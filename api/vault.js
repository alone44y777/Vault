export const config = { runtime: 'edge' };

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  const jsonHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  const meta = {
    "System Owner": "☠️ 𝕾𝖆𝖗𝖉𝖆𝖗 𝕯𝖆𝖚𝖉 𝕬𝖗𝖆𝖎𝖓 ☠️ 🌚💀",
    "PowerBy": "⚡ 𝕯𝖆𝖗𝖐 𝕰𝖒𝖕𝖎𝖗𝖊 𝕿𝖊𝖈𝖍 ⚡ 🕷️💗",
    "Code By": "Empire Tech Zone"
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return new Response(JSON.stringify({ error: "Upstash Variables Missing", meta }), {
      status: 500,
      headers: jsonHeaders
    });
  }

  async function redis(cmd, ...args) {
    const cleanUrl = UPSTASH_URL.replace(/\/+$/, '');
    const res = await fetch(cleanUrl + '/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + UPSTASH_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([cmd, ...args])
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Redis Error');
    }
    return data.result;
  }

  try {
    // 1. POST -> Save & Lock Message (Used by your separate Web)
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const image = typeof body.image === 'string' ? body.image : '';

      if (!message && !image) {
        return new Response(JSON.stringify({
          success: false,
          error: "Message or image is required",
          meta
        }), { status: 400, headers: jsonHeaders });
      }

      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const payload = JSON.stringify({
        message,
        image,
        created_at: Date.now()
      });

      await redis('SET', 'vault:' + id, payload, 'EX', 86400);

      const shareUrl = url.origin + url.pathname + '?id=' + id;
      return new Response(JSON.stringify({
        success: true,
        status: "Locked and Secured",
        vault_id: id,
        share_url: shareUrl,
        meta
      }), { status: 200, headers: jsonHeaders });
    }

    // 2. GET -> Welcome OR Beautiful Web View OR Unlock JSON
    if (req.method === 'GET') {
      const id = (url.searchParams.get('id') || '').trim();
      const unlock = url.searchParams.get('unlock') === 'true';

      // No ID -> API Status JSON
      if (!id) {
        return new Response(JSON.stringify({
          success: true,
          welcome: "Welcome to Empire Zero Trace Vault API",
          usage: "POST { message, image } to lock; Open ?id=VAULT_ID in browser to read",
          meta
        }), { status: 200, headers: jsonHeaders });
      }

      // If user clicked "Unlock" button (or external app requested ?unlock=true) -> Read & Destroy
      if (unlock) {
        const key = 'vault:' + id;
        const raw = await redis('GET', key);

        if (!raw) {
          return new Response(JSON.stringify({
            success: false,
            error: "This secret message has already been destroyed or does not exist.",
            status: 404,
            meta
          }), { status: 404, headers: jsonHeaders });
        }

        await redis('DEL', key);
        const secretData = JSON.parse(raw);

        return new Response(JSON.stringify({
          success: true,
          status: "Destroyed! This data will never be seen again.",
          data: secretData,
          meta
        }), { status: 200, headers: jsonHeaders });
      }

      // Normal Browser Visit (?id=XYZ) -> Serve Beautiful HTML/CSS Reader Page (Does NOT delete yet!)
      const html = renderSecretPage(id);
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed", meta }), {
      status: 405,
      headers: jsonHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, meta }), {
      status: 500,
      headers: jsonHeaders
    });
  }
}

function renderSecretPage(vaultId) {
  const safeId = vaultId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Secret Note 💌</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --accent: #ff2e88;
      --accent2: #ff7b54;
      --glow: rgba(255, 46, 136, 0.32);
      --bg: #07060b;
      --card: rgba(20, 18, 32, 0.82);
      --border: rgba(255, 255, 255, 0.13);
      --text: #f8fafc;
      --muted: #9ca3af;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px 16px;
      overflow-x: hidden;
    }
    .orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(85px);
      opacity: 0.45;
      z-index: 0;
      pointer-events: none;
    }
    .orb1 { width: 260px; height: 260px; background: var(--accent); top: -70px; left: -70px; }
    .orb2 { width: 240px; height: 240px; background: var(--accent2); bottom: -80px; right: -60px; }
    .card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 440px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px 22px;
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 35px -12px var(--glow);
      text-align: center;
      animation: fadeUp 0.45s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .envelope {
      width: 76px;
      height: 76px;
      margin: 0 auto 16px;
      border-radius: 22px;
      border: 1.5px solid var(--accent);
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      box-shadow: 0 0 28px var(--glow);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
      background: linear-gradient(135deg, #fff 30%, var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.sub {
      margin: 0 0 22px;
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.55;
    }
    .btn {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 15px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 15.5px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 26px -6px var(--glow);
      transition: transform 0.18s ease, opacity 0.2s;
    }
    .btn:hover { transform: translateY(-2px); opacity: 0.95; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .letter {
      text-align: left;
      background: linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02));
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 20px;
      padding: 24px 20px;
      animation: fadeUp 0.45s ease;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(255,255,255,0.06);
      padding: 5px 11px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      margin-bottom: 14px;
    }
    .quote {
      font-family: 'Lora', serif;
      font-size: 42px;
      line-height: 0.6;
      color: var(--accent);
      opacity: 0.45;
      display: block;
      margin-bottom: 8px;
    }
    .msg-text {
      font-family: 'Lora', serif;
      font-size: 19px;
      line-height: 1.75;
      color: #ffffff;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
    .photo-frame {
      margin-top: 18px;
      padding: 10px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03));
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 14px 36px rgba(0,0,0,0.55);
    }
    .photo-frame img {
      width: 100%;
      max-height: 380px;
      object-fit: contain;
      border-radius: 12px;
      display: block;
      background: #09080f;
    }
    .brand {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.6;
    }
    .brand strong { color: #fff; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>

  <div class="card">
    <div id="sealed">
      <div class="envelope">💌</div>
      <h1>You received a secret note</h1>
      <p class="sub">Someone locked a private message for you.<br/>Once you open it, it will vanish forever.</p>
      <button class="btn" id="unlockBtn" onclick="openSecret()">🔓 Unlock & Read Secret</button>
    </div>

    <div id="result" class="hidden"></div>
  </div>

  <script>
    function esc(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function brandFooter(meta) {
      const codeBy = (meta && meta["Code By"]) ? meta["Code By"] : "Empire Tech Zone";
      const powerBy = (meta && meta["PowerBy"]) ? meta["PowerBy"] : "Dark Empire Tech";
      const owner = (meta && meta["System Owner"]) ? meta["System Owner"] : "Sardar Daud Arain";
      return '<div class="brand"><strong>' + esc(codeBy) + '</strong> • ' + esc(powerBy) + '<br/>' + esc(owner) + '</div>';
    }

    async function openSecret() {
      const btn = document.getElementById('unlockBtn');
      const sealed = document.getElementById('sealed');
      const result = document.getElementById('result');
      btn.disabled = true;
      btn.innerText = '✨ Opening Secret...';

      try {
        const res = await fetch(window.location.pathname + '?id=${safeId}&unlock=true');
        const data = await res.json();

        if (!res.ok || !data.data) {
          throw new Error(data.error || 'This secret has already vanished.');
        }

        const msg = data.data.message ? '<span class="quote">“</span><p class="msg-text">' + esc(data.data.message) + '</p>' : '';
        const img = data.data.image ? '<div class="photo-frame"><img src="' + data.data.image + '" alt="Secret Photo" /></div>' : '';

        sealed.classList.add('hidden');
        result.classList.remove('hidden');
        result.innerHTML =
          '<div class="letter">' +
            '<div class="badge">🔥 Opened Once • Now Destroyed</div>' +
            msg + img +
            brandFooter(data.meta) +
          '</div>';
      } catch (e) {
        sealed.classList.add('hidden');
        result.classList.remove('hidden');
        result.innerHTML =
          '<div style="padding:10px 0;">' +
            '<div style="font-size:44px;">💨</div>' +
            '<h1 style="margin-top:8px;">Message Vanished</h1>' +
            '<p class="sub">' + esc(e.message) + '</p>' +
            brandFooter() +
          '</div>';
      }
    }
  </script>
</body>
</html>`;
}
