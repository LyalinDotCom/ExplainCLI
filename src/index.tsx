#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { loadConfig } from './config/config.js';
import chalk from 'chalk';
import dotenv from 'dotenv';
import process from 'node:process';

dotenv.config();

async function main() {
  try {
    const config = await loadConfig();

    if (!config.apiKey) {
      console.error(chalk.red('Error: GEMINI_API_KEY is not set.'));
      console.error(chalk.yellow('Please set your API key in the .env file or as an environment variable.'));
      process.exit(1);
    }

    const { waitUntilExit } = render(<App config={config} />);
    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled rejection:'), reason);
  process.exit(1);
});

main().catch((error) => {
  console.error(chalk.red('Failed to start ExplainCLI:'), error);
  process.exit(1);
});