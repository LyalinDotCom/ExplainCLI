import { useCallback } from 'react';
import type { Config, AnalysisResult, IndexedProject } from '../types/index.js';
import { ProjectIndexer } from '../services/ProjectIndexer.js';
import { DeepAnalyzer } from '../services/DeepAnalyzer.js';

export const useProjectAnalyzer = (config: Config) => {
  const analyzeProject = useCallback(async (
    question: string,
    filters: { include: string[]; exclude: string[] },
    onProgress?: (progress: any) => void
  ): Promise<{ result: AnalysisResult; project: IndexedProject }> => {
    // Step 1: Index the project with progress callback
    const indexer = new ProjectIndexer(config);
    const project = await indexer.indexProject(process.cwd(), filters, (progress) => {
      if (onProgress) {
        // Also count insights as we find relevant code
        const insights = (progress.filesScanned || 0) > 0 
          ? Math.floor((progress.filesScanned || 0) / 5) 
          : 0;
        onProgress({ ...progress, insights });
      }
    });

    // Step 2: Deep analysis with multiple Gemini calls
    const analyzer = new DeepAnalyzer(config);
    const result = await analyzer.analyzeProject(question, project, (message) => {
      if (onProgress) {
        onProgress({ currentFile: message });
      }
    });

    return { result, project };
  }, [config]);

  return { analyzeProject };
};