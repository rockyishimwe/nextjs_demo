// Placeholder index.js for Cloudflare Workers deployment
// This file is needed to satisfy Wrangler's entry point requirement
// The actual OpenNext-generated worker code would normally be here

export default {
  async fetch(request, env, ctx) {
    return new Response('Placeholder worker - OpenNext build did not generate worker code', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
};