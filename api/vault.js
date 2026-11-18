export const config = { runtime: 'edge' };

export default async function handler(req) {
  // CORS Headers taake kisi bhi frontend se connect ho sakay
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Tumhari Custom Branding (Har response mein aayegi)
  const meta = {
    "System Owner": "*⎯⎯꯭፝𝆭𝐒𝝰꯭᪳̐ɤ፝֟͝𝙳꯭𝝰꯭֟ؖ۬ɤ꯭ 𝙳꯭֟֗֯፝⃑⃐𝝰꯭ꭎ꯭҄𝙳 𝆅ᗩ꯭ɤ꯭፝𝝰𝆭𝝸꯭𝝶꯭⎯꯭⃰❀* 🌚💀",
    "PowerBy": "*ꠋꠋ𓆩꯭𝆅𝐃꯭𝝰꯭᪳᪰̑ɤ꯭꯭ꠋ𝆅𝐊 𝝴꯭᪳̐ϻ꯭፝֟͝𝗽𝆭𝝸꯭ɤ𝆅𝝴꯭𓂃꯭𝆬𝆬𝆬𝆬𝆬𝆬𝆬𖢷𓆪",
    "Code By": "Empire Tech Zone"
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const url = new URL(req.url);

  // Vercel Variables (Jo tumne Upstash ke liye set kiye thay)
  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return new Response(JSON.stringify({ error: "Upstash Variables Missing", meta }), { status: 500, headers });
  }

  // Redis se direct connect karne ka helper function
  async function redis(cmd, ...args) {
    const res = await fetch(`${UPSTASH_URL}/`, {
      method: 'POST',
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
