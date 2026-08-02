# Demo runbook

Read this the morning of. It takes about ten minutes.

## Before you present

**1. Warm the model.** This is the single most important step. The first call
after Ollama starts takes about 70 seconds because the weights load into VRAM.
Every call after that takes 2 to 3 seconds. Do not let a judge watch the first one.

```bash
npm run gemma:health
```

Run it twice. The second run should report a few seconds, not seventy.

**2. Start the app.**

```bash
npm run dev
```

**3. Reseed if the board looks stale.** Takes about three and a half minutes,
because it genuinely runs all twenty reports through Gemma rather than writing
finished records.

```bash
curl -X POST "http://localhost:3000/api/dev/seed-needs?reset=1"
```

**4. Check what is actually in the database.**

```bash
curl http://localhost:3000/api/dev/seed-needs
```

Expect roughly 18 created and 2 rejected. Three New Delhi rows from the earlier
version of this platform are still in the shared Firebase project; every read is
scoped to Rajkot so they never surface, but you will see them in this listing.

## Measured on an RTX 4050, 6 GB

| | |
|---|---|
| Cold start, first call | ~70 s |
| Triage, warm | 9 to 12 s |
| Dispatch, warm | 2 to 3 s |
| Full intake, triage plus dispatch | ~12 s |
| Seeding twenty reports | ~210 s |

Twelve seconds is a long silence in front of an audience. Say what is happening
while it runs: it is reading Gujarati, choosing a department, and picking a crew,
on this laptop, with the network off.

## The five minute demo

**1. Show that it is local.** Turn off wifi. Everything below still works.

**2. File a report in romanized Gujarati.** This is the strongest single moment,
because it is neither Gujarati script nor English and no translation API is
involved.

```
kalavad road par sharu ma moto khado chhe, kal raat e mari bike lapsi gai
```

Point at the output: `language: gu`, an English summary for the crew, a Gujarati
summary for the resident, PWD, urgency, and Karsan Bhai the Senior Pothole
Technician by name.

**3. Show that it refuses things.** Two cases, both from the seed:

- `hello hello testing 123` becomes `spam_or_test`
- `mara ghar na bedroom ni light bandh thai gai chhe` becomes `private_property`,
  because RMC maintains public assets and that light is inside someone's house

**4. Show the escalation boundary.** A pothole gets `dispatch_municipal_crew`
with a seven hour target. A live wire on a footpath gets `escalate_emergency`
with the control room paged. Same model, same prompt, different judgement. That
is Gemma's native function calling choosing between real actions.

**5. Show that it will not guess a location.** One seeded report names a housing
society the gazetteer does not know. It is stored with `needs_location_pin` set
rather than being dropped on the city centre. Gemma extracts a place name; a
fixed table resolves coordinates; an unknown name asks the resident instead of
inventing a decimal place.

**6. Show it propagate.** File one report, then reload the homepage. The counters
move, the map gains a pin, the officer dashboard picks it up. Every figure on the
site is counted from the reports themselves, so nothing can disagree.

## If something breaks

**Model not found.** `ollama pull gemma4:e4b-it-qat`

**A call fails with a 500 and "llama-server process has terminated."** Out of
VRAM. The client retries three times with backoff and usually recovers. If it
keeps happening, drop to the smaller model, which has real headroom on a 6 GB
card:

```bash
ollama pull gemma4:e2b-it-qat
```

Then set `GEMMA_LOCAL_MODEL=gemma4:e2b-it-qat` in `.env.local` and restart.

**Everything is slow.** Something else is using the GPU. Close it, then
re-warm with `npm run gemma:health`.

**The map is empty.** Check `curl http://localhost:3000/api/needs`. If that
returns reports and the map does not show them, it is the browser, so reload.
Public pages read through the server precisely so Firestore rules cannot empty
them.

**Voice reporting does nothing.** It needs `SARVAM_API_KEY`. Without it, typing
still works and everything else is unaffected. Gemma does the reasoning either
way, so this costs you nothing except the microphone.

## Questions you will be asked

**"Is it really running locally?"** Turn off the network and file another report.
Or show `/api/gemma/health?probe=1`, which reports the host and model that served
the request. Every AI response carries `_meta` naming the model.

**"Why not just use a bigger hosted model?"** Cost and data. A municipal
corporation cannot put a residents' complaint database and a per-token bill on a
foreign API, and a ward office with a bad connection cannot depend on one. The
whole thing is Apache 2.0 and runs on hardware they already own.

**"What happens when Gemma is wrong?"** Every route fails closed and nothing is
auto-approved. Photo verification returns an error rather than passing. Dispatch
below the confidence floor goes to a human. Gemma never picks the individual
technician and never produces a coordinate.

**"Does it do speech?"** Gemma 4's smaller variants have an audio encoder, and
the path is implemented, but it is unreliable through Ollama today, so a
dedicated ASR handles the microphone and Gemma does everything after the
transcript. `docs/gemma-integration.md` cites the open upstream bugs.
