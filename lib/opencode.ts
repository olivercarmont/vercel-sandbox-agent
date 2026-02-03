import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";

export async function createSession(baseUrl: string, title = "Session") {
  const client = createOpencodeClient({ baseUrl });
  const result = await client.session.create({ title });

  if (!result.data?.id) {
    throw new Error("Failed to create session");
  }

  return { sessionId: result.data.id };
}

export async function sendPrompt(
  baseUrl: string,
  sessionId: string,
  prompt: string,
  options?: {
    providerID?: string;
    modelID?: string;
  }
) {
  const client = createOpencodeClient({ baseUrl });
  await client.session.promptAsync({
    sessionID: sessionId,
    parts: [{ type: "text", text: prompt }],
    providerID: options?.providerID || "anthropic",
    modelID: options?.modelID || "claude-opus-4-5-20251101",
  } as Parameters<typeof client.session.promptAsync>[0]);
}

export async function* subscribeToEvents(baseUrl: string) {
  const client = createOpencodeClient({ baseUrl });
  const events = await client.global.event();

  for await (const event of events.stream) {
    yield event;
  }
}
