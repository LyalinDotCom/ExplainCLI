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
    overallProgress?: number;
    stage?: string;
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
  
  // Extract progress from analysis messages if present
  let progress = simulatedProgress;
  
  if (scanProgress?.currentFile && scanProgress.currentFile.startsWith('[')) {
    // Extract percentage from messages like "[61%] Analyzing..."
    const match = scanProgress.currentFile.match(/\[(\d+)%\]/);
    if (match) {
      progress = parseInt(match[1]) / 100;
    }
  } else if (scanProgress?.overallProgress !== undefined) {
    // Use overall progress from indexing phase
    progress = scanProgress.overallProgress / 100;
  } else if (scanProgress?.totalFiles) {
    // Calculate from file scanning
    progress = scanProgress.filesScanned / scanProgress.totalFiles;
  }
    
  const stats = scanProgress || {
    filesScanned: 0,
    entryPoints: 0,
    frameworks: [],
    insights: 0,
  };

  // Determine if we're in analysis phase
  const isAnalyzing = scanProgress?.currentFile && scanProgress.currentFile.startsWith('[');

  return (
    <Box flexDirection="column" paddingY={2}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text color="cyan">
          <Spinner type="dots" /> {
            isAnalyzing
              ? 'Deep Analysis in Progress...' 
              : 'Scanning & Indexing Project...'
          }
        </Text>
      </Box>

      {/* Stats Section */}
      <Box flexDirection="column" marginBottom={2}>
        {/* Files scanned - only show during indexing */}
        {!isAnalyzing && (stats.filesScanned > 0 || scanProgress?.totalFiles) ? (
          <Box>
            <Text>📁 Files scanned: </Text>
            <Text color="cyan" bold>{String(stats.filesScanned)}</Text>
            {scanProgress?.totalFiles ? (
              <Text color="gray"> / {String(scanProgress.totalFiles)}</Text>
            ) : null}
          </Box>
        ) : null}
        
        {/* Entry points - only show during indexing */}
        {!isAnalyzing && stats.entryPoints > 0 ? (
          <Box>
            <Text>🎯 Entry points found: </Text>
            <Text color="green" bold>{String(stats.entryPoints)}</Text>
          </Box>
        ) : null}
        
        {/* Frameworks - only show during indexing */}
        {!isAnalyzing && stats.frameworks && stats.frameworks.length > 0 ? (
          <Box>
            <Text>🔧 Frameworks: </Text>
            <Text color="yellow">{stats.frameworks.join(', ')}</Text>
          </Box>
        ) : null}
        
        {/* Insights - only show during indexing */}
        {!isAnalyzing && scanProgress?.insights !== undefined && scanProgress.insights > 0 ? (
          <Box>
            <Text>💡 Insights discovered: </Text>
            <Text color="magenta" bold>{String(scanProgress.insights)}</Text>
          </Box>
        ) : null}
        
        {/* Current status - show analysis messages prominently */}
        {scanProgress?.currentFile ? (
          <Box marginTop={1}>
            {isAnalyzing ? (
              // This is a progress message with percentage - show it prominently
              <Text bold color="cyan">{scanProgress.currentFile}</Text>
            ) : (
              // This is a file path during indexing
              <Text color="gray">
                Current: {scanProgress.currentFile.length > 50 
                  ? '...' + scanProgress.currentFile.slice(-47) 
                  : scanProgress.currentFile}
              </Text>
            )}
          </Box>
        ) : null}
      </Box>

      {/* Spacer to push progress bar to bottom */}
      <Box flexGrow={1} />

      {/* Progress Bar at Bottom */}
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="green">{'█'.repeat(Math.floor(progress * 20))}</Text>
          <Text color="gray">{'░'.repeat(20 - Math.floor(progress * 20))}</Text>
        </Box>
      </Box>
    </Box>
  );
};