# Drafty's AI server (free, on Cloudflare)

The chat bubble on the site works on its own: it answers from the site's data. Connecting
this server makes it a real AI that understands any question, in any language.

It runs on **Cloudflare Workers** with **Workers AI**. The free plan includes 10,000 "Neurons"
a day (a few hundred chats with the default model) and resets at 00:00 UTC. On the free plan
nothing is ever charged: when the day's allowance is used up, the chat quietly switches back to
its built-in answers until the reset.

## Set it up (about 10 minutes, all in the browser)

1. **Create a free Cloudflare account** at dash.cloudflare.com. No card needed.
2. **Create the Worker:** in the dashboard open *Compute (Workers) → Workers & Pages →
   Create → Create Worker*. Name it `drafty` and click **Deploy**.
3. **Paste the code:** click **Edit code**, delete everything in `worker.js`, paste the whole of
   `worker/index.js` from this repository, and click **Deploy**.
4. **Connect the AI:** go back to the Worker → **Settings → Bindings → Add → Workers AI**.
   Variable name: `AI`. Save.
5. **Tell it where the site is:** **Settings → Variables and Secrets → Add**.
   Type *Text*, name `SITE_URL`, value `https://arclay2026.github.io/DraftStudio/`. Save and deploy.
6. **Copy the Worker's address** (shown at the top, like `https://drafty.yourname.workers.dev`).
7. **Connect the site:** in `js/data.js`, set `chatEndpoint: "https://drafty.yourname.workers.dev"`,
   then run `tools/bump.sh` and publish.

Open the site, ask Drafty something, and the answer now comes from the AI. The small note under
the chat changes to "AI answers can be wrong."

## Good to know

- **What it knows** comes from `chat-knowledge.json` on the site. `tools/bump.sh` rebuilds it
  from `js/data.js`, so new designs are known as soon as the site is published.
- **Only your site can use it:** requests from other websites are refused (it checks `SITE_URL`).
- **Limits per visitor:** 8 messages a minute and 40 a day, so one person can't use up the
  allowance. Change `LIMIT` at the top of `index.js`.
- **Change the AI model:** add a Text variable `MODEL` with any text model id from
  *AI → Workers AI → Models* in the dashboard (pick one marked as available on the free plan).
  Bigger models answer better but use the daily allowance faster.
- **See usage:** *AI → Workers AI* in the dashboard shows Neurons used per day.
- **If something breaks,** the site never shows an error: it falls back to the built-in answers.
