import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ScanningScreenProps {
  progress?: {
    filesScanned: number;
    totalFiles: number;
    currentFile: string;
    entryPoints: number;
    frameworks: string[];
  };
}

export const ScanningScreen: React.FC<ScanningScreenProps> = ({ progress: scanProgress }) => {
  const progress = scanProgress?.totalFiles ? scanProgress.filesScanned / scanProgress.totalFiles : 0;
  const stats = scanProgress || {
    filesScanned: 0,
    entryPoints: 0,
    frameworks: [],
  };

  return (
    <Box flexDirection="column" paddingY={2}>
      <Box marginBottom={2}>
        <Text color="cyan">
          <Spinner type="dots" /> Scanning & Indexing Project...
        </Text>
      </Box>

      <Box marginBottom={2}>
        <Text>Progress: </Text>
        <Text color="green">{'█'.repeat(Math.floor(progress * 20))}</Text>
        <Text color="gray">{'░'.repeat(20 - Math.floor(progress * 20))}</Text>
        <Text> {Math.floor(progress * 100)}%</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text>Files scanned: <Text color="cyan">{stats.filesScanned}</Text>
          {scanProgress?.totalFiles ? ` / ${scanProgress.totalFiles}` : ''}</Text>
        <Text>Entry points found: <Text color="green">{stats.entryPoints}</Text></Text>
        {stats.frameworks.length > 0 && (
          <Text>Frameworks detected: <Text color="yellow">{stats.frameworks.join(', ')}</Text></Text>
        )}
        {scanProgress?.currentFile && (
          <Text color="gray">Currently: {scanProgress.currentFile}</Text>
        )}
      </Box>

      <Box marginTop={2}>
        <Text color="gray">Building dependency graph and analyzing architecture...</Text>
      </Box>
    </Box>
  );
};