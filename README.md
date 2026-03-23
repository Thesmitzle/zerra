# Zerra — Zero-Knowledge Encrypted Chat

<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Zerra logo" />
</p>

<p align="center">
  <strong>Privacy-first · End-to-end encrypted · Self-destructing messages · Zero knowledge</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#how-encryption-works">How Encryption Works</a> ·
  <a href="#security-model">Security Model</a> ·
  <a href="#deploy-to-vercel">Deploy</a>
</p>

---

## What is Zerra?

Zerra is a minimal, premium chat app where **the server never sees your messages**. Messages are encrypted in your browser using AES-GCM 256-bit encryption before being sent. The encryption key is shared via the URL fragment (`#key=...`), which browsers **never include in HTTP requests** — so the server is cryptographically blind to your conversations.

---

## Features

| Feature | Details |
|---|---|
| 🔐 End-to-end encryption | AES-GCM 256-bit via Web Crypto API |
| 🫥 Zero knowledge | Server only relays encrypted blobs |
| 💣 Self-destructing messages | 10s / 1m / 5m / 1h after read |
| 🏠 Private rooms | Secure random IDs, no room listing |
| ⏰ Room expiry | 1h / 24h / 7d auto-delete |
| 🔑 Key fingerprint | Out-of-band verification |
| 💬 Typing indicators | Real-time presence |
| 🚦 Rate limiting | 1 message/sec anti-spam |
| 📱 Responsive | Mobile & desktop |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/zerra.git
cd zerra
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# Optional: Cloudflare Turnstile (anti-bot CAPTCHA)
# Get keys at: https://dash.cloudflare.com/?to=/:account/turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

### 4. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for production

```bash
npm run build
npm start
```

---

## How Encryption Works

Zerra uses the browser's native **Web Crypto API** — no third-party crypto library required.

### Algorithm: AES-GCM 256-bit

- **AES-GCM** (Advanced Encryption Standard — Galois/Counter Mode) provides both confidentiality and authenticity.
- 256-bit keys = 2²⁵⁶ possible keys (computationally infeasible to brute-force).
- Each message uses a **unique random 96-bit IV** (Initialization Vector), so identical messages produce different ciphertexts.

### The Zero-Knowledge URL System

```
https://zerra.app/room/x7Kp9Qa2LmN#key=base64encodedkey...
                    └─ sent to server ─┘ └─── NEVER sent ───┘
```

The `#fragment` part of a URL is **client-side only**. Browsers do not include it in HTTP requests or server logs. This means:

1. Room creator generates an AES-256 key entirely in their browser
2. Key is base64-encoded and placed in the URL fragment
3. When the link is shared, the recipient's browser reads the key from `window.location.hash`
4. The key **never touches the server** at any point
5. Both parties encrypt/decrypt locally before sending/after receiving

### Message Lifecycle

```
Sender                          Server                         Receiver
  │                               │                               │
  ├─ Compose plaintext            │                               │
  ├─ Generate random IV           │                               │
  ├─ AES-GCM encrypt              │                               │
  ├─ Send {encryptedData, iv} ───►│                               │
  │                               ├─ Store encrypted blob         │
  │                               ├─ Relay to room ──────────────►│
  │                               │                               ├─ Receive {encryptedData, iv}
  │                               │                               ├─ AES-GCM decrypt with key
  │                               │                               ├─ Display plaintext
```

### Self-Destruct Timer

- Timer starts **client-side** when the message appears
- When timer expires, client sends `delete-message` event to server
- Server removes the message from its in-memory store
- All room participants receive `message-deleted` event and remove from UI
- The server also auto-deletes all messages when a room expires

---

## Security Model

### What Zerra protects against

| Threat | Protection |
|---|---|
| Server compromise | Server only stores ciphertext — useless without the key |
| Network interception | TLS + AES-GCM double encryption |
| Message replay | Per-message random IV prevents replay attacks |
| Key brute-force | 2²⁵⁶ key space — computationally infeasible |
| Message tampering | GCM authentication tag detects any modification |

### Security Limitations (be honest about these)

> **Important**: Zerra is designed for casual privacy, not national-security-level communications. Here are the known limitations:

1. **Key in URL** — If someone has access to your browser history, clipboard, or the shared link, they have the encryption key. Share links only over secure, trusted channels (Signal, in-person, etc.).

2. **No forward secrecy** — All messages in a session use the same key. If the key is ever compromised, all messages from that session can be decrypted.

3. **No identity verification** — There is no way to cryptographically verify who you're talking to. Anyone with the room link can join and impersonate. Use the key fingerprint for out-of-band verification.

4. **In-memory server storage** — Messages are stored in RAM on the server in encrypted form. A server restart clears all messages. There is no persistence layer.

5. **Metadata** — The server knows IP addresses, connection times, room IDs, and participant counts — just not message content.

6. **Client trust** — The security model trusts the JavaScript served by the server. A compromised server could theoretically serve malicious JS that leaks keys. For maximum security, use a self-hosted instance and verify the source code.

7. **Browser security** — If the user's browser or device is compromised (keylogger, malicious extension), encryption cannot protect against local attacks.

### Threat Model Summary

✅ **Zerra is good for**: Private conversations where you don't want messages stored on a server, casual ephemeral chats, sharing sensitive one-off information.

❌ **Zerra is NOT a replacement for**: Signal, ProtonMail, or other battle-tested E2E encrypted tools for high-stakes communications.

---

## Deploy to Vercel

> **Note**: Vercel's serverless functions don't support persistent WebSocket connections. For production, deploy to a **Node.js VPS** (Railway, Fly.io, Render, DigitalOcean) that supports long-lived connections.

### Option A: Railway (Recommended for WebSockets)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables from `.env.example`
4. Railway auto-detects Node.js and runs `npm start`

### Option B: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### Option C: Render

1. Connect GitHub repo at [render.com](https://render.com)
2. Service type: **Web Service**
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables

### Option D: DigitalOcean Droplet / Any VPS

```bash
# On your server
git clone https://github.com/yourusername/zerra.git
cd zerra
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name zerra
pm2 save
pm2 startup
```

Then configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Project Structure

```
zerra/
├── server.js                    # Express + Socket.io server (zero-knowledge relay)
├── next.config.mjs              # Next.js config
├── tailwind.config.js           # Design tokens + animations
├── vercel.json                  # Vercel deployment config
├── .env.example                 # Environment variable template
│
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout (fonts, metadata)
    │   ├── globals.css           # Global styles + animations
    │   ├── page.tsx              # Landing page (hero + room creation)
    │   └── room/
    │       └── [id]/
    │           └── page.tsx      # Room page
    │
    ├── components/
    │   ├── ChatRoom.tsx          # Main chat orchestrator
    │   ├── TopBar.tsx            # Header with E2E indicator + expiry
    │   ├── MessageBubble.tsx     # Chat bubble + self-destruct timer
    │   └── MessageInput.tsx      # Input bar + timer selector
    │
    ├── lib/
    │   ├── crypto.ts             # Web Crypto API (AES-GCM encrypt/decrypt)
    │   └── socketClient.ts       # Socket.io client singleton
    │
    └── types/
        └── index.ts              # TypeScript interfaces
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL (for CORS) |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | No | Cloudflare Turnstile secret key |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS + CSS animations |
| Real-time | Socket.io 4 |
| Backend | Express.js + Node.js |
| Encryption | Web Crypto API (native browser) |
| Fonts | Syne + Outfit + DM Mono (Google Fonts) |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ and cryptography · <strong>The server never knows</strong>
</p>
