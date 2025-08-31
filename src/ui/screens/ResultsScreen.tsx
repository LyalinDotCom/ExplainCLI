import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { AnalysisResult } from '../../types/index.js';

interface ResultsScreenProps {
  result?: AnalysisResult;
  question: string;
  onBack: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  question,
  onBack,
}) => {
  useInput((input: string) => {
    if (input === 'q' || input === 'b') {
      onBack();
    }
  });

  if (!result) {
    return (
      <Box paddingY={2}>
        <Text color="red">No results available</Text>
      </Box>
    );
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box flexDirection="column" paddingY={2}>
      <Box marginBottom={2}><Text bold color="cyan">📋 Analysis Results</Text></Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Question:</Text>
        <Text color="white">{question}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Answer:</Text>
        <Box padding={1} borderStyle="round" borderColor="green">
          <Text>{result.answer}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>Confidence: </Text>
        <Text color={getConfidenceColor(result.confidence)}>
          {result.confidence.toUpperCase()}
        </Text>
      </Box>

      {result.citations && result.citations.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Text bold>Citations:</Text>
          {result.citations.map((cite, i) => (
            <Box key={i} marginLeft={2}>
              <Text color="cyan">📍 {cite.file}:{cite.line}</Text>
              <Text color="gray"> - {cite.claim}</Text>
            </Box>
          ))}
        </Box>
      )}

      {result.uncertainties && result.uncertainties.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Text bold color="yellow">Uncertainties:</Text>
          {result.uncertainties.map((u, i) => (
            <Box key={i} marginLeft={2}><Text color="yellow">• {u}</Text></Box>
          ))}
        </Box>
      )}

      {result.omissions && result.omissions.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Text bold color="gray">Omitted due to limits:</Text>
          {result.omissions.map((o, i) => (
            <Box key={i} marginLeft={2}><Text color="gray">• {o}</Text></Box>
          ))}
        </Box>
      )}

      <Box marginTop={2}>
        <Text color="gray">Press q to go back</Text>
      </Box>
    </Box>
  );
};