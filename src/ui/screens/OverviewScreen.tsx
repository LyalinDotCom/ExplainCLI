import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { ArchitectureOverview } from '../../types/index.js';

interface OverviewScreenProps {
  overview?: ArchitectureOverview;
  onWalkthrough: () => void;
  onQA: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  overview,
  onWalkthrough,
  onQA,
}) => {
  useInput((input: string) => {
    if (input === 'w' || input === ' ') {
      onWalkthrough();
    } else if (input === 'q') {
      onQA();
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
      <Box marginBottom={2}><Text bold color="cyan">📊 Architecture Overview</Text></Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box><Text bold>Frameworks & Technologies:</Text></Box>
        {overview.frameworks && Array.isArray(overview.frameworks) && overview.frameworks.length > 0 ? (
          overview.frameworks.map((fw, i) => (
            <Box key={i}>
              <Text color="green">  • {fw}</Text>
            </Box>
          ))
        ) : (
          <Box><Text color="gray">  No frameworks detected</Text></Box>
        )}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box><Text bold>Runtimes:</Text></Box>
        {overview.runtimes && Array.isArray(overview.runtimes) && overview.runtimes.length > 0 ? (
          overview.runtimes.map((rt, i) => (
            <Box key={i}>
              <Text color="yellow">  • {rt}</Text>
            </Box>
          ))
        ) : (
          <Box><Text color="gray">  Runtime not identified</Text></Box>
        )}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box><Text bold>Folder Structure:</Text></Box>
        <Box><Text color="gray">{overview.folderLayout}</Text></Box>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box><Text bold>Main Components:</Text></Box>
        {overview.mainComponents && Array.isArray(overview.mainComponents) ? (
          overview.mainComponents.map((comp, i) => (
            <Box key={i}>
              <Text color="cyan">  • {comp}</Text>
            </Box>
          ))
        ) : (
          <Box><Text color="gray">  No components identified</Text></Box>
        )}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box><Text bold>Control Flow:</Text></Box>
        <Box><Text color="gray">{overview.controlFlow}</Text></Box>
      </Box>

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
      </Box>
    </Box>
  );
};