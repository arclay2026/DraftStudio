/* =====================================================================
   Drafty's AI server — a Cloudflare Worker
   The site's chat (js/chat.js) posts { lang, messages } here and gets back
   { reply }. Answers come from, in order:
     1. Groq (free tier, Llama 3.3 70B) when GROQ_API_KEY is set
     2. Cloudflare Workers AI (free daily allowance) when the AI binding is set
   If both are unavailable the site uses its built-in answers.
   What it knows comes from the site's own chat-knowledge.json, so new
   designs show up without touching this file. See worker/README.md.

   Settings (Cloudflare dashboard → the Worker → Settings):
     Variable  SITE_URL      https://arclay2026.github.io/DraftStudio/
     Secret    GROQ_API_KEY  your key from console.groq.com
     Variable  GROQ_MODEL    (optional) a Groq model id
     Binding   AI            (optional backup) Workers AI
     Variable  MODEL         (optional) a Workers AI text model id
   ===================================================================== */

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const LANGS = { en: "English", fr: "French", es: "Spanish", pt: "Portuguese", ar: "Arabic", zh: "Simplified Chinese" };
const LIMIT = { perMinute: 8, perDay: 40 };   // per visitor (rough: kept per server instance)

let knowledge = null, loadedAt = 0;
const hits = new Map();

export default {
  async fetch(request, env) {
    const site = (env.SITE_URL || "").replace(/\/?$/, "/");
    const origin = request.headers.get("Origin") || "";
    const allowed = site && origin && site.startsWith(origin);
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : site.replace(/^(https?:\/\/[^/]+).*$/, "$1"),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ ok: true, name: "Drafty" });
    if (!allowed) return json({ error: "origin" }, 403);

    // Light rate limit per visitor
    const ip = request.headers.get("CF-Connecting-IP") || "?";
    const now = Date.now(), day = Math.floor(now / 864e5);
    const h = hits.get(ip) || { day, n: 0, recent: [] };
    if (h.day !== day) { h.day = day; h.n = 0; }
    h.recent = h.recent.filter(t => now - t < 60e3);
    if (h.n >= LIMIT.perDay || h.recent.length >= LIMIT.perMinute) return json({ error: "busy" }, 429);
    h.n++; h.recent.push(now); hits.set(ip, h);
    if (hits.size > 5000) hits.clear();

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "bad request" }, 400);

    try {
      if (!knowledge || now - loadedAt > 10 * 60e3) {
        const r = await fetch(site + "chat-knowledge.json", { cf: { cacheTtl: 600 } });
        if (r.ok) { knowledge = await r.json(); loadedAt = now; }
      }
      const convo = [{ role: "system", content: systemPrompt(knowledge, LANGS[body.lang] || "the visitor's language") }, ...messages];
      const reply = (await askGroq(env, convo)) || (await askWorkersAI(env, convo));
      if (!reply) return json({ error: "ai" }, 503);
      return json({ reply });
    } catch (e) {
      // The site falls back to its built-in answers
      return json({ error: "ai" }, 503);
    }
  }
};

// Groq: free tier, OpenAI-style API. Returns "" when it's off, busy or out of quota.
async function askGroq(env, messages) {
  if (!env.GROQ_API_KEY) return "";
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.GROQ_MODEL || DEFAULT_GROQ_MODEL, messages, max_tokens: 450, temperature: 0.6 })
    });
    if (!r.ok) return "";
    const j = await r.json();
    return String(j.choices?.[0]?.message?.content || "").trim();
  } catch (e) { return ""; }
}

// Cloudflare Workers AI: the backup when Groq is unavailable
async function askWorkersAI(env, messages) {
  if (!env.AI) return "";
  try {
    const result = await env.AI.run(env.MODEL || DEFAULT_MODEL, { messages, max_tokens: 450, temperature: 0.5 });
    return String((result && (result.response ?? result.result?.response)) || "").trim();
  } catch (e) { return ""; }
}

function systemPrompt(k, lang) {
  const files = k ? k.files.map(f => `- ${f.id}: ${f.title} · ${f.category} · ${f.formats.join("/")} · ${f.price === "free" ? "free" : (f.sold ? "sold" : "exclusive, " + f.price)}${f.requires ? " · needs " + f.requires : ""} — ${f.description}`).join("\n") : "(file list unavailable)";
  const formats = k ? k.formats.map(f => `- ${f.ext}: ${f.what} Opens in ${f.opensIn.join(", ")}.`).join("\n") : "";
  return `You are Drafty, the friendly assistant on Draft Studio, a website of free design files (PSD mockups, vector logos, templates), colour palettes and a QR code designer called QR Code Studio.

Rules:
- Reply in ${lang}. Sound like a friendly, upbeat designer chatting with a friend: warm, natural and a little playful, never robotic. React to what the visitor says (their project, their business) before answering.
- Keep answers short: 1 to 3 short sentences, plain text, no headings or lists unless asked. An emoji now and then is fine, never more than one.
- Only talk about Draft Studio, its files and tools, and general design help (file formats, which app to use, colours, logos, mockups). Politely decline anything else.
- Never invent files, prices or features. If something isn't listed below, say it isn't on the site yet and suggest asking the team on WhatsApp for a custom design.
- To show cards in the chat, add tokens on their own line at the end of your reply (the site turns them into visuals; never explain them):
  [[file:ID]] for a design (ID from the list), [[palette:NAME]] for a palette,
  [[link:browse]] [[link:palettes]] [[link:qr]] [[link:license]] [[link:learn]] [[link:mockups]] [[link:logos]] for pages.
  Use at most 4 file, 3 palette and 2 link tokens.
- Free files need no sign-up and have no watermark. Exclusive (paid) logos are sold once, with full rights; buying happens on WhatsApp.

License: ${k ? k.license : ""}
Contact: WhatsApp ${k ? k.contact.whatsapp : ""}, email ${k ? k.contact.email : ""}

Designs on the site:
${files}

File formats:
${formats}

Palettes: ${k ? k.palettes.join(", ") : ""}`;
}
