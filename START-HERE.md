# Start here

Read this the night before. It takes ten minutes and tells you what to read next.

---

## The one-sentence version

A resident in Rajkot types **`kalavad road par moto khado chhe`** and twelve
seconds later there is a routed municipal ticket with a named technician, decided
by a 6 GB open model running on the laptop with the wifi switched off.

If you remember nothing else, open with that sentence and turn off the network.

---

## Read in this order

| # | File | When | Why |
|---|---|---|---|
| 1 | **START-HERE.md** (this) | night before | orientation |
| 2 | **[docs/demo-runbook.md](docs/demo-runbook.md)** | night before, again on the morning | the checklist and the five-minute script |
| 3 | **[docs/CHEATSHEET.md](docs/CHEATSHEET.md)** | morning, then keep it open | one page, the answers to what judges ask |
| 4 | **[docs/PROJECT.md](docs/PROJECT.md)** | night before | the full argument, including why Gemma over anything else |
| 5 | [docs/gemma-integration.md](docs/gemma-integration.md) | if a judge goes deep | every model call, both boundaries |
| 6 | **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | before publishing a link | how Gemma works on a live URL, and WhatsApp |
| 7 | [docs/kaggle-writeup.md](docs/kaggle-writeup.md) | before submitting | the submission text, 1,499 words |

There is also a Word version of the project document:
**[docs/Sahaayak-Project-Overview.docx](docs/Sahaayak-Project-Overview.docx)**.

---

## The morning, in four commands

```bash
ollama serve
```

```bash
npm run gemma:health
```

Run that **twice**. The first call after Ollama starts takes about 70 seconds
while the weights load into VRAM. The second should be a few seconds. Do not let
a judge watch the first one.

```bash
npm run dev
```

```bash
npm run seed
```

Only reseed if the board looks stale. It takes about three and a half minutes
because it genuinely runs all twenty reports through Gemma.

Then confirm everything is alive:

```bash
npm run gemma:test
```

Twenty-one checks against the real model. If that says `21 passed`, the AI layer
is working. `npm run test:persist` proves changes save.

---

## What is real, and what is not

Judges will ask. Know the answer before they do.

### Real

- **Every AI decision.** Triage, routing, urgency, photo checks, translation,
  analysis. All Gemma 4, all local, verifiable with `/api/gemma/health?probe=1`.
- **The demo reports.** Twenty raw resident sentences, run through Gemma at seed
  time. The routing you see is the model's actual output, not something typed in.
- **Every change you make.** Status, department, crew, notes, resolutions,
  upvotes and volunteer status all save server side and survive a reload, with a
  history recording who did what.
- **Every figure on screen.** Counted from the reports themselves. There is no
  stored counter anywhere.
- **The volunteer roster.** Eight real records in the database, editable.
- **The spawn control.** On the officer dashboard, "Have Gemma file a report"
  makes the model write a resident's sentence which then goes through the
  ordinary intake pipeline. Press it twice, get two different incidents.
- **Storage without a cloud account.** `STORE_BACKEND=local` keeps everything in
  `.data/` as JSON. No Firebase needed, no quota to run out of, and the app
  genuinely works with the network off.

### Not real, and labelled as such

- **The public marketing pages** (`/government`, parts of `/impact-report`)
  contain sample figures showing the *format* of a report. They carry a visible
  "sample figures" label. Do not present them as live.
- **Speech-to-text** runs on a dedicated ASR, not Gemma. The Gemma audio path is
  built but switched off, because it is broken upstream. Section 6 of PROJECT.md
  has the bug links. Say this plainly if asked; it lands better than hedging.
- **Text-to-speech** is not a Gemma task at all.
- **Supply inventory and the reports screen** are layout placeholders with no
  data source. Both carry a visible "placeholder screen" banner.
- **Organisation verification and compliance scoring** are not implemented. The
  partners screen derives what is knowable from the roster and leaves the rest
  blank.

### Deliberately not automated

Say these out loud during the demo. They make the system look more trustworthy,
not less.

- Gemma never produces coordinates. It names a place; a fixed gazetteer resolves
  it; an unknown place asks the resident for a pin.
- Gemma never picks the individual technician. That is arithmetic against a
  roster, so the assignment can be explained to the person who got it.
- Gemma never issues a compliance verdict on an organisation.
- Gemma never estimates anything it would need an instrument to measure.

---

## The five-minute demo, in order

Full detail in [docs/demo-runbook.md](docs/demo-runbook.md). The shape:

1. **The sentence.** Show `kalavad road par moto khado chhe`. Ask what language
   it is. That is the problem statement.
2. **Turn off the wifi.** File it. Twelve seconds, routed ticket, named crew.
3. **Show a refusal.** Spam is refused. A light inside someone's bedroom is
   refused as private property. A system that accepts everything is not triaging.
4. **Show the escalation boundary.** Pothole gets a crew and a seven hour target.
   Live wire pages the control room. Same model, different judgement, delivered
   as a tool call.
5. **Show what it will not do.** The report naming an unknown housing society is
   stored asking for a pin, not dropped on the city centre.
6. **Change something.** Move a ticket, reload, show it stuck. Then show the
   history recording who changed it.
7. **Close on the economics.** Apache 2.0, 6 GB, the machine already on the desk,
   no per-token bill, no data leaving the building.

---

## If something breaks

| Symptom | Fix |
|---|---|
| `model not found` | `ollama pull gemma4:e4b-it-qat` |
| A call 500s with "llama-server process has terminated" | Out of VRAM. The client retries automatically. If it repeats, switch to `gemma4:e2b-it-qat` and set `GEMMA_LOCAL_MODEL` in `.env.local`. |
| Everything is slow | Something else is on the GPU. Close it, then re-warm with `npm run gemma:health`. |
| The map is empty | `curl localhost:3000/api/needs`. If that returns reports, reload the browser. |
| A dashboard shows zeroes | Same check. Public and dashboard reads both go through `/api/needs`. |
| Voice does nothing | Needs `SARVAM_API_KEY`. Typing works without it and nothing else is affected. |
| A change did not save | `npm run test:persist`. If that passes, it was the browser; reload. |
| Everything is empty after a restart | `npm run seed`, then `npm run seed:volunteers`. |

---

## Numbers worth memorising

| | |
|---|---|
| Model | `gemma4:e4b-it-qat`, 4.5B effective params, 6.1 GB, Apache 2.0 |
| Storage | local JSON in `.data/`. No cloud account needed. |
| Hardware | RTX 4050, 6 GB. It also runs on CPU, slowly. |
| Cold start | ~70 s, once |
| Full intake, warm | ~12 s |
| Translate, search, chat | 2 to 3 s |
| AI routes | 22, all on Gemma |
| Tests | 21 AI behaviours, 12 persistence checks, all passing |

---

## The two sentences to close on

> This is not interesting because a model can read Gujarati. It is interesting
> because the whole pipeline fits on hardware the corporation already owns, under
> a licence that lets them run it forever without asking anyone.
>
> That is only true because the model is small enough, open enough and good
> enough at once. It was not true a year ago.
