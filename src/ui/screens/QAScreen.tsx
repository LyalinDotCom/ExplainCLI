import React, { useState } from 'react';
import { Box, Text, Static } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import type { AnalysisResult } from '../../types/index.js';

interface QAScreenProps {
  context?: AnalysisResult;
  onBack: () => void;
}

interface QAMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ file: string; line: number }>;
}

export const QAScreen: React.FC<QAScreenProps> = ({ context, onBack }) => {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: QAMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // TODO: Send to Gemini with context
    setTimeout(() => {
      const response: QAMessage = {
        role: 'assistant',
        content: 'This would be the AI response based on the project context.',
        citations: [{ file: 'src/index.ts', line: 42 }],
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1500);
  };

  const handleCommand = (cmd: string) => {
    if (cmd.startsWith('/open ')) {
      // TODO: Implement file viewer
    } else if (cmd.startsWith('/find ')) {
      // TODO: Implement search
    } else if (cmd === '/back' || cmd === 'q') {
      onBack();
    }
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={2}><Text bold color="cyan">💬 Q&A Mode</Text></Box>
      
      <Box flexDirection="column" flexGrow={1} marginBottom={2}>
        <Static items={messages}>
          {(msg: QAMessage, i: number) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text bold color={msg.role === 'user' ? 'green' : 'magenta'}>
                {msg.role === 'user' ? 'You' : 'ExplainCLI'}:
              </Text>
              <Text>{msg.content}</Text>
              {msg.citations && msg.citations.length > 0 && (
                <Box marginTop={1}>
                  {msg.citations.map((cite, j) => (
                    <Text key={j} color="cyan">
                      📍 {cite.file}:{cite.line}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Static>
        
        {loading && (
          <Box>
            <Text color="magenta">
              <Spinner type="dots" /> Analyzing...
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <Text color="green">{'> '}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={input.startsWith('/') ? () => handleCommand(input) : handleSubmit}
          placeholder="Ask a follow-up question or use /commands"
          focus={!loading}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          Commands: /open file:line · /find "text" · /back or q to return
        </Text>
      </Box>
    </Box>
  );
};