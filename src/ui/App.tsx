import React, { useState, useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import type { Config, AppState, ScreenState, AnalysisMode } from '../types/index.js';
import { GlobalLayout } from './layouts/GlobalLayout.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { PrivacyPreviewScreen } from './screens/PrivacyPreviewScreen.js';
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
    mode: 'best-effort',
    question: '',
    currentStep: 0,
    filters: {
      include: ['**/*'],
      exclude: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    },
    privacyConsent: false,
    loading: false,
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

  const handleModeChange = useCallback((mode: AnalysisMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const handleQuestionSubmit = useCallback(async (question: string) => {
    setState(prev => ({ ...prev, question, screen: 'privacy-preview' }));
  }, []);

  const handlePrivacyConsent = useCallback(async () => {
    setState(prev => ({ ...prev, privacyConsent: true, screen: 'scanning', loading: true }));
    
    try {
      const result = await analyzeProject(state.question, state.mode, state.filters);
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
  }, [state.question, state.mode, state.filters, analyzeProject]);

  const renderScreen = () => {
    switch (state.screen) {
      case 'home':
        return (
          <HomeScreen
            onQuestionSubmit={handleQuestionSubmit}
            onModeChange={handleModeChange}
            currentMode={state.mode}
          />
        );
      case 'privacy-preview':
        return (
          <PrivacyPreviewScreen
            onConsent={handlePrivacyConsent}
            onCancel={() => handleScreenChange('home')}
            filters={state.filters}
          />
        );
      case 'scanning':
        return <ScanningScreen />;
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
      mode={state.mode}
      screen={state.screen}
    >
      {renderScreen()}
    </GlobalLayout>
  );
};