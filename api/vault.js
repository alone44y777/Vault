export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  const meta = {
    "System Owner": "𝗦𝗔𝗥𝗗𝗔𝗥 𝗗𝗔𝗨𝗗 𝗔𝗥𝗔𝗜𝗡🌚💀",
    "PowerBy": "𝗗𝗔𝗥𝗞-𝗘𝗠𝗣𝗜𝗥𝗘💗",
    "Code By": "Empire Tech Zone"
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return new Response(JSON.stringify({ error: "Upstash Variables Missing", meta }), {
      status: 500,
      headers
    });
  }

  async function redis(cmd, ...args) {
    const cleanUrl = UPSTASH_URL.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([cmd, ...args])
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `Redis HTTP ${res.status}`);
    }
    return data.result;
  }

  try {
    // CREATE & LOCK VAULT (POST)
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const image = typeof body.image === 'string' ? body.image : '';

      if (!message && !image) {
        return new Response(JSON.stringify({
          success: false,
          error: "Message or image is required",
          meta
        }), { status: 400, headers });
      }

      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const payload = JSON.stringify({
        message,
        image,
        created_at: Date.now()
      });

      // 24 hours (86400s) expiry safety + self-destruct on first read
      await redis('SET', `vault:${id}`, payload, 'EX', 86400);

      const apiEndpoint = `${url.origin}${url.pathname}`;
      return new Response(JSON.stringify({
        success: true,
        status: "Locked and Secured",
        vault_id: id,
        api_read_url: `${apiEndpoint}?id=${id}`,
        meta
      }), { status: 200, headers });
    }

    // READ & SELF-DESTRUCT VAULT (GET ?id=...)
    if (req.method === 'GET') {
      const id = (url.searchParams.get('id') || '').trim();

      if (!id) {
        return new Response(JSON.stringify({
          success: true,
          welcome: "Welcome to Empire Zero Trace Vault API",
          usage: "POST { message, image } to lock; GET ?id=VAULT_ID to read and destroy",
          meta
        }), { status: 200, headers });
      }

      const key = `vault:${id}`;
      const raw = await redis('GET', key);

      if (!raw) {
        return new Response(JSON.stringify({
          success: false,
          error: "This message has been destroyed or does not exist.",
          status: 404,
          meta
        }), { status: 404, headers });
      }

      await redis('DEL', key);
      const secretData = JSON.parse(raw);

      return new Response(JSON.stringify({
        success: true,
        status: "Destroyed! This data will never be seen again.",
        data: secretData,
        meta
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Method not allowed",
      meta
    }), { status: 405, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Internal Server Error",
      meta
    }), { status: 500, headers });
  }
}

      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([cmd, ...args])
    });
    const data = await res.json();
    return data.result;
  }

  try {
    // 🔴 1. POST Request: Naya Khufia Message Save Karne Ke Liye
    if (req.method === 'POST') {
      const body = await req.json();
      if (!body.message && !body.image) {
        return new Response(JSON.stringify({ error: "Message or image is required", meta }), { status: 400, headers });
      }

      // Unique ID Generator (Hacker Style)
      const id = crypto.randomUUID().slice(0, 10);
      const secretData = JSON.stringify({
        message: body.message || "",
        image: body.image || "", // Base64 picture ke liye
        created_at: Date.now()
      });

      // Data ko Redis mein save karo (24 ghante baad khud expire ho jayega)
      await redis('SET', `vault:${id}`, secretData, 'EX', 86400);

      return new Response(JSON.stringify({
        success: true,
        status: "Locked and Secured",
        vault_id: id,
        share_url: `${url.origin}/api/vault?id=${id}`,
        meta
      }), { status: 200, headers });
    }

    // 🟢 2. GET Request: Message Padhne Aur Destroy Karne Ke Liye
    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ 
          welcome: "Welcome to NexGen Vault API", 
          usage: "Pass ?id=YOUR_VAULT_ID to read a secret", 
          meta 
        }), { status: 200, headers });
      }

      // Redis se data nikalo
      const dataString = await redis('GET', `vault:${id}`);
      
      if (!dataString) {
        return new Response(JSON.stringify({
          error: "Vault not found or already destroyed!",
          status: 404,
          meta
        }), { status: 404, headers });
      }

      // 🔥 MISSION IMPOSSIBLE ACTION: Message Foran Delete (Self-Destruct) 🔥
      await redis('DEL', `vault:${id}`);

      const secretData = JSON.parse(dataString);

      return new Response(JSON.stringify({
        success: true,
        status: "Destroyed! This data will never be seen again.",
        data: secretData,
        meta
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed", meta }), { status: 405, headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, meta }), { status: 500, headers });
  }
}
