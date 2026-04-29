"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, Send, Settings2, Trash2 } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const modelOptions = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

export default function ChatDashboardPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi — send a message to test streaming OpenAI responses."
    }
  ]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise, practical assistant for startup operators and software builders."
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const historyForApi = useMemo(
    () => messages.filter((message) => message.content.trim() && (message.role === "user" || message.role === "assistant")),
    [messages]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    const nextMessages: Message[] = [...historyForApi, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, systemPrompt, model }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error("Chat request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value, { stream: true });

        setMessages((current) => {
          const copy = [...current];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMessages((current) => {
        const copy = [...current];
        copy[copy.length - 1] = { role: "assistant", content: `Error: ${message}` };
        return copy;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content: "Conversation cleared. Send a new message to start again."
      }
    ]);
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <Settings2 className="h-6 w-6 text-cyan-300" />
            <div>
              <p className="text-sm text-neutral-400">Configuration</p>
              <h1 className="text-2xl font-bold">AI Chat Dashboard</h1>
            </div>
          </div>

          <label className="mt-6 block text-sm font-medium text-neutral-300">Model</label>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3"
          >
            {modelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label className="mt-5 block text-sm font-medium text-neutral-300">System prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            rows={8}
            className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3"
          />

          <div className="mt-5 rounded-2xl border border-white/10 bg-neutral-900 p-4 text-sm text-neutral-300">
            <p className="font-semibold text-white">Demo features</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Streaming responses</li>
              <li>Editable system prompt</li>
              <li>Conversation history</li>
              <li>Model selection UI</li>
            </ul>
          </div>
        </aside>

        <section className="flex min-h-[80vh] flex-col rounded-3xl border border-white/10 bg-white/5">
          <header className="flex items-center justify-between border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-300/10 p-3">
                <Bot className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Streaming chat</h2>
                <p className="text-sm text-neutral-400">Current model: {model}</p>
              </div>
            </div>

            <button onClick={clearChat} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-3xl rounded-3xl p-4 ${
                  message.role === "user"
                    ? "ml-auto bg-cyan-300 text-neutral-950"
                    : "mr-auto border border-white/10 bg-neutral-900 text-neutral-100"
                }`}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">{message.role}</p>
                <p className="whitespace-pre-wrap leading-7">{message.content || "..."}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-5">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask something..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 px-4 py-3"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/10"
                >
                  Stop
                </button>
              ) : (
                <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-cyan-200">
                  Send <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
