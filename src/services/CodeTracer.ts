import fs from 'node:fs/promises';
import path from 'node:path';
import type { WalkthroughStep, IndexedProject } from '../types/index.js';

export class CodeTracer {
  async traceExecutionPath(
    question: string,
    project: IndexedProject
  ): Promise<WalkthroughStep[]> {
    const steps: WalkthroughStep[] = [];
    const keywords = this.extractKeywords(question);
    
    // Start from entry points
    for (const entryPoint of project.entryPoints) {
      const visited = new Set<string>();
      await this.traceFromFile(
        path.join(project.root, entryPoint),
        keywords,
        steps,
        visited,
        project
      );
    }
    
    // If no entry points, start from files that match keywords
    if (steps.length === 0) {
      const relevantFiles = project.files
        .filter(f => this.fileMatchesKeywords(f, keywords))
        .sort((a, b) => (b.isEntry ? 1 : 0) - (a.isEntry ? 1 : 0));
      
      for (const file of relevantFiles.slice(0, 5)) {
        if (file.content) {
          const relevantSpans = await this.extractRelevantSpans(
            file.content,
            keywords,
            file.path
          );
          steps.push(...relevantSpans);
        }
      }
    }
    
    return steps;
  }

  private async traceFromFile(
    filePath: string,
    keywords: string[],
    steps: WalkthroughStep[],
    visited: Set<string>,
    project: IndexedProject
  ): Promise<void> {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Find imports
      const imports = this.findImports(lines);
      
      // Find keyword matches and function definitions
      const relevantSpans = await this.extractRelevantSpans(content, keywords, filePath);
      steps.push(...relevantSpans);
      
      // Follow imports that might be relevant
      for (const imp of imports) {
        if (this.importMatchesKeywords(imp, keywords)) {
          const resolvedPath = this.resolveImportPath(imp, filePath, project);
          if (resolvedPath) {
            await this.traceFromFile(resolvedPath, keywords, steps, visited, project);
          }
        }
      }
    } catch (error) {
      // File might not exist or be readable
    }
  }

  private async extractRelevantSpans(
    content: string,
    keywords: string[],
    filePath: string
  ): Promise<WalkthroughStep[]> {
    const lines = content.split('\n');
    const steps: WalkthroughStep[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let isRelevant = false;
      let explanation = '';
      let whyRelevant = '';
      
      // Check for keyword matches
      for (const keyword of keywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          isRelevant = true;
          
          // Generate specific explanations based on actual code patterns
          if (line.includes('import') && line.includes('from')) {
            const moduleMatch = line.match(/from\s+['"]([^'"]+)['"]/);
            const importMatch = line.match(/import\s+(?:\{([^}]+)\}|(\w+))/);
            const imported = importMatch ? (importMatch[1] || importMatch[2]) : 'module';
            explanation = `Imports ${imported} from ${moduleMatch ? moduleMatch[1] : 'module'}`;
            whyRelevant = `This brings in the ${keyword} functionality needed for this feature`;
          } else if (line.includes('require')) {
            const moduleMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            explanation = `Loads ${moduleMatch ? moduleMatch[1] : 'module'} using CommonJS`;
            whyRelevant = `This loads the ${keyword} module for use in this file`;
          } else if (line.includes('new ')) {
            const classMatch = line.match(/new\s+(\w+)/);
            explanation = `Creates new instance of ${classMatch ? classMatch[1] : 'class'}`;
            whyRelevant = `This initializes the ${keyword} service that will handle the main functionality`;
          } else if (line.includes('class ')) {
            const classMatch = line.match(/class\s+(\w+)/);
            explanation = `Defines ${classMatch ? classMatch[1] : 'class'} class`;
            whyRelevant = `This class encapsulates the ${keyword} logic and methods`;
          } else if (line.includes('function ') || line.includes('const ') && line.includes('=>')) {
            const funcMatch = line.match(/(?:function|const)\s+(\w+)/);
            explanation = `Defines ${funcMatch ? funcMatch[1] : 'function'} function`;
            whyRelevant = `This function handles ${keyword}-related operations`;
          } else if (line.includes('await ') || line.includes('.then')) {
            explanation = `Async call involving ${keyword}`;
            whyRelevant = `This performs an asynchronous ${keyword} operation and waits for the result`;
          } else if (line.match(/\.\w+\(/)) {
            const methodMatch = line.match(/\.(\w+)\(/);
            explanation = `Calls ${methodMatch ? methodMatch[1] : 'method'} method`;
            whyRelevant = `This invokes the ${keyword} API to perform the requested action`;
          } else if (line.includes('export ')) {
            const exportMatch = line.match(/export\s+(?:default\s+)?(\w+)/);
            explanation = `Exports ${exportMatch ? exportMatch[1] : 'component'}`;
            whyRelevant = `This makes the ${keyword} functionality available to other modules`;
          } else if (line.includes('=') && !line.includes('==')) {
            const varMatch = line.match(/(?:const|let|var)?\s*(\w+)\s*=/);
            explanation = `Assigns value to ${varMatch ? varMatch[1] : 'variable'}`;
            whyRelevant = `This stores ${keyword} configuration or data for later use`;
          } else {
            explanation = `Uses ${keyword} in code logic`;
            whyRelevant = `This line contains logic that directly involves ${keyword}`;
          }
          break;
        }
      }
      
      if (isRelevant) {
        // Get context around the line
        const startLine = Math.max(0, i - 2);
        const endLine = Math.min(lines.length - 1, i + 5);
        const codeSnippet = lines.slice(startLine, endLine + 1).join('\n');
        
        steps.push({
          index: steps.length,
          file: path.relative(process.cwd(), filePath),
          lineRange: [startLine + 1, endLine + 1],
          code: codeSnippet,
          explanation,
          whyRelevant,
          linksTo: this.findLinkedFiles(lines[i], filePath),
        });
      }
    }
    
    return steps;
  }

  private findImports(lines: string[]): string[] {
    const imports: string[] = [];
    
    for (const line of lines) {
      // ES6 imports
      const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        imports.push(importMatch[1]);
      }
      
      // CommonJS requires
      const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (requireMatch) {
        imports.push(requireMatch[1]);
      }
    }
    
    return imports;
  }

  private findLinkedFiles(line: string, currentFile: string): string[] {
    const links: string[] = [];
    
    // Find imports in the line
    const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      links.push(importMatch[1]);
    }
    
    const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      links.push(requireMatch[1]);
    }
    
    return links;
  }

  private importMatchesKeywords(importPath: string, keywords: string[]): boolean {
    const lowerImport = importPath.toLowerCase();
    return keywords.some(kw => lowerImport.includes(kw.toLowerCase()));
  }

  private fileMatchesKeywords(file: any, keywords: string[]): boolean {
    const lowerPath = file.path.toLowerCase();
    const lowerContent = (file.content || '').toLowerCase();
    
    return keywords.some(kw => {
      const lower = kw.toLowerCase();
      return lowerPath.includes(lower) || lowerContent.includes(lower);
    });
  }

  private resolveImportPath(
    importPath: string,
    fromFile: string,
    project: IndexedProject
  ): string | null {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const dir = path.dirname(fromFile);
      const resolved = path.resolve(dir, importPath);
      
      // Try with different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
      for (const ext of ['', ...extensions]) {
        const fullPath = resolved + ext;
        if (project.files.some(f => path.join(project.root, f.path) === fullPath)) {
          return fullPath;
        }
      }
    }
    
    // Handle node_modules imports (simplified)
    return null;
  }

  private extractKeywords(question: string): string[] {
    // Extract meaningful keywords from the question
    const commonWords = new Set([
      'where', 'is', 'the', 'how', 'what', 'when', 'why', 'does', 
      'do', 'in', 'of', 'a', 'an', 'to', 'from', 'with', 'for',
      'implemented', 'used', 'works', 'located', 'defined'
    ]);
    
    return question
      .toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
  }
}