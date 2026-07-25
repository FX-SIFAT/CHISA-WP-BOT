function getHTML(pkg, startTime, botState = {}, resetToken = "") {
    const connected = botState.connected || false;
    const pairingCode = botState.pairingCode || null;
    const phone = botState.phone || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${pkg.name} — WhatsApp Bot</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}

:root{
  --bg:#ececec;
  --card:#0d0d0d;
  --card2:#111;
  --border:#2a2a2a;
  --border-light:#e0e0e0;
  --text:#f0f0f0;
  --muted:#666;
  --muted2:#999;
  --accent:#fff;
  --green:#00ff88;
  --red:#ff4455;
  --yellow:#ffd600;
  --blue:#60a5fa;
  --pink:#ff6eb4;
  --mono:'JetBrains Mono',monospace;
}

html{scroll-behavior:smooth;}
body{
  background:var(--bg);
  background-image:radial-gradient(#c8c8c8 1px,transparent 1px);
  background-size:20px 20px;
  font-family:var(--mono);
  min-height:100vh;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:2rem 1rem 4rem;
  color:var(--text);
}

.wrap{width:100%;max-width:520px;display:flex;flex-direction:column;gap:0;}

.topbar{
  display:flex;align-items:center;justify-content:space-between;
  background:var(--card);
  border:1px solid var(--border);
  padding:.6rem 1rem;
  font-size:.7rem;letter-spacing:.15em;font-weight:700;
}
.topbar-brand{color:#fff;display:flex;align-items:center;gap:.5rem;}
.brand-dash{color:var(--muted2);}
.topbar-right{display:flex;align-items:center;gap:.75rem;color:var(--muted2);}
.version-tag{font-size:.65rem;color:var(--muted2);}
.status-dot{
  width:7px;height:7px;border-radius:50%;
  display:inline-block;
}
.status-dot.online{background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s ease-in-out infinite;}
.status-dot.offline{background:var(--yellow);animation:pulse 1s ease-in-out infinite;}
.status-label{font-size:.65rem;letter-spacing:.1em;font-weight:700;}
.status-label.online{color:var(--green);}
.status-label.offline{color:var(--yellow);}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

.card{
  background:var(--card);
  border:1px solid var(--border);
  border-top:none;
}

.profile{
  display:grid;
  grid-template-columns:110px 1fr;
  gap:0;
  border-bottom:1px solid var(--border);
}
.avatar-wrap{
  border-right:1px solid var(--border);
  overflow:hidden;
  position:relative;
}
.avatar-wrap img{
  width:100%;height:100%;
  object-fit:cover;
  display:block;
  filter:grayscale(15%);
  transition:filter .3s;
}
.avatar-wrap:hover img{filter:grayscale(0%);}

.profile-info{
  padding:1rem 1.1rem;
  display:flex;flex-direction:column;gap:.5rem;
}
.profile-tag{
  font-size:.6rem;letter-spacing:.2em;
  color:var(--muted2);font-weight:500;
}
.profile-name{
  font-size:1.6rem;font-weight:800;
  color:#fff;letter-spacing:-.01em;
  display:flex;align-items:center;gap:2px;
  line-height:1;
}
.cursor{
  display:inline-block;
  width:3px;height:1.4rem;
  background:#fff;
  animation:blink-cur .9s step-end infinite;
  margin-left:1px;
  vertical-align:middle;
}
@keyframes blink-cur{0%,100%{opacity:1}50%{opacity:0}}
.profile-handle{font-size:.7rem;color:var(--muted2);letter-spacing:.05em;}
.profile-bio{
  font-size:.72rem;color:rgba(240,240,240,.65);
  line-height:1.55;
  border-left:2px solid var(--border);
  padding-left:.6rem;
}
.profile-pills{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.1rem;}
.pill{
  font-size:.58rem;font-weight:700;letter-spacing:.12em;
  border:1px solid var(--border);
  padding:.2rem .55rem;color:var(--muted2);
  cursor:default;transition:all .2s;
  text-transform:uppercase;
}
.pill:hover{border-color:#555;color:#ccc;}

.stats-row{
  display:grid;grid-template-columns:repeat(3,1fr);
  border-bottom:1px solid var(--border);
}
.stat{
  padding:.85rem .75rem;
  border-right:1px solid var(--border);
  text-align:center;
}
.stat:last-child{border-right:none;}
.stat-val{
  font-size:1.25rem;font-weight:800;
  color:#fff;letter-spacing:-.02em;
  font-variant-numeric:tabular-nums;
}
.stat-val.green{color:var(--green);}
.stat-val.yellow{color:var(--yellow);}
.stat-val.blue{color:var(--blue);}
.stat-key{
  font-size:.58rem;letter-spacing:.18em;
  color:var(--muted);font-weight:600;
  margin-top:.2rem;text-transform:uppercase;
}

.section{
  padding:1rem 1.1rem;
  border-bottom:1px solid var(--border);
}
.section-label{
  font-size:.62rem;letter-spacing:.2em;
  color:var(--muted);font-weight:600;
  margin-bottom:.75rem;
}
.section-label span{color:var(--muted2);}

.feat-grid{display:flex;flex-wrap:wrap;gap:.4rem;}
.feat-pill{
  font-size:.63rem;font-weight:600;letter-spacing:.06em;
  border:1px solid var(--border);
  padding:.3rem .65rem;color:rgba(240,240,240,.7);
  transition:all .18s;cursor:default;
  display:flex;align-items:center;gap:.35rem;
}
.feat-pill:hover{border-color:#444;color:#fff;background:rgba(255,255,255,.04);}
.feat-pill .fi{font-size:.8rem;}

.terminal{
  background:#050505;
  border:1px solid var(--border);
  border-radius:0;
  overflow:hidden;
}
.term-bar{
  display:flex;align-items:center;gap:.4rem;
  padding:.5rem .75rem;
  border-bottom:1px solid var(--border);
  background:#0a0a0a;
}
.term-dot{width:9px;height:9px;border-radius:50%;}
.term-dot.r{background:#ff5f57;}
.term-dot.y{background:#febc2e;}
.term-dot.g{background:#28c840;}
.term-body{padding:.85rem 1rem;font-size:.7rem;line-height:1.9;color:rgba(240,240,240,.8);}
.term-prompt{color:var(--green);}
.term-key{color:var(--muted2);min-width:52px;display:inline-block;}
.term-arrow{color:var(--border);}
.term-val{color:#fff;}
.term-val.g{color:var(--green);}
.term-val.y{color:var(--yellow);}
.term-val.b{color:var(--blue);}
.term-val.p{color:var(--pink);}

.pairing-section{
  padding:1rem 1.1rem;
  border-bottom:1px solid var(--border);
}
.pairing-code-display{
  font-size:2rem;font-weight:800;
  letter-spacing:.35em;color:#fff;
  text-shadow:0 0 20px rgba(0,255,136,.3);
  margin:1rem 0 .5rem;
  padding:.75rem;
  background:#050505;
  border:1px solid rgba(0,255,136,.25);
  text-align:center;
}
.pairing-steps-list{
  display:flex;flex-direction:column;gap:.4rem;
  margin-top:.75rem;
}
.pairing-step-row{
  display:flex;align-items:center;gap:.65rem;
  font-size:.68rem;color:rgba(240,240,240,.55);
}
.step-n{
  width:18px;height:18px;border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  font-size:.58rem;font-weight:800;flex-shrink:0;
  color:var(--muted2);
}
.copy-row{display:flex;justify-content:center;margin-top:.75rem;}
.copy-btn{
  font-family:var(--mono);font-size:.68rem;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;
  border:1px solid var(--border);
  background:transparent;color:var(--muted2);
  padding:.4rem 1.2rem;cursor:pointer;
  transition:all .2s;
}
.copy-btn:hover{border-color:#555;color:#fff;}
.copy-btn.ok{border-color:var(--green);color:var(--green);}

.btns-row{
  display:grid;grid-template-columns:1fr 1fr;
  border-bottom:1px solid var(--border);
}
.btn-outline{
  font-family:var(--mono);font-size:.65rem;font-weight:700;
  letter-spacing:.15em;text-transform:uppercase;
  border:none;border-right:1px solid var(--border);
  background:transparent;color:var(--muted2);
  padding:.85rem .5rem;cursor:pointer;
  text-decoration:none;display:flex;
  align-items:center;justify-content:center;gap:.4rem;
  transition:all .2s;
}
.btn-outline:last-child{border-right:none;}
.btn-outline:hover{background:rgba(255,255,255,.04);color:#fff;}

.cta-btn{
  font-family:var(--mono);font-size:.72rem;font-weight:800;
  letter-spacing:.2em;text-transform:uppercase;
  background:#fff;color:#0d0d0d;
  border:none;width:100%;
  padding:1.05rem;cursor:pointer;
  transition:all .2s;
  text-decoration:none;display:block;text-align:center;
  border-bottom:1px solid var(--border);
}
.cta-btn:hover{background:#e0e0e0;}

.req-btn{
  font-family:var(--mono);font-size:.65rem;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;
  background:transparent;color:var(--muted2);
  border:1px solid var(--border);
  width:100%;padding:.7rem;cursor:pointer;
  transition:all .2s;margin-top:.6rem;
}
.req-btn:hover{border-color:#555;color:#fff;}
.req-msg{
  font-size:.65rem;text-align:center;
  margin-top:.4rem;min-height:1.1em;color:var(--muted);
}

.footer-bar{
  background:var(--card);
  border:1px solid var(--border);
  border-top:none;
  padding:.65rem 1rem;
  display:flex;align-items:center;justify-content:space-between;
  font-size:.6rem;color:var(--muted);letter-spacing:.1em;
}
.footer-bar a{color:var(--muted);text-decoration:none;}
.footer-bar a:hover{color:var(--muted2);}

::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#333;}

@media(max-width:480px){
  .profile{grid-template-columns:90px 1fr;}
  .profile-name{font-size:1.3rem;}
  .pairing-code-display{font-size:1.5rem;letter-spacing:.25em;}
}
</style>
</head>
<body>

<div class="wrap">

  <div class="topbar">
    <div class="topbar-brand">
      <span class="brand-dash">—</span>${pkg.name}
    </div>
    <div class="topbar-right">
      <span class="version-tag">V${pkg.version}</span>
      <span id="status-dot" class="status-dot ${connected ? 'online' : 'offline'}"></span>
      <span id="status-label" class="status-label ${connected ? 'online' : 'offline'}">${connected ? 'ONLINE' : 'LINKING'}</span>
    </div>
  </div>

  <div class="card">

    <div class="profile">
      <div class="avatar-wrap">
        <img src="/thumbnail.jpg" alt="${pkg.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%230d0d0d%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2240%22>🤖</text></svg>'"/>
      </div>
      <div class="profile-info">
        <div class="profile-tag">// BOT.EXE</div>
        <div class="profile-name">
          ${pkg.name}<span class="cursor"></span>
        </div>
        <div class="profile-handle">@CHISA_BOT</div>
        <div class="profile-bio">
          (*^‿^*) 🌸 I'm your WhatsApp companion<br/>— AI · Media · Group Guard ⚡
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat">
        <div class="stat-val accent" id="uptime-val">—</div>
        <div class="stat-key">Uptime</div>
      </div>
      <div class="stat">
        <div class="stat-val ${connected ? 'green' : 'yellow'}" id="wa-val">${connected ? 'ON' : 'OFF'}</div>
        <div class="stat-key">WhatsApp</div>
      </div>
      <div class="stat">
        <div class="stat-val blue">42+</div>
        <div class="stat-key">Commands</div>
      </div>
    </div>

    <div class="section">
      <div class="section-label"><span>// </span>INFO</div>
      <div class="terminal">
        <div class="term-bar">
          <div class="term-dot r"></div>
          <div class="term-dot y"></div>
          <div class="term-dot g"></div>
        </div>
        <div class="term-body">
          <div><span class="term-prompt">$ </span>info</div>
          <div><span class="term-key">name </span><span class="term-arrow">→ </span><span class="term-val p">${pkg.name}</span></div>
          <div><span class="term-key">version </span><span class="term-arrow">→ </span><span class="term-val b">v${pkg.version}</span></div>
          <div><span class="term-key">owner </span><span class="term-arrow">→ </span><span class="term-val">SIFAT</span></div>
          <div><span class="term-key">runtime </span><span class="term-arrow">→ </span><span class="term-val b">Node.js ${process.version}</span></div>
          <div><span class="term-key">engine </span><span class="term-arrow">→ </span><span class="term-val">wp-heart</span></div>
          ${phone ? `<div><span class="term-key">phone </span><span class="term-arrow">→ </span><span class="term-val g">+${phone}</span></div>` : ''}
          <div><span class="term-key">status </span><span class="term-arrow">→ </span><span id="term-status" class="term-val ${connected ? 'g' : 'y'}">${connected ? 'CONNECTED ✓' : 'LINKING...'}</span></div>
        </div>
      </div>
    </div>

    <div id="pairing-section" class="pairing-section" style="display:${connected ? 'none' : 'block'}">
      <div class="section-label"><span>// </span>DEVICE LINK</div>

      <div id="code-block" style="display:${pairingCode ? 'block' : 'none'}">
        <div class="terminal">
          <div class="term-bar">
            <div class="term-dot r"></div>
            <div class="term-dot y"></div>
            <div class="term-dot g"></div>
          </div>
          <div class="term-body">
            <div><span class="term-prompt">$ </span>link --device</div>
            <div><span class="term-key">code </span><span class="term-arrow">→ </span><span class="term-val g" id="pairing-code">${pairingCode || ''}</span></div>
            <div><span class="term-key">expires </span><span class="term-arrow">→ </span><span class="term-val y">60s after generation</span></div>
          </div>
        </div>
        <div class="pairing-code-display" id="pairing-display">${pairingCode || ''}</div>
        <div class="copy-row">
          <button class="copy-btn" id="copy-btn" onclick="copyCode()">⎘ COPY CODE</button>
        </div>
        <div class="pairing-steps-list">
          <div class="pairing-step-row"><div class="step-n">1</div>Open WhatsApp on your phone</div>
          <div class="pairing-step-row"><div class="step-n">2</div>Settings → Linked Devices</div>
          <div class="pairing-step-row"><div class="step-n">3</div>Link a Device → Link with phone number</div>
          <div class="pairing-step-row"><div class="step-n">4</div>Enter the code above</div>
        </div>
      </div>

      <div id="no-code-msg" style="display:${pairingCode ? 'none' : 'block'}">
        <div class="terminal">
          <div class="term-bar">
            <div class="term-dot r"></div>
            <div class="term-dot y"></div>
            <div class="term-dot g"></div>
          </div>
          <div class="term-body">
            <div><span class="term-prompt">$ </span>link --device</div>
            <div><span class="term-val y">⏳ Waiting for pairing code...</span></div>
            <div><span class="term-val" style="color:var(--muted2);">Click the button below to generate one.</span></div>
          </div>
        </div>
      </div>

      <button class="req-btn" id="req-btn" onclick="requestLogin()">↻ REQUEST PAIRING CODE</button>
      <div class="req-msg" id="req-msg"></div>
    </div>

    <div id="connected-section" class="section" style="display:${connected ? 'block' : 'none'}">
      <div class="section-label"><span>// </span>CONNECTION</div>
      <div class="terminal">
        <div class="term-bar">
          <div class="term-dot r"></div>
          <div class="term-dot y"></div>
          <div class="term-dot g"></div>
        </div>
        <div class="term-body">
          <div><span class="term-prompt">$ </span>status --live</div>
          <div><span class="term-val g">✓ Connected to WhatsApp</span></div>
          <div><span class="term-key">uptime </span><span class="term-arrow">→ </span><span class="term-val" id="term-uptime">—</span></div>
          <div><span class="term-key">poll </span><span class="term-arrow">→ </span><span class="term-val b" id="term-poll">—</span></div>
        </div>
      </div>
    </div>

    <div class="btns-row">
      <a class="btn-outline" href="https://github.com/FX-SIFAT" target="_blank">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
        GITHUB
      </a>
      <a class="btn-outline" href="${pkg.bot?.groupLink || 'https://chat.whatsapp.com/FuyoDJWuOvM5g5HuU4SpT1'}" target="_blank">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WA GROUP
      </a>
    </div>

  </div>

  <div class="footer-bar">
    <span>© ${new Date().getFullYear()} —${pkg.name} &nbsp;·&nbsp; BUILT BY <a href="https://github.com/FX-SIFAT" target="_blank">SIFAT</a></span>
    <span id="last-poll-label">LIVE</span>
  </div>

</div>

    <script>
const resetToken = ${JSON.stringify(resetToken)};
const start = ${startTime};
function fmt(ms) {
  const s = Math.floor(ms/1000), m = Math.floor(s/60),
        h = Math.floor(m/60),   d = Math.floor(h/24);
  if (d > 0) return d+'D '+(h%24)+'H';
  if (h > 0) return h+'H '+(m%60)+'M';
  if (m > 0) return m+'M '+(s%60)+'S';
  return s+'S';
}
function tick() {
  const v = fmt(Date.now() - start);
  const el = document.getElementById('uptime-val');
  const t  = document.getElementById('term-uptime');
  if (el) el.textContent = v;
  if (t)  t.textContent  = v;
}
tick(); setInterval(tick, 1000);

function copyCode() {
  const code = document.getElementById('pairing-display')?.textContent?.trim();
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copy-btn');
    if (!btn) return;
    btn.classList.add('ok');
    btn.textContent = '✓ COPIED';
    setTimeout(() => { btn.classList.remove('ok'); btn.textContent = '⎘ COPY CODE'; }, 2500);
  });
}

async function requestLogin() {
  const btn = document.getElementById('req-btn');
  const msg = document.getElementById('req-msg');
  if (!btn || !msg) return;
  btn.disabled = true;
  btn.textContent = '↻ SENDING...';
  msg.style.color = 'var(--muted)';
  msg.textContent = '';
  try {
    const res  = await fetch('/api/request-login', {
      method: 'POST',
      headers: { 'X-Chisa-Reset-Token': resetToken }
    });
    const data = await res.json();
    msg.style.color = data.success ? 'var(--green)' : 'var(--yellow)';
    msg.textContent = (data.success ? '✓ ' : '⚠ ') + data.message;
    if (data.success) setTimeout(poll, 4000);
  } catch {
    msg.style.color = 'var(--yellow)';
    msg.textContent = '⚠ NETWORK ERROR';
  } finally {
    btn.disabled = false;
    btn.textContent = '↻ REQUEST NEW PAIRING CODE';
  }
}

function timeAgo(d) {
  const s = Math.round((Date.now()-d)/1000);
  if (s < 5)  return 'JUST NOW';
  if (s < 60) return s+'S AGO';
  return Math.floor(s/60)+'M AGO';
}

let lastPoll = Date.now();

async function poll() {
  try {
    const res  = await fetch('/api/status');
    const data = await res.json();
    lastPoll = Date.now();

    const dot       = document.getElementById('status-dot');
    const lbl       = document.getElementById('status-label');
    const waVal     = document.getElementById('wa-val');
    const termSt    = document.getElementById('term-status');
    const pSect     = document.getElementById('pairing-section');
    const cSect     = document.getElementById('connected-section');
    const pCode     = document.getElementById('pairing-code');
    const pDisp     = document.getElementById('pairing-display');
    const codeBlock = document.getElementById('code-block');
    const noCodeMsg = document.getElementById('no-code-msg');
    const pollLbl   = document.getElementById('last-poll-label');

    if (pollLbl) pollLbl.textContent = timeAgo(lastPoll);

    if (data.connected) {
      if (dot)    { dot.className = 'status-dot online'; }
      if (lbl)    { lbl.className = 'status-label online'; lbl.textContent = 'ONLINE'; }
      if (waVal)  { waVal.className = 'stat-val green'; waVal.textContent = 'ON'; }
      if (termSt) { termSt.className = 'term-val g'; termSt.textContent = 'CONNECTED ✓'; }
      if (pSect)  pSect.style.display = 'none';
      if (cSect)  cSect.style.display = 'block';
    } else {
      if (dot)    { dot.className = 'status-dot offline'; }
      if (lbl)    { lbl.className = 'status-label offline'; lbl.textContent = data.pairingCode ? 'PAIRING' : 'LINKING'; }
      if (waVal)  { waVal.className = 'stat-val yellow'; waVal.textContent = 'OFF'; }
      if (termSt) { termSt.className = 'term-val y'; termSt.textContent = data.pairingCode ? 'AWAITING LINK' : 'LINKING...'; }
      if (cSect)  cSect.style.display = 'none';
      if (pSect)  pSect.style.display = 'block';
      if (data.pairingCode) {
        if (pCode)     pCode.textContent = data.pairingCode;
        if (pDisp)     pDisp.textContent = data.pairingCode;
        if (codeBlock) codeBlock.style.display = 'block';
        if (noCodeMsg) noCodeMsg.style.display = 'none';
      } else {
        if (codeBlock) codeBlock.style.display = 'none';
        if (noCodeMsg) noCodeMsg.style.display = 'block';
      }
    }
  } catch {}
}

setInterval(poll, 5000);
setInterval(() => {
  const el = document.getElementById('last-poll-label');
  if (el) el.textContent = timeAgo(lastPoll);
}, 5000);
</script>

</body>
</html>`;
}

module.exports = { getHTML };
