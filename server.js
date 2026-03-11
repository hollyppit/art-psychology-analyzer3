require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ── 미들웨어 ─────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' })); // 이미지 base64 크기 허용

// ── 정적 파일 (HTML) 서빙 ───────────────────────────
app.use(express.static(path.join(__dirname)));

// ── 분석 API 엔드포인트 ─────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { imageBase64, imageType } = req.body;

  if (!imageBase64 || !imageType) {
    return res.status(400).json({ error: '이미지 데이터가 없습니다.' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'API 키가 서버에 설정되지 않았습니다.' });
  }

  const prompt = `당신은 임상 미술심리치료사입니다. 이 그림을 깊이 있는 심리학적 관점으로 분석하고, 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트나 마크다운 백틱 없이 순수 JSON만 출력하세요.

{
  "title": "그림 제목 혹은 핵심 인상 (한 줄, 시적으로)",
  "overview": "그림 전반에 대한 심리적 개요 (2~3문장)",
  "elements": {
    "color": "색채 분석과 심리적 의미",
    "composition": "공간 구성과 위치가 말하는 심리",
    "form": "형태, 선, 질감이 표현하는 내면 상태",
    "symbol": "상징적 요소와 그 무의식적 의미"
  },
  "scores": [
    { "name": "감정 표현력", "value": 75 },
    { "name": "내면 에너지", "value": 60 },
    { "name": "자아 통합",   "value": 55 },
    { "name": "사회적 연결", "value": 70 },
    { "name": "창의적 확장", "value": 80 }
  ],
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "core_state": "현재 심리 상태 핵심 요약 (1~2문장, 공감 어조)",
  "solutions": [
    { "title": "솔루션 제목", "description": "구체적 실천 방법과 이유 (2~3문장)" },
    { "title": "솔루션 제목", "description": "구체적 실천 방법과 이유 (2~3문장)" },
    { "title": "솔루션 제목", "description": "구체적 실천 방법과 이유 (2~3문장)" }
  ],
  "closing": "따뜻하고 시적인 마무리 문장 (이탤릭 문장으로)"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageType};base64,${imageBase64}`,
                  detail: 'high'
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      const message = errData.error?.message || 'OpenAI API 오류';
      console.error('[OpenAI Error]', message);
      return res.status(response.status).json({ error: message });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('[JSON Parse Error]', cleaned);
      return res.status(500).json({ error: 'AI 응답을 파싱하지 못했습니다.' });
    }

    return res.json(result);

  } catch (err) {
    console.error('[Server Error]', err);
    return res.status(500).json({ error: '서버 오류: ' + err.message });
  }
});

// ── 서버 시작 ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✦ Artemis 서버 가동 중: http://localhost:${PORT}`);
  console.log(`  API 키 상태: ${OPENAI_API_KEY ? '✓ 로드됨' : '✗ 없음 (.env 확인)'}`);
});
