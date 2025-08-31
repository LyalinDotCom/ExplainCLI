import type { Config } from '../types/index.js';
import path from 'node:path';
import os from 'node:os';

export async function loadConfig(): Promise<Config> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = 'gemini-2.5-pro'; // Always use gemini-2.5-pro for optimal performance
  const debug = process.env.DEBUG === 'true';
  
  const cacheDir = process.env.CACHE_DIR || path.join(os.homedir(), '.explain-cli-cache');
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '1048576', 10); // 1MB default
  const maxContextSize = parseInt(process.env.MAX_CONTEXT_SIZE || '10485760', 10); // 10MB default

  return {
    apiKey,
    model,
    debug,
    cacheDir,
    maxFileSize,
    maxContextSize,
  };
}