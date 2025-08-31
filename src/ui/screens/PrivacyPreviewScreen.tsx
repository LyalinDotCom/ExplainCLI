import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, Static } from 'ink';
import Spinner from 'ink-spinner';
import { useFileDiscovery } from '../../hooks/useFileDiscovery.js';
import type { ProjectFile } from '../../types/index.js';

interface PrivacyPreviewScreenProps {
  onConsent: () => void;
  onCancel: () => void;
  filters: { include: string[]; exclude: string[] };
}

export const PrivacyPreviewScreen: React.FC<PrivacyPreviewScreenProps> = ({
  onConsent,
  onCancel,
  filters,
}) => {
  const { discoverFiles, loading } = useFileDiscovery();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    const discover = async () => {
      const discovered = await discoverFiles(process.cwd(), filters);
      setFiles(discovered.slice(0, 20)); // Show first 20 files
      setTotalSize(discovered.reduce((sum, f) => sum + f.size, 0));
    };
    discover();
  }, [filters, discoverFiles]);

  useInput((input: string, key: any) => {
    if (key.return) {
      onConsent();
    } else if (key.escape) {
      onCancel();
    }
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (loading) {
    return (
      <Box paddingY={2}>
        <Text color="cyan">
          <Spinner type="dots" /> Discovering files...
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={2}>
        <Text bold color="yellow">
          ⚠️  Privacy Preview - Review what will be sent to Gemini
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          Found <Text color="cyan">{files.length}</Text> files
          {' '}(<Text color="green">{formatSize(totalSize)}</Text> total)
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={2} height={10}>
        <Box marginBottom={1}><Text bold>Files to analyze:</Text></Box>
        <Static items={files.slice(0, 10)}>
          {(file: ProjectFile) => (
            <Box key={file.path}>
              <Text color="gray">• </Text>
              <Text color="cyan">{file.path}</Text>
              <Text color="gray"> ({formatSize(file.size)})</Text>
            </Box>
          )}
        </Static>
        {files.length > 10 && (
          <Text color="gray">... and {files.length - 10} more files</Text>
        )}
      </Box>

      <Box flexDirection="column" marginTop={2}>
        <Text color="green">✓ No credentials or secrets will be sent</Text>
        <Text color="green">✓ Your code remains private and secure</Text>
        <Text color="green">✓ Read-only analysis - no files will be modified</Text>
      </Box>

      <Box marginTop={2}>
        <Text bold>
          Press <Text color="green">Enter</Text> to approve or{' '}
          <Text color="red">Esc</Text> to cancel
        </Text>
      </Box>
    </Box>
  );
};