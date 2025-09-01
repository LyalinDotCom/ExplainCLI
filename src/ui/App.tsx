import React, { useState, useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import type { Config, AppState, ScreenState } from '../types/index.js';
import { GlobalLayout } from './layouts/GlobalLayout.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { ScanningScreen } from './screens/ScanningScreen.js';
import { OverviewScreen } from './screens/OverviewScreen.js';
import { WalkthroughScreen } from './screens/WalkthroughScreen.js';
import { QAScreen } from './screens/QAScreen.js';
import { ResultsScreen } from './screens/ResultsScreen.js';
import { useProjectAnalyzer } from '../hooks/useProjectAnalyzer.js';

interface AppProps {
  config: Config;
}

export const App: React.FC<AppProps> = ({ config }) => {
  const { exit } = useApp();
  const { analyzeProject } = useProjectAnalyzer(config);
  
  const [state, setState] = useState<AppState>({
    screen: 'home',
    question: '',
    currentStep: 0,
    filters: {
      include: ['**/*.{js,jsx,ts,tsx,py,java,go,rs,cpp,c,cs,rb,php,swift,kt,json,yaml,yml,toml,md}'],
      exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.next/**', '**/coverage/**'],
    },
    loading: false,
  });
  
  const [scanProgress, setScanProgress] = useState({
    filesScanned: 0,
    totalFiles: 0,
    currentFile: '',
    entryPoints: 0,
    frameworks: [] as string[],
    insights: 0,
  });

  useInput((input: string, key: any) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      if (state.screen === 'home') {
        exit();
      } else {
        setState(prev => ({ ...prev, screen: 'home' }));
      }
    }
  });

  const handleScreenChange = useCallback((screen: ScreenState) => {
    setState(prev => ({ ...prev, screen }));
  }, []);

  const handleQuestionSubmit = useCallback(async (question: string) => {
    setState(prev => ({ ...prev, question, screen: 'scanning', loading: true }));
    
    // Reset progress
    setScanProgress({
      filesScanned: 0,
      totalFiles: 0,
      currentFile: '',
      entryPoints: 0,
      frameworks: [],
      insights: 0,
    });
    
    try {
      const result = await analyzeProject(
        question, 
        state.filters,
        (progress) => {
          setScanProgress(prev => ({ ...prev, ...progress }));
        }
      );
      setState(prev => ({
        ...prev,
        result,
        loading: false,
        screen: 'overview',
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screen: 'home',
      }));
    }
  }, [state.filters, analyzeProject]);

  const renderScreen = () => {
    switch (state.screen) {
      case 'home':
        return (
          <HomeScreen
            onQuestionSubmit={handleQuestionSubmit}
          />
        );
      case 'scanning':
        return <ScanningScreen progress={scanProgress} />;
      case 'overview':
        return (
          <OverviewScreen
            overview={state.result?.overview}
            onWalkthrough={() => handleScreenChange('walkthrough')}
            onQA={() => handleScreenChange('qa')}
          />
        );
      case 'walkthrough':
        return (
          <WalkthroughScreen
            steps={state.result?.walkthrough || []}
            currentStep={state.currentStep}
            onStepChange={(step) => setState(prev => ({ ...prev, currentStep: step }))}
            onBack={() => handleScreenChange('overview')}
          />
        );
      case 'qa':
        return (
          <QAScreen
            context={state.result}
            onBack={() => handleScreenChange('overview')}
          />
        );
      case 'results':
        return (
          <ResultsScreen
            result={state.result}
            question={state.question}
            onBack={() => handleScreenChange('overview')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GlobalLayout
      projectName={state.project?.name || 'No Project'}
      screen={state.screen}
    >
      {renderScreen()}
    </GlobalLayout>
  );
};