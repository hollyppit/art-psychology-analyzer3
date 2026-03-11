export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Ensure OPENAI_API_KEY exists in Cloudflare Environment Variables
  const OPENAI_API_KEY = env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: "Server configuration error: Missing API Key" } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const requestData = await request.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { message: error.message || "An error occurred while proxying to OpenAI" } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
