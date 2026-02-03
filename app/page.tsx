"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

interface LogEntry {
  type: "info" | "error" | "stdout" | "stderr" | "message";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: LogEntry["type"], content: string) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || !prompt.trim() || isRunning) return;

    setLogs([]);
    setIsRunning(true);

    try {
      addLog("info", `Starting sandbox for repository: ${repoUrl}`);

      const createRes = await fetch("/api/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gitUrl: repoUrl }),
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        throw new Error(error.error || "Failed to create sandbox");
      }

      const { sandboxId, serverUrl } = await createRes.json();
      addLog("info", `Sandbox created: ${sandboxId}`);
      addLog("info", `Server URL: ${serverUrl}`);

      addLog("info", "Sending prompt to OpenCode...");
      const promptRes = await fetch("/api/sandbox/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl, prompt }),
      });

      if (!promptRes.ok) {
        const error = await promptRes.json();
        throw new Error(error.error || "Failed to send prompt");
      }

      const { sessionId } = await promptRes.json();
      addLog("info", `Session created: ${sessionId}`);
      addLog("info", "Streaming response...");

      const eventSource = new EventSource(
        `/api/sandbox/stream?serverUrl=${encodeURIComponent(serverUrl)}&sessionId=${sessionId}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "complete") {
            addLog("info", "Completed successfully");
            eventSource.close();
            setIsRunning(false);
            return;
          }

          if (data.type === "error") {
            addLog("error", data.content);
            eventSource.close();
            setIsRunning(false);
            return;
          }

          if (data.type === "message") {
            addLog("message", data.content);
          }
        } catch (error) {
          console.error("Failed to parse event:", error);
        }
      };

      eventSource.onerror = () => {
        addLog("error", "Connection to server lost");
        eventSource.close();
        setIsRunning(false);
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", message);
      setIsRunning(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Vercel Sandbox Agent</h1>
        <p className={styles.description}>
          AI coding assistant with sandbox environments
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="repoUrl" className={styles.label}>
              GitHub Repository URL
            </label>
            <input
              id="repoUrl"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              disabled={isRunning}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="prompt" className={styles.label}>
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to accomplish..."
              disabled={isRunning}
              className={styles.textarea}
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isRunning || !repoUrl.trim() || !prompt.trim()}
            className={styles.button}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </form>

        {logs.length > 0 && (
          <div className={styles.logs}>
            <div className={styles.logsHeader}>Output</div>
            <div className={styles.logsContent}>
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`${styles.logEntry} ${styles[log.type]}`}
                >
                  <span className={styles.logTime}>
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={styles.logText}>{log.content}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
