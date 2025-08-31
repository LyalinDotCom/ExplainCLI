# ExplainCLI

A read-only, project-aware code educator TUI that builds mental models and teaches architecture step-by-step. Run it inside any repository to understand how the code works.

## 🎯 Purpose

ExplainCLI is your personal code teacher that:
- **Builds a mental model** of how the code works
- **Teaches architecture** and execution flow step-by-step  
- **Answers questions** with precise file:line citations
- **Never modifies** any files (100% read-only)

## ✨ Features

### Two Analysis Modes
- **⚡ Best-Effort Mode**: Fast heuristics, partial reads, reasonable assumptions
- **🔍 Deep Inspection Mode**: Exhaustive analysis to discover all possible paths

### Interactive TUI Experience
- **Privacy Preview**: Review exactly what will be sent to Gemini before consent
- **Architecture Overview**: Concise summary of frameworks, structure, and flow
- **Execution Walkthrough**: Step-by-step code flow with explanations
- **Q&A Mode**: Ask follow-up questions using the same context
- **Precise Citations**: Every claim backed by file:line references

### Safety & Privacy
- **Read-only**: Never modifies any files in your repository
- **No code execution**: Doesn't run project scripts or binaries
- **Privacy first**: Shows what will be sent and requires consent
- **Secret redaction**: Automatically removes credentials and sensitive data
- **Size limits**: Enforces file and context size caps

## 📋 Prerequisites

- Node.js >= 20.0.0
- Google Gemini API key

## 🚀 Installation

### Global Installation (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd ExplainCLI

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

### Setup

1. Create a `.env` file:
```bash
cp .env.example .env
```

2. Add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 💻 Usage

Navigate to any code repository and run:

```bash
explain
```

### TUI Navigation

The entire experience happens inside the terminal UI:

1. **Home Screen**: Enter your question and select analysis mode
2. **Privacy Preview**: Review and approve files to be analyzed
3. **Scanning**: Watch as the project is indexed
4. **Overview**: See the architecture summary
5. **Walkthrough**: Step through the execution flow
6. **Q&A Mode**: Ask follow-up questions

### Keyboard Controls

#### Global
- `Esc` or `Ctrl+C`: Go back / Exit
- `Tab`: Switch between UI elements

#### Walkthrough Mode
- `Space` or `→`: Next step
- `←`: Previous step
- `g`: Jump to step number
- `o`: Open file location (future)
- `q`: Back to overview

#### Q&A Mode
- `/open file:line`: View specific code location
- `/find "text"`: Search in context
- `/mode`: Switch analysis mode
- `q`: Back to overview

## 🏗️ Architecture

```
ExplainCLI/
├── src/
│   ├── index.tsx              # Entry point
│   ├── types/                 # TypeScript definitions
│   ├── config/                # Configuration
│   ├── hooks/                 # React hooks
│   ├── services/
│   │   ├── ProjectIndexer.ts  # File discovery & indexing
│   │   ├── GeminiAnalyzer.ts  # AI analysis with Gemini 2.5 Pro
│   │   └── SecurityService.ts # Secret redaction & safety
│   ├── analyzers/             # Language-specific analyzers
│   └── ui/
│       ├── App.tsx            # Main app component
│       ├── layouts/           # Global layout
│       └── screens/           # TUI screens
│           ├── HomeScreen.tsx
│           ├── PrivacyPreviewScreen.tsx
│           ├── ScanningScreen.tsx
│           ├── OverviewScreen.tsx
│           ├── WalkthroughScreen.tsx
│           ├── QAScreen.tsx
│           └── ResultsScreen.tsx
```

## 🔐 Security Features

- **Automatic secret redaction**: API keys, tokens, passwords are never sent
- **Path validation**: Prevents directory traversal attacks
- **Read-only guarantee**: No file system modifications
- **Size limits**: Configurable max file and context sizes
- **.env protection**: Environment files are fully redacted

## ⚙️ Configuration

Environment variables (in `.env`):

```env
# Required
GEMINI_API_KEY=your_key_here

# Optional
DEBUG=false
CACHE_DIR=~/.explain-cli-cache
MAX_FILE_SIZE=1048576        # 1MB default
MAX_CONTEXT_SIZE=10485760    # 10MB default
```

## 🧪 Development

```bash
# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## 📝 Example Session

1. **Question**: "Where is OAuth token verification implemented?"

2. **ExplainCLI provides**:
   - Architecture overview showing auth framework
   - Step-by-step walkthrough of the auth flow
   - Direct answer: "OAuth token verification is in `auth/middleware.ts:47-52`"
   - Q&A mode for follow-ups like "How are refresh tokens handled?"

## 🤝 Contributing

Contributions are welcome! The codebase is designed to be extensible:
- Add language analyzers in `src/analyzers/`
- Extend analysis modes in `src/services/GeminiAnalyzer.ts`
- Improve UI screens in `src/ui/screens/`

## 📄 License

MIT

## 🙏 Acknowledgments

- Powered by Google's Gemini 2.5 Pro model
- Built with Ink for the terminal UI
- Inspired by the need for better code understanding tools