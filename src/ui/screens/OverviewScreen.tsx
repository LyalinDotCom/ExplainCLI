import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { ArchitectureOverview } from '../../types/index.js';

interface OverviewScreenProps {
  overview?: ArchitectureOverview;
  onWalkthrough: () => void;
  onQA: () => void;
  onSaveReport?: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  overview,
  onWalkthrough,
  onQA,
  onSaveReport,
}) => {
  useInput((input: string) => {
    if (input === 'w' || input === ' ') {
      onWalkthrough();
    } else if (input === 'q') {
      onQA();
    } else if (input === 's' && onSaveReport) {
      onSaveReport();
    }
  });

  if (!overview) {
    return (
      <Box paddingY={2}>
        <Text color="red">No overview available</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={2}>
      <Box marginBottom={2}>
        <Text bold color="cyan">📊 Architecture Overview</Text>
      </Box>

      {/* Frameworks Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Frameworks & Technologies:</Text>
      </Box>
      <Box flexDirection="column" marginBottom={2} paddingLeft={2}>
        {overview.frameworks && Array.isArray(overview.frameworks) && overview.frameworks.length > 0 ? (
          overview.frameworks.map((fw, i) => (
            <Box key={`fw-${i}`}>
              <Text color="green">• {fw}</Text>
            </Box>
          ))
        ) : (
          <Box>
            <Text color="gray">No frameworks detected</Text>
          </Box>
        )}
      </Box>

      {/* Runtimes Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Runtimes:</Text>
      </Box>
      <Box flexDirection="column" marginBottom={2} paddingLeft={2}>
        {overview.runtimes && Array.isArray(overview.runtimes) && overview.runtimes.length > 0 ? (
          overview.runtimes.map((rt, i) => (
            <Box key={`rt-${i}`}>
              <Text color="yellow">• {rt}</Text>
            </Box>
          ))
        ) : (
          <Box>
            <Text color="gray">Runtime not identified</Text>
          </Box>
        )}
      </Box>

      {/* Folder Structure Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Folder Structure:</Text>
      </Box>
      <Box flexDirection="column" marginBottom={2} paddingLeft={2}>
        <Text color="gray">{overview.folderLayout || 'Standard project structure'}</Text>
      </Box>

      {/* Main Components Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Main Components:</Text>
      </Box>
      <Box flexDirection="column" marginBottom={2} paddingLeft={2}>
        {overview.mainComponents && Array.isArray(overview.mainComponents) && overview.mainComponents.length > 0 ? (
          overview.mainComponents.map((comp, i) => (
            <Box key={`comp-${i}`}>
              <Text color="cyan">• {typeof comp === 'string' ? comp : String(comp)}</Text>
            </Box>
          ))
        ) : (
          <Box>
            <Text color="gray">No components identified</Text>
          </Box>
        )}
      </Box>

      {/* Control Flow Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Control Flow:</Text>
      </Box>
      <Box flexDirection="column" marginBottom={2} paddingLeft={2}>
        <Text color="gray">{overview.controlFlow || 'Application flow'}</Text>
      </Box>

      {/* Navigation Instructions */}
      <Box marginTop={3} flexDirection="column">
        <Text bold>🎯 Ready to explore!</Text>
        <Box marginTop={1}>
          <Text color="green" bold>Press [w] or Space</Text>
          <Text> to begin step-by-step code walkthrough</Text>
        </Box>
        <Box>
          <Text color="blue" bold>Press [q]</Text>
          <Text> for Q&A mode to ask follow-up questions</Text>
        </Box>
        <Box>
          <Text color="magenta" bold>Press [s]</Text>
          <Text> to save full analysis report as Markdown</Text>
        </Box>
      </Box>
    </Box>
  );
};