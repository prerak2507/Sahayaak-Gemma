# Sahaayak: a civic desk that speaks Gujarati and runs on one machine

**Track: GenAI for Good**
## The problem

Rajkot Municipal Corporation serves roughly 1.6 million people. To report a dead
street light, a resident is expected to know it belongs to the electricity
department rather than PWD, and to file in English or Hindi through a portal.

Most people here write Gujarati, and a great many write it in Latin letters
because that is what the keyboard offers. "kalavad road par moto khado chhe" is
neither Gujarati script nor English, and it is how a real report arrives.

So reports go unfiled, because nobody learns an org chart to report a pothole,
and the ones filed land in the wrong queue and age there.

The fix is a model that reads what people actually write. The objection is that
a municipal corporation cannot put a per-token bill and a residents' complaint
database on a foreign API, and a ward office with a bad connection cannot depend
on one.

Gemma 4 removes it. A 6 GB open-weights model on the machine already in the
office reads all four ways people write here, decides what the report is, and
routes it. No key, no bill, no egress.

## What it does

A resident submits however they can: typed or romanized Gujarati, Hindi,
English, a photograph, a voice note, or WhatsApp. Then:

1. **Triage.** Gemma reads it in its original language and returns validity,
   language, title, a summary in English *and* in the resident's language,
   category, government or NGO, department, urgency, and a named place.
2. **Dispatch.** Gemma calls one of three tools: `dispatch_municipal_crew`,
   `escalate_emergency`, or `refer_to_ngo`, filling the arguments.
3. **Photo check.** Gemma confirms the image is real and shows what was described.
4. **Crew assignment.** Deterministic arithmetic against the RMC roster, not a
   model call.
5. **Closure.** Gemma checks the crew's photo shows the problem actually fixed.

## How Gemma 4 is used

**One client, two hosts.** `lib/gemma/client.ts` is the only code that talks to a
model. It speaks Ollama's `/api/chat` protocol, which local and hosted Ollama
implement identically, so moving between a ward office machine and a hosted
endpoint is one environment variable, not a second code path. Local goes first.

**Schema-constrained decoding, not JSON scraping.** The change that mattered
most. The predecessor asked a hosted model for JSON in prose then hunted for it:
strip fences, attempt a parse, fall back to `indexOf('{')` and `lastIndexOf('}')`,
then serve a canned object. That scraper was the largest source of wrong answers.
Gemma 4 accepts a JSON Schema and is constrained to conforming output during
decoding. We derive the schema from the same Zod object that validates the
result, so contract and parse target cannot drift. There is no regex JSON
extraction anywhere in this codebase.

**Native function calling for dispatch.** Routing is a choice between mutually
exclusive actions with different arguments and consequences, which is what tool
calling is for. The decision arrives typed. Escalation is a separate tool from
ordinary dispatch so that escalating a pothole is a visible mistake rather than
a field set to `true`.

**Multimodal.** Gemma 4 reads images on every variant, so the same local model
screens the photograph, cross-checks it against the resident's words, and later
verifies completion evidence. That cross-check is the anti-fraud control: it
stops one photograph being filed against six different streets.

**Multilingual reasoning, not translation-then-reasoning.** Nothing is
translated before it is understood. Translation exists only to show a resident
their report back and give a crew an English work order.

Model: `gemma4:e4b-it-qat`, 4.5B effective parameters, ~6.1 GB, fits a 6 GB
laptop GPU.

## Two things we deliberately did not let the model do

**Gemma never produces coordinates.** The original prompt asked the model for
latitude and longitude, and supplied example values in the prompt. A model that
is confidently wrong about a decimal place sends a crew to the wrong ward, and
there is no way to distinguish a hallucinated coordinate from a real one by
looking at it. Gemma now extracts a place *name* and a fixed gazetteer resolves
it. An unresolved name yields no coordinates, and the resident is asked to drop
a pin rather than being silently misplaced.

**Gemma never picks the individual technician.** It decides which department
owns a problem, a judgement call. Choosing who works tonight is arithmetic
against a roster, and deterministic, so the assignment can be explained to the
person who received it. The predecessor picked randomly among the top two, with
a comment saying this avoided assigning the same person during demonstrations.

## Failing honestly

Every AI route fails closed. If Gemma cannot answer, the route returns 5xx with
a machine-readable code and a message written for a resident. No route invents a
result.

This reverses the previous behaviour, and it is the change we would defend
hardest. Photo verification used to return `valid: true` on *every* failure
path, including a missing API key. An outage silently approved every submission
while the interface went on telling residents their report had been AI verified.
A verification that cannot fail is not a verification.

We removed the same pattern in four other places: a pre-written policy brief
proposing a ₹15 Crore fund whenever the drafting call failed, an impact narrative
of invented statistics presented as generated output, a demo route shipping
pre-written "AI routing reasons" in a fallback table, and a satellite dashboard
showing a green-cover percentage a text model had invented from coordinates.

Where a deterministic fallback genuinely helps, it is labelled. Every AI
response carries `_meta` naming the model and host that produced it, and
`_meta.source` is `'gemma'` for real inference or `'fallback'` otherwise.

## What was hard

**Audio was the disappointment.** Gemma 4's smaller variants carry a ~300M audio
encoder, so a Gujarati voice note could in principle be understood by the same
model that routes it. In practice, through Ollama v0.30.x, E4B returns empty or
hallucinated transcripts and `think: false` only partly helps (ollama#16584,
open), thinking mode yields empty responses on audio generally (ollama#16583),
and llama.cpp has not implemented Gemma 4 audio at all (llama.cpp#21334). Audio
also does not travel on `/api/chat`; the working path is the OpenAI-compatible
endpoint with an `input_audio` block.

We built it anyway, gated behind `GEMMA_AUDIO_ENABLED`, and kept a dedicated ASR
on the microphone by default. A resident holding a phone to their mouth in a
noisy street is the least forgiving moment in this product and should not depend
on an upstream bug being fixed. Gemma still does all the reasoning. When the bug
closes, one flag moves and a file becomes dead code.

**One field was carrying two meanings.** Every officer dashboard filtered on
`category === 'government'`, using the category field as a routing discriminator,
while the type system used the same field for the service taxonomy
(roads_potholes, water_supply). Both meanings could not hold at once, so a
Gemma-triaged report carrying a real taxonomy value was invisible on every
dashboard. `assignment_type` is now the only discriminator, and every writer goes
through one builder so a seeded report and a live one are the same shape.

**The public map was empty for the public.** It subscribed to Firestore from the
browser, so anonymous visitors hit the security rules and got permission-denied.
Public pages now read through a server route, so the browser never holds a
database credential and no rule had to be loosened.

**The geography was wrong in a way that was easy to miss.** The codebase had
been through a find-and-replace renaming Rajkot to Delhi, which changed the
strings and left the coordinates. The intake prompt mapped "Kalavad Road, Delhi"
to 22.2904, 70.7749, which is Rajkot. Anything trusting those labels was wrong
about which city it was in.

## Verifying the claim

Nothing has to be taken on trust. `npm run gemma:health` checks the host, the
model and a schema-constrained completion, using romanized Gujarati as its test
input. `/api/gemma/health?probe=1` runs a live inference and names what answered.
Every AI response carries `_meta` with the model and host that produced it.

Measured on an RTX 4050 with 6 GB: triage 9 to 12 seconds, dispatch 2 to 3,
about 12 for a full intake once the model is resident, and roughly 70 for the
first call while the weights load. Seeding the twenty demo reports takes about
210 seconds, because the seeder runs each one through the model rather than
writing finished records.

## Why this matters beyond the demo

The interesting property is not that a model can read Gujarati. It is that the
whole pipeline fits on hardware a municipal corporation already owns, under a
licence letting them run it forever without asking anyone. A ward office with a
bad connection and no cloud budget is the deployment, not the degraded case.

That is only true because the model is small enough, open enough and good enough
at once. It was not true a year ago.

**Repository:** [link] · **Live demo:** [link] · **Model:** `gemma4:e4b-it-qat`
via Ollama, Apache 2.0
