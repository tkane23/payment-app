import { createApiServer } from './server.ts';

const port = Number(process.env['PORT'] ?? 3000);

createApiServer().listen(port, () => {
  console.log(`api: http://localhost:${port}/health`);
});
