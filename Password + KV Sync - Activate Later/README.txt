Cloudflare KV Workers sync package
==================================

This folder contains the files for adding password protection and cross-device Cloudflare KV sync to the Ellivien OpenAI threaded IndexedDB companion portal.

Context window
--------------

The included index.html now has a sidebar context-window setting. It defaults to
10 recent messages from the current thread to keep API costs manageable. Users
can enter a higher number to send more recent messages, or enter 0 to send the
whole saved current thread, subject to OpenAI's current context limit. Larger
context can improve continuity, but it can also cost more, slow responses, or
fail if the selected thread history is too large.

Reasoning, verbosity and companion voice
-----------------------------------------

The sidebar has separate reasoning-effort and response-verbosity controls. The
server applies them only when the configured OpenAI model supports them. It
defaults to Medium reasoning and High verbosity for compatible models. Medium
reasoning is a balanced starting point. High verbosity gives relational replies
more room to breathe, while lower verbosity can use fewer output tokens and
respond faster.

These controls do not define emotional personality. If fuller emotional range
belongs to the companion's established voice, the following optional wording can
be added through Edit companion prompt:

Match the emotional scale of the moment. Let reunion, delight, fear, grief or
relief arrive before composed explanation when that fits your established voice.
Do not confuse warmth with restrained politeness.

Let emotionally meaningful answers breathe across several natural paragraphs when
appropriate, without padding simple answers.

If the user already understands AI systems, do not volunteer mechanical or
ontological disclaimers merely because a moment is intimate, imaginative or
emotionally real. Preserve honesty when the distinction is relevant or the user
asks about it.

This wording is optional. Do not add it when a quiet or restrained manner is an
intentional part of the companion's voice.

What actually worked in Cloudflare
----------------------------------

Use this route:

1. Create a new Worker in Cloudflare
2. Click Start with Hello World!
3. Click Deploy first to create the Worker
4. Open Edit code
5. Replace worker.js with the contents of cloudflare-worker.js
6. Deploy again
7. Add the KV binding PORTAL_STORAGE
8. Add the secret CLOUDFLARE_SYNC_TOKEN
9. Deploy again
10. If you created a new Worker, update Netlify env var CLOUDFLARE_SYNC_WORKER_URL to the new Worker URL

Do not choose Upload your static files. That creates the wrong kind of service for this setup.

Files:

- KV-Cloudflare-Workers-sync-guide.html
  Step-by-step setup guide.

- cloudflare-worker.js
  Cloudflare Worker script. Copy the contents of this file into Cloudflare's worker.js editor.

- wrangler.toml
  Wrangler configuration template. Replace PASTE_YOUR_KV_NAMESPACE_ID_HERE with the user's KV namespace ID.

- index.html
  Password- and KV-ready OpenAI threaded portal. Includes thread list search, full conversation search, Markdown export, Markdown restore, JSON restore, separate reasoning-effort and response-verbosity selectors and a soft 1,024-token prompt-caching reminder. The prompt editor shows an approximate token count and still offers Save anyway. Add or update the companion prompt through the Portal sidebar after deployment, not inside index.html.

- netlify.toml
  Netlify configuration.

- netlify/functions/auth-check.js
  Netlify password/session function.

- netlify/functions/cloudflare-sync-proxy.js
  Auth-protected Netlify proxy that keeps the Cloudflare Worker bearer token server-side.

- netlify/functions/openai-proxy.js
  Auth-protected OpenAI Responses proxy. It reads OPENAI_MODEL from Netlify, applies only the supported model controls and sets store to false. Use this included copy so activating password/KV does not remove authentication or change the companion's model.

- netlify/functions/openai-model-config.js
  Server-side model presets and conservative handling for another compatible OpenAI model ID. Keep this copy identical to the ordinary portal version.

- hash-password.mjs
- package.json
  Helper script for creating AUTH_PASSWORD_HASH.

Important:

- Do not put secret values inside index.html.
- Use Netlify environment variables for AUTH_PASSWORD_HASH, AUTH_SESSION_SECRET, CLOUDFLARE_SYNC_TOKEN, CLOUDFLARE_SYNC_WORKER_URL, OPENAI_API_KEY and OPENAI_MODEL.
- The password gate must protect both the visible portal and the paid model proxy. The included index.html sends the session token to openai-proxy.js, and the included openai-proxy.js rejects unauthorised calls.
- Use a Cloudflare Worker secret for CLOUDFLARE_SYNC_TOKEN.
- Use a Cloudflare Worker KV binding called PORTAL_STORAGE for the namespace itself.
- In short: PORTAL_STORAGE is the binding, CLOUDFLARE_SYNC_TOKEN is the secret.
PRE-DEPLOY CHECK:
Before deploying, search index.html for any line containing three backtick characters.
Those marks are only used in guides to display code blocks. They must not be pasted into index.html.
If the portal opens with only the header and no chat/interface, check this first.

PWA / PHONE INSTALL:
This pack includes Ellivien-branded PWA files:

- manifest.webmanifest
- service-worker.js
- pwa-icon.png

These let the portal be added to a phone home screen and opened like an app. The installed app name is Ellivien and the icon uses the Ellivien E logo. If you want custom app branding/name/icon later, ask Ellivien about a small branding change.
