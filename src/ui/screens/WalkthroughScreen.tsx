import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { WalkthroughStep } from '../../types/index.js';

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
  const [viewMode, setViewMode] = useState<'code' | 'explanation'>('code');
  
  useInput((input: string, key: any) => {
    if (key.rightArrow || input === ' ') {
      if (currentStep < steps.length - 1) {
        onStepChange(currentStep + 1);
      }
    } else if (key.leftArrow) {
      if (currentStep > 0) {
        onStepChange(currentStep - 1);
      }
    } else if (input === 'q') {
      onBack();
    } else if (key.tab) {
      setViewMode(prev => prev === 'code' ? 'explanation' : 'code');
    } else if (input === 'g') {
      // TODO: Implement jump to step
    }
  });

  const step = steps[currentStep];
  if (!step) {
    return (
      <Box paddingY={2}>
        <Text color="red">No walkthrough steps available</Text>
      </Box>
    );
  }

  // Simple syntax highlighting for code
  const highlightCode = (code: string) => {
    // This is a simple highlighter - you could enhance this
    const lines = code.split('\n');
    return lines.map((line, i) => {
      const lineNum = step.lineRange[0] + i;
      const isHighlighted = i >= 2 && i <= 4; // Highlight middle lines
      
      return (
        <Box key={i}>
          <Text color="gray">{String(lineNum).padStart(4, ' ')} │ </Text>
          <Text color={isHighlighted ? 'yellow' : 'white'}>{line}</Text>
        </Box>
      );
    });
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Progress Header */}
      <Box marginBottom={2} justifyContent="space-between">
        <Text bold color="cyan">
          Step {currentStep + 1}/{steps.length}
        </Text>
        <Text color="yellow">{step.file}</Text>
        <Text color="gray">Lines {step.lineRange[0]}-{step.lineRange[1]}</Text>
      </Box>

      {/* Main Content Area */}
      <Box flexDirection="column" flexGrow={1} marginBottom={2}>
        {viewMode === 'code' ? (
          <Box flexDirection="column">
            <Box marginBottom={1}><Text bold>📄 Code:</Text></Box>
            <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
              {highlightCode(step.code)}
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Box marginBottom={1}><Text bold>💡 Explanation:</Text></Box>
            <Box padding={1}>
              <Text color="white">{step.explanation}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Why This Matters */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="green">Why this matters:</Text>
        <Text color="gray">{step.whyRelevant}</Text>
      </Box>

      {/* Links to Related */}
      {step.linksTo && step.linksTo.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Text bold>Related:</Text>
          {step.linksTo.map((link, i) => (
            <Text key={i} color="cyan">  → {link}</Text>
          ))}
        </Box>
      )}

      {/* Navigation Hint */}
      <Box>
        <Text color="gray">
          {currentStep < steps.length - 1 ? 'Space/→ Next' : 'Last step'} · 
          {currentStep > 0 ? ' ← Back' : ''} · 
          Tab Toggle View · q Return
        </Text>
      </Box>
    </Box>
  );
};