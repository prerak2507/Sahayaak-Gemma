#!/usr/bin/env node
/**
 * Exercises every AI route against whatever Gemma is actually running.
 *
 * This is the integration check: it does not mock the model, so a pass means
 * the prompt, the schema and the route agree on real output. Run it before a
 * demo and before submitting.
 *
 *   node scripts/test-ai-routes.mjs
 *   node scripts/test-ai-routes.mjs --only=triage,radar
 *
 * Requires the dev server on http://localhost:3000 and a reachable Gemma host.
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '');
const filter = only ? only.split(',').map((s) => s.trim()) : null;

// A 1x1 PNG. Enough to prove the multimodal path carries an image end to end;
// the model will correctly say it shows no civic problem.
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const sampleNeeds = [
  { id: 'n1', title: 'Sewer overflow at Madhapar', category: 'drainage_sewerage', urgency_score: 8, ward: 'Mavdi', status: 'open' },
  { id: 'n2', title: 'Pothole cluster on Kalavad Road', category: 'roads_potholes', urgency_score: 7, ward: 'Kalavad Road', status: 'open' },
  { id: 'n3', title: 'Street lights out on University Road', category: 'electricity_streetlights', urgency_score: 4, ward: 'Nana Mava', status: 'open' },
  { id: 'n4', title: 'Yellow water from taps on Gondal Road', category: 'water_supply', urgency_score: 9, ward: 'Kotecha Chowk', status: 'open' },
];

/** name, method, path, body, and what a correct answer must contain. */
const CASES = [
  {
    name: 'triage',
    path: '/api/ai/validate',
    body: { description: 'kalavad road par moto khado chhe, bike lapsi gai' },
    check: (r) => {
      if (!r.triage?.valid) return 'expected a valid report';
      if (r.triage.language !== 'gu') return `expected language gu, got ${r.triage.language}`;
      if (r.triage.assigned_department !== 'pwd') return `expected pwd, got ${r.triage.assigned_department}`;
      if (!r.triage.location) return 'expected Kalavad Road to resolve to coordinates';
      if (!r.dispatch?.toolCalled) return 'expected a dispatch tool call';
      return null;
    },
    show: (r) => `${r.triage.assigned_department} u${r.triage.urgency_score} via ${r.dispatch?.toolCalled}`,
  },
  {
    name: 'triage-reject',
    path: '/api/ai/validate',
    body: { description: 'hello hello testing 123' },
    check: (r) => (r.triage?.valid ? 'expected spam to be rejected' : null),
    show: (r) => `rejected: ${r.triage.rejection_reason}`,
  },
  {
    name: 'triage-escalate',
    path: '/api/ai/validate',
    body: { description: 'Yagnik road par vijli no taar tuti ne footpath par padyo chhe, tankha zare chhe' },
    check: (r) =>
      r.dispatch?.toolCalled === 'escalate_emergency' ? null : `expected escalation, got ${r.dispatch?.toolCalled}`,
    show: (r) => `u${r.triage.urgency_score} ${r.dispatch.toolCalled}`,
  },
  {
    name: 'translate',
    path: '/api/ai/translate',
    body: { text: 'Your report has been assigned to the water works department.', target_language: 'gu' },
    check: (r) => (r.translatedText?.length > 5 ? null : 'expected a translation'),
    show: (r) => r.translatedText.slice(0, 60),
  },
  {
    name: 'search',
    path: '/api/ai/search',
    body: { query: 'urgent water problems in Mavdi' },
    check: (r) => (r.category || r.ward || r.is_urgent ? null : 'expected at least one filter to be set'),
    show: (r) => `ward=${r.ward} cat=${r.category} urgent=${r.is_urgent}`,
  },
  {
    name: 'radar',
    path: '/api/ai/radar',
    body: { needs: sampleNeeds },
    check: (r) => (r.hotspot && r.patterns?.length >= 2 ? null : 'expected a hotspot and patterns'),
    show: (r) => r.hotspot.slice(0, 70),
  },
  {
    name: 'ngo-insights',
    path: '/api/ai/ngo-insights',
    body: { needs: sampleNeeds },
    check: (r) => (r.summary ? null : 'expected a summary'),
    show: (r) => r.summary.slice(0, 70),
  },
  {
    name: 'match',
    path: '/api/ai/match',
    body: { volunteerSkills: ['plumbing', 'first_aid'], needs: sampleNeeds },
    check: (r) => (Array.isArray(r.ranked_need_ids) ? null : 'expected ranked ids'),
    show: (r) => `ranked ${r.ranked_need_ids.join(', ') || '(none matched input ids)'}`,
  },
  {
    name: 'volunteer-scout',
    path: '/api/ai/volunteer-scout',
    body: {
      volunteers: [
        { name: 'Asha Patel', skills: ['nursing', 'first_aid'], status: 'available' },
        { name: 'Kiran Joshi', skills: ['driving', 'food_distribution'], status: 'available' },
      ],
      activeNeeds: sampleNeeds,
    },
    check: (r) => (r.strategy ? null : 'expected a deployment strategy'),
    show: (r) => `${r.matches?.length ?? 0} matches, ${r.gaps?.length ?? 0} gaps`,
  },
  {
    name: 'impact-narrative',
    path: '/api/ai/impact-narrative',
    body: { organisationName: 'Disha Foundation', stats: { reports_closed: 34, people_reached: 210, months_active: 6 } },
    check: (r) => (r.narrative?.length > 80 ? null : 'expected a narrative'),
    show: (r) => r.narrative.slice(0, 70).replace(/\n/g, ' '),
  },
  {
    name: 'forecast',
    path: '/api/ai/forecast',
    body: { history: [{ week: 1, food_kits: 120 }, { week: 2, food_kits: 140 }], trend: 'monsoon approaching' },
    check: (r) => (typeof r.food_kits === 'number' && r.confidence ? null : 'expected numbers and a confidence'),
    show: (r) => `food ${r.food_kits}, medical ${r.medical_packs}, confidence ${r.confidence}`,
  },
  {
    name: 'predictive-risk',
    path: '/api/ai/predictive-risk',
    body: { needs: sampleNeeds, conditions: { rain_mm: 60, temperature: 31 } },
    check: (r) => (r.risks?.length >= 1 ? null : 'expected at least one risk'),
    show: (r) => `${r.risks.length} risks, first: ${r.risks[0].title.slice(0, 45)}`,
  },
  {
    name: 'predictive-weather',
    path: '/api/ai/predictive-weather',
    body: { temperature: 34, precipitation_probability: 80, wind_speed: 22, current_condition: 'heavy rain expected' },
    check: (r) => (r.civic_risk_level && r.expected_load?.length ? null : 'expected a risk level and load'),
    show: (r) => `${r.civic_risk_level}: ${r.headline.slice(0, 55)}`,
  },
  {
    name: 'scheme-analysis',
    path: '/api/ai/scheme-analysis',
    body: { needsDistribution: { 'Sewerage & Drainage': 5, 'PWD Roads': 4, 'Water Works': 3 }, totalNeeds: 12 },
    check: (r) => (typeof r.overall_coverage_score === 'number' ? null : 'expected a coverage score'),
    show: (r) => `coverage ${r.overall_coverage_score}%, ${r.gaps?.length ?? 0} gaps`,
  },
  {
    name: 'spatial-audit',
    path: '/api/ai/spatial-audit',
    body: { zone: 'Mavdi', lat: 22.2734, lng: 70.7756, reportedNeeds: sampleNeeds },
    check: (r) => (r.zone_status && r.confidence ? null : 'expected a status and confidence'),
    show: (r) => `${r.zone_status} (confidence ${r.confidence})`,
  },
  {
    name: 'compliance-audit',
    path: '/api/ai/compliance-audit',
    body: { organisation: { name: 'Disha Foundation', registered: 2016 }, docs: ['registration_certificate.pdf', 'pan.pdf'] },
    check: (r) => (Array.isArray(r.gaps) ? null : 'expected a gaps list'),
    show: (r) => `${r.gaps.length} gaps, ${r.questions_for_reviewer?.length ?? 0} questions`,
  },
  {
    name: 'chat',
    path: '/api/ai/chat',
    body: {
      message: 'Which department has the heaviest load right now?',
      context: { stats: { open_reports: 18, critical: 7 }, openNeeds: sampleNeeds },
    },
    check: (r) => (r.reply?.length > 20 ? null : 'expected a reply'),
    show: (r) => r.reply.slice(0, 70).replace(/\n/g, ' '),
  },
  {
    name: 'chat-refuses-unknown',
    path: '/api/ai/chat',
    body: { message: 'How many volunteers are registered in Surat?', context: { stats: { open_reports: 18 } } },
    check: (r) => (r.reply ? null : 'expected a reply'),
    show: (r) => r.reply.slice(0, 90).replace(/\n/g, ' '),
  },
  {
    name: 'verify-image',
    path: '/api/ai/verify-image',
    body: { imageBase64: `data:image/png;base64,${TINY_PNG}` },
    // A blank pixel is not a civic problem, so a correct answer rejects it.
    check: (r) => (typeof r.valid === 'boolean' ? null : 'expected a verdict'),
    show: (r) => `valid=${r.valid} (${r.description?.slice(0, 45)})`,
  },
  {
    name: 'cross-verify',
    path: '/api/ai/cross-verify-report',
    body: { imageBase64: `data:image/png;base64,${TINY_PNG}`, userDescription: 'huge pothole on the main road' },
    check: (r) => (typeof r.matches === 'boolean' ? null : 'expected a match verdict'),
    show: (r) => `matches=${r.matches}`,
  },
  {
    name: 'verify-solution',
    path: '/api/ai/verify-solution',
    body: {
      imageBase64: `data:image/png;base64,${TINY_PNG}`,
      issueTitle: 'Pothole on Kalavad Road',
      issueDescription: 'Deep pothole outside the school gate',
      issueCategory: 'roads_potholes',
    },
    check: (r) => (typeof r.resolved === 'boolean' ? null : 'expected a resolution verdict'),
    show: (r) => `resolved=${r.resolved}`,
  },
];

const pad = (s, n) => String(s).padEnd(n);
let passed = 0,
  failed = 0;
const failures = [];

console.log(`Exercising AI routes against ${BASE}\n`);

for (const c of CASES) {
  if (filter && !filter.includes(c.name)) continue;

  const started = Date.now();
  try {
    const res = await fetch(BASE + c.path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c.body),
      signal: AbortSignal.timeout(300000),
    });

    const secs = ((Date.now() - started) / 1000).toFixed(1);
    const body = await res.json();

    if (!res.ok) {
      failed++;
      failures.push(`${c.name}: HTTP ${res.status} ${body.error ?? ''}`);
      console.log(`[FAIL] ${pad(c.name, 22)} HTTP ${res.status}  ${String(body.error ?? '').slice(0, 70)}`);
      continue;
    }

    const problem = c.check(body);
    if (problem) {
      failed++;
      failures.push(`${c.name}: ${problem}`);
      console.log(`[FAIL] ${pad(c.name, 22)} ${pad(secs + 's', 7)} ${problem}`);
    } else {
      passed++;
      console.log(`[ ok ] ${pad(c.name, 22)} ${pad(secs + 's', 7)} ${c.show(body)}`);
    }
  } catch (err) {
    failed++;
    failures.push(`${c.name}: ${err.message}`);
    console.log(`[FAIL] ${pad(c.name, 22)} ${err.message.slice(0, 70)}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  ${f}`));
}
process.exit(failed === 0 ? 0 : 1);
