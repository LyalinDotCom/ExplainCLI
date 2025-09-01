import fs from 'node:fs/promises';
import path from 'node:path';
import type { AnalysisResult, IndexedProject } from '../types/index.js';

export class ReportGenerator {
  async generateMarkdownReport(
    question: string,
    result: AnalysisResult,
    project: IndexedProject,
    outputPath?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputPath || `analysis-report-${timestamp}.md`;
    
    let markdown = '';
    
    // Header
    markdown += `# Code Analysis Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Project:** ${project.name}\n`;
    markdown += `**Question:** ${question}\n\n`;
    markdown += `---\n\n`;
    
    // Table of Contents
    markdown += `## Table of Contents\n\n`;
    markdown += `1. [Architecture Overview](#architecture-overview)\n`;
    markdown += `2. [Analysis Summary](#analysis-summary)\n`;
    markdown += `3. [Code Walkthrough](#code-walkthrough)\n`;
    markdown += `4. [File Details](#file-details)\n`;
    markdown += `5. [Citations](#citations)\n\n`;
    markdown += `---\n\n`;
    
    // Architecture Overview
    markdown += `## Architecture Overview\n\n`;
    if (result.overview) {
      markdown += `### Frameworks & Technologies\n`;
      result.overview.frameworks.forEach(fw => {
        markdown += `- ${fw}\n`;
      });
      markdown += `\n`;
      
      markdown += `### Runtimes\n`;
      result.overview.runtimes.forEach(rt => {
        markdown += `- ${rt}\n`;
      });
      markdown += `\n`;
      
      markdown += `### Folder Structure\n`;
      markdown += `${result.overview.folderLayout}\n\n`;
      
      markdown += `### Main Components\n`;
      result.overview.mainComponents.forEach(comp => {
        markdown += `- ${comp}\n`;
      });
      markdown += `\n`;
      
      markdown += `### Control Flow\n`;
      markdown += `${result.overview.controlFlow}\n\n`;
    }
    
    markdown += `---\n\n`;
    
    // Analysis Summary
    markdown += `## Analysis Summary\n\n`;
    markdown += `### Answer\n`;
    markdown += `${result.answer}\n\n`;
    
    if (result.confidence) {
      markdown += `**Confidence Level:** ${result.confidence}\n\n`;
    }
    
    if (result.uncertainties && result.uncertainties.length > 0) {
      markdown += `### Uncertainties\n`;
      result.uncertainties.forEach(u => {
        markdown += `- ${u}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
    
    // Code Walkthrough
    markdown += `## Code Walkthrough\n\n`;
    markdown += `This section walks through the relevant code files in execution order.\n\n`;
    
    if (result.walkthrough && result.walkthrough.length > 0) {
      // Group walkthrough steps by file
      const fileGroups = new Map<string, typeof result.walkthrough>();
      result.walkthrough.forEach(step => {
        if (!fileGroups.has(step.file)) {
          fileGroups.set(step.file, []);
        }
        fileGroups.get(step.file)!.push(step);
      });
      
      let stepCounter = 1;
      for (const [filePath, steps] of fileGroups) {
        markdown += `### Step ${stepCounter}: ${filePath}\n\n`;
        
        for (const step of steps) {
          markdown += `#### Lines ${step.lineRange[0]}-${step.lineRange[1]}\n\n`;
          
          markdown += `**What this code does:**\n`;
          markdown += `${step.explanation}\n\n`;
          
          markdown += `**Why this matters:**\n`;
          markdown += `${step.whyRelevant}\n\n`;
          
          if (step.linksTo && step.linksTo.length > 0) {
            markdown += `**Connections:**\n`;
            step.linksTo.forEach(link => {
              markdown += `- ${link}\n`;
            });
            markdown += `\n`;
          }
        }
        
        stepCounter++;
      }
    }
    
    markdown += `---\n\n`;
    
    // File Details with Full Code
    markdown += `## File Details\n\n`;
    markdown += `Complete code listings for all analyzed files.\n\n`;
    
    // Get unique files from walkthrough
    const analyzedFiles = new Set<string>();
    if (result.walkthrough) {
      result.walkthrough.forEach(step => {
        analyzedFiles.add(step.file);
      });
    }
    
    for (const filePath of analyzedFiles) {
      markdown += `### ${filePath}\n\n`;
      
      // Find the file in the project
      const file = project.files.find(f => f.path === filePath);
      
      if (file && file.content) {
        // Add language hint for syntax highlighting
        const ext = path.extname(filePath).slice(1);
        const langMap: Record<string, string> = {
          'ts': 'typescript',
          'tsx': 'tsx',
          'js': 'javascript',
          'jsx': 'jsx',
          'py': 'python',
          'java': 'java',
          'go': 'go',
          'rs': 'rust',
          'cpp': 'cpp',
          'c': 'c',
          'cs': 'csharp',
          'rb': 'ruby',
          'php': 'php',
          'swift': 'swift',
          'kt': 'kotlin',
        };
        const lang = langMap[ext] || ext;
        
        markdown += `\`\`\`${lang}\n`;
        markdown += file.content;
        markdown += `\n\`\`\`\n\n`;
      } else {
        // Try to read the file directly
        try {
          const fullPath = path.isAbsolute(filePath) 
            ? filePath 
            : path.join(project.root, filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          const ext = path.extname(filePath).slice(1);
          const langMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'tsx',
            'js': 'javascript',
            'jsx': 'jsx',
            'py': 'python',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'rb': 'ruby',
            'php': 'php',
            'swift': 'swift',
            'kt': 'kotlin',
          };
          const lang = langMap[ext] || ext;
          
          markdown += `\`\`\`${lang}\n`;
          markdown += content;
          markdown += `\n\`\`\`\n\n`;
        } catch (error) {
          markdown += `*File content not available*\n\n`;
        }
      }
    }
    
    markdown += `---\n\n`;
    
    // Citations
    markdown += `## Citations\n\n`;
    if (result.citations && result.citations.length > 0) {
      markdown += `| Claim | File | Line |\n`;
      markdown += `|-------|------|------|\n`;
      result.citations.forEach(citation => {
        markdown += `| ${citation.claim} | ${citation.file} | ${citation.line} |\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `*End of Report*\n`;
    
    // Save to file
    await fs.writeFile(filename, markdown, 'utf-8');
    
    return filename;
  }
}