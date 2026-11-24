import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/api";
import { getPublishedProjects, getSiteContent } from "@/lib/content";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { localAnswer, systemPrompt } from "@/lib/assistant";

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20)
    .refine((m) => m[m.length - 1].role === "user", "Last message must come from the user"),
});

type ChatMessage = z.infer<typeof chatSchema>["messages"][number];
type Emit = (text: string) => void;
type Provider = {
  name: string;
  enabled: boolean;
  run: (system: string, messages: ChatMessage[], emit: Emit) => Promise<void>;
};

const PROVIDERS: Provider[] = [
  {
    name: "gemini",
    enabled: Boolean(process.env.GEMINI_API_KEY),
    async run(system, messages, emit) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Comma-separated list: if a model is overloaded (503) or retired, the next one is tried.
      const models = (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite,gemini-3.8-flash,gemini-3.5-flash")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
      let lastError: unknown;
      for (const model of models) {
        let started = false;
        try {
          const stream = await ai.models.generateContentStream({
            model,
            contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
            config: { systemInstruction: system, maxOutputTokens: 1500, temperature: 0.4 },
          });
          for await (const chunk of stream) {
            if (chunk.text) {
              started = true;
              emit(chunk.text);
            }
          }
          if (started) return;
        } catch (error) {
          if (started) throw error;
          console.warn(`[chat] gemini ${model} unavailable:`, (error as Error).message?.slice(0, 160));
          lastError = error;
        }
      }
      throw lastError ?? new Error("No Gemini model returned text");
    },
  },
  {
    name: "openai",
    enabled: Boolean(process.env.OPENAI_API_KEY),
    async run(system, messages, emit) {
      const client = new OpenAI();
      const stream = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        stream: true,
        max_tokens: 1200,
        temperature: 0.4,
        messages: [{ role: "system", content: system }, ...messages],
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) emit(delta);
      }
    },
  },
  {
    name: "claude",
    enabled: Boolean(process.env.ANTHROPIC_API_KEY),
    async run(system, messages, emit) {
      const client = new Anthropic();
      const stream = client.beta.messages.stream({
        model: "claude-opus-5-5",
        max_tokens: 4096,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages,
      });
      stream.on("text", emit);
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") throw new Error("refusal");
    },
  },
];

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const limit = await rateLimit(`chat:${clientIp(req)}`, 30, 60 * 10);
  if (!limit.ok) {
    return NextResponse.json({ error: "You're sending messages too quickly. Please wait a few minutes." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = chatSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Conversation must start with a user turn.
  const messages = parsed.data.messages.slice(parsed.data.messages.findIndex((m) => m.role === "user"));
  const question = messages[messages.length - 1].content;

  const [content, projects] = await Promise.all([getSiteContent(), getPublishedProjects()]);
  const providers = PROVIDERS.filter((p) => p.enabled);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      const emit: Emit = (text) => {
        sent = true;
        controller.enqueue(encoder.encode(text));
      };
      const system = providers.length ? systemPrompt(content, projects) : "";
      // Try each configured AI provider in order; the next one only runs if nothing was sent yet.
      for (const provider of providers) {
        try {
          await provider.run(system, messages, emit);
          if (sent) break;
        } catch (error) {
          console.error(`[chat] ${provider.name} failed:`, (error as Error).message?.slice(0, 300));
          if (sent) break;
        }
      }
      // Built-in answers from the portfolio content, so the visitor always gets a reply.
      if (!sent) emit(localAnswer(question, content, projects));
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
