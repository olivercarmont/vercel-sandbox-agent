import { NextRequest } from "next/server";
import { subscribeToEvents } from "@/lib/opencode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serverUrl = searchParams.get("serverUrl");
  const sessionId = searchParams.get("sessionId");

  if (!serverUrl || !sessionId) {
    return new Response("Missing serverUrl or sessionId", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const event of subscribeToEvents(serverUrl)) {
          const payload = event.payload;

          if (payload.type === "message.updated") {
            const info = payload.properties.info as {
              id: string;
              sessionID: string;
              role: string;
            };
            
            if (info.sessionID === sessionId && info.role === "assistant") {
              continue;
            }
          }

          if (payload.type === "message.part.updated") {
            const part = payload.properties.part as {
              id: string;
              messageID: string;
              sessionID: string;
              type: string;
              text?: string;
            };

            if (part.sessionID === sessionId && part.type === "text" && part.text) {
              send({ type: "message", content: part.text });
            }
          }
        }

        send({ type: "complete" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", content: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
