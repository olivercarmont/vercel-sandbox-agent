import { NextRequest, NextResponse } from "next/server";
import {
  createSandbox,
  waitForSandboxReady,
  installOpenCode,
  configureOpenCode,
  startOpenCodeServer,
  waitForOpenCodeServer,
  getSandboxDomain,
} from "@/lib/sandbox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gitUrl } = body;

    if (!gitUrl) {
      return NextResponse.json(
        { error: "Git URL is required" },
        { status: 400 }
      );
    }

    const { sandbox, sandboxId } = await createSandbox(gitUrl);
    
    await waitForSandboxReady(sandboxId);
    
    await installOpenCode(sandbox);
    
    await configureOpenCode(sandbox);
    
    await startOpenCodeServer(sandbox);
    
    const serverUrl = getSandboxDomain(sandbox, 4096);
    
    await waitForOpenCodeServer(serverUrl);

    return NextResponse.json({ sandboxId, serverUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
