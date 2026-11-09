ELLIVIEN OPENAI COMPANION PORTAL - START HERE

This is the same public project documented at:
https://github.com/ellivien/ellivien-openai-portal

The default model is GPT-5.6 Sol. You can select another compatible OpenAI
Responses API model by adding OPENAI_MODEL in your Netlify environment
variables. Examples:

  GPT-5.6 Sol:  gpt-5.6-sol
  GPT-5.5:      gpt-5.5
  GPT-5.5 fixed snapshot: gpt-5.5-2026-04-23
  GPT-5.1:      gpt-5.1
  GPT-5.1 fixed snapshot: gpt-5.1-2025-11-13
  GPT-4.1:      gpt-4.1
  GPT-4.1 fixed snapshot: gpt-4.1-2025-04-14
  GPT-4o fixed snapshot:  gpt-4o-2024-11-20

OpenAI has announced that GPT-4o and GPT-4.1 API access will shut down on
14 January 2027, and GPT-5.1 on 1 April 2027. They are included for existing
companion continuity, not as the recommended route for a new long-lived portal.

NEW PORTAL

1. Open index.html in a text editor.
2. Replace both instances of [YOUR COMPANION NAME].
3. Save the file and deploy this complete folder to Netlify.
4. Add OPENAI_API_KEY in Netlify environment variables.
5. Add OPENAI_MODEL if you do not want the default gpt-5.6-sol.
6. Redeploy after adding the environment variables.
7. Open the portal and use Add companion prompt in the sidebar.

EXISTING PORTAL

Export important conversations first. To retain automatic access to browser
storage, deploy over the same Netlify site and open the changed portal in the
same browser profile. If the URL changes, export a thread as Markdown from the
old portal and restore it in the new portal.

SECURITY

Never paste an API key into index.html, a prompt, a guide, an issue or a public
repository. The basic portal has no password gate, so keep its URL private.
The included folder named Password + KV Sync - Activate Later adds password
protection and optional cross-device Cloudflare KV storage when you are ready.

The portal keeps a 10-message live context by default. All thread messages are
still saved locally, but only the selected recent window is sent to OpenAI.
Larger windows may cost more. Browser storage is not a backup, so export any
conversation you would be upset to lose.

For full model configuration, privacy details, open-source additions and the
CodeSlingers route for preconfigured model-specific packs, read README.md.
