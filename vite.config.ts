import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

function saveExamplesPlugin(): Plugin {
  return {
    name: 'save-examples-api',
    configureServer(server) {
      server.middlewares.use('/api/save-examples', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const tracks = data.tracks;
              if (!Array.isArray(tracks)) {
                throw new Error('tracks array is required in request body');
              }
              const targetPath = path.resolve(process.cwd(), 'src/data/examples.ts');
              const formattedContent = `import { ExampleTrack } from '../types';\n\nexport const EXAMPLE_TRACKS: ExampleTrack[] = ${JSON.stringify(tracks, null, 2)};\n`;
              fs.writeFileSync(targetPath, formattedContent, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Saved to src/data/examples.ts successfully!' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to save examples file' }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), saveExamplesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
