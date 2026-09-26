import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint to save examples.ts
  app.post('/api/save-examples', (req, res) => {
    try {
      const { tracks } = req.body;
      if (!tracks || !Array.isArray(tracks)) {
        return res.status(400).json({ error: 'Invalid tracks data' });
      }

      const fileContent = `import { ExampleTrack } from '../types';\n\nexport const EXAMPLE_TRACKS: ExampleTrack[] = ${JSON.stringify(
        tracks,
        null,
        2
      )};\n`;

      const filePath = path.resolve(process.cwd(), 'src/data/examples.ts');
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving examples:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API endpoint to save challenges.ts
  app.post('/api/save-challenges', (req, res) => {
    try {
      const { challenges } = req.body;
      if (!challenges || !Array.isArray(challenges)) {
        return res.status(400).json({ error: 'Invalid challenges data' });
      }

      const fileContent = `import { Challenge } from '../types';\n\nexport const MIXING_CHALLENGES: Challenge[] = ${JSON.stringify(
        challenges,
        null,
        2
      )};\n`;

      const filePath = path.resolve(process.cwd(), 'src/data/challenges.ts');
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving challenges:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
