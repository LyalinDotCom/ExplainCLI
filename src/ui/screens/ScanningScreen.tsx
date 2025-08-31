import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export const ScanningScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [stats, setStats] = useState({
    filesScanned: 0,
    entryPoints: 0,
    frameworks: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.1, 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
        <Text>Files scanned: <Text color="cyan">{stats.filesScanned}</Text></Text>
        <Text>Entry points found: <Text color="green">{stats.entryPoints}</Text></Text>
        {currentFile && (
          <Text color="gray">Currently: {currentFile}</Text>
        )}
      </Box>

      <Box marginTop={2}>
        <Text color="gray">Building dependency graph and analyzing architecture...</Text>
      </Box>
    </Box>
  );
};