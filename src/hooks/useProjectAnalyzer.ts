import { useCallback } from 'react';
import type { Config, AnalysisMode, AnalysisResult } from '../types/index.js';
import { ProjectIndexer } from '../services/ProjectIndexer.js';
import { GeminiAnalyzer } from '../services/GeminiAnalyzer.js';

export const useProjectAnalyzer = (config: Config) => {
  const analyzeProject = useCallback(async (
    question: string,
    mode: AnalysisMode,
    filters: { include: string[]; exclude: string[] }
  ): Promise<AnalysisResult> => {
    // Step 1: Index the project
    const indexer = new ProjectIndexer(config);
    const project = await indexer.indexProject(process.cwd(), filters);

    // Step 2: Analyze with Gemini
    const analyzer = new GeminiAnalyzer(config);
    const result = await analyzer.analyze(question, project, mode);

    return result;
  }, [config]);

  return { analyzeProject };
};