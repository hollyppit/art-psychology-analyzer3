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
  const body = await context.request.json();

  // 1순위: Anthropic Claude
  try {
    const anthropicPayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: body.messages?.find(m => m.role === 'system')?.content || '',
      messages: body.messages?.filter(m => m.role !== 'system').map(m => {
        // OpenAI image_url 형식을 Anthropic 형식으로 변환
        if (Array.isArray(m.content)) {
          return {
            role: m.role,
            content: m.content.map(c => {
              if (c.type === 'image_url') {
                const base64 = c.image_url.url.split(',')[1];
                const mediaType = c.image_url.url.split(';')[0].split(':')[1];
                return { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };
              }
              return c;
            })
          };
        }
        return m;
      }) || []
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicPayload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Anthropic error');

    const text = data?.content?.[0]?.text;
    if (!text) throw new Error('Anthropic 응답 없음');

    // OpenAI 형식으로 변환해서 반환 (기존 프론트 코드 호환)
    return new Response(JSON.stringify({
      choices: [{ message: { content: text }, finish_reason: 'stop' }],
      _provider: 'anthropic'
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.warn('Anthropic 실패, OpenAI fallback:', e.message);
  }

  // 2순위: OpenAI fallback
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ ...body, model: 'gpt-4o' })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'OpenAI error');

    return new Response(JSON.stringify({ ...data, _provider: 'openai' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: { message: `분석 실패: ${e.message}` } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
