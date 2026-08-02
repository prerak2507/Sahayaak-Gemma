#!/usr/bin/env node
/**
 * Preflight for the Gemma layer. Run it before a demo:
 *
 *   npm run gemma:health
 *
 * Checks that a host answers, that the model is pulled, and that it actually
 * completes a prompt and honours a JSON schema. Prints what to do about each
 * failure rather than a stack trace.
 */

import fs from 'node:fs';

// Minimal .env.local reader so this runs without Next.js.
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  }
}

const LOCAL_ORIGIN = (process.env.GEMMA_LOCAL_ORIGIN || 'http://localhost:11434').replace(/\/$/, '');
const LOCAL_MODEL = process.env.GEMMA_LOCAL_MODEL || 'gemma4:e4b-it-qat';
const CLOUD_ORIGIN = (process.env.GEMMA_CLOUD_ORIGIN || 'https://ollama.com').replace(/\/$/, '');
const CLOUD_MODEL = process.env.GEMMA_CLOUD_MODEL || 'gemma4:cloud';
const API_KEY = process.env.OLLAMA_API_KEY;

const tick = (ok) => (ok ? '  ok  ' : ' FAIL ');
let failures = 0;

function report(ok, label, detail) {
  if (!ok) failures++;
  console.log(`[${tick(ok)}] ${label}`);
  if (detail) console.log(`         ${detail}`);
}

async function probeHost(origin, model, apiKey, kind) {
  console.log(`\n${kind} host: ${origin}`);

  let tags;
  try {
    const res = await fetch(`${origin}/api/tags`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`returned ${res.status}`);
    tags = await res.json();
    report(true, 'host is reachable');
  } catch (error) {
    report(
      false,
      'host is reachable',
      kind === 'local'
        ? `${error.message}. Is Ollama running? Start it, or install with: winget install Ollama.Ollama`
        : `${error.message}. Check OLLAMA_API_KEY.`
    );
    return false;
  }

  const names = (tags.models ?? []).flatMap((m) => [m.name, m.model].filter(Boolean));
  const present = names.includes(model) || kind === 'cloud';
  report(
    present,
    `model ${model} is available`,
    present ? null : `Not pulled. Run: ollama pull ${model}`
  );
  if (!present) return false;

  // A real completion, constrained to a schema, which is how the app uses it.
  try {
    const started = Date.now();
    const res = await fetch(`${origin}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content:
              'A resident of Rajkot writes: "kalavad road par moto khado chhe, bike lapsi gai". Which RMC department owns this, and how urgent is it?',
          },
        ],
        format: {
          type: 'object',
          properties: {
            department: { type: 'string' },
            urgency: { type: 'integer' },
            language_detected: { type: 'string' },
          },
          required: ['department', 'urgency', 'language_detected'],
        },
        stream: false,
        think: false,
      }),
      signal: AbortSignal.timeout(Number(process.env.GEMMA_TIMEOUT_MS) || 120000),
    });

    if (!res.ok) throw new Error(`returned ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.message?.content ?? '{}');
    const elapsed = Date.now() - started;

    report(true, `completes a schema-constrained prompt (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`         romanized Gujarati in, structured out: ${JSON.stringify(parsed)}`);
    return true;
  } catch (error) {
    report(false, 'completes a schema-constrained prompt', error.message);
    return false;
  }
}

console.log('Sahaayak: checking the Gemma layer');

const localOk = await probeHost(LOCAL_ORIGIN, LOCAL_MODEL, undefined, 'local');

if (API_KEY) {
  await probeHost(CLOUD_ORIGIN, CLOUD_MODEL, API_KEY, 'cloud');
} else {
  console.log('\ncloud host: not configured (OLLAMA_API_KEY unset)');
  console.log(
    localOk
      ? '         Fine for local use. Set a key if you want a fallback for the public demo.'
      : '         Nothing will run until the local checks above pass, or a key is set.'
  );
}

console.log(
  failures === 0
    ? '\nReady.'
    : `\n${failures} check${failures === 1 ? '' : 's'} failed. See the notes above.`
);

process.exit(failures === 0 ? 0 : 1);
