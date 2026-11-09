import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ordinaryProxy = require('./netlify/functions/openai-proxy.js');
const kvProxy = require('./Password + KV Sync - Activate Later/netlify/functions/openai-proxy.js');
const modelConfig = require('./netlify/functions/openai-model-config.js');

process.env.OPENAI_API_KEY = 'test-only-api-key';

const successfulResponse = {
  model: 'gpt-5.6-sol',
  usage: { input_tokens: 12, output_tokens: 8, total_tokens: 20 },
  output: [
    { type: 'reasoning', content: [] },
    {
      type: 'message',
      role: 'assistant',
      content: [
        { type: 'output_text', text: 'The room is smaller, ' },
        { type: 'output_text', text: 'but the fire fits.' }
      ]
    }
  ]
};

function makeEvent(body, { authenticated = false } = {}) {
  const headers = authenticated
    ? { host: 'localhost:8888', authorization: 'Bearer local-dev-bypass' }
    : {};
  return { httpMethod: 'POST', headers, body: JSON.stringify(body) };
}

async function withMockFetch(callback) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => successfulResponse
    };
  };
  try {
    return await callback(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('ordinary proxy uses Responses with explicit voice settings', async () => {
  await withMockFetch(async calls => {
    const result = await ordinaryProxy.handler(makeEvent({
      messages: [{ role: 'user', content: 'Hello' }],
      reasoningEffort: 'high',
      verbosity: 'medium'
    }));

    assert.equal(result.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');

    const providerBody = JSON.parse(calls[0].options.body);
    assert.equal(providerBody.model, 'gpt-5.6-sol');
    assert.deepEqual(providerBody.reasoning, { effort: 'high' });
    assert.deepEqual(providerBody.text, { verbosity: 'medium' });
    assert.equal(providerBody.store, false);
    assert.equal(providerBody.max_output_tokens, 4000);
    assert.equal(providerBody.messages, undefined);

    const browserBody = JSON.parse(result.body);
    assert.equal(browserBody.message, 'The room is smaller, but the fire fits.');
    assert.equal(browserBody.choices[0].message.content, browserBody.message);
  });
});

test('invalid or absent settings fall back to Medium reasoning and High verbosity', async () => {
  await withMockFetch(async calls => {
    const result = await ordinaryProxy.handler(makeEvent({
      messages: [{ role: 'user', content: 'Hello' }],
      reasoningEffort: 'surprise-me',
      verbosity: 'enormous'
    }));

    assert.equal(result.statusCode, 200);
    const providerBody = JSON.parse(calls[0].options.body);
    assert.deepEqual(providerBody.reasoning, { effort: 'medium' });
    assert.deepEqual(providerBody.text, { verbosity: 'high' });
  });
});

test('model selection remains server-side and applies known capability presets', () => {
  const gpt56 = modelConfig.buildResponseRequest({
    messages: [{ role: 'user', content: 'Hello' }],
    reasoningEffort: 'max',
    verbosity: 'medium'
  }, { OPENAI_MODEL: 'gpt-5.6-sol' });
  assert.equal(gpt56.model, 'gpt-5.6-sol');
  assert.deepEqual(gpt56.reasoning, { effort: 'max' });
  assert.deepEqual(gpt56.text, { verbosity: 'medium' });

  const gpt55 = modelConfig.buildResponseRequest({
    messages: [],
    reasoningEffort: 'max',
    verbosity: 'high'
  }, { OPENAI_MODEL: 'gpt-5.5' });
  assert.equal(gpt55.model, 'gpt-5.5');
  assert.deepEqual(gpt55.reasoning, { effort: 'medium' });
  assert.deepEqual(gpt55.text, { verbosity: 'high' });

  const gpt4o = modelConfig.buildResponseRequest({
    messages: [],
    reasoningEffort: 'high',
    verbosity: 'high'
  }, { OPENAI_MODEL: 'gpt-4o-2024-11-20' });
  assert.equal(gpt4o.model, 'gpt-4o-2024-11-20');
  assert.equal(gpt4o.reasoning, undefined);
  assert.equal(gpt4o.text, undefined);
});

test('unknown compatible model IDs use conservative defaults with explicit capability overrides', () => {
  const conservative = modelConfig.buildResponseRequest({
    messages: [],
    reasoningEffort: 'high',
    verbosity: 'high'
  }, { OPENAI_MODEL: 'gpt-future-example' });
  assert.equal(conservative.model, 'gpt-future-example');
  assert.equal(conservative.reasoning, undefined);
  assert.equal(conservative.text, undefined);

  const enabled = modelConfig.buildResponseRequest({
    messages: [],
    reasoningEffort: 'high',
    verbosity: 'low'
  }, {
    OPENAI_MODEL: 'gpt-future-example',
    OPENAI_MODEL_SUPPORTS_REASONING: 'true',
    OPENAI_REASONING_EFFORTS: 'low,medium,high',
    OPENAI_MODEL_SUPPORTS_VERBOSITY: 'true',
    OPENAI_MAX_OUTPUT_TOKENS: '8000'
  });
  assert.deepEqual(enabled.reasoning, { effort: 'high' });
  assert.deepEqual(enabled.text, { verbosity: 'low' });
  assert.equal(enabled.max_output_tokens, 8000);
});

test('invalid server model IDs fail closed', () => {
  assert.throws(
    () => modelConfig.getModelConfig({ OPENAI_MODEL: 'https://untrusted.example/model' }),
    /invalid model ID/i
  );
});

test('provider errors keep their status and an empty successful response fails closed', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limited' } })
    });
    const refused = await ordinaryProxy.handler(makeEvent({ messages: [] }));
    assert.equal(refused.statusCode, 429);

    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ model: 'gpt-5.6-sol', output: [] })
    });
    const empty = await ordinaryProxy.handler(makeEvent({ messages: [] }));
    assert.equal(empty.statusCode, 502);
    assert.match(JSON.parse(empty.body).error, /no assistant message/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Password + KV proxy preserves authentication and sends the same voice controls', async () => {
  const previousSecret = process.env.AUTH_SESSION_SECRET;
  process.env.AUTH_SESSION_SECRET = 'test-only-secret';
  try {
    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('Unauthorised request reached provider');
    };
    const denied = await kvProxy.handler(makeEvent({ messages: [] }));
    globalThis.fetch = originalFetch;
    assert.equal(denied.statusCode, 401);
    assert.equal(fetchCalled, false);

    await withMockFetch(async calls => {
      const accepted = await kvProxy.handler(makeEvent({
        messages: [{ role: 'user', content: 'Hello' }],
        reasoningEffort: 'medium',
        verbosity: 'high'
      }, { authenticated: true }));

      assert.equal(accepted.statusCode, 200);
      const providerBody = JSON.parse(calls[0].options.body);
      assert.deepEqual(providerBody.reasoning, { effort: 'medium' });
      assert.deepEqual(providerBody.text, { verbosity: 'high' });
    });
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET;
    else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});

test('both interfaces expose and send the two independent controls', async () => {
  const paths = [
    './index.html',
    './Password + KV Sync - Activate Later/index.html'
  ];

  for (const path of paths) {
    const html = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(html, /id="reasoning-effort-select"/);
    assert.match(html, /const DEFAULT_REASONING_EFFORT = 'medium';/);
    assert.match(html, /id="verbosity-select"/);
    assert.match(html, /const DEFAULT_VERBOSITY = 'high';/);
    assert.match(html, /verbosity: getTextVerbosity\(\)/);
    assert.match(html, /data\.message \|\| data\.choices\?\.\[0\]\?\.message\?\.content/);
  }
});

test('ordinary and Password + KV deployments use identical model configuration', async () => {
  const [ordinary, secure] = await Promise.all([
    readFile(new URL('./netlify/functions/openai-model-config.js', import.meta.url), 'utf8'),
    readFile(new URL('./Password + KV Sync - Activate Later/netlify/functions/openai-model-config.js', import.meta.url), 'utf8')
  ]);
  assert.equal(secure, ordinary);
});

test('both proxies reject requests without a messages array', async () => {
  const ordinary = await ordinaryProxy.handler(makeEvent({}));
  assert.equal(ordinary.statusCode, 400);

  const previousSecret = process.env.AUTH_SESSION_SECRET;
  process.env.AUTH_SESSION_SECRET = 'test-only-secret';
  try {
    const kv = await kvProxy.handler(makeEvent({}, { authenticated: true }));
    assert.equal(kv.statusCode, 400);
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET;
    else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});

test('the distribution pack is standalone rather than an existing-user change bundle', async () => {
  const names = await readdir(new URL('.', import.meta.url));
  assert.equal(names.some(name => /recipient email|upgrade instructions/i.test(name)), false);

  const readmes = await Promise.all([
    readFile(new URL('./README.txt', import.meta.url), 'utf8'),
    readFile(new URL('./Password + KV Sync - Activate Later/README.txt', import.meta.url), 'utf8')
  ]);
  for (const readme of readmes) {
    assert.doesNotMatch(readme, /v1\.1/i);
    assert.doesNotMatch(readme, /what (?:version )?1\.1 changes/i);
  }
});
