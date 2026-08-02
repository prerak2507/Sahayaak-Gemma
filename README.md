# Sahaayak

Civic reporting for Rajkot, in the language people actually speak, running on a
model that fits on the machine under the desk.

A resident describes a problem however they can — typed Gujarati, romanized
Gujarati, Hindi, English, a voice note, a photograph, or a WhatsApp message —
and Gemma 4 reads it, decides whether it is real, works out which Rajkot
Municipal Corporation department owns it, scores how dangerous it is, places it
on a ward map, and dispatches a crew. No cloud API key. No per-token cost. The
corporation's data never leaves the corporation's hardware.

Built for the Build With Gemma hackathon, GDG Cloud Rajkot, GenAI for Good track.

## The problem

Rajkot Municipal Corporation serves about 1.6 million people across six ward
zones. A resident who wants to report a broken street light has to know which
department owns street lights, has to file in English or Hindi through a portal,
and then has no idea whether anything happened.

Most people here write Gujarati. Many write Gujarati in Latin letters because
that is what the keyboard gives them. A working adult is not going to learn a
municipal org chart to report a pothole, and the corporation is not going to
staff a translation desk.

So the reports do not get filed, and the ones that do get filed land in the
wrong queue.

## What it does

**Understands the report in whatever language it arrives in.** "kalavad road par
moto khado chhe, bike lapsi gai" is romanized Gujarati, and it routes to PWD at
urgency 7 without anyone translating anything first.

**Routes it by calling a tool, not by guessing.** Gemma picks between
`dispatch_municipal_crew`, `escalate_emergency` and `refer_to_ngo` using Gemma
4's native function calling, and fills the arguments. The decision arrives typed.

**Looks at the photograph.** Gemma 4 is multimodal, so the same local model
checks that the picture is real, that it shows what the resident described, and
later that the crew's completion photo shows the problem actually fixed.

**Never invents where.** Gemma extracts a place *name*; a fixed gazetteer
resolves the coordinates. If the place is unknown, the resident is asked to drop
a pin rather than being silently misplaced.

**Runs offline.** The whole pipeline is one ~6 GB model on local hardware.

## Running it

You need Node 20+ and [Ollama](https://ollama.com).

```bash
git clone <this repo> && cd sahaayak-gemma
npm install
```

```bash
ollama pull gemma4:e4b-it-qat
```

```bash
cp .env.example .env.local
```

The defaults work as they are. Storage goes to `.data/` as JSON, so **no
Firebase account is required** and there is no quota to run out of. Set the
Firebase variables instead if you want Firestore.

`SARVAM_API_KEY` is optional and only enables voice; typing works without it.

Check the model layer before anything else:

```bash
npm run gemma:health
```

That confirms Ollama is up, the model is pulled, and it completes a
schema-constrained prompt — using romanized Gujarati as the test input. Then:

```bash
npm run dev
```

### Hardware

`gemma4:e4b-it-qat` is ~6.1 GB and fits a 6 GB GPU. On less VRAM use
`gemma4:e2b-it-qat` (~4.3 GB) by setting `GEMMA_LOCAL_MODEL`. Both handle text
and images. It runs on CPU too, just slowly.

If you would rather not run anything locally, set `OLLAMA_API_KEY` and the same
code path uses Ollama's hosted Gemma instead. Local is always tried first.

## How it is put together

Next.js 16 App Router, React 19, a pluggable store (local JSON by default,
Firestore when configured), Leaflet for the ward map. Four role surfaces behind one login: resident, volunteer, NGO, and
municipal officer.

The part that matters is `lib/gemma/`. One client, schema-constrained output,
native tool calling, multimodal input, and a hard rule that no route ever
invents a result when the model cannot answer.

[docs/gemma-integration.md](docs/gemma-integration.md) covers every call, both
places where the boundary is drawn deliberately, and the evidence behind the one
capability that is switched off.

```
lib/gemma/
  client.ts       the only thing that talks to a model
  structured.ts   schema-constrained decoding and tool choice
  civic.ts        triage: one sentence in, a routed ticket out
  dispatch.ts     function calling for the routing decision
  vision.ts       photo screening, cross-verification, completion checks
  language.ts     Gujarati, Hindi and English
  analytics.ts    city load, search, deployment
  ops.ts          forecasting, cascade risk, zone assessment
  policy.ts       scheme gap analysis
  assistant.ts    the officer-facing assistant
  audio.ts        Gemma speech input, gated (see the doc)
  health.ts       runtime probe
lib/geo/rajkot.ts the gazetteer that resolves place names to coordinates
lib/data/         RMC crew registry and department data
lib/speech/       the audio edges, and nothing else
```

## Loading the demo workload

Twenty raw resident reports, in Gujarati script, romanized Gujarati, Hindi and
English. Nothing is pre-triaged: the seeder runs each one through Gemma, so what
lands in the database is the model's real output.

```bash
npm run seed
npm run seed:volunteers
```

Takes about three and a half minutes. `curl localhost:3000/api/dev/seed-needs`
reports what is currently loaded.

## Verifying that it really runs on Gemma

```bash
npm run gemma:health     # host, model, and a live schema-constrained completion
npm run gemma:schemas    # every schema serialises to valid JSON Schema
npm run gemma:test       # 21 AI behaviours against the real model, nothing mocked
```

`gemma:test` asserts behaviour rather than status codes: that romanized Gujarati
is detected as `gu`, that a pothole routes to PWD, that a live wire escalates and
a pothole does not, that spam is refused, and that the assistant declines a
question its data cannot answer.

Every AI response also carries `_meta` naming the model and host that produced
it, and `/api/gemma/health?probe=1` runs a live inference and reports what
answered.

There is no hidden cloud call and no canned output dressed up as inference. If
the model is down, the route says so with a 5xx and the interface tells the
resident their report was not lost.

## Documentation

- **[docs/PROJECT.md](docs/PROJECT.md)** — the full picture: why this exists, how
  every part works, exactly how Gemma 4 is used, why Gemma over the alternatives,
  and how to explain it in five minutes. Also as a
  [Word document](docs/Sahaayak-Project-Overview.docx).
- [docs/gemma-integration.md](docs/gemma-integration.md) — technical detail of
  every model call and both deliberate boundaries
- [docs/demo-runbook.md](docs/demo-runbook.md) — demo checklist and failure recovery
- [DEPLOY-TO-VERCEL.md](DEPLOY-TO-VERCEL.md) — step-by-step Vercel deployment
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — the deployment options and their trade-offs, and the WhatsApp bot
- [docs/kaggle-writeup.md](docs/kaggle-writeup.md) — the submission text

## WhatsApp intake

`scripts/whatsapp-bot.js` accepts reports over WhatsApp for residents who will
never install anything. It runs against the same local Gemma.

```bash
node scripts/whatsapp-bot.js
```

Scan the QR code with the handset you want to receive reports on.

## Licence and credits

Gemma 4 is released by Google DeepMind under Apache 2.0.
