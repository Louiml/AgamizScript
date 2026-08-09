const BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiRequest {
  apiKey: string;
  model: string;
  system?: string;
  prompt: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}

export interface GeminiStreamResponse {
  candidates?: {
    content?: { parts?: Array<{ text?: string }> };
  }[];
}

/**
 * Stream tokens from the Gemini API over SSE.
 * Throws an Error with a contextual message on non-2xx responses.
 */
export async function generateGeminiStream({
  apiKey,
  model,
  system,
  prompt,
  onDelta,
  signal,
}: GeminiRequest): Promise<string> {
  if (!apiKey) throw new Error("Gemini API key is not set.");

  const url = new URL(`${BASE}/${encodeURIComponent(model)}:streamGenerateContent`);
  url.searchParams.set("alt", "sse");
  url.searchParams.set("key", apiKey);

  const body = {
    contents: [
      ...(system
        ? [
            {
              role: "user",
              parts: [{ text: `[System instructions]\n${system}` }],
            },
          ]
        : []),
      { role: "user", parts: [{ text: prompt }] },
    ],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
    },
  };

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let message = `Gemini HTTP ${res.status}`;
    try {
      const json = JSON.parse(detail);
      message = json?.error?.message ?? message;
    } catch {
      message = detail || message;
    }
    throw new Error(message);
  }

  if (!res.body) throw new Error("Gemini returned an empty stream.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload) as GeminiStreamResponse;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          full += text;
          onDelta(text);
        }
      } catch {
        /* ignore malformed keepalive frames */
      }
    }
  }

  return full;
}