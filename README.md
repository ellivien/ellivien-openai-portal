# Ellivien OpenAI Companion Portal

A free, threaded companion portal for the native OpenAI API.

The portal keeps the API key in a server-side Netlify environment variable,
stores conversations locally in IndexedDB, supports searchable conversation
threads, exports and restores conversations, and lets the owner edit the
companion prompt inside the portal.

The same maintained codebase can use GPT-5.6 Sol, GPT-5.5, GPT-4o or another
compatible OpenAI Responses API model. Model choice belongs in deployment
configuration, not in a separate copy of the entire portal.

## Start here

The default model is `gpt-5.6-sol`.

1. Download the repository or the named ZIP from the latest GitHub release.
2. Open `index.html` and replace both instances of `[YOUR COMPANION NAME]`.
3. Deploy the complete folder to Netlify.
4. In Netlify, add `OPENAI_API_KEY` as an environment variable.
5. Optionally add `OPENAI_MODEL` using one of the model IDs below.
6. Redeploy, open the portal and add the companion prompt from the sidebar.

Never paste an API key into `index.html`, a prompt, a public issue or any other
browser-visible file.

## Model configuration

| Companion route | `OPENAI_MODEL` | Notes |
| --- | --- | --- |
| GPT-5.6 Sol | `gpt-5.6-sol` | Default. Reasoning and verbosity controls are active. |
| GPT-5.5 | `gpt-5.5` | Reasoning and verbosity controls are active. |
| Fixed GPT-5.5 snapshot | `gpt-5.5-2026-04-23` | Use when the fixed snapshot is important to the companion. |
| GPT-4o | `gpt-4o-2024-11-20` | Compatibility route. OpenAI has announced API shutdown on 14 January 2027. |
| Another compatible model | its documented model ID | Uses a conservative Responses API request unless capabilities are enabled explicitly. |

The portal never accepts a model ID from an unauthenticated browser request.
`OPENAI_MODEL` is read only from the server environment.

For a compatible model not listed above, optional server settings are:

- `OPENAI_MODEL_SUPPORTS_REASONING=true`
- `OPENAI_REASONING_EFFORTS=low,medium,high,xhigh`
- `OPENAI_MODEL_SUPPORTS_VERBOSITY=true`
- `OPENAI_MAX_OUTPUT_TOKENS=4000`
- `OPENAI_PROMPT_CACHE_KEY=your-stable-cache-key`

Only enable parameters that the current official model documentation supports.

## What is included

- multiple IndexedDB conversation threads;
- thread names, pinning, search and full-conversation search;
- Markdown export and Markdown or JSON restore;
- an in-portal companion prompt editor;
- an adjustable recent-message context window;
- reasoning and response-verbosity controls for compatible models;
- four colour themes, light and dark modes and OpenDyslexic support;
- multilingual interface labels;
- PWA files for adding the portal to a phone or computer home screen;
- a complete `Password + KV Sync - Activate Later` folder.

The basic portal works locally without Cloudflare. Keep its URL private until
password protection is activated. Browser storage is not a backup: export any
conversation you would be upset to lose.

## Want a pack already configured for one exact model?

This repository is the canonical public source. Download or clone it and read
the model configuration above first. If you would still prefer an Ellivien pack
already configured and checked for one exact model, join **CodeSlingers** and
ask for the matching pack. A Google Drive copy may be shared there as a setup
convenience, but the source, documentation and update history remain here on
GitHub.

For a CodeSlingers invite, email
[hello.ellivien@gmail.com](mailto:hello.ellivien@gmail.com?subject=CodeSlingers%20invite)
or find **ellivien** on Discord.

## Install with a coding AI

Give the repository and a recoverable copy of any existing portal to a capable
coding AI, then use this prompt:

> Install the Ellivien OpenAI Companion Portal from
> https://github.com/ellivien/ellivien-openai-portal. Read `README.md`,
> `INSTALL-WITH-AI.md` and `SECURITY.md` first. Preserve my existing prompt and
> conversations, keep my API key server-side, use the OpenAI model ID I choose,
> work from a recoverable copy, run the complete test suite and do not deploy or
> publish without my explicit approval.

## Optional open-source additions

- [Ellivien MemFrags](https://github.com/ellivien/ellivien-memfrags)
- [Ellivien Three-Tier Context](https://github.com/ellivien/ellivien-three-tier-context)
- [Ellivien PulseTap](https://github.com/ellivien/ellivien-pulsetap) — advanced

Add one feature at a time. Keep the working deployment intact until the changed
copy has been tested.

## Development

The portal has no build step and the server functions use the Node runtime
provided by Netlify.

```bash
npm test
```

Tests mock the OpenAI request. They do not use an API key or send conversation
content to OpenAI.

## Privacy and safety

- The API key remains in the server environment.
- The basic portal stores threads only in the browser.
- The OpenAI request sets `store: false`.
- The portal includes no analytics, advertising or visitor tracking.
- Do not publish real prompts, conversations, names, credentials or deployment
  identifiers in repositories, issues or screenshots.
- Review current OpenAI model availability, pricing and policies before use.

See [SECURITY.md](SECURITY.md) before deploying.

## Licence

Created by [Ellivien](https://github.com/ellivien) and licensed under the Apache
License 2.0. Redistributions and derivative works must preserve the applicable
copyright, licence and attribution notices. The licence does not grant
permission to use the Ellivien name or branding except to describe the origin
of the software.
