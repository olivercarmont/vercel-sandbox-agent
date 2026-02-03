import { NextRequest, NextResponse } from "next/server";
import { createSession, sendPrompt } from "@/lib/opencode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverUrl, prompt } = body;

    if (!serverUrl || !prompt) {
      return NextResponse.json(
        { error: "Server URL and prompt are required" },
        { status: 400 }
      );
    }

    const { sessionId } = await createSession(serverUrl, "Session");
    
    await sendPrompt(serverUrl, sessionId, prompt);

    return NextResponse.json({ sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
