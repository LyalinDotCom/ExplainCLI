import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  Config, 
  IndexedProject, 
  AnalysisResult,
  WalkthroughStep,
  ArchitectureOverview 
} from '../types/index.js';
import { SecurityService } from './SecurityService.js';
import { CodeTracer } from './CodeTracer.js';

export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private security: SecurityService;
  private codeTracer: CodeTracer;

  constructor(private config: Config) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro'
    });
    this.security = new SecurityService();
    this.codeTracer = new CodeTracer();
  }

  async analyze(
    question: string,
    project: IndexedProject
  ): Promise<AnalysisResult> {
    // First, trace the actual code execution path
    const walkthrough = await this.codeTracer.traceExecutionPath(question, project);
    
    // Prepare deep context
    const context = await this.prepareDeepContext(project, question);

    // Redact sensitive information
    const safeContext = this.security.redactSensitiveData(context);

    // Build the prompt
    const prompt = this.buildPrompt(question, safeContext, 'deep');

    // Send to Gemini for overview and answer
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response and combine with real walkthrough
    const parsed = this.parseResponse(text, project);
    
    // Use the real traced walkthrough instead of AI-generated one
    return {
      ...parsed,
      walkthrough: walkthrough.length > 0 ? walkthrough : parsed.walkthrough,
    };
  }

  private async prepareBestEffortContext(
    project: IndexedProject,
    question: string
  ): Promise<string> {
    const relevantFiles = this.rankFilesByRelevance(project.files, question);
    const topFiles = relevantFiles.slice(0, 10);
    
    let context = `Project: ${project.name}\n`;
    context += `Frameworks: ${project.frameworks.join(', ')}\n`;
    context += `Languages: ${Array.from(project.languages).join(', ')}\n`;
    context += `Entry Points: ${project.entryPoints.join(', ')}\n\n`;
    
    context += 'Relevant Code Sections:\n';
    for (const file of topFiles) {
      if (file.content) {
        context += `\n--- ${file.path} ---\n`;
        context += file.content.slice(0, 2000); // First 2000 chars
        context += '\n';
      }
    }

    return context;
  }

  private async prepareDeepContext(
    project: IndexedProject,
    question: string
  ): Promise<string> {
    let context = `Project: ${project.name}\n`;
    context += `Frameworks: ${project.frameworks.join(', ')}\n`;
    context += `Languages: ${Array.from(project.languages).join(', ')}\n`;
    context += `Entry Points: ${project.entryPoints.join(', ')}\n\n`;
    
    context += 'Project Structure:\n';
    const fileTree = this.buildFileTree(project.files);
    context += fileTree + '\n\n';

    context += 'Import Graph:\n';
    for (const [file, imports] of project.importGraph) {
      context += `${file} imports: ${imports.join(', ')}\n`;
    }
    context += '\n';

    context += 'All Code Files:\n';
    let totalSize = 0;
    for (const file of project.files) {
      if (file.content && totalSize < this.config.maxContextSize) {
        context += `\n--- ${file.path} ---\n`;
        context += file.content;
        context += '\n';
        totalSize += file.content.length;
      }
    }

    return context;
  }

  private rankFilesByRelevance(files: any[], question: string): any[] {
    const keywords = this.extractKeywords(question);
    
    return files.map(file => {
      let score = 0;
      
      // Check filename relevance
      for (const keyword of keywords) {
        if (file.path.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
      }
      
      // Check if entry point
      if (file.isEntry) score += 5;
      
      // Check content relevance
      if (file.content) {
        for (const keyword of keywords) {
          const matches = (file.content.match(new RegExp(keyword, 'gi')) || []).length;
          score += matches;
        }
      }
      
      return { ...file, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private extractKeywords(question: string): string[] {
    const commonWords = new Set(['is', 'the', 'where', 'how', 'what', 'when', 'why', 'does', 'in', 'of', 'a', 'an']);
    return question
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
  }

  private buildFileTree(files: any[]): string {
    const tree: any = {};
    
    for (const file of files) {
      const parts = file.path.split('/');
      let current = tree;
      
      for (const part of parts) {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
    
    return this.renderTree(tree, 0);
  }

  private renderTree(tree: any, depth: number): string {
    let result = '';
    const indent = '  '.repeat(depth);
    
    for (const [name, children] of Object.entries(tree)) {
      result += `${indent}${name}\n`;
      if (Object.keys(children as any).length > 0) {
        result += this.renderTree(children, depth + 1);
      }
    }
    
    return result;
  }

  private buildPrompt(question: string, context: string, mode: string): string {
    return `You are a code educator analyzing a codebase. Be precise and concise. 
Cite file:line for claims tied to code. Prefer truth over speculation. 
Trace behavior from entry points through the call graph. If unsure, say so.

Analysis Mode: ${mode === 'deep' ? 'Deep Inspection' : 'Best-Effort'}
User Question: ${question}

Project Context:
${context}

Please provide:
1. A brief architecture overview (6-10 lines)
2. An execution walkthrough with 5-10 key steps showing how the code flows
3. A direct answer to the question with specific file:line citations
4. Note any uncertainties or missing information

Format your response as JSON with this structure:
{
  "overview": {
    "frameworks": [],
    "runtimes": [],
    "folderLayout": "",
    "mainComponents": [],
    "controlFlow": ""
  },
  "walkthrough": [
    {
      "file": "",
      "lineRange": [start, end],
      "code": "",
      "explanation": "",
      "whyRelevant": "",
      "linksTo": []
    }
  ],
  "answer": "",
  "citations": [
    {"claim": "", "file": "", "line": 0}
  ],
  "uncertainties": [],
  "confidence": "high|medium|low"
}`;
  }

  private parseResponse(text: string, project: IndexedProject): AnalysisResult {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Convert to our types
      const overview: ArchitectureOverview = {
        frameworks: parsed.overview?.frameworks || project.frameworks,
        runtimes: parsed.overview?.runtimes || [],
        folderLayout: parsed.overview?.folderLayout || 'Standard project structure',
        mainComponents: parsed.overview?.mainComponents || [],
        controlFlow: parsed.overview?.controlFlow || 'Request/response flow',
      };

      const walkthrough: WalkthroughStep[] = (parsed.walkthrough || []).map((step: any, index: number) => ({
        index,
        file: step.file,
        lineRange: step.lineRange || [1, 10],
        code: step.code || '',
        explanation: step.explanation || '',
        whyRelevant: step.whyRelevant || '',
        linksTo: step.linksTo || [],
      }));

      return {
        overview,
        walkthrough,
        answer: parsed.answer || 'Unable to determine answer',
        citations: parsed.citations || [],
        uncertainties: parsed.uncertainties,
        omissions: [],
        confidence: parsed.confidence || 'medium',
      };
    } catch (error) {
      // Fallback response if parsing fails
      return {
        overview: {
          frameworks: project.frameworks,
          runtimes: [],
          folderLayout: 'Project structure analyzed',
          mainComponents: project.entryPoints,
          controlFlow: 'Standard application flow',
        },
        walkthrough: [],
        answer: 'Analysis completed but response parsing failed. The project appears to be a ' + 
                project.frameworks.join(', ') + ' application.',
        citations: [],
        uncertainties: ['Response parsing error'],
        confidence: 'low',
      };
    }
  }
}