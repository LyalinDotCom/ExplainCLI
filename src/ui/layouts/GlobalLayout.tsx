import React from 'react';
import { Box, Text, useStdout } from 'ink';
import Gradient from 'ink-gradient';
import type { ScreenState } from '../../types/index.js';

interface GlobalLayoutProps {
  children: React.ReactNode;
  projectName: string;
  screen: ScreenState;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({
  children,
  projectName,
  screen,
}) => {
  const { stdout } = useStdout();
  const height = stdout.rows || 24;

  const getFooterHints = () => {
    switch (screen) {
      case 'home':
        return 'Enter Submit · Tab Mode · Ctrl+C Exit';
      case 'walkthrough':
        return 'Space/→ Next · ← Back · g Jump # · Tab Switch · o Open · q Back';
      case 'qa':
        return '/open path:line · /find "token" · /mode · q Back';
      default:
        return 'Esc/q Back · ? Help · Ctrl+C Exit';
    }
  };


  const getScreenTitle = () => {
    const titles: Record<ScreenState, string> = {
      home: 'Ask a Question',
      scanning: 'Scanning & Indexing',
      overview: 'Architecture Overview',
      walkthrough: 'Execution Walkthrough',
      qa: 'Q&A Mode',
      results: 'Analysis Results',
    };
    return titles[screen] || '';
  };

  return (
    <Box flexDirection="column" height={height}>
      {/* Header */}
      <Box
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
        justifyContent="space-between"
      >
        <Box>
          <Gradient name="rainbow">
            <Text bold>📖 ExplainCLI</Text>
          </Gradient>
          <Text color="gray"> · </Text>
          <Text color="cyan">{projectName}</Text>
        </Box>
        <Box>
          <Text color="yellow">{getScreenTitle()}</Text>
          <Text color="gray"> · </Text>
          <Text color="green">Deep Analysis</Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} flexDirection="column" paddingX={1}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        justifyContent="center"
      >
        <Text color="gray">{getFooterHints()}</Text>
      </Box>
    </Box>
  );
};