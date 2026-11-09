# Release acceptance

Before publishing a version tag:

- [ ] `npm test` passes.
- [ ] `npm run package:release -- vX.Y.Z` creates a ZIP and SHA-256 file.
- [ ] The model ID is read only from server-side environment configuration.
- [ ] The basic and Password + KV proxies use the same model configuration.
- [ ] No real API key, prompt, conversation, personal path or deployment identifier is present.
- [ ] Both `[YOUR COMPANION NAME]` placeholders remain in each portal interface.
- [ ] A fresh basic deployment works with only `OPENAI_API_KEY` configured.
- [ ] GPT-5.6 Sol, GPT-5.5, GPT-5.1, GPT-4.1 and GPT-4o request shapes have been checked by tests.
- [ ] The Password + KV route rejects an unauthenticated OpenAI request.
- [ ] The release notes call out any model retirement or migration requirement.

The automated tests do not contact OpenAI. A maintainer should still perform a
small live smoke test before recommending a new release broadly.
