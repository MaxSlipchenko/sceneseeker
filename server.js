import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/identify', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-key-here') {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set. Open .env and add your key.' });
  }

  const { frames } = req.body;
  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: 'No frames provided.' });
  }

  const prompt = `You are a world-class film and television expert with encyclopedic knowledge of movies and TV shows from all eras and countries.

I'm showing you frames extracted from a video clip. Your task is to identify what movie or TV show this is from.

Analyze: costumes, props, set design, color grading, cinematography style, film grain, actors if recognizable, production design era, lighting style, genre visual cues, and any text/logos visible.

Respond ONLY with a valid JSON object. No markdown, no backticks, no extra text. Just raw JSON:
{
  "identified": true,
  "confidence": 87,
  "title": "Movie or Show Title",
  "year": "2010",
  "type": "Movie",
  "genre": "Sci-Fi Thriller",
  "director": "Christopher Nolan",
  "scene_description": "2-3 sentences describing what appears to be happening in this scene.",
  "visual_clues": ["clue 1", "clue 2", "clue 3", "clue 4", "clue 5"],
  "streaming": "Netflix, HBO Max",
  "reasoning": "Brief explanation of how you identified it.",
  "alternative": "Another possible title if uncertain"
}`;

  const parts = frames.slice(0, 3).map(f => ({
    inline_data: { mime_type: 'image/jpeg', data: f.split(',')[1] || f }
  }));
  parts.push({ text: prompt });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    console.log('→ Calling Gemini API...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    });

    const rawText = await response.text();
    console.log('← Gemini status:', response.status);
    console.log('← Gemini raw response:', rawText.slice(0, 600));

    if (!response.ok) {
      let errMsg = `Gemini ${response.status} error`;
      try { errMsg = JSON.parse(rawText).error?.message || errMsg; } catch {}
      return res.status(response.status).json({ error: errMsg });
    }

    if (!rawText || rawText.trim() === '') {
      return res.status(500).json({ error: 'Gemini returned an empty response. Try again.' });
    }

    const data = JSON.parse(rawText);

    // Check for blocked/safety filtered response
    const candidate = data.candidates?.[0];
    if (!candidate) {
      const blocked = data.promptFeedback?.blockReason;
      return res.status(500).json({ error: blocked ? `Blocked: ${blocked}` : 'No response from Gemini' });
    }

    const text = candidate.content?.parts?.[0]?.text || '';
    if (!text) {
      console.log('Full response:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'Gemini returned no text. Finish reason: ' + (candidate.finishReason || 'unknown') });
    }

    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1) throw new Error('No JSON in response. Got: ' + clean.slice(0, 100));

    res.json(JSON.parse(clean.slice(start, end + 1)));
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const keySet = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-key-here';
    console.log(`\n🎬 SceneSeeker running at http://localhost:${PORT}`);
    console.log(`   Gemini key: ${keySet ? '✓ loaded' : '✗ NOT SET'}\n`);
  });
}

export default app;
