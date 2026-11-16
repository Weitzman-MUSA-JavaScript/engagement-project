import { handleApi } from './api.js';
import { assets } from './assets.js';

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      if (!env.DB) return new Response(JSON.stringify({ message: 'Shared storage is not available. Please try again later.' }), { status: 503, headers: { 'content-type': 'application/json' } });
      return handleApi(request, env.DB);
    }
    const asset = assets[path === '/' ? '/index.html' : path];
    if (!asset) return new Response('Not found', { status: 404 });
    const body = asset.encoding === 'base64' ? Uint8Array.from(atob(asset.body), (character) => character.charCodeAt(0)) : asset.body;
    return new Response(body, { headers: { 'content-type': asset.type, 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: https://tile.openstreetmap.org https://imagery.pasda.psu.edu; connect-src 'self'; base-uri 'none'; form-action 'self'" } });
  },
};
