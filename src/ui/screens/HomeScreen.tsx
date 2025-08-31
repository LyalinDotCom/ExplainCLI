import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { AnalysisMode } from '../../types/index.js';

interface HomeScreenProps {
  onQuestionSubmit: (question: string) => void;
  onModeChange: (mode: AnalysisMode) => void;
  currentMode: AnalysisMode;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onQuestionSubmit,
  onModeChange,
  currentMode,
}) => {
  const [question, setQuestion] = useState('');
  const [focusedElement, setFocusedElement] = useState<'input' | 'mode'>('input');

  useInput((input: string, key: any) => {
    if (key.tab) {
      setFocusedElement(prev => prev === 'input' ? 'mode' : 'input');
    }
  });

  const handleSubmit = () => {
    if (question.trim()) {
      onQuestionSubmit(question);
    }
  };

  const modeItems = [
    { label: '⚡ Best-Effort Mode - Fast heuristics, partial reads', value: 'best-effort' },
    { label: '🔍 Deep Inspection Mode - Exhaustive analysis', value: 'deep' },
  ];

  return (
    <Box flexDirection="column" paddingY={2}>
      <Box marginBottom={2}>
        <Text bold color="cyan">What do you want to understand about this codebase?</Text>
      </Box>

      <Box marginBottom={2}>
        <Text color={focusedElement === 'input' ? 'green' : 'gray'}>{'> '}</Text>
        <TextInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          placeholder="e.g., Where is OAuth token verification implemented?"
          focus={focusedElement === 'input'}
        />
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}><Text bold>Analysis Mode:</Text></Box>
        <SelectInput
          items={modeItems}
          onSelect={(item) => onModeChange(item.value as AnalysisMode)}
          initialIndex={currentMode === 'deep' ? 1 : 0}
          isFocused={focusedElement === 'mode'}
        />
      </Box>

      <Box marginTop={2}>
        <Text color="gray">
          💡 Tip: Best-Effort mode is faster and works well for most questions.
          Use Deep mode for comprehensive analysis.
        </Text>
      </Box>
    </Box>
  );
};