# Vercel Sandbox Agent

A lightweight AI coding assistant that spins up sandboxed development environments from GitHub repositories and executes prompts using OpenCode.

## Features

- Simple form interface: enter repo URL + prompt
- Automatic sandbox creation and OpenCode installation
- Real-time streaming output
- No authentication or database required
- Open source and self-hostable

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your tokens:

```
GITHUB_TOKEN=your_github_token_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. Enter a GitHub repository URL
2. Provide a prompt describing what you want to accomplish
3. The system creates a sandbox, clones the repository, installs OpenCode, and executes your prompt
4. Watch the real-time output as the AI processes your request

## Tech Stack

- **Framework:** Next.js 15
- **Sandbox:** Vercel Sandbox SDK
- **AI:** OpenCode
- **Runtime:** Node.js

## Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token with repo access
- `ANTHROPIC_API_KEY` - Anthropic API key for AI model access

## License

MIT
