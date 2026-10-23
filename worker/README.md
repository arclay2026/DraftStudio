# Drafty's AI server (free)

The chat bubble on the site works on its own: it answers from the site's data. Connecting this
server turns Drafty into a real AI that chats naturally, in any language.

- **Groq** (free, no card) gives the most human answers, using Llama 3.3 70B.
- **Cloudflare** (free, no card) runs the small server that keeps your Groq key secret.
- If Groq's free daily limit is reached, Cloudflare's own free AI takes over (optional). If both
  are out, Drafty uses its built-in answers. Visitors never see an error and nothing is ever charged.

## Setup (about 15 minutes)

### Part 1: Get a free Groq key

1. Go to **console.groq.com** and sign up (Google sign-in is fine).
2. In the left menu, open **API Keys** and click **Create API Key**.
3. Name it `drafty` and click **Submit**.
4. **Copy the key** (it starts with `gsk_`) and keep it somewhere safe for a few minutes.
   Groq shows it only once. Never paste it into the website's files or share it.

### Part 2: Create the server on Cloudflare

5. Go to **dash.cloudflare.com** and sign up (free, no card).
6. In the left menu open **Compute (Workers) → Workers & Pages**, click **Create**, then **Create Worker**
   (choose "Start with Hello World" if asked).
7. Name it `drafty` and click **Deploy**.
8. Click **Edit code**. Delete everything in the editor, paste the whole of `worker/index.js` from
   this repository, and click **Deploy** (top right).

### Part 3: Connect them

9. Go back to the Worker's page and open **Settings → Variables and Secrets**. Click **Add**:
   - Type **Secret**, name `GROQ_API_KEY`, value: the Groq key from step 4.
   - Click **Add** again. Type **Text**, name `SITE_URL`,
     value `https://arclay2026.github.io/DraftStudio/`
   - Click **Deploy**.
10. *(Optional backup)* **Settings → Bindings → Add → Workers AI**, variable name `AI`, then **Deploy**.
11. Copy the Worker's address from the top of its page. It looks like
    `https://drafty.your-name.workers.dev`

### Part 4: Switch the site over

12. Send that address to Claude, or set it yourself: in `js/data.js` change
    `chatEndpoint: ""` to `chatEndpoint: "https://drafty.your-name.workers.dev"`,
    run `tools/bump.sh` and publish.

Open the site and ask Drafty anything. The note under the chat box now says
"AI answers can be wrong."

## Checking it works

Open the Worker's address in your browser. It should show `{"ok":true,"name":"Drafty"}`.
That means the server is running. Chat requests only work from your own site.

## Good to know

- **What it knows** comes from `chat-knowledge.json` on the site. `tools/bump.sh` rebuilds it from
  `js/data.js`, so new designs are known as soon as the site is published.
- **Only your site can use it:** requests from other websites are refused (it checks `SITE_URL`).
- **Limits per visitor:** 8 messages a minute and 40 a day. Change `LIMIT` at the top of `index.js`.
- **Usage:** Groq's dashboard (**console.groq.com → Usage**) shows requests per day and your
  free-tier limits.
- **Another model:** add a Text variable `GROQ_MODEL` with any model id from Groq's **Models** page.
- **Lost or leaked key?** Delete it on Groq's API Keys page, create a new one, and update the
  `GROQ_API_KEY` secret in Cloudflare.
