import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { WalkthroughStep } from '../../types/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

interface WalkthroughScreenProps {
  steps: WalkthroughStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onBack: () => void;
}

export const WalkthroughScreen: React.FC<WalkthroughScreenProps> = ({
  steps,
  currentStep,
  onStepChange,
  onBack,
}) => {
  const [fileContent, setFileContent] = useState<string[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'code' | 'explanation'>('code');
  const [loading, setLoading] = useState(true);
  
  const step = steps[currentStep];
  const maxVisibleLines = 30; // Number of lines to show at once
  
  // Load the full file content
  useEffect(() => {
    const loadFile = async () => {
      if (!step?.file) return;
      
      try {
        setLoading(true);
        // Try to read the actual file
        const fullPath = path.isAbsolute(step.file) 
          ? step.file 
          : path.join(process.cwd(), step.file);
        
        const content = await fs.readFile(fullPath, 'utf-8');
        setFileContent(content.split('\n'));
        
        // Scroll to the highlighted section
        const targetLine = step.lineRange[0] - 1;
        const centerOffset = Math.max(0, targetLine - Math.floor(maxVisibleLines / 2));
        setScrollOffset(centerOffset);
        setLoading(false);
      } catch (error) {
        // Fallback to the code from the step if file read fails
        setFileContent((step.code || '').split('\n'));
        setScrollOffset(0);
        setLoading(false);
      }
    };
    
    loadFile();
  }, [step, maxVisibleLines]);

  useInput((input: string, key: any) => {
    if (key.leftArrow && currentStep > 0) {
      onStepChange(currentStep - 1);
    } else if ((key.rightArrow || input === ' ') && currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else if (key.tab) {
      setViewMode(viewMode === 'code' ? 'explanation' : 'code');
    } else if (input === 'q') {
      onBack();
    } else if (key.upArrow && scrollOffset > 0) {
      setScrollOffset(Math.max(0, scrollOffset - 1));
    } else if (key.downArrow && scrollOffset < fileContent.length - maxVisibleLines) {
      setScrollOffset(Math.min(fileContent.length - maxVisibleLines, scrollOffset + 1));
    } else if (key.pageUp && scrollOffset > 0) {
      setScrollOffset(Math.max(0, scrollOffset - maxVisibleLines));
    } else if (key.pageDown && scrollOffset < fileContent.length - maxVisibleLines) {
      setScrollOffset(Math.min(fileContent.length - maxVisibleLines, scrollOffset + maxVisibleLines));
    }
  });

  if (!step) {
    return (
      <Box paddingY={2}>
        <Text color="red">No walkthrough steps available</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box paddingY={2}>
        <Text color="cyan">Loading file...</Text>
      </Box>
    );
  }

  const renderCodeView = () => {
    const visibleLines = fileContent.slice(scrollOffset, scrollOffset + maxVisibleLines);
    const [highlightStart, highlightEnd] = step.lineRange;
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1} justifyContent="space-between">
          <Text bold>📄 {step.file}</Text>
          <Text color="gray">
            Lines {scrollOffset + 1}-{Math.min(scrollOffset + maxVisibleLines, fileContent.length)} of {fileContent.length}
          </Text>
        </Box>
        <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
          {visibleLines.map((line, i) => {
            const lineNum = scrollOffset + i + 1;
            const isHighlighted = lineNum >= highlightStart && lineNum <= highlightEnd;
            
            return (
              <Box key={i}>
                <Text color="gray">{String(lineNum).padStart(4, ' ')} │ </Text>
                <Text 
                  color={isHighlighted ? 'yellow' : 'white'}
                  backgroundColor={isHighlighted ? 'gray' : undefined}
                >
                  {line || ' '}
                </Text>
              </Box>
            );
          })}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">
            ↑↓ Scroll · PgUp/PgDn Page · Highlighted: Lines {highlightStart}-{highlightEnd}
          </Text>
        </Box>
      </Box>
    );
  };

  const renderExplanationView = () => (
    <Box flexDirection="column">
      <Box marginBottom={2}>
        <Text bold>💡 Explanation for {step.file} (Lines {step.lineRange[0]}-{step.lineRange[1]})</Text>
      </Box>
      
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="cyan">What this code does:</Text>
        <Box paddingLeft={2}>
          <Text>{step.explanation}</Text>
        </Box>
      </Box>
      
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="yellow">Why this matters:</Text>
        <Box paddingLeft={2}>
          <Text>{step.whyRelevant}</Text>
        </Box>
      </Box>
      
      {step.linksTo && step.linksTo.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="green">Connections:</Text>
          {step.linksTo.map((link, i) => (
            <Box key={i} paddingLeft={2}>
              <Text>→ {link}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Progress Header */}
      <Box marginBottom={2} justifyContent="space-between">
        <Text bold color="cyan">
          Step {currentStep + 1}/{steps.length}
        </Text>
        <Text color="gray">
          [{viewMode === 'code' ? 'CODE VIEW' : 'EXPLANATION'}]
        </Text>
      </Box>

      {/* Main Content */}
      {viewMode === 'code' ? renderCodeView() : renderExplanationView()}

      {/* Navigation Footer */}
      <Box marginTop={2} flexDirection="column">
        <Box>
          <Text color="green" bold>Space/→</Text>
          <Text> Next · </Text>
          <Text color="yellow" bold>←</Text>
          <Text> Previous · </Text>
          <Text color="blue" bold>Tab</Text>
          <Text> Toggle View · </Text>
          <Text color="red" bold>q</Text>
          <Text> Back</Text>
        </Box>
      </Box>
    </Box>
  );
};