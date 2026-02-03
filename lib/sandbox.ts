import { Sandbox } from "@vercel/sandbox";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";

const OPENCODE_PORT = 4096;
const OPENCODE_CORS = "*";

export async function createSandbox(gitUrl: string) {
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  const sandbox = await Sandbox.create({
    source: {
      type: "git",
      url: gitUrl.replace(/\.git$/, ""),
      username: "x-access-token",
      password: githubToken,
      depth: 1,
    },
    ports: [OPENCODE_PORT],
    timeout: 300000,
    runtime: "node22",
  });

  return {
    sandbox,
    sandboxId: sandbox.sandboxId,
  };
}

export async function waitForSandboxReady(sandboxId: string, timeoutMs = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const sandbox = await Sandbox.get({ sandboxId });
    const status = sandbox.status;

    if (status === "running") {
      return sandbox;
    }

    if (status === "failed" || status === "stopped") {
      throw new Error(`Sandbox failed to start (status: ${status})`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Sandbox timed out waiting to start");
}

export async function installOpenCode(sandbox: Sandbox) {
  const command = await sandbox.runCommand({
    cmd: "pnpm",
    args: ["i", "-g", "opencode-ai"],
  });

  const [stdout, stderr] = await Promise.all([
    command.stdout(),
    command.stderr(),
  ]);

  if (command.exitCode !== 0) {
    throw new Error(`Failed to install opencode: ${stderr}`);
  }

  return { stdout, stderr };
}

export async function configureOpenCode(sandbox: Sandbox) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  await sandbox.runCommand("mkdir", ["-p", ".opencode"]);

  const config = {
    provider: {
      anthropic: {
        apiKey: apiKey,
      },
    },
  };

  const configJson = JSON.stringify(config, null, 2);
  const configBase64 = Buffer.from(configJson).toString("base64");
  
  await sandbox.runCommand("sh", [
    "-c",
    `echo "${configBase64}" | base64 -d > .opencode/config.json`,
  ]);

  const envContent = `ANTHROPIC_API_KEY=${apiKey}`;
  const envBase64 = Buffer.from(envContent).toString("base64");
  
  await sandbox.runCommand("sh", [
    "-c",
    `echo "${envBase64}" | base64 -d > .env.opencode`,
  ]);
}

export async function startOpenCodeServer(sandbox: Sandbox) {
  await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      `set -a && source .env.opencode && set +a && opencode serve --port ${OPENCODE_PORT} --cors "${OPENCODE_CORS}"`,
    ],
    detached: true,
  });
}

export async function waitForOpenCodeServer(baseUrl: string, timeoutMs = 30000) {
  const client = createOpencodeClient({ baseUrl });
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const health = await client.global.health();
      if (health.data?.healthy) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error("OpenCode server not ready");
}

export function getSandboxDomain(sandbox: Sandbox, port: number) {
  return sandbox.domain(port);
}
