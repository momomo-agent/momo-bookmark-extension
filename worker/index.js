// momo-bookmark-worker v4 — Webhook 方式（allowBots=true 放行）
// 环境变量: WEBHOOK_URL, API_KEY

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405);
    }

    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${env.API_KEY}`) {
      return json({ error: 'unauthorized' }, 401);
    }

    const body = await request.json();
    const { url, note } = body;

    if (!url) {
      return json({ error: 'url required' }, 400);
    }

    let content = url;
    if (note) content += `\n> ${note}`;

    // 用 Webhook 发消息（author.id ≠ botUserId，allowBots=true 放行）
    const resp = await fetch(env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, username: 'Bookmark' }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return json({ error: `Webhook: ${resp.status}`, detail: err }, 502);
    }

    return json({ ok: true }, 200);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
