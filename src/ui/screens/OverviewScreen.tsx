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
    if (input === 'w') {
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
        <Text bold>Frameworks & Technologies:</Text>
        {overview.frameworks.map((fw, i) => (
          <Text key={i} color="green">  • {fw}</Text>
        ))}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Runtimes:</Text>
        {overview.runtimes.map((rt, i) => (
          <Text key={i} color="yellow">  • {rt}</Text>
        ))}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Folder Structure:</Text>
        <Text color="gray">{overview.folderLayout}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Main Components:</Text>
        {overview.mainComponents.map((comp, i) => (
          <Text key={i} color="cyan">  • {comp}</Text>
        ))}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Control Flow:</Text>
        <Text color="gray">{overview.controlFlow}</Text>
      </Box>

      <Box marginTop={3} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text color="green">  [w] Begin Walkthrough - Step through the execution flow</Text>
        <Text color="blue">  [q] Q&A Mode - Ask follow-up questions</Text>
      </Box>
    </Box>
  );
};