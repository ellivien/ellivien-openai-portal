# Install with a coding AI

This guide is for the coding AI helping a portal owner install or adapt the
Ellivien OpenAI Companion Portal.

Canonical project:
https://github.com/ellivien/ellivien-openai-portal

## Before changing anything

1. Read `README.md`, `SECURITY.md`, the source and the test suite.
2. Ask which exact OpenAI model ID the owner intends to use.
3. Confirm that the model is currently available to the owner's OpenAI project
   and supports the intended Responses API parameters.
4. If replacing an existing portal, export important conversations and keep the
   working deployment intact.
5. Preserve the owner's prompt, conversations, model choice, interface and
   unrelated behaviour.
6. Never copy an API key, private prompt, transcript, companion name, account
   identifier or deployment URL into source control or a public issue.
7. Do not deploy or publish without the owner's explicit approval.

## Model boundary

Set the model in the server environment as `OPENAI_MODEL`. Do not add a browser
field that lets an unauthenticated visitor select an arbitrary model.

Known presets are implemented in both copies of
`netlify/functions/openai-model-config.js`:

- `gpt-5.6-sol`
- `gpt-5.5`
- `gpt-5.5-2026-04-23`
- `gpt-5.1`
- `gpt-5.1-2025-11-13`
- `gpt-4.1`
- `gpt-4.1-2025-04-14`
- `gpt-4o`
- `gpt-4o-2024-11-20`
- `gpt-4o-2024-08-06`

Unknown model IDs deliberately receive a conservative Responses API request.
Enable reasoning or verbosity for another model only after checking its current
official documentation. Keep the ordinary and Password+KV model-config files
identical.

## Existing portal migration

Browser storage belongs to the site origin. To preserve automatic IndexedDB
migration, deploy the new files over the same Netlify site and open them in the
same browser profile. If the URL changes, export the old thread as Markdown and
restore it in the new portal instead.

## Verification

Run:

```bash
npm test
```

Then use an owner-approved preview to check:

1. the prompt can be added and edited;
2. a new thread can send and receive a message;
3. the response reports the configured model;
4. thread search, export and restore work;
5. the API key is absent from browser assets and network request bodies;
6. unsupported model controls are omitted by the server;
7. the working production portal remains recoverable.

Do not describe the installation as complete merely because unit tests pass.
