# AI Chat Dashboard

Streaming AI chat dashboard built with Next.js 15, Tailwind CSS, OpenAI API, and Vercel AI SDK.

## Features
- Streaming chat responses
- Editable system prompt
- Conversation history
- Model selection UI
- Vercel-ready deployment

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local`.

Required environment variables:

```bash
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Verify

```bash
npm run lint
npm run build
npm audit
```

## Deploy
Import the GitHub repo into Vercel and add `OPENAI_API_KEY`.
