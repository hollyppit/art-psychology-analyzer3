export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const { request, env } = context;
  const body = await request.json();

  const messages = body.messages || [];
  const maxTokens = body.max_tokens || 2500;
  const temperature = body.temperature || 0.7;

  const systemMessage = messages.find(m => m.role === "system")?.content || "";
  const userMessages = messages.filter(m => m.role !== "system");

  function convertMessagesForAnthropic(msgs) {
    return msgs.map(m => {
      if (m.role !== "user") return { role: m.role, content: m.content };
      if (!Array.isArray(m.content)) return { role: "user", content: m.content };
      const converted = m.content.map(block => {
        if (block.type === "text") return { type: "text", text: block.text };
        if (block.type === "image_url") {
          const url = block.image_url?.url || "";
          const match = url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            return {
              type: "image",
              source: { type: "base64", media_type: match[1], data: match[2] }
            };
          }
        }
        return block;
      });
      return { role: "user", content: converted };
    });
  }

  // ── 1순위: Anthropic Claude ──
  try {
    const anthropicMessages = convertMessagesForAnthropic(userMessages);
    const jsonInstruction = "You must respond with pure JSON only. No markdown code blocks, no explanation text, no prefix. Output only a valid JSON object.";

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system: jsonInstruction + "\n\n" + systemMessage,
        messages: anthropicMessages
      })
    });

    if (anthropicRes.ok) {
      const anthropicData = await anthropicRes.json();
      const text = anthropicData.content?.[0]?.text || "";
      return new Response(JSON.stringify({
        choices: [{ message: { content: text } }],
        _provider: "anthropic"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.error("Anthropic 실패, OpenAI로 폴백:", anthropicRes.status);
  } catch (err) {
    console.error("Anthropic 연결 오류, OpenAI로 폴백:", err.message);
  }

  // ── 2순위 폴백: OpenAI ──
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: body.model || "gpt-4o",
        messages: messages,
        response_format: body.response_format || undefined,
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    const openaiData = await openaiRes.json();

    if (!openaiRes.ok) {
      return new Response(JSON.stringify({
        error: openaiData.error?.message || "OpenAI 오류"
      }), {
        status: openaiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      ...openaiData,
      _provider: "openai"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: `모든 API 연결 실패: ${err.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
