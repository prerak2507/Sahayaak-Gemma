# Where Gemma sits

Every decision Sahaayak makes is made by Gemma 4. This document says exactly
which call does what, why it is shaped that way, and where the boundaries are.

## One client, two hosts

`lib/gemma/client.ts` is the only thing in the codebase that talks to a model.
It speaks Ollama's `/api/chat` protocol, which local Ollama and Ollama's hosted
models both implement identically. So there is one code path, and the choice of
where inference happens is an environment variable:

| | origin | auth | model |
|---|---|---|---|
| local | `http://localhost:11434` | none | `gemma4:e4b-it-qat` |
| cloud | `https://ollama.com` | bearer token | `gemma4:cloud` |

Local is always attempted first. The hosted host exists so a public demo works
for someone who has not installed anything, not as the normal path. A
corporation running this on its own hardware never sends a resident's report
anywhere.

`gemma4:e4b-it-qat` is ~6.1 GB and fits a 6 GB GPU. On less VRAM,
`gemma4:e2b-it-qat` is ~4.3 GB. Both read text and images.

## What each call does

### Triage — `lib/gemma/civic.ts`

The core of the product. One messy sentence in, a routed municipal ticket out:
validity, language, title, summary in English and in the resident's own
language, category, government or NGO, department, urgency, and a named place.

Schema-constrained, with thinking on, because routing and urgency are judgement
calls rather than extraction.

### Dispatch — `lib/gemma/dispatch.ts`

Native function calling. Gemma is given three real actions and calls one:

- `dispatch_municipal_crew(department, crew_size, skills_required, target_hours)`
- `escalate_emergency(department, hazard, notify_control_room)`
- `refer_to_ngo(focus_area, volunteers_needed, time_sensitive)`

The decision arrives already typed. Nothing parses a sentence to work out what
the model meant.

Picking the individual technician inside the chosen department is *not* a model
call. `lib/data/rmc-workers.ts` scores the roster arithmetically and
deterministically, so an assignment can be explained to the person who received
it. Gemma decides which department owns a problem; it does not decide who works
tonight.

### Photographs — `lib/gemma/vision.ts`

Gemma 4 is multimodal on every variant, so the same local model that reads the
text looks at the photo.

- `screenPhoto` — is this a real photograph of a civic problem
- `crossVerifyPhoto` — does the photo show what the resident actually described
- `verifySolutionPhoto` — does the crew's photo show the problem fixed

The second is the anti-fraud check: it is what stops one photograph being filed
against six different streets.

### Language — `lib/gemma/language.ts`

Residents write Gujarati, Hindi, English, and Gujarati in Latin script, often
mixed in one sentence. Gemma reads all of it directly. Nothing is translated
before it is understood.

Translation exists only to show a resident their own report back and to give a
crew an English work order.

### Analysis — `analytics.ts`, `ops.ts`, `policy.ts`, `assistant.ts`

City load, search parsing, volunteer deployment, resource forecasting, cascade
risk, weather-driven load, zone assessment, partner document review, scheme gap
analysis, and the officer-facing assistant.

## Structured output, not JSON scraping

The version of this platform that ran on a hosted API asked for JSON in prose
and then went looking for it: strip markdown fences, try a parse, fall back to
`indexOf('{')` and `lastIndexOf('}')`, then serve a canned object. That scraper
was the single largest source of wrong answers.

Gemma 4 accepts a JSON Schema and is constrained to conforming output during
decoding. `lib/gemma/structured.ts` derives the schema from the same Zod object
used to validate the result, so the prompt contract and the parse target cannot
drift. There is no regex JSON extraction anywhere in this codebase.

## The two boundaries

**Gemma does not produce coordinates.** It extracts a place *name*, and
`lib/geo/rajkot.ts` resolves it against a fixed gazetteer. A model that is
confidently wrong about a decimal place sends a crew to the wrong ward, and
there is no way to tell a hallucinated coordinate from a real one by looking at
it. An unresolved name produces no coordinates and the resident is asked to drop
a pin.

**Gemma does not touch the microphone or the speaker.** `lib/speech/sarvam.ts`
converts sound to text and back, and does nothing else. Between the transcript
and the spoken reply, everything is Gemma.

### Why speech is not on Gemma yet

Gemma 4's E2B, E4B and 12B variants carry a ~300M audio encoder, so in principle
a Gujarati voice note could be understood by the same model that routes it. The
path is implemented in `lib/gemma/audio.ts` and gated behind
`GEMMA_AUDIO_ENABLED`, because as of Ollama v0.30.x:

- E4B returns empty or hallucinated transcripts, and `think: false` only partly
  mitigates it ([ollama#16584](https://github.com/ollama/ollama/issues/16584))
- thinking mode yields empty responses on audio input generally
  ([ollama#16583](https://github.com/ollama/ollama/issues/16583))
- llama.cpp has not implemented Gemma 4 audio at all
  ([llama.cpp#21334](https://github.com/ggml-org/llama.cpp/discussions/21334)),
  so non-Ollama backends cannot serve it
- 12B with thinking disabled is the variant reported to behave

Audio also does not travel on `/api/chat`. An `audios` field there is silently
ignored; the working path is the OpenAI-compatible endpoint with an
`input_audio` content block.

A resident holding a phone to their mouth in a noisy street is the least
forgiving moment in this product, so it does not depend on an upstream bug being
fixed. When it is, `lib/gemma/audio.ts` takes over and `lib/speech/` becomes dead
code.

## Failing honestly

Every AI route fails closed. If Gemma cannot answer, the route returns 5xx with
a `code` and a message written for a resident. No route invents a result.

This is a deliberate reversal. The previous build returned `valid: true` from
photo verification whenever the model was unreachable or the response failed to
parse, so an outage silently approved every submission while the interface went
on claiming each one had been verified. A verification that cannot fail is not a
verification.

Where a deterministic fallback genuinely helps, it is labelled: `_meta.source`
is `'gemma'` for real inference and `'fallback'` otherwise, and the UI renders
it. Nothing canned is ever presented as model output.

## Checking it yourself

```bash
npm run gemma:health
```

Confirms a host answers, the model is pulled, and it completes a
schema-constrained prompt — with romanized Gujarati as the test input, since
that is what most residents actually type.

At runtime, `/api/gemma/health` reports which host is serving. Add `?probe=1` to
run a real inference. Every AI response also carries `_meta` naming the model
and host that produced it, so nothing has to be taken on trust.
