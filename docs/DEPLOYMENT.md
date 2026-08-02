# Running it live

The honest problem first: **a model running on your laptop is not reachable from
a server on the internet.** If you deploy this to Vercel as-is, every AI call
will try `http://localhost:11434`, find nothing, and return 503.

There are three ways to have a public URL judges can click. Pick by what you are
optimising for.

---

## Option 1: Ollama Cloud (recommended for the submission)

Ollama hosts Gemma 4, and `gemma4` is on their cloud model list. Their cloud API
speaks the same protocol as local Ollama, so **no code changes are needed** —
`lib/gemma/client.ts` already supports it.

1. Create a key at [ollama.com/settings/keys](https://ollama.com/settings/keys)
2. Set these on your host:

```
OLLAMA_API_KEY=your_key_here
GEMMA_DISABLE_LOCAL=true
GEMMA_CLOUD_MODEL=gemma4:cloud
STORE_BACKEND=local
```

`GEMMA_DISABLE_LOCAL=true` matters. Without it every request wastes time trying
localhost first and only then falls through.

**Trade-off, and be upfront about it in the pitch:** the deployed demo is not
running on the corporation's own hardware, so the offline and zero-cost
properties do not apply to that URL. It is still Gemma 4, still the same model
family, still Apache 2.0 weights. Say "the hosted demo runs the same model
through Ollama's cloud so you can click it; the local build is the real
deployment, and here it is with the wifi off."

That framing is stronger than pretending, and a judge will find out either way
from `/api/gemma/health`, which reports `host: cloud`.

---

## Option 2: A tunnel to your machine (best for a live demo)

Keeps the demo genuinely local. The public URL forwards to the laptop actually
running Gemma.

```bash
npm run dev
```

```bash
npx cloudflared tunnel --url http://localhost:3000
```

That prints a public `https://something.trycloudflare.com` address. Everything
runs on your hardware, so the offline claim stays true and `/api/gemma/health`
reports `host: local`.

**Trade-off:** it dies when you close the laptop. Fine for a judging session,
useless as a submission link that someone opens three days later.

---

## Option 3: Both

What we would actually do. Submit the Ollama Cloud URL as the permanent link so
it works whenever a judge opens it, and run the tunnel during the live demo so
you can turn the wifi off in front of them.

---

## What about the database?

Already solved. `STORE_BACKEND=local` keeps everything in `.data/` as JSON, so
the deployment needs no Firebase project at all.

This matters more than it sounds. During development the Firestore free tier ran
out of read quota and every screen emptied at once, because it bills per
document and the dashboards poll. A judge cloning the repository also has no
Firebase credentials, so without the local backend they would get a blank app.

On a serverless host the filesystem is ephemeral, so reports filed through the
public demo will not survive a cold start. For a judging session that is fine and
arguably desirable, since the board resets clean. If you want persistence on a
hosted deployment, set the Firebase variables instead and the store switches back
to Firestore with no code change.

---

## Deploying to Vercel

```bash
npx vercel --prod
```

Set in the Vercel dashboard, under Environment Variables:

| Variable | Value |
|---|---|
| `OLLAMA_API_KEY` | your Ollama Cloud key |
| `GEMMA_DISABLE_LOCAL` | `true` |
| `GEMMA_CLOUD_MODEL` | `gemma4:cloud` |
| `STORE_BACKEND` | `local` |
| `GEMMA_TIMEOUT_MS` | `60000` |
| `SARVAM_API_KEY` | optional, only enables voice |

Two things to check after deploying:

```bash
curl https://your-app.vercel.app/api/gemma/health?probe=1
```

Should report `active: cloud` and complete an inference. Then seed the board:

```bash
curl -X POST "https://your-app.vercel.app/api/dev/seed-needs?reset=1"
```

**Watch the function timeout.** Seeding twenty reports takes minutes, and
Vercel's hobby plan caps a function at 60 seconds. The seed route declares
`maxDuration = 900`, which needs a paid plan to be honoured. If seeding times
out, either seed a handful at a time or run the local build for the demo and use
the hosted URL only to prove the app exists.

---

## Which host is serving? Always checkable

```bash
curl localhost:3000/api/gemma/health
```

```json
{ "ok": true, "active": "local", "hosts": [ ... ] }
```

Every AI response also carries `_meta.host`, either `local` or `cloud`. Nothing
about this is hidden, which is the point: a judge asking "is this really local?"
gets a verifiable answer rather than a claim.

---

## WhatsApp intake

The bot cannot be deployed to a serverless host. `whatsapp-web.js` drives a real
Chrome session and needs a QR scan from the handset that will receive reports, so
it runs on a machine that stays on.

```bash
npm run dev
```

```bash
node scripts/whatsapp-bot.js
```

Scan the QR code with the phone you want to use as the intake number. Messages to
that number are then triaged by Gemma and filed through the same
`/api/ai/validate` endpoint the website uses, so a WhatsApp report and a web
report are indistinguishable once stored.

Set `APP_BASE_URL` if the app is not on `http://localhost:3000`.

Firebase is optional for the bot. Without it, reports still file normally;
telemetry logging and notifying a department lead over WhatsApp are the only
things that switch off.

**For a demo, be realistic about this one.** It needs a phone, a QR scan, and a
stable Chrome session. If the room's wifi is poor, show it from a recording
rather than gambling the live slot on it. The intake path itself is the same code
as the website, so nothing about the Gemma story depends on WhatsApp working on
the day.
