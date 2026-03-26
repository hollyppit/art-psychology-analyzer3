export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const body = await request.json();
    const { messages, model, stream, ...rest } = body;

    // 1. Try Anthropic
    if (env.ANTHROPIC_API_KEY) {
      try {
        const anthropicResponse = await callAnthropic(messages, env.ANTHROPIC_API_KEY);
        return new Response(JSON.stringify(anthropicResponse), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Anthropic Error:", error);
        // Fallback to OpenAI if Anthropic fails
      }
    }

    // 2. OpenAI Fallback
    if (env.OPENAI_API_KEY) {
      const openaiResponse = await callOpenAI(body, env.OPENAI_API_KEY);
      return new Response(JSON.stringify(openaiResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No API keys configured or providers failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function callAnthropic(messages, apiKey) {
  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || "";
  const filteredMessages = messages.filter(m => m.role !== 'system');

  // Convert messages to Anthropic format
  const anthropicMessages = filteredMessages.map(msg => {
    if (Array.isArray(msg.content)) {
      const content = msg.content.map(item => {
        if (item.type === 'text') {
          return { type: 'text', text: item.text };
        } else if (item.type === 'image_url') {
          const url = item.image_url.url;
          const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: match[1],
                data: match[2],
              },
            };
          }
        }
        return item;
      });
      return { role: msg.role === 'assistant' ? 'assistant' : 'user', content };
    }
    return { role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content };
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      max_tokens: 4096,
      system: systemMessage,
      messages: anthropicMessages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Anthropic API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  // Convert to OpenAI format
  return {
    id: data.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: data.model,
    _provider: "anthropic",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: data.content[0].text,
        },
        finish_reason: data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
      },
    ],
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

async function callOpenAI(body, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      model: "gpt-4o", // Ensure we use gpt-4o as requested
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  data._provider = "openai";
  return data;
}
