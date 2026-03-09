// momo-bookmark-worker v3 — Bot token + allowBots=true
// 环境变量: DISCORD_BOT_TOKEN, CHANNEL_ID, API_KEY

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

    // 用 Bot token 发消息到 #bookmark
    const resp = await fetch(
      `https://discord.com/api/v10/channels/${env.CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      return json({ error: `Discord: ${resp.status}`, detail: err }, 502);
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
