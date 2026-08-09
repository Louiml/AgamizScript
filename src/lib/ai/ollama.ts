export interface OllamaRequest {
  url: string;
  model: string;
  system?: string;
  prompt: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}

interface OllamaChunk {
  response?: string;
  done?: boolean;
  error?: string;
}

/** Stream tokens from a local Ollama `/api/generate` endpoint. */
export async function generateOllamaStream({
  url,
  model,
  system,
  prompt,
  onDelta,
  signal,
}: OllamaRequest): Promise<string> {
  const endpoint = `${url.replace(/\/$/, "")}/api/generate`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: system ? `${system}\n\n${prompt}` : prompt,
      stream: true,
      options: { temperature: 0.85 },
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status} — is the server running?`);

  const reader = res.body!.getReader();
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
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line) as OllamaChunk;
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.response) {
          full += chunk.response;
          onDelta(chunk.response);
        }
      } catch {
        /* skip partial frames */
      }
    }
  }

  return full;
}

/** Convenience: verify Ollama connectivity + list installed models. */
export async function ollamaModels(url: string): Promise<string[]> {
  const res = await fetch(`${url.replace(/\/$/, "")}/api/tags`);
  if (!res.ok) return [];
  const json = (await res.json()) as { models?: Array<{ name: string }> };
  return (json.models ?? []).map((m) => m.name);
}