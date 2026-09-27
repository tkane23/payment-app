// 起動確認用の最小サーバー。フレームワーク（Hono / NestJS）は E00-S02 で確定してから置き換える。
import { createServer, type Server } from 'node:http';

export function createApiServer(): Server {
  return createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
}
