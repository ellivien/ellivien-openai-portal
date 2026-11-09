// netlify/functions/openai-proxy.js
// Server-side OpenAI Responses API proxy.
// Configure the model with OPENAI_MODEL; never place API keys in browser files.

const { buildResponseRequest } = require('./openai-model-config.js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, reasoningEffort, verbosity } = JSON.parse(event.body || '{}');

    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'messages must be an array' })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'OPENAI_API_KEY is not configured' })
      };
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(buildResponseRequest({ messages, reasoningEffort, verbosity }))
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    const assistantMessage = (Array.isArray(data.output) ? data.output : [])
      .filter(item => item && item.type === 'message' && item.role === 'assistant')
      .flatMap(item => Array.isArray(item.content) ? item.content : [])
      .map(part => {
        if (part && part.type === 'output_text' && typeof part.text === 'string') return part.text;
        if (part && part.type === 'refusal' && typeof part.refusal === 'string') return part.refusal;
        return '';
      })
      .join('');

    if (!assistantMessage) {
      console.error('OpenAI Responses API returned no assistant text');
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'OpenAI returned no assistant message' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: assistantMessage,
        model: data.model,
        usage: data.usage || null,
        // Legacy response shape keeps a briefly cached earlier page compatible.
        choices: [{ message: { role: 'assistant', content: assistantMessage } }]
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
