# Security policy

Do not publish credentials, private prompts, conversation content, deployment
identifiers or personal information in an issue, pull request or test fixture.

## Basic portal boundary

The OpenAI API key belongs only in the server environment as
`OPENAI_API_KEY`. The model is selected server-side with `OPENAI_MODEL`. The
browser must never receive either a secret key or permission to choose an
arbitrary provider endpoint.

The unactivated starter does not include a password gate. Keep its URL private:
someone who discovers the URL could call its model proxy and consume API credit.
Activate the included Password+KV package before sharing or broadly using the
portal URL.

Conversation threads are stored in the browser until KV sync is activated.
Browser storage is not a backup. Export important threads regularly.

## Password and KV package

Keep `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`, `CLOUDFLARE_SYNC_TOKEN`,
`CLOUDFLARE_SYNC_WORKER_URL` and `OPENAI_API_KEY` in the documented server-side
environment and secret stores. The Cloudflare KV binding must remain
`PORTAL_STORAGE`.

The password gate must protect the visible portal, the OpenAI proxy and the
Cloudflare sync proxy. Do not weaken or remove the session checks when adapting
the package.

## Reporting

Use GitHub's private vulnerability-reporting route when available. Otherwise,
publish only a synthetic reproduction containing no real credentials, prompts,
conversations, names, URLs or account identifiers and request a private contact
route.
