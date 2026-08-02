# Cheat sheet

One page. Keep it open during judging.

---

## The demo inputs, ready to paste

**The opener, romanized Gujarati:**
```
kalavad road par sharu ma moto khado chhe, kal raat e mari bike lapsi gai
```
→ `gu` · PWD · urgency 6 · Kalavad Road resolved · `dispatch_municipal_crew`, 7 h

**Escalation, Gujarati script:**
```
યાજ્ઞિક રોડ પર વીજળીનો તાર તૂટીને ફૂટપાથ પર પડ્યો છે અને તણખા ઝરે છે
```
→ `gu` · electricity · urgency 10 · `escalate_emergency`, control room paged

**Refused as spam:**
```
hello hello testing 123
```
→ `valid: false` · `spam_or_test`

**Refused as private property:**
```
mara ghar na bedroom ni light bandh thai gai chhe, aavo ne repair karo
```
→ `valid: false` · `private_property` · RMC maintains public assets

**Hindi:**
```
University road pe college ke saamne manhole ka dhakkan nahi hai
```
→ `hi` · drainage · urgency 7

**Location it will not guess:**
```
Aa shakti society na naka par thi gatar ubhrai chhe
```
→ stored with `needs_location_pin: true`, asks the resident for a pin

---

## Commands

```bash
npm run gemma:health     # run twice; warms the model
npm run dev
npm run seed             # ~3.5 min, reseeds through Gemma
npm run gemma:test       # 21 AI behaviours
npm run test:persist     # 12 persistence checks
```

Prove it is local, live, in front of them:
```bash
curl localhost:3000/api/gemma/health?probe=1
```

---

## Answers

**"Is it really running locally?"**
Turn off the wifi and file another report. Or hit `/api/gemma/health?probe=1`,
which names the host and model that served that exact request. Every AI response
carries `_meta` with the model and host.

**"Why Gemma and not GPT or Gemini?"**
Three reasons, in this order. A municipal corporation cannot put a residents'
complaint database and a per-token bill on a foreign API. A ward office with a
bad connection cannot depend on one being reachable. And Apache 2.0 means they
can run it forever without a licence negotiation. The technical fit is real too:
we need multilingual, structured output, tool calling and vision in one model, or
we are running two models and no longer fit on one machine.

**"Why not a bigger open model?"**
6.1 GB fits the machine already on the desk. A 27B model needs hardware a ward
office does not have and will not buy. The constraint is the product.

**"Is this just an API wrapper?"**
Three Gemma 4 capabilities are load-bearing. Schema-constrained decoding replaced
a JSON scraper that was the biggest source of wrong answers. Native tool calling
makes dispatch a typed decision instead of a parsed sentence. Vision lets the same
model check the photo. Remove any one and a specific feature breaks.

**"What happens when it is wrong?"**
Every route fails closed. Nothing is auto-approved. Photo verification returns an
error rather than passing. Autonomous dispatch below 0.8 confidence goes to a
human. And there are four things it is never allowed to do: produce coordinates,
pick the individual technician, issue a compliance verdict, or estimate anything
needing an instrument.

**"Does it do speech?"**
Not on Gemma yet, honestly. Gemma 4's smaller variants have an audio encoder and
the path is built, but it is broken through Ollama right now — E4B returns
hallucinated transcripts, llama.cpp has not implemented it. So a dedicated ASR
handles the microphone and Gemma does everything after the transcript. One flag
moves when the upstream bug closes.

**"How do I know the demo data is not staged?"**
The seeder stores raw resident sentences and runs them through Gemma at seed
time. Delete a record, re-run `npm run seed`, and watch the same decisions be
re-derived. Nothing in the database was typed by a developer.

**"Can I change something?"**
Yes. Move a ticket, reassign a department, close a job. Reload. It is still
there, with a history entry naming who changed it. Changing the department
automatically reassigns the crew, because the old crew belonged to the old
department.

**"What is not real?"**
The public marketing pages carry sample figures, labelled on screen. Speech-to-
text is not Gemma. Three leftover New Delhi records from an earlier version sit
in the shared database, scoped out of every read. That is the complete list.

---

## Numbers

| | |
|---|---|
| Model | `gemma4:e4b-it-qat` · 4.5B effective · 6.1 GB · Apache 2.0 |
| Cold start | ~70 s, once |
| Triage | 9-12 s · Dispatch 2-3 s · Full intake ~12 s |
| Translate / search / chat | 2-3 s |
| Slowest route | scheme analysis, 35-60 s. Do not demo it live. |
| Coverage | 22 AI routes · 21 AI tests · 12 persistence tests · all passing |

---

## Do not

- Do not demo before warming the model. The first call is 70 seconds.
- Do not demo scheme gap analysis live.
- Do not claim speech runs on Gemma.
- Do not present the marketing pages' sample figures as live data.
- Do not say "it never gets it wrong". Say what happens when it does.
