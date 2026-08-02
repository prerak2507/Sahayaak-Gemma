# Sahaayak

**Civic reporting for Rajkot, in the language people actually speak, running on
one machine.**

Build With Gemma Hackathon, GDG Cloud Rajkot · Track: GenAI for Good

This document is the complete picture: why the project exists, what it does, how
every part works, exactly how Gemma 4 is used, why Gemma and not something else,
and how to explain it to a judge in five minutes.

---

## 1. Why we built this

Rajkot Municipal Corporation serves about 1.6 million people across six ward
zones. Reporting a broken street light today requires a resident to know three
things: that street lights belong to the electricity department and not to PWD,
that there is a portal, and enough English or Hindi to fill it in.

Most people in Rajkot write Gujarati. A very large share write Gujarati in Latin
letters, because that is what the phone keyboard gives them.

> **kalavad road par moto khado chhe, bike lapsi gai**
>
> "There's a big pothole on Kalavad Road, my bike skidded."

That sentence is not Gujarati script. It is not English. It is not Hindi. It is
how a real complaint actually arrives, and no municipal portal in India accepts
it.

Two things follow, and both are quiet failures rather than loud ones:

1. **Most problems are never reported.** A working adult will not learn a
   municipal org chart to report a pothole. So the corporation's data
   under-represents exactly the wards with the least English.
2. **Reports that are filed land in the wrong queue.** A resident guesses the
   department, guesses wrong, and the ticket ages in a place nobody is watching.

The obvious fix is software that reads what people actually write. The obvious
objection, and the reason this does not already exist, is money and data: a
municipal corporation cannot put a residents' complaint database and a per-token
bill on a foreign API, and a ward office on a patchy connection cannot depend on
one being reachable.

**Gemma 4 removes the objection.** A 6 GB open-weights model, on the desktop
already sitting in the ward office, reads all four ways people write here,
decides what the report is, and routes it. No API key. No per-token cost. No data
leaving the building. Apache 2.0, so the corporation can run it forever without
asking anyone's permission.

---

## 2. What it does

A resident reports however they can: typed Gujarati, romanized Gujarati, Hindi,
English, a photo, a voice note, or WhatsApp. Then:

| Step | What happens | Who does it |
|---|---|---|
| 1. Triage | Reads the report in its original language. Returns validity, language, a title, an English summary for the crew, a native-script summary for the resident, category, government or NGO, department, urgency 1-10, and a named place. | **Gemma** |
| 2. Dispatch | Chooses and parameterises one of three real actions by calling it as a tool. | **Gemma** |
| 3. Photo check | Confirms the photo is real and shows what was described. | **Gemma** |
| 4. Location | Resolves the named place to coordinates. | **Gazetteer, not the model** |
| 5. Crew assignment | Picks the technician by skill match and historic completion rate. | **Arithmetic, not the model** |
| 6. Closure | Confirms the crew's completion photo shows the problem actually fixed. | **Gemma** |

### A worked example, measured on the demo machine

Input: `kalavad road par sharu ma moto khado chhe, kal raat e mari bike lapsi gai`

```
language              gu                    (romanized Gujarati, correctly not "en")
auto_title            કાલાવડ રોડ પર ખાડો અને સ્ટ્રીટ લાઇટ બંધ
summary               There is a large pothole on Kalavad Road which caused
                      the resident's bike to skid last night.
summary_native        કલાવડ રોડ પર રસ્તામાં મોટો ખાડો છે
category              roads_potholes
assigned_department   pwd
urgency_score         6
location              Kalavad Road → 22.2904, 70.7749   (from the gazetteer)
tool called           dispatch_municipal_crew(department=pwd, target_hours=7)
crew                  Karsan Bhai, Senior Pothole Technician,
                      matches on asphalt, closes 95% of assigned tickets
```

Total: about 12 seconds, entirely on a laptop GPU, with the network off.

---

## 3. How Gemma 4 is used

Every decision in this system is made by Gemma. There are 22 AI endpoints and
all of them go through one client.

### 3.1 One client, two hosts

`lib/gemma/client.ts` is the only code in the project that talks to a model. It
speaks Ollama's `/api/chat` protocol, which local Ollama and Ollama's hosted
models implement identically.

| | origin | auth | model |
|---|---|---|---|
| local | `http://localhost:11434` | none | `gemma4:e4b-it-qat` |
| cloud | `https://ollama.com` | bearer token | `gemma4:cloud` |

Local is always attempted first. The hosted path exists so a public demo works
for someone who has installed nothing; it is not the normal path. Switching is
one environment variable, not a second code path.

### 3.2 Structured output, which replaced a JSON scraper

This is the single most important technical change, and the clearest argument
for Gemma 4 specifically.

The predecessor asked a hosted model for JSON inside prose, then went hunting:

```js
// what this used to be
const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
try { return JSON.parse(cleaned); } catch {}
const start = cleaned.indexOf('{');
const end = cleaned.lastIndexOf('}');
if (start !== -1 && end > start) { /* try again */ }
return null; // then serve a canned object and hope
```

That scraper was the largest single source of wrong answers in the old system.

Gemma 4 accepts a JSON Schema and is **constrained during decoding** to emit
conforming output. We derive the schema from the same Zod object that validates
the result, so the prompt contract and the parse target are literally the same
definition and cannot drift.

```ts
const jsonSchema = z.toJSONSchema(req.schema, { target: 'draft-7' });
const result = await gemmaChat({ messages, format: jsonSchema, think: false });
const validated = req.schema.safeParse(JSON.parse(result.content));
```

**There is no regex JSON extraction anywhere in this codebase.**

### 3.3 Native function calling for dispatch

Routing is a choice between mutually exclusive actions with different arguments
and different consequences, which is exactly what tool calling is for. Gemma is
given three real actions and calls one:

- `dispatch_municipal_crew(department, crew_size, skills_required, target_hours)`
- `escalate_emergency(department, hazard, notify_control_room)`
- `refer_to_ngo(focus_area, volunteers_needed, time_sensitive)`

Escalation is a **separate tool** rather than a boolean field, deliberately. It
means escalating a pothole is a visibly wrong choice rather than a flag someone
set. Measured behaviour: a pothole gets `dispatch_municipal_crew` with a 7 hour
target; a live wire on a footpath gets `escalate_emergency` with the control room
paged.

### 3.4 Multimodal

Gemma 4 reads images on every variant, so the same local model that reads the
text also:

- screens the photo (`screenPhoto`)
- checks it against the resident's words (`crossVerifyPhoto`)
- verifies the crew's completion evidence (`verifySolutionPhoto`)

The middle one is the anti-fraud control. It is what stops one photograph being
filed against six different streets.

### 3.5 Multilingual reasoning, not translate-then-reason

Nothing is translated before it is understood. Gemma reads Gujarati as Gujarati.
Translation exists only to show a resident their own report back and to give a
crew an English work order.

The prompt carries a small Gujarati civic glossary, because the model initially
read *khado* (pothole) as "a large rock":

```
khado / khada = pothole or pit in the road, never a rock
gatar = sewer or drain, ubhrai chhe = it is overflowing
lapsi gai = skidded, futi gai = burst, tuti gai = broken
```

### 3.6 Every endpoint

| Route | What Gemma does |
|---|---|
| `ai/validate` | triage + dispatch, the core loop |
| `ai/verify-image` | screens attached photos |
| `ai/cross-verify-report` | photo against description, anti-fraud |
| `ai/verify-solution` | completion evidence before closing |
| `ai/re-verify` | re-check when a resident edits their text |
| `ai/translate` | Gujarati/Hindi/English, register-aware |
| `ai/search` | natural-language query to structured filter |
| `ai/radar` | city-wide situational read |
| `ai/ngo-insights` | NGO coordinator's morning brief |
| `ai/match` | ranks open needs for one volunteer |
| `ai/volunteer-scout` | deployment plan and skill gaps |
| `ai/autonomous-dispatch` | assigns without a coordinator, fenced |
| `ai/forecast` | relief supply projection with confidence |
| `ai/predictive-risk` | second-order failures from current load |
| `ai/predictive-weather` | weather reading to expected civic load |
| `ai/scheme-analysis` | scheme coverage gaps, and the policy brief |
| `ai/spatial-audit` | zone risk from supplied measurements |
| `ai/compliance-audit` | partner document review worklist |
| `ai/chat` | officer assistant, grounded in live figures |
| `ai/impact-narrative` | phrases real impact figures |
| `ai/stt` | Gemma audio path, flagged (see §6) |
| `ai/tts` | speech synthesis, not a Gemma task |

---

## 4. Why Gemma, and not anything else

This is the question a judge should ask, so here is the honest answer.

### Against a hosted frontier API

| | Hosted API | Gemma 4 local |
|---|---|---|
| Cost per report | per-token, forever | zero after download |
| Residents' complaint data | leaves the building | never leaves |
| Works on a bad connection | no | yes |
| Municipal procurement | a recurring foreign bill | a one-time download |
| Licence | terms can change | Apache 2.0 |

A municipal corporation is not a startup. It needs something it can budget once,
run on hardware it owns, and keep running when the vendor changes their pricing
or their terms. That is a governance requirement before it is a technical one.

### Against a smaller open model

The work here needs four capabilities **at the same time**, and that combination
is what narrows the field:

1. **Genuine multilingual competence**, including romanized Indic script. Most
   small models handle Gujarati poorly, and romanized Gujarati worse.
2. **Schema-constrained structured output.** Without it we are back to scraping
   JSON out of prose, which is what we replaced.
3. **Native function calling**, so dispatch is a typed invocation rather than a
   sentence to parse.
4. **Vision**, so the same model reads the photo.

A model with three of these forces a second model into the stack, which doubles
the memory footprint and defeats the purpose of fitting on one office machine.

### Against a larger open model

`gemma4:e4b-it-qat` is 6.1 GB and fits a 6 GB laptop GPU. That constraint is the
product. A 27B model needs hardware a ward office does not have and will not buy.
The interesting claim here is not "an AI can read Gujarati", it is "this runs on
the machine that is already on the desk".

### What Gemma 4 specifically gave us

- **E4B**: 4.5B effective parameters, 128K context, text and vision, ~6.1 GB at QAT
- **Apache 2.0**, so a public body can adopt it without a licence negotiation
- **Constrained decoding**, which deleted an entire class of parsing bug
- **Tool calling**, which made dispatch a typed decision
- **An audio encoder**, which is where we want to go next (§6)

---

## 5. What we deliberately do not let the model do

A judge will trust the system more, not less, for these limits.

**Gemma never produces coordinates.** The original prompt asked the model for
latitude and longitude and even supplied example values. A model confidently
wrong about a decimal place sends a crew to the wrong ward, and a hallucinated
coordinate is indistinguishable from a real one. Gemma now extracts a place
*name*; `lib/geo/rajkot.ts` resolves it against a fixed table. An unresolved name
yields no coordinates and the resident is asked to drop a pin.

**Gemma never picks the individual technician.** It decides which department owns
a problem, which is judgement. Choosing who works tonight is arithmetic against a
roster, and it is deterministic so the assignment can be explained to the person
who received it.

**Gemma never issues a compliance verdict.** An earlier version returned
`{ compliant: true, score: 85 }` for an NGO from a list of filenames. That is a
regulatory judgement about a real organisation and a model is not entitled to
make it. It now prepares a human reviewer's worklist.

**Gemma never estimates what it cannot see.** The satellite page used to display
a green-cover percentage produced by a text model given bare coordinates. It now
interprets measurements supplied to it, or reports low confidence.

**Status labels are derived, not asked for.** The model kept labelling a scheme
at 0% coverage as "adequate". Comparing a number to a threshold is arithmetic, so
the code does it.

---

## 6. Honest limitations

**Speech-to-text does not run on Gemma yet.** Gemma 4's E2B, E4B and 12B variants
carry a ~300M audio encoder, so a Gujarati voice note could in principle be
understood by the same model that routes it. In practice, through Ollama v0.30.x:

- E4B returns empty or hallucinated transcripts, and `think: false` only partly
  helps ([ollama#16584](https://github.com/ollama/ollama/issues/16584), open)
- thinking mode yields empty responses on audio input
  ([ollama#16583](https://github.com/ollama/ollama/issues/16583))
- llama.cpp has not implemented Gemma 4 audio at all
  ([llama.cpp#21334](https://github.com/ggml-org/llama.cpp/discussions/21334))

The path is built and gated behind `GEMMA_AUDIO_ENABLED`. By default a dedicated
ASR handles the microphone and **Gemma does everything after the transcript**.
When the upstream bug closes, one flag moves and a file becomes dead code.

**Text-to-speech is not a Gemma task.** Reading a municipal update aloud in
Gujarati needs a vocoder, which is a different kind of model.

**Some analysis routes are slow.** Scheme gap analysis takes 35 to 60 seconds
locally. Fine for a report an officer runs once a week, wrong for a live demo.

**Crew assignment ignores current workload.** Balancing across open tickets needs
live crew state the project does not hold, and rotating assignments randomly to
imitate balance would make dispatch unauditable.

---

## 7. Failing honestly

Every AI route fails closed. If Gemma cannot answer, the route returns 5xx with a
machine-readable code and a message written for a resident. **No route invents a
result.**

This reverses the predecessor's behaviour, and it is the change we would defend
hardest. Photo verification used to return `valid: true` on *every* failure path,
including a missing API key. An outage silently approved every submission while
the interface told residents their report had been AI verified. A verification
that cannot fail is not a verification.

We removed the same pattern in seven places:

| Where | What it did |
|---|---|
| photo verification | approved everything on any failure |
| `jury-demo` route | shipped pre-written "AI routing reasons" in a fallback table |
| policy brief | produced a ₹15 Crore funding proposal when the model failed |
| scheme analysis | a full 12-scheme report with invented percentages |
| impact narrative | four paragraphs of invented statistics as "generated" output |
| officer dashboard | injected 8 fake incidents, "never looks dead for the jury" |
| analytics | **always** merged 18 fabricated incidents into real data |

Every AI response now carries `_meta` naming the model and host that produced it,
and `_meta.source` is `'gemma'` for real inference or `'fallback'` otherwise.

---

## 8. Architecture

```
Resident (Gujarati / Hindi / English · text, photo, voice, WhatsApp)
        │
        ▼
   /api/ai/validate
        │
        ├── triageReport()      Gemma · schema-constrained
        ├── decideDispatch()    Gemma · native function calling
        ├── assignCrew()        deterministic arithmetic
        └── resolveLandmark()   fixed gazetteer
        │
        ▼
   buildNeedFromTriage()   ← the single writer everything goes through
        │
        ▼
   Firestore  ──►  /api/needs, /api/stats  ──►  every screen
```

**One writer.** Gemma triage, the seeder, WhatsApp and manual entry all call
`buildNeed`, so a seeded report and a live one are the same shape and appear
everywhere identically.

**One discriminator.** `assignment_type` decides government versus NGO.
`category` is only ever the service taxonomy. These were previously the same
field carrying both meanings, which made Gemma-triaged reports invisible on every
officer dashboard.

**Server-side reads.** Screens read through `/api/needs`, not from Firestore in
the browser. The rules deny client reads, so every dashboard was rendering zeroes
and covering it with fabricated data.

**Derived statistics.** Every figure is counted from the reports themselves.
There is no stored counter to drift.

---

## 9. Proving it is real

Nothing here needs to be taken on trust.

```bash
npm run gemma:health              # host, model, and a live constrained completion
node scripts/verify-schemas.mjs   # every schema serialises to valid JSON Schema
node scripts/test-ai-routes.mjs   # all 21 AI behaviours against the real model
curl localhost:3000/api/gemma/health?probe=1
```

`test-ai-routes.mjs` does not mock anything. Current state: **21 passed, 0
failed.** It asserts behaviour, not just HTTP 200 — that romanized Gujarati is
detected as `gu`, that a pothole routes to PWD, that a live wire escalates and a
pothole does not, that spam is refused, and that the assistant declines a
question its data cannot answer.

Measured on an RTX 4050, 6 GB:

| | |
|---|---|
| First call after startup | ~70 s (weights loading) |
| Triage, warm | 9 to 12 s |
| Dispatch, warm | 2 to 3 s |
| Translate, search, chat | 2 to 3 s |
| Full intake | ~12 s |
| Seeding 20 reports through the model | ~210 s |

---

## 10. How this solves the problem

| The problem | What changes |
|---|---|
| A resident must know the org chart | They describe the problem. Gemma picks the department. |
| Portals only accept English or Hindi | Gujarati, romanized Gujarati and Hindi are first-class. Nothing is translated before it is understood. |
| Reports age in the wrong queue | Routing and urgency happen at intake, in about 12 seconds. |
| Genuine emergencies queue behind cosmetic complaints | Escalation is a separate decision with its own channel. |
| Cloud AI is unaffordable and cannot hold citizen data | 6 GB model, corporation's own hardware, no egress, Apache 2.0. |
| A ward office has patchy internet | It runs offline. Verify by turning off wifi. |
| Nobody can tell if the "AI" did anything | Every response names the model and host that produced it. |
| One photo filed against six streets | Gemma cross-checks the photo against the words. |
| Tickets closed on bad evidence | Gemma checks completion photos before closing. |

---

## 11. Explaining it to a judge in five minutes

Do these in order. [docs/demo-runbook.md](demo-runbook.md) has the operational
detail, including warming the model first.

**Open with the sentence, not the architecture.** Show
`kalavad road par moto khado chhe`. Ask them what language it is. That is the
problem statement in one line.

**Turn off the wifi.** Then file it. Twelve seconds later there is a routed
ticket with a named technician. Nothing left the laptop.

**Show it refuse things.** `hello hello testing 123` is refused as spam. A broken
light inside someone's bedroom is refused as private property, because RMC
maintains public assets. A system that accepts everything is not triaging.

**Show the escalation boundary.** A pothole gets a crew and a 7 hour target. A
live wire on a footpath pages the control room. Same model, same prompt,
different judgement, and it is a tool call rather than a parsed sentence.

**Show what it will not do.** One seeded report names a housing society the
gazetteer does not know, and it is stored asking for a pin rather than dropped on
the city centre. This is the slide that separates a demo from a system.

**Close on the economics.** Apache 2.0, 6 GB, runs on the machine already in the
ward office, no per-token bill, no data leaving the building. That is why it can
actually be adopted, and it is only true because the model is small enough, open
enough and good enough at once. It was not true a year ago.

### Likely questions

**"Is it really local?"** Turn off the network and file another report. Or hit
`/api/gemma/health?probe=1`, which names the host and model that served it.

**"What if Gemma is wrong?"** Every route fails closed, nothing is auto-approved,
dispatch below the confidence floor goes to a human, and the model never picks a
technician or a coordinate.

**"Is this just a wrapper?"** Structured decoding, native tool calling and vision
are all load-bearing. Removing any one of them breaks a specific feature, and the
repo shows what the code looked like before each.

**"Does it do speech?"** Honestly: not on Gemma yet, and §6 says exactly why with
links to the open upstream bugs. A dedicated ASR handles the microphone and Gemma
does everything after the transcript.

---

## 12. Where the code is

```
lib/gemma/
  client.ts       the only code that talks to a model
  structured.ts   schema-constrained decoding and tool choice
  civic.ts        triage: one sentence in, a routed ticket out
  dispatch.ts     function calling for the routing decision
  vision.ts       photo screening, cross-verification, completion
  language.ts     Gujarati, Hindi, English
  analytics.ts    city load, search, deployment, volunteer choice
  ops.ts          forecasting, cascade risk, zone assessment
  policy.ts       scheme gap analysis and policy briefs
  assistant.ts    the officer assistant
  audio.ts        Gemma speech input, gated
  health.ts       runtime probe

lib/geo/rajkot.ts     gazetteer: names to coordinates
lib/data/needs.ts     the single need writer, scoping, derived stats
lib/data/demo-reports.ts   20 raw resident reports, untriaged
lib/speech/sarvam.ts  the audio edges, and nothing else

scripts/
  gemma-health.mjs      preflight
  verify-schemas.mjs    schema serialisation check
  test-ai-routes.mjs    21 behaviours against the real model
  whatsapp-bot.js       WhatsApp intake
```

Companion documents: [gemma-integration.md](gemma-integration.md) for the
technical detail, [demo-runbook.md](demo-runbook.md) for running the demo,
[kaggle-writeup.md](kaggle-writeup.md) for the submission text.
