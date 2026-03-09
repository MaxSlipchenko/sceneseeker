# SceneSeeker — AI Movie Clip Identifier

Upload any video clip and AI will identify the movie or TV show, the scene, director, streaming availability, and more.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API key
Open `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your-key-here
```
Get a key at → https://aistudio.google.com/app/apikey

### 3. Start the server
```bash
npm start        # production
npm run dev      # auto-reload on save
```

### 4. Open in browser
Go to → **http://localhost:3001**

---

## How it works

1. Upload a video clip (MP4, MOV, AVI, MKV, WEBM)
2. The browser extracts 3 frames at evenly-spaced timestamps using a canvas element
3. Frames (JPEG, max 512px wide) are sent to the local Express server
4. Server forwards frames to **Gemini 2.5 Flash** vision API
5. Returns structured JSON: title, year, director, genre, scene description, streaming info, confidence score

---

## Project structure

```
sceneseeker/
├── server.js          # Express backend — proxies frames to Gemini API
├── public/
│   └── index.html     # Entire frontend (vanilla JS, no build step)
├── .env               # GEMINI_API_KEY (never commit this)
├── .gitignore
└── package.json
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `GEMINI_API_KEY not set` | Check your `.env` file |
| `Cannot connect to localhost:3001` | Make sure `npm start` is running |
| Port 3001 in use | Set `PORT=3002` in your environment |
| Gemini quota exceeded | Check usage at aistudio.google.com |
