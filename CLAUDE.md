# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm start         # Run server (production)
npm run dev       # Run server with auto-reload (node --watch)
```

Server runs at **http://localhost:3001**. No test or lint scripts are configured.

## Architecture

Minimal two-file app:

- **`server.js`** — Express backend (ES modules). Single POST endpoint `/api/identify` that receives base64-encoded video frames from the browser, forwards them to the **Gemini API** (`gemini-2.5-flash`), and returns a structured JSON result. The API key is kept server-side so it's never exposed to the browser.

- **`public/index.html`** — Self-contained vanilla JS frontend. Handles video upload/drag-drop, uses a hidden `<canvas>` to extract 3 JPEG frames from the video at evenly-spaced timestamps (capped at 512px wide for payload size), displays frame thumbnails, calls the local server, and renders the result card.

## Key Details

- **API key**: `GEMINI_API_KEY` in `.env` (note: README and frontend copy reference Anthropic/Claude but the implementation uses Gemini)
- **Payload limit**: Express is configured for `50mb` JSON bodies; frames are extracted at JPEG quality 0.5 to keep size down
- **Response format**: Server expects Gemini to return raw JSON (no markdown fences); it strips any backtick wrappers before parsing
- **Port**: Hardcoded to `3001` in `server.js`
