import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface HomeScreenProps {
  onQuestionSubmit: (question: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onQuestionSubmit,
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = () => {
    if (question.trim()) {
      onQuestionSubmit(question);
    }
  };

  return (
    <Box flexDirection="column" paddingY={2}>
      <Box marginBottom={2}>
        <Text bold color="cyan">What do you want to understand about this codebase?</Text>
      </Box>

      <Box marginBottom={2}>
        <Text color="green">{'> '}</Text>
        <TextInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          placeholder="e.g., Where is OAuth token verification implemented?"
          focus={true}
        />
      </Box>

      <Box marginTop={2}>
        <Text color="gray">
          🔍 Deep Analysis Mode: I'll thoroughly analyze your codebase,
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          examining every relevant file to build a complete understanding.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          💡 Examples: "How is authentication implemented?" • "Show me the API flow"
        </Text>
      </Box>
    </Box>
  );
};