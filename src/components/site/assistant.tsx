"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowUp, Mic, RotateCcw, Square, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

// ── Voice: text-to-speech + speech-to-text with the browser's Web Speech API ──
type Lang = "en" | "ur";

/** Turn chat Markdown into something pleasant to listen to. */
function speakable(md: string) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → label
    .replace(/https?:\/\/\S+/g, "") // bare URLs
    .replace(/[*_`#>]+/g, "")
    .replace(/^\s*(?:[-•]|\d+[.)])\s+/gm, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s*·\s*/g, ", ")
    .replace(/([^.!?:۔؟,\s])\s*\n+/g, "$1. ") // a pause at every line / list item
    .replace(/\s+/g, " ")
    .trim();
}

const ROMAN_URDU = /\b(hai|hain|ka|ki|ke|ko|aur|mein|main|kya|nahi|aap|unhe|unka|unki|woh|yeh|kar|karna|sakte|liye|bhi|se|hota|tha)\b/gi;

/** Which voice suits this text: Urdu script, Roman Urdu, or English. */
function detectLang(text: string): "ur" | "roman" | "en" {
  if (/[؀-ۿ]/.test(text)) return "ur";
  return (text.match(ROMAN_URDU)?.length ?? 0) >= 3 ? "roman" : "en";
}

function pickVoice(kind: "ur" | "roman" | "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const by = (prefix: string) => {
    const matches = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
    // Prefer natural/online voices, which sound far better than the legacy ones.
    return matches.find((v) => /natural|online|google/i.test(v.name)) ?? matches[0];
  };
  // Roman Urdu is read most naturally by a Hindi/Urdu voice; Urdu script needs Urdu (or Hindi).
  const order = kind === "ur" ? ["ur", "hi"] : kind === "roman" ? ["hi", "ur", "en-in", "en"] : ["en-us", "en-gb", "en"];
  for (const p of order) {
    const v = by(p);
    if (v) return v;
  }
  return null;
}

/** Split into sentence-sized chunks: Chrome cuts off long utterances. */
function chunks(text: string, max = 180) {
  const out: string[] = [];
  for (const s of text.match(/[^.!?۔؟\n]+[.!?۔؟]?/g) ?? [text]) {
    let rest = s.trim();
    while (rest.length > max) {
      const cut = rest.lastIndexOf(",", max) > 40 ? rest.lastIndexOf(",", max) + 1 : rest.lastIndexOf(" ", max);
      out.push(rest.slice(0, cut > 0 ? cut : max));
      rest = rest.slice(cut > 0 ? cut : max).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

// Minimal typing for the (still prefixed) SpeechRecognition API.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
const noopSubscribe = () => () => {};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const SUGGESTIONS = [
  "Who is Taha?",
  "What projects has he built?",
  "Tell me about the Atlassian AI Agent",
  "What are his skills?",
  "How can I hire him?",
  "Taha ki education kya hai?",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! 👋 I'm **Taha's AI**. I know everything on this portfolio: his projects, skills, experience and education. Ask me anything, in English or Urdu.",
};

/** The robot mascot. Pure SVG + CSS so it stays crisp and light. */
export function RobotAvatar({ className, talking }: { className?: string; talking?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("robot", talking && "robot-talking", className)} aria-hidden="true">
      <defs>
        <linearGradient id="robot-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-1)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <line x1="32" y1="6" x2="32" y2="15" stroke="url(#robot-head)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="6" r="4" fill="var(--accent-3)" className="robot-antenna" />
      <rect x="6" y="27" width="6" height="14" rx="3" fill="url(#robot-head)" opacity="0.8" />
      <rect x="52" y="27" width="6" height="14" rx="3" fill="url(#robot-head)" opacity="0.8" />
      <rect x="10" y="14" width="44" height="40" rx="14" fill="url(#robot-head)" />
      <rect x="15" y="21" width="34" height="22" rx="9" fill="#0b1122" />
      <g className="robot-eyes">
        <rect x="21" y="27" width="7" height="9" rx="3.5" fill="#7dd3fc" />
        <rect x="36" y="27" width="7" height="9" rx="3.5" fill="#7dd3fc" />
      </g>
      <rect x="25" y="47" width="14" height="3" rx="1.5" fill="#ffffff" opacity="0.7" className="robot-mouth" />
    </svg>
  );
}

// ── Minimal, safe Markdown: **bold**, [links](url), bullet lists, paragraphs ──
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) out.push(<strong key={k} className="font-semibold text-fg">{m[1]}</strong>);
    else {
      const href = m[3] ?? m[4];
      const label = m[2] ?? m[4];
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/.test(href);
      const external = /^https?:\/\//.test(href);
      out.push(
        safe ? (
          <a
            key={k}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-medium text-accent-1 underline decoration-accent-1/40 underline-offset-2 hover:decoration-accent-1"
          >
            {label}
          </a>
        ) : (
          label
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={key} className="my-1.5 list-disc space-y-1 pl-5 marker:text-accent-1">
        {bullets.map((b, i) => (
          <li key={i}>{inline(b, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  text.split("\n").forEach((line, i) => {
    const b = line.match(/^\s*[-*•]\s+(.*)$/) ?? line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (b) return void bullets.push(b[1]);
    flush(`ul-${i}`);
    const heading = /^#{1,6}\s+/.test(line);
    const clean = line.replace(/^#{1,6}\s+/, "");
    if (clean.trim())
      blocks.push(
        <p key={`p-${i}`} className={heading ? "mb-1 mt-3 font-semibold text-fg" : "my-1"}>
          {inline(clean, `p-${i}`)}
        </p>,
      );
  });
  flush("ul-end");
  return <Fragment>{blocks}</Fragment>;
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Voice state
  const [voiceOn, setVoiceOn] = useState(true);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [micLang, setMicLang] = useState<Lang>("en");
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const sendRef = useRef<(text: string) => void>(() => {});
  // Feature detection without a hydration mismatch (the server always reports "unsupported").
  const canSpeak = useSyncExternalStore(noopSubscribe, () => "speechSynthesis" in window, () => false);
  const canListen = useSyncExternalStore(noopSubscribe, () => getRecognition() !== null, () => false);

  // Voices load asynchronously in Chrome; ask early so they're ready for the first reply.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const prime = () => window.speechSynthesis.getVoices();
    prime();
    window.speechSynthesis.addEventListener("voiceschanged", prime);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", prime);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
  }, []);

  const speak = useCallback((md: string, idx: number) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const text = speakable(md);
    if (!text) return;
    const kind = detectLang(text);
    const voice = pickVoice(kind);
    // Urdu script can only be read by an Urdu (or Hindi) voice; Chrome on Windows often has neither.
    if (kind === "ur" && !voice) {
      setVoiceNote("Urdu voice isn't available in this browser. Open the site in Microsoft Edge to hear Urdu replies.");
      return;
    }
    setVoiceNote(null);
    const parts = chunks(text);
    setSpeakingIdx(idx);
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = kind === "en" ? "en-US" : "ur-PK";
      }
      u.rate = kind === "en" ? 1.03 : 0.95;
      if (i === parts.length - 1) {
        u.onend = () => setSpeakingIdx((cur) => (cur === idx ? null : cur));
        u.onerror = () => setSpeakingIdx((cur) => (cur === idx ? null : cur));
      }
      synth.speak(u);
    });
  }, []);

  const toggleListening = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Rec = getRecognition();
    if (!Rec) return;
    stopSpeaking();
    const rec = new Rec();
    rec.lang = micLang === "ur" ? "ur-PK" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText.trim()) sendRef.current(finalText);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  // Show a small "Ask me" bubble once, a few seconds after load.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("assistant-teaser") === "1";
    } catch {}
    if (seen) return;
    const show = setTimeout(() => setTeaser(true), 2500);
    const hide = setTimeout(() => setTeaser(false), 11000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem("assistant-teaser", "1");
    } catch {}
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      setInput("");
      const history = [...messages, { role: "user" as const, content: question }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setBusy(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const setReply = (content: string) =>
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content }]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The greeting is UI-only; send the real conversation (last 12 turns).
          body: JSON.stringify({ messages: history.filter((m) => m !== GREETING && m.content).slice(-12) }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const err = (await res.json().catch(() => null)) as { error?: string } | null;
          setReply(err?.error ?? "Sorry, something went wrong. Please try again.");
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setReply(acc);
        }
        if (!acc.trim()) setReply("Sorry, I couldn't come up with an answer. Please try rephrasing.");
        else if (voiceOn) speak(acc, history.length);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setReply("Network error. Please check your connection and try again.");
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, voiceOn, speak],
  );

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const reset = () => {
    abortRef.current?.abort();
    stopSpeaking();
    setMessages([GREETING]);
    setBusy(false);
  };

  const showSuggestions = messages.length === 1;

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-5 right-5 z-50 flex items-end gap-3 sm:bottom-6 sm:right-6">
        <div
          className={cn(
            "glass pointer-events-none mb-3 hidden max-w-[220px] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-fg shadow-xl transition-all duration-500 sm:block",
            teaser && !open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          aria-hidden="true"
        >
          Hi! Ask me anything about Taha&apos;s work 🤖
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close Taha's AI assistant" : "Open Taha's AI assistant"}
          aria-expanded={open}
          aria-controls="taha-assistant"
          className={cn(
            "group relative grid size-16 place-items-center rounded-full border border-line-strong bg-bg-elevated shadow-[0_10px_40px_-8px_var(--glow)] transition duration-300 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            !open && "robot-float",
          )}
        >
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--accent-1),var(--accent-2),var(--accent-3),var(--accent-1))] opacity-60 blur-md transition group-hover:opacity-90" />
          <span className="relative grid size-full place-items-center rounded-full bg-bg-elevated">
            {open ? <X className="size-6 text-fg" /> : <RobotAvatar className="size-11" />}
          </span>
          {!open ? (
            <span aria-hidden="true" className="absolute right-0.5 top-0.5 size-3.5 rounded-full border-2 border-bg-elevated bg-[var(--success)]" />
          ) : null}
        </button>
      </div>

      {/* Panel */}
      <section
        id="taha-assistant"
        role="dialog"
        aria-label="Taha's AI assistant"
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-3 bottom-24 z-50 flex max-h-[min(640px,calc(100dvh-7.5rem))] flex-col overflow-hidden rounded-3xl border border-line-strong bg-bg-elevated shadow-2xl transition-all duration-300 sm:inset-x-auto sm:right-6 sm:w-[400px]",
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0",
        )}
        {...(!open ? { inert: true } : {})}
      >
        <header className="relative flex items-center gap-3 overflow-hidden border-b border-line px-4 py-3.5">
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--accent-1)_18%,transparent),color-mix(in_oklab,var(--accent-2)_18%,transparent))]" />
          <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-bg ring-1 ring-line">
            <RobotAvatar className="size-9" talking={busy || speakingIdx !== null} />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="font-semibold leading-tight text-fg">Taha&apos;s AI</p>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-[var(--success)]" />{" "}
              {listening ? "Listening…" : busy ? "Typing…" : speakingIdx !== null ? "Speaking…" : "Talks in English & Urdu"}
            </p>
          </div>
          {canSpeak ? (
            <button
              type="button"
              onClick={() => {
                if (voiceOn) stopSpeaking();
                setVoiceOn((v) => !v);
              }}
              className={cn(
                "relative grid size-9 place-items-center rounded-xl transition hover:bg-surface",
                voiceOn ? "text-accent-1" : "text-muted hover:text-fg",
              )}
              aria-pressed={voiceOn}
              aria-label={voiceOn ? "Turn voice replies off" : "Turn voice replies on"}
              title={voiceOn ? "Voice on" : "Voice off"}
            >
              {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="relative grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-fg"
            aria-label="Start a new conversation"
            title="New conversation"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="relative grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-fg"
            aria-label="Close assistant"
          >
            <X className="size-4" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-bg ring-1 ring-line">
                  <RobotAvatar className="size-6" talking={speakingIdx === i} />
                </span>
                <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-muted ring-1 ring-line">
                  {m.content ? (
                    <>
                      <Markdown text={m.content} />
                      {canSpeak && !(busy && i === messages.length - 1) ? (
                        <button
                          type="button"
                          onClick={() => (speakingIdx === i ? stopSpeaking() : speak(m.content, i))}
                          className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-medium text-subtle transition hover:bg-bg hover:text-accent-1"
                          aria-label={speakingIdx === i ? "Stop speaking" : "Read this answer aloud"}
                        >
                          {speakingIdx === i ? <Square className="size-3 fill-current" /> : <Volume2 className="size-3.5" />}
                          {speakingIdx === i ? "Stop" : "Listen"}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <span className="flex gap-1 py-1.5" aria-label="Thinking">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="size-2 animate-bounce rounded-full bg-accent-1" style={{ animationDelay: `${d * 120}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] px-3.5 py-2.5 text-sm leading-relaxed text-white">
                  {m.content}
                </div>
              </div>
            ),
          )}
          {showSuggestions ? (
            <div className="flex flex-wrap gap-2 pl-10">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent-1 hover:text-fg"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {voiceNote ? (
          <p role="status" className="flex items-start gap-2 border-t border-line bg-[color-mix(in_oklab,var(--accent-2)_10%,transparent)] px-4 py-2 text-xs text-muted">
            <VolumeX className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{voiceNote}</span>
            <button type="button" onClick={() => setVoiceNote(null)} aria-label="Dismiss" className="text-subtle hover:text-fg">
              <X className="size-3.5" />
            </button>
          </p>
        ) : null}
        {canListen ? (
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 pt-2.5 text-xs text-subtle">
            <span>Voice input language</span>
            <div role="radiogroup" aria-label="Voice input language" className="flex rounded-lg bg-bg p-0.5 ring-1 ring-line">
              {(["en", "ur"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={micLang === l}
                  onClick={() => setMicLang(l)}
                  disabled={listening}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition",
                    micLang === l ? "bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-white" : "text-muted hover:text-fg",
                  )}
                >
                  {l === "en" ? "English" : "اردو"}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className={cn("flex items-end gap-2 p-3", !canListen && "border-t border-line")}
        >
          <label htmlFor="assistant-input" className="sr-only">
            Ask about Taha
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={listening ? (micLang === "ur" ? "بولیں… سن رہا ہوں" : "Listening… speak now") : "Ask about projects, skills, experience…"}
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-subtle focus:border-accent-1 focus:outline-none"
          />
          {canListen ? (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggleListening}
                disabled={busy}
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : `Speak your question (${micLang === "ur" ? "Urdu" : "English"})`}
                title={listening ? "Stop" : "Speak"}
                className={cn(
                  "relative grid size-11 place-items-center rounded-2xl border transition disabled:opacity-40",
                  listening
                    ? "border-transparent bg-red-500 text-white"
                    : "border-line bg-bg text-muted hover:border-accent-1 hover:text-fg",
                )}
              >
                {listening ? <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-2xl bg-red-500/40" /> : null}
                <Mic className="relative size-5" />
              </button>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <ArrowUp className="size-5" />
          </button>
        </form>
      </section>
    </>
  );
}
