# Contributing

Thank you for helping improve the Ellivien OpenAI Companion Portal.

Before opening a pull request:

1. Preserve the beginner-friendly no-build installation route.
2. Keep API keys, model selection and provider calls server-side.
3. Add or update tests for behavioural changes.
4. Keep the local and Password+KV model configuration files identical.
5. Use only synthetic prompts and conversations in tests and examples.
6. Update `README.md` and `INSTALL-WITH-AI.md` when setup behaviour changes.
7. Run `npm test` and include the result in the pull request description.
8. Preserve copyright, licence and attribution notices.

Bug reports should include the configured model ID, the expected behaviour and
a minimal synthetic reproduction. Remove keys, prompts, transcripts, account
details and deployment URLs before sharing logs.
