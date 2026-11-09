const DEFAULT_MODEL = 'gpt-5.6-sol';
const ALLOWED_REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'];
const ALLOWED_VERBOSITY_LEVELS = ['low', 'medium', 'high'];

const MODEL_PRESETS = {
  'gpt-5.6': {
    reasoningEfforts: ALLOWED_REASONING_EFFORTS,
    verbosity: true,
  },
  'gpt-5.6-sol': {
    reasoningEfforts: ALLOWED_REASONING_EFFORTS,
    verbosity: true,
  },
  'gpt-5.5': {
    reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
    verbosity: true,
  },
  'gpt-5.5-2026-04-23': {
    reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
    verbosity: true,
  },
  'gpt-4o': {
    reasoningEfforts: [],
    verbosity: false,
  },
  'gpt-4o-2024-11-20': {
    reasoningEfforts: [],
    verbosity: false,
  },
  'gpt-4o-2024-08-06': {
    reasoningEfforts: [],
    verbosity: false,
  },
};

function readBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (/^(1|true|yes|on)$/i.test(String(value))) return true;
  if (/^(0|false|no|off)$/i.test(String(value))) return false;
  return fallback;
}

function safeModelId(value) {
  const model = String(value || DEFAULT_MODEL).trim();
  if (!model || model.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(model)) {
    throw new Error('OPENAI_MODEL contains an invalid model ID');
  }
  return model;
}

function configuredReasoningEfforts(env, preset) {
  const explicit = String(env.OPENAI_REASONING_EFFORTS || '')
    .split(',')
    .map(value => value.trim())
    .filter(value => ALLOWED_REASONING_EFFORTS.includes(value));
  if (explicit.length) return [...new Set(explicit)];

  const enabled = readBoolean(env.OPENAI_MODEL_SUPPORTS_REASONING, preset.reasoningEfforts.length > 0);
  return enabled ? preset.reasoningEfforts : [];
}

function maxOutputTokens(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 4000;
  return Math.min(Math.max(parsed, 64), 128000);
}

function getModelConfig(env = process.env) {
  const model = safeModelId(env.OPENAI_MODEL);
  const preset = MODEL_PRESETS[model] || { reasoningEfforts: [], verbosity: false };
  const reasoningEfforts = configuredReasoningEfforts(env, preset);
  const supportsVerbosity = readBoolean(env.OPENAI_MODEL_SUPPORTS_VERBOSITY, preset.verbosity);
  const promptCacheKey = String(env.OPENAI_PROMPT_CACHE_KEY || `ellivien-${model}-companion`)
    .replace(/[^A-Za-z0-9._:-]/g, '-')
    .slice(0, 64);

  return {
    model,
    reasoningEfforts,
    supportsVerbosity,
    maxOutputTokens: maxOutputTokens(env.OPENAI_MAX_OUTPUT_TOKENS),
    promptCacheKey,
  };
}

function buildResponseRequest({ messages, reasoningEffort, verbosity }, env = process.env) {
  const config = getModelConfig(env);
  const body = {
    model: config.model,
    input: messages,
    max_output_tokens: config.maxOutputTokens,
    prompt_cache_key: config.promptCacheKey,
    store: false,
  };

  if (config.reasoningEfforts.length) {
    const safeEffort = config.reasoningEfforts.includes(reasoningEffort)
      ? reasoningEffort
      : config.reasoningEfforts.includes('medium') ? 'medium' : config.reasoningEfforts[0];
    body.reasoning = { effort: safeEffort };
  }

  if (config.supportsVerbosity) {
    body.text = {
      verbosity: ALLOWED_VERBOSITY_LEVELS.includes(verbosity) ? verbosity : 'high',
    };
  }

  return body;
}

module.exports = {
  ALLOWED_REASONING_EFFORTS,
  ALLOWED_VERBOSITY_LEVELS,
  DEFAULT_MODEL,
  MODEL_PRESETS,
  buildResponseRequest,
  getModelConfig,
};
