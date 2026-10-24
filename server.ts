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

  // API endpoint to save the challenge starting diagrams (src/data/challengeDiagrams.json).
  // Only the diagrams are written; the pass/fail checks in challenges.ts are never touched.
  app.post('/api/save-challenge-diagrams', (req, res) => {
    try {
      const { diagrams } = req.body;
      if (!diagrams || typeof diagrams !== 'object' || Array.isArray(diagrams)) {
        return res.status(400).json({ error: 'Invalid diagrams data' });
      }
      const filePath = path.resolve(process.cwd(), 'src/data/challengeDiagrams.json');
      fs.writeFileSync(filePath, JSON.stringify(diagrams, null, 2) + '\n', 'utf-8');
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving challenge diagrams:', err);
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
