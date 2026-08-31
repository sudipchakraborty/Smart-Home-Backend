import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();
const server = app.listen(env.port, env.host, () => {
  console.log(`Smart Home backend listening at http://${env.host}:${env.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error('Graceful shutdown failed', error);
      process.exitCode = 1;
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

