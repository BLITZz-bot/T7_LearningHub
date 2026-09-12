import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import jobsHandler from './api/jobs.js'
import lyzrHandler from './api/lyzr.js'
import dbHandler from './api/db.js'
import authHandler from './api/auth.js'

function apiDevMiddlewarePlugin(env) {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      // Inject all env vars from .env into process.env for local development
      Object.assign(process.env, env);

      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');

        // Polyfill res.status and res.json on raw Node response for Vite dev server
        if (!res.status) {
          res.status = function(code) {
            this.statusCode = code;
            return this;
          };
        }
        if (!res.json) {
          res.json = function(data) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }

        const handleBodyRequest = (handlerFn) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
              await handlerFn(req, res);
            } catch (err) {
              console.error(`Local dev error on ${urlObj.pathname}:`, err);
              res.status(500).json({ error: err.message });
            }
          });
        };

        if (urlObj.pathname === '/api/jobs') {
          req.query = Object.fromEntries(urlObj.searchParams.entries());
          try {
            await jobsHandler(req, res);
          } catch (err) {
            console.error('Local dev /api/jobs error:', err);
            res.status(500).json({ error: err.message });
          }
          return;
        }

        if (urlObj.pathname === '/api/lyzr') {
          handleBodyRequest(lyzrHandler);
          return;
        }

        if (urlObj.pathname === '/api/db') {
          handleBodyRequest(dbHandler);
          return;
        }

        if (urlObj.pathname === '/api/auth') {
          handleBodyRequest(authHandler);
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiDevMiddlewarePlugin(env)],
    server: {
      port: 3000,
      open: true
    }
  };
});
