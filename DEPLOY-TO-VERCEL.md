# Deploying to Vercel

Follow this top to bottom. About five minutes.

The repository is already on GitHub at
[prerak2507/Sahayaak-Gemma](https://github.com/prerak2507/Sahayaak-Gemma).

---

## Step 1: Get an Ollama Cloud key

Vercel cannot reach the Ollama running on your laptop, so the deployed site
needs a Gemma it can call over the internet. Ollama hosts `gemma4`.

1. Go to [ollama.com/settings/keys](https://ollama.com/settings/keys)
2. Sign in and create a key
3. Copy it, and **paste it only into Vercel and your local `.env.local`**. It
   does not need to go anywhere else.

---

## Step 2: Import the repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **prerak2507/Sahayaak-Gemma**
3. Leave the framework preset as Next.js and the build settings alone. Do not
   deploy yet, set the variables first.

---

## Step 3: Environment variables

Paste these into **Settings → Environment Variables**, for Production, Preview
and Development.

| Name | Value |
|---|---|
| `OLLAMA_API_KEY` | your key from step 1 |
| `GEMMA_DISABLE_LOCAL` | `true` |
| `GEMMA_CLOUD_ORIGIN` | `https://ollama.com` |
| `GEMMA_CLOUD_MODEL` | `gemma4:cloud` |
| `GEMMA_TIMEOUT_MS` | `55000` |
| `GEMMA_NUM_CTX` | `8192` |
| `STORE_BACKEND` | `local` |
| `NEXT_PUBLIC_STORE_BACKEND` | `local` |

Two of these matter more than they look:

- **`GEMMA_DISABLE_LOCAL=true`** stops every request wasting time trying
  `localhost:11434` before falling through to the cloud.
- **`GEMMA_TIMEOUT_MS=55000`** sits just under Vercel's 60 second function
  ceiling, so a slow call fails cleanly instead of being killed mid-response.

Do **not** set the Firebase variables. Leaving them out is what selects the
local file store, which needs no account and has no quota.

Optional: `SARVAM_API_KEY` if you want voice input. Everything else works
without it.

---

## Step 4: Deploy

Click Deploy. First build takes two or three minutes.

---

## Step 5: Check Gemma is actually answering

```bash
curl https://YOUR-APP.vercel.app/api/gemma/health?probe=1
```

You want `"active": "cloud"` and `"inference": { "ok": true }`.

If it reports `ok: false`, the key is wrong or `gemma4:cloud` is not available
on your Ollama account. The error text in the response says which.

---

## Step 6: Load the board

```bash
curl -X POST https://YOUR-APP.vercel.app/api/dev/quick-seed
```

Takes under a second and loads 18 reports plus 8 volunteers.

**Be straight about what this is.** Those 18 reports were triaged by
`gemma4:e4b-it-qat` in a real run and committed as a fixture, because running
the live seeder takes three and a half minutes and Vercel kills a function at
sixty seconds. Every record still carries the `ai_model` that produced it and is
marked `seed_mode: 'prebuilt'`.

Anything filed *after* that, including the spawn control, is triaged live by the
cloud model. To show that, open the officer dashboard and press **Have Gemma
file a report**.

---

## What the deployed site is and is not

Say this plainly if a judge asks, because it is checkable either way.

**It is** the same code, the same model family, the same prompts, the same
schema-constrained decoding and tool calling. `/api/gemma/health` will tell them
it is Gemma 4.

**It is not** running on the corporation's own hardware, so the offline and
zero-cost arguments do not apply to that URL. Those are properties of the local
build.

The strong version of the pitch uses both: *"here is the hosted demo so you can
click it, and here is the same thing on my laptop with the wifi off, which is
the deployment we are actually arguing for."*

---

## Running the real thing during the demo

Locally, nothing changes. `.env.local` keeps `GEMMA_DISABLE_LOCAL` unset, so the
local Ollama is used first and the cloud key is only a fallback.

```bash
npm run gemma:health     # run twice, the first call loads the weights
npm run dev
npm run seed             # the real seeder, live through your local Gemma
```

If you want a public URL pointing at your actual laptop:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

That URL runs genuinely local Gemma and will report `host: local`. It dies when
you close the laptop, which is fine for a judging session.

---

## Known limits on Vercel

**Reports do not survive a cold start.** The local file store writes to the
function's filesystem, which is ephemeral. For a judging session that is
arguably good, since the board resets clean. Re-run `quick-seed` if it looks
empty. If you want persistence, set the Firebase variables and the store
switches to Firestore with no code change.

**The live seeder will time out.** `/api/dev/seed-needs` needs several minutes.
Use `quick-seed` on Vercel and the real seeder locally.

**Cloud inference is slower than you expect on the first call.** Ollama Cloud
cold-starts too. Hit the health probe once before showing anyone.

**The WhatsApp bot cannot run on Vercel at all.** It drives a real Chrome
session and needs a QR scan, so it runs on a machine that stays on. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
