import { useState, useCallback } from 'react';
import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProjectFile } from '../types/index.js';

export const useFileDiscovery = () => {
  const [loading, setLoading] = useState(false);

  const discoverFiles = useCallback(async (
    rootDir: string,
    filters: { include: string[]; exclude: string[] }
  ): Promise<ProjectFile[]> => {
    setLoading(true);
    try {
      const patterns = filters.include.map(p => path.join(rootDir, p));
      const ignorePatterns = filters.exclude;

      const filePaths = await globby(patterns, {
        ignore: ignorePatterns,
        gitignore: true,
        onlyFiles: true,
        absolute: false,
        cwd: rootDir,
      });

      const files: ProjectFile[] = [];
      
      for (const filePath of filePaths) {
        const fullPath = path.join(rootDir, filePath);
        const stats = await fs.stat(fullPath);
        
        // Skip large files
        if (stats.size > 1024 * 1024) continue; // 1MB limit
        
        const ext = path.extname(filePath);
        const language = getLanguageFromExt(ext);
        
        files.push({
          path: filePath,
          size: stats.size,
          language,
          isEntry: isEntryPoint(filePath),
        });
      }

      return files;
    } finally {
      setLoading(false);
    }
  }, []);

  return { discoverFiles, loading };
};

function getLanguageFromExt(ext: string): string | undefined {
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

function isEntryPoint(filePath: string): boolean {
  const entryPatterns = [
    'index.js', 'index.ts', 'main.js', 'main.ts',
    'app.js', 'app.ts', 'server.js', 'server.ts',
    '__main__.py', 'main.py', 'app.py',
    'Main.java', 'main.go', 'main.rs',
  ];
  
  const filename = path.basename(filePath);
  return entryPatterns.includes(filename);
}