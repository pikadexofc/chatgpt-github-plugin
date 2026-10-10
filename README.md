# GitHub ChatGPT Plugin

This project creates a classic ChatGPT plugin that exposes GitHub repository operations through a public HTTPS endpoint.

## What it does

- Search GitHub repositories
- Get repository metadata
- List open or closed issues
- List pull requests
- Read file contents from a repo

## Project structure

```text
.
├─ .well-known/
│  └─ ai-plugin.json
├─ openapi.yaml
├─ package.json
├─ server.js
├─ README.md
└─ .gitignore
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set a GitHub token if you want to use authenticated requests:

```bash
export GITHUB_TOKEN=your_token_here
```

3. Start the server:

```bash
npm start
```

4. The service will run at:

```text
http://localhost:3000
```

## Plugin manifest

The manifest is served at:

```text
http://localhost:3000/.well-known/ai-plugin.json
```

The OpenAPI document is served at:

```text
http://localhost:3000/openapi.yaml
```

## Example requests

```bash
curl "http://localhost:3000/github/search/repositories?q=nextjs&per_page=3"
curl "http://localhost:3000/github/repos/vercel/next.js"
curl "http://localhost:3000/github/repos/microsoft/vscode/issues?state=open&per_page=5"
curl "http://localhost:3000/github/repos/vercel/next.js/pulls?state=open&per_page=5"
curl "http://localhost:3000/github/repos/openai/openai-cookbook/contents/examples/README.md?ref=main"
```

## Deploying for ChatGPT

The server must be publicly reachable over HTTPS. Common choices:

- Render
- Railway
- Fly.io
- DigitalOcean App Platform
- VPS with Nginx + PM2

After deployment:

1. Replace `https://your-domain.example.com` in `openapi.yaml` and `.well-known/ai-plugin.json`
2. Make sure `.well-known/ai-plugin.json` is accessible from the public host
3. Add the plugin in ChatGPT using the public URL

## Notes

- For public repositories, no token is required.
- For private repositories, use a GitHub token with the correct scopes.
- Keep all GitHub API calls on the backend server, never in the frontend.

## Next steps

If you want, I can also generate:

- a GitHub OAuth version
- a TypeScript version
- an MCP version
- a plugin that supports repository creation, comments, labels, and PR review actions
