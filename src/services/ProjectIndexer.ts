import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import type { Config, ProjectFile, IndexedProject } from '../types/index.js';

export class ProjectIndexer {
  constructor(private config: Config) {}

  async indexProject(
    rootDir: string,
    filters: { include: string[]; exclude: string[] },
    onProgress?: (progress: any) => void
  ): Promise<IndexedProject> {
    const projectName = path.basename(rootDir);
    
    // Track overall progress through stages
    const updateOverallProgress = (stage: string, stageProgress: number = 100) => {
      if (onProgress) {
        onProgress({ 
          stage,
          stageProgress,
          currentFile: stage
        });
      }
    };
    
    // Stage 1: Discover files (0-40%)
    updateOverallProgress('Discovering files...', 0);
    const files = await this.discoverFiles(rootDir, filters, (progress) => {
      if (onProgress) {
        const overallProgress = Math.min(40, (progress.filesScanned || 0) / Math.max(1, progress.totalFiles || 1) * 40);
        onProgress({
          ...progress,
          overallProgress,
          stage: 'Discovering files'
        });
      }
    });
    
    // Stage 2: Find entry points (40-50%)
    updateOverallProgress('Finding entry points...', 40);
    const entryPoints = this.findEntryPoints(files);
    if (onProgress) {
      onProgress({ 
        entryPoints: entryPoints.length,
        overallProgress: 50,
        stage: 'Entry points found'
      });
    }
    
    // Stage 3: Detect frameworks (50-60%)
    updateOverallProgress('Detecting frameworks...', 50);
    const frameworks = await this.detectFrameworks(rootDir, files);
    if (onProgress) {
      onProgress({ 
        frameworks,
        overallProgress: 60,
        stage: 'Frameworks detected'
      });
    }
    
    // Stage 4: Detect languages (60-70%)
    updateOverallProgress('Analyzing languages...', 60);
    const languages = this.detectLanguages(files);
    if (onProgress) {
      onProgress({ 
        overallProgress: 70,
        stage: 'Languages analyzed'
      });
    }
    
    // Stage 5: Build import graph (70-100%)
    updateOverallProgress('Building dependency graph...', 70);
    const importGraph = await this.buildImportGraph(files);
    if (onProgress) {
      onProgress({ 
        overallProgress: 100,
        stage: 'Indexing complete'
      });
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return {
      root: rootDir,
      name: projectName,
      files,
      entryPoints,
      frameworks,
      languages,
      importGraph,
      totalSize,
    };
  }

  private async discoverFiles(
    rootDir: string,
    filters: { include: string[]; exclude: string[] },
    onProgress?: (progress: any) => void
  ): Promise<ProjectFile[]> {
    // Use the patterns directly without joining with rootDir
    const patterns = filters.include;
    const ignorePatterns = filters.exclude;

    const filePaths = await globby(patterns, {
      ignore: ignorePatterns,
      gitignore: true,
      onlyFiles: true,
      absolute: false,
      cwd: rootDir,
    });

    const files: ProjectFile[] = [];
    
    // Report total files
    if (onProgress) {
      onProgress({ totalFiles: filePaths.length });
    }

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fullPath = path.join(rootDir, filePath);
      const stats = await fs.stat(fullPath);

      // Skip files larger than max size
      if (stats.size > this.config.maxFileSize) continue;

      const ext = path.extname(filePath);
      const language = this.getLanguageFromExt(ext);

      // Read content for code files
      let content: string | undefined;
      let preview: string | undefined;
      
      if (language && stats.size < 100000) { // Read files under 100KB
        try {
          content = await fs.readFile(fullPath, 'utf-8');
          preview = content.split('\n').slice(0, 5).join('\n');
        } catch {
          // Skip files that can't be read
        }
      }

      files.push({
        path: filePath,
        size: stats.size,
        language,
        content,
        preview,
        isEntry: this.isEntryPoint(filePath),
      });
      
      // Report progress more frequently
      if (onProgress) {
        onProgress({ 
          filesScanned: i + 1,
          currentFile: filePath 
        });
      }
    }
    
    // Final progress update
    if (onProgress) {
      onProgress({ 
        filesScanned: filePaths.length,
        currentFile: '' 
      });
    }

    return files;
  }

  private findEntryPoints(files: ProjectFile[]): string[] {
    return files
      .filter(f => f.isEntry)
      .map(f => f.path);
  }

  private async detectFrameworks(rootDir: string, files: ProjectFile[]): Promise<string[]> {
    const frameworks: Set<string> = new Set();

    // Check package.json for Node.js frameworks
    const packageJson = files.find(f => f.path === 'package.json');
    if (packageJson && packageJson.content) {
      try {
        const pkg = JSON.parse(packageJson.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps['react']) frameworks.add('React');
        if (deps['vue']) frameworks.add('Vue');
        if (deps['@angular/core']) frameworks.add('Angular');
        if (deps['express']) frameworks.add('Express');
        if (deps['next']) frameworks.add('Next.js');
        if (deps['@nestjs/core']) frameworks.add('NestJS');
        if (deps['fastify']) frameworks.add('Fastify');
      } catch {
        // Invalid package.json
      }
    }

    // Check for other framework indicators
    if (files.some(f => f.path.includes('requirements.txt'))) {
      frameworks.add('Python');
    }
    if (files.some(f => f.path === 'go.mod')) {
      frameworks.add('Go');
    }
    if (files.some(f => f.path === 'Cargo.toml')) {
      frameworks.add('Rust');
    }

    return Array.from(frameworks);
  }

  private detectLanguages(files: ProjectFile[]): Set<string> {
    const languages = new Set<string>();
    files.forEach(f => {
      if (f.language) languages.add(f.language);
    });
    return languages;
  }

  private async buildImportGraph(files: ProjectFile[]): Promise<Map<string, string[]>> {
    const graph = new Map<string, string[]>();

    for (const file of files) {
      if (!file.content || !file.language) continue;

      const imports = this.extractImports(file.content, file.language);
      if (imports.length > 0) {
        graph.set(file.path, imports);
      }
    }

    return graph;
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'javascript' || language === 'typescript') {
      // ES6 imports
      const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // CommonJS requires
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (language === 'python') {
      const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }

    return imports;
  }

  private getLanguageFromExt(ext: string): string | undefined {
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
    };
    return langMap[ext];
  }

  private isEntryPoint(filePath: string): boolean {
    const entryPatterns = [
      'index.js', 'index.ts', 'index.tsx',
      'main.js', 'main.ts', 'main.tsx',
      'app.js', 'app.ts', 'app.tsx',
      'server.js', 'server.ts',
      '__main__.py', 'main.py', 'app.py',
      'Main.java', 'main.go', 'main.rs',
    ];
    
    const filename = path.basename(filePath);
    return entryPatterns.includes(filename);
  }
}