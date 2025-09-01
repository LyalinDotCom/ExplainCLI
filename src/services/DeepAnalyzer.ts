import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { 
  Config, 
  IndexedProject, 
  AnalysisResult,
  WalkthroughStep,
  ArchitectureOverview,
  ProjectFile
} from '../types/index.js';
import { SecurityService } from './SecurityService.js';

export class DeepAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private security: SecurityService;

  constructor(private config: Config) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro'
    });
    this.security = new SecurityService();
  }

  async analyzeProject(
    question: string,
    project: IndexedProject,
    onProgress?: (message: string) => void
  ): Promise<AnalysisResult> {
    if (onProgress) onProgress('Starting deep analysis...');

    // Step 1: Analyze overall architecture
    const overview = await this.analyzeArchitecture(project, question);
    if (onProgress) onProgress('Analyzed architecture');

    // Step 2: Find relevant files for the question
    const relevantFiles = await this.findRelevantFiles(project, question);
    if (onProgress) onProgress(`Found ${relevantFiles.length} relevant files`);

    // Step 3: Build execution path through the code
    const executionPath = await this.buildExecutionPath(relevantFiles, question, project);
    if (onProgress) onProgress('Built execution path');

    // Step 4: Analyze each file in the path with Gemini
    const walkthrough: WalkthroughStep[] = [];
    for (let i = 0; i < executionPath.length; i++) {
      const file = executionPath[i];
      if (onProgress) onProgress(`Analyzing ${file.path} (${i + 1}/${executionPath.length})`);
      
      const steps = await this.analyzeFile(file, question, i, project);
      walkthrough.push(...steps);
    }

    // Step 5: Analyze how everything connects
    const connections = await this.analyzeConnections(walkthrough, project, question);
    
    // Step 6: Generate comprehensive answer
    const answer = await this.generateAnswer(question, overview, walkthrough, connections);

    return {
      overview,
      walkthrough,
      answer,
      citations: this.extractCitations(walkthrough),
      confidence: 'high',
    };
  }

  private async analyzeArchitecture(project: IndexedProject, question: string): Promise<ArchitectureOverview> {
    const prompt = `Analyze this project's architecture in the context of the question: "${question}"

Project files:
${project.files.map(f => f.path).join('\n')}

Entry points: ${project.entryPoints.join(', ')}
Detected frameworks: ${project.frameworks.join(', ')}

Provide a concise overview focusing on:
1. Main frameworks and technologies used
2. How the project is structured (folder layout)
3. Key components relevant to: ${question}
4. How control flows through the application
5. Which files are most important for understanding: ${question}

Format as JSON:
{
  "frameworks": ["list of frameworks"],
  "runtimes": ["runtime environments"],
  "folderLayout": "description of structure",
  "mainComponents": ["key components"],
  "controlFlow": "how execution flows"
}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return {
        frameworks: json.frameworks || project.frameworks,
        runtimes: json.runtimes || ['Node.js'],
        folderLayout: json.folderLayout || 'Standard project structure',
        mainComponents: json.mainComponents || [],
        controlFlow: json.controlFlow || 'Request/response flow',
      };
    } catch {
      return {
        frameworks: project.frameworks,
        runtimes: ['Node.js'],
        folderLayout: 'Standard project structure',
        mainComponents: project.entryPoints,
        controlFlow: 'Application flow',
      };
    }
  }

  private async findRelevantFiles(project: IndexedProject, question: string): Promise<ProjectFile[]> {
    // Send file list to Gemini to identify relevant files
    const fileList = project.files.map(f => `${f.path} (${f.language || 'unknown'})`).join('\n');
    
    const prompt = `Given the question: "${question}"
    
And these project files:
${fileList}

Identify the files that are most relevant for understanding the answer. Consider:
1. Files that directly implement the feature
2. Configuration files that affect it
3. Entry points that trigger it
4. Dependencies it uses

Return a JSON array of file paths in order of execution/importance:
["path1", "path2", ...]`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const paths = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
      return project.files.filter(f => paths.includes(f.path)).slice(0, 20); // Max 20 files
    } catch {
      // Fallback to keyword matching
      const keywords = question.toLowerCase().split(/\s+/);
      return project.files
        .filter(f => {
          const content = (f.content || '').toLowerCase();
          const pathLower = f.path.toLowerCase();
          return keywords.some(kw => content.includes(kw) || pathLower.includes(kw));
        })
        .slice(0, 10);
    }
  }

  private async buildExecutionPath(
    relevantFiles: ProjectFile[],
    question: string,
    project: IndexedProject
  ): Promise<ProjectFile[]> {
    if (relevantFiles.length === 0) return [];

    const prompt = `Given these relevant files for the question "${question}":
${relevantFiles.map(f => f.path).join('\n')}

And knowing the import graph:
${Array.from(project.importGraph.entries()).map(([file, imports]) => 
  `${file} imports: ${imports.join(', ')}`
).join('\n')}

Order these files in the logical execution flow - from entry point through to implementation.
Consider: initialization → configuration → routing → business logic → utilities

Return a JSON array of file paths in execution order:
["path1", "path2", ...]`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const orderedPaths = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
      const orderedFiles = orderedPaths
        .map((p: string) => relevantFiles.find(f => f.path === p))
        .filter(Boolean);
      return orderedFiles.length > 0 ? orderedFiles : relevantFiles;
    } catch {
      return relevantFiles;
    }
  }

  private async analyzeFile(
    file: ProjectFile,
    question: string,
    stepIndex: number,
    project: IndexedProject
  ): Promise<WalkthroughStep[]> {
    if (!file.content) {
      // Read the file if content not loaded
      try {
        file.content = await fs.readFile(path.join(project.root, file.path), 'utf-8');
      } catch {
        return [];
      }
    }

    const prompt = `Analyze this code file in the context of: "${question}"

File: ${file.path}
Language: ${file.language || 'unknown'}

Code:
${file.content}

Identify the most important sections that help answer the question. For each section:
1. Identify the line range
2. Explain what the code does
3. Explain why it's relevant to the question
4. Note any connections to other files

Return JSON array of important sections:
[{
  "lineStart": number,
  "lineEnd": number,
  "code": "the actual code snippet",
  "explanation": "what this code does",
  "whyRelevant": "why this matters for the question",
  "connections": ["files this connects to"]
}]`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const sections = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
      return sections.map((section: any, i: number) => ({
        index: stepIndex * 10 + i,
        file: file.path,
        lineRange: [section.lineStart || 1, section.lineEnd || 10],
        code: section.code || this.extractLines(file.content!, section.lineStart - 1, section.lineEnd),
        explanation: section.explanation || 'This section contains relevant code',
        whyRelevant: section.whyRelevant || 'Related to your question',
        linksTo: section.connections || [],
      }));
    } catch {
      // Fallback to basic extraction
      return [{
        index: stepIndex,
        file: file.path,
        lineRange: [1, Math.min(50, file.content!.split('\n').length)],
        code: file.content!.split('\n').slice(0, 50).join('\n'),
        explanation: `This file contains code related to ${question}`,
        whyRelevant: 'Contains relevant implementation',
        linksTo: [],
      }];
    }
  }

  private async analyzeConnections(
    walkthrough: WalkthroughStep[],
    project: IndexedProject,
    question: string
  ): Promise<string> {
    const prompt = `Analyze how these code sections connect to answer: "${question}"

Files analyzed:
${[...new Set(walkthrough.map(w => w.file))].join('\n')}

Explain:
1. How data flows between these components
2. What triggers the execution
3. How the components work together
4. The overall execution sequence

Provide a clear, concise explanation of how everything connects.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generateAnswer(
    question: string,
    overview: ArchitectureOverview,
    walkthrough: WalkthroughStep[],
    connections: string
  ): Promise<string> {
    const prompt = `Based on the code analysis, answer this question: "${question}"

Architecture: ${overview.frameworks.join(', ')} application with ${overview.controlFlow}

Key files examined:
${[...new Set(walkthrough.map(w => w.file))].join('\n')}

How components connect:
${connections}

Provide a direct, comprehensive answer with specific file:line references where relevant.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private extractLines(content: string, start: number, end: number): string {
    const lines = content.split('\n');
    return lines.slice(start, end).join('\n');
  }

  private extractCitations(walkthrough: WalkthroughStep[]): Array<{ claim: string; file: string; line: number }> {
    return walkthrough.map(step => ({
      claim: step.explanation,
      file: step.file,
      line: step.lineRange[0],
    }));
  }
}