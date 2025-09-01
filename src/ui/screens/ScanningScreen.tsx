import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ScanningScreenProps {
  progress?: {
    filesScanned: number;
    totalFiles: number;
    currentFile: string;
    entryPoints: number;
    frameworks: string[];
    insights?: number;
  };
}

export const ScanningScreen: React.FC<ScanningScreenProps> = ({ progress: scanProgress }) => {
  // Simulate progress if no real progress yet
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  
  useEffect(() => {
    if (!scanProgress?.totalFiles) {
      const interval = setInterval(() => {
        setSimulatedProgress(prev => Math.min(prev + 0.05, 0.9)); // Max out at 90%
      }, 200);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [scanProgress?.totalFiles]);
  
  const progress = scanProgress?.totalFiles 
    ? scanProgress.filesScanned / scanProgress.totalFiles 
    : simulatedProgress;
    
  const stats = scanProgress || {
    filesScanned: 0,
    entryPoints: 0,
    frameworks: [],
    insights: 0,
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
        {/* Files scanned - only show if we have files */}
        {(stats.filesScanned > 0 || scanProgress?.totalFiles) ? (
          <Box>
            <Text>📁 Files scanned: </Text>
            <Text color="cyan" bold>{String(stats.filesScanned)}</Text>
            {scanProgress?.totalFiles ? (
              <Text color="gray"> / {String(scanProgress.totalFiles)}</Text>
            ) : null}
          </Box>
        ) : null}
        
        {/* Entry points - only show the count, no total */}
        {stats.entryPoints > 0 ? (
          <Box>
            <Text>🎯 Entry points found: </Text>
            <Text color="green" bold>{String(stats.entryPoints)}</Text>
          </Box>
        ) : null}
        
        {stats.frameworks && stats.frameworks.length > 0 ? (
          <Box>
            <Text>🔧 Frameworks: </Text>
            <Text color="yellow">{stats.frameworks.join(', ')}</Text>
          </Box>
        ) : null}
        
        {scanProgress?.insights !== undefined && scanProgress.insights > 0 ? (
          <Box>
            <Text>💡 Insights discovered: </Text>
            <Text color="magenta" bold>{String(scanProgress.insights)}</Text>
          </Box>
        ) : null}
        
        {scanProgress?.currentFile ? (
          <Box marginTop={1}>
            <Text color="gray">Analyzing: {scanProgress.currentFile.length > 50 
              ? '...' + scanProgress.currentFile.slice(-47) 
              : scanProgress.currentFile}
            </Text>
          </Box>
        ) : null}
      </Box>

      <Box marginTop={2}>
        <Text color="gray">
          {progress < 0.3 ? 'Discovering files...' :
           progress < 0.6 ? 'Building dependency graph...' :
           progress < 0.9 ? 'Analyzing code patterns...' :
           'Finalizing analysis...'}
        </Text>
      </Box>
    </Box>
  );
};