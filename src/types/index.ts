// Removed AnalysisMode - always deep inspection now

export type ScreenState = 
  | 'home'
  | 'scanning'
  | 'overview'
  | 'walkthrough'
  | 'qa'
  | 'results';

export interface Config {
  apiKey: string;
  model: string;
  debug: boolean;
  cacheDir?: string;
  maxFileSize: number;
  maxContextSize: number;
}

export interface ProjectFile {
  path: string;
  size: number;
  language?: string;
  content?: string;
  preview?: string;
  isEntry?: boolean;
  imports?: string[];
  exports?: string[];
}

export interface IndexedProject {
  root: string;
  name: string;
  files: ProjectFile[];
  entryPoints: string[];
  frameworks: string[];
  languages: Set<string>;
  importGraph: Map<string, string[]>;
  totalSize: number;
}

export interface CodeSpan {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  explanation?: string;
  relevance?: number;
}

export interface WalkthroughStep {
  index: number;
  file: string;
  lineRange: [number, number];
  code: string;
  explanation: string;
  whyRelevant: string;
  linksTo?: string[];
}

export interface ArchitectureOverview {
  frameworks: string[];
  runtimes: string[];
  folderLayout: string;
  mainComponents: string[];
  controlFlow: string;
}

export interface AnalysisResult {
  overview: ArchitectureOverview;
  walkthrough: WalkthroughStep[];
  answer: string;
  citations: Array<{ claim: string; file: string; line: number }>;
  uncertainties?: string[];
  omissions?: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface PrivacyPreview {
  files: Array<{
    path: string;
    size: number;
    preview: string;
    included: boolean;
  }>;
  totalSize: number;
  fileCount: number;
}

export interface AppState {
  screen: ScreenState;
  question: string;
  project?: IndexedProject;
  result?: AnalysisResult;
  currentStep: number;
  filters: {
    include: string[];
    exclude: string[];
  };
  loading: boolean;
  error?: string;
}