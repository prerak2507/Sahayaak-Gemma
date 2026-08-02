#!/usr/bin/env node
/**
 * Proves that changes actually save.
 *
 * Every check writes something, then re-reads it from a fresh request, which is
 * what a page reload does. This exists because the interface used to write
 * directly to Firestore from the browser, the rules rejected it, and the
 * optimistic update made it look like it had worked. A test that only checked
 * the response would have passed too, so each case re-reads.
 *
 *   node scripts/test-persistence.mjs
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const problems = [];

const pad = (s, n) => String(s).padEnd(n);

async function check(name, fn) {
  try {
    const detail = await fn();
    passed++;
    console.log(`[ ok ] ${pad(name, 34)} ${detail ?? ''}`);
  } catch (err) {
    failed++;
    problems.push(`${name}: ${err.message}`);
    console.log(`[FAIL] ${pad(name, 34)} ${err.message}`);
  }
}

const json = async (path, init) => {
  const res = await fetch(BASE + path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} returned ${res.status}: ${body.error ?? ''}`);
  return body;
};

const patch = (id, payload) =>
  json(`/api/needs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

const reread = (id) => json(`/api/needs/${id}`).then((b) => b.need);

console.log(`Checking that changes persist, against ${BASE}\n`);

const board = await json('/api/needs?assignment=government&limit=5');
if (!board.needs?.length) {
  console.log('No reports on the board. Seed first: npm run seed');
  process.exit(1);
}

const subject = board.needs[0];
const original = await reread(subject.id);

await check('status change survives reload', async () => {
  const target = original.status === 'in_progress' ? 'verified' : 'in_progress';
  await patch(subject.id, { status: target, actor: 'persistence test' });
  const after = await reread(subject.id);
  if (after.status !== target) throw new Error(`expected ${target}, re-read gave ${after.status}`);
  return `${original.status} to ${after.status}`;
});

await check('department change reassigns crew', async () => {
  const target = original.assigned_department === 'drainage' ? 'pwd' : 'drainage';
  await patch(subject.id, { assigned_department: target, actor: 'persistence test' });
  const after = await reread(subject.id);
  if (after.assigned_department !== target) throw new Error('department did not save');
  if (!after.assigned_worker_name) throw new Error('crew was not reassigned with the department');
  return `${target}, crew ${after.assigned_worker_name}`;
});

await check('explicit crew override saves', async () => {
  await patch(subject.id, {
    assigned_worker_name: 'Karsan Bhai',
    assigned_worker_title: 'Senior Pothole Technician',
    actor: 'persistence test',
  });
  const after = await reread(subject.id);
  if (after.assigned_worker_name !== 'Karsan Bhai') throw new Error('crew override did not save');
  return after.assigned_worker_name;
});

await check('notes append to history', async () => {
  const before = (await reread(subject.id)).history?.length ?? 0;
  await patch(subject.id, { note: 'Checked by the persistence test', actor: 'persistence test' });
  const after = await reread(subject.id);
  if ((after.history?.length ?? 0) <= before) throw new Error('history did not grow');
  return `${after.history.length} entries, last: ${after.history.at(-1).action}`;
});

await check('history records who made the change', async () => {
  const after = await reread(subject.id);
  const mine = after.history?.filter((h) => h.by === 'persistence test') ?? [];
  if (mine.length === 0) throw new Error('no entry attributed to the actor');
  return `${mine.length} attributed entries`;
});

await check('resolution note and completion save', async () => {
  await patch(subject.id, {
    status: 'completed',
    resolution_note: 'Filled and levelled, verified on site',
    actor: 'persistence test',
  });
  const after = await reread(subject.id);
  if (after.status !== 'completed') throw new Error('status did not save');
  if (!after.resolution_note) throw new Error('resolution note did not save');
  if (!after.completed_at) throw new Error('completed_at was not stamped');
  return 'closed with a note and a timestamp';
});

await check('closing moves the derived stats', async () => {
  const stats = await json('/api/stats');
  if (stats.needs_resolved < 1) throw new Error('resolved count did not move');
  return `${stats.needs_resolved} resolved, ${stats.open_needs} open`;
});

await check('upvote saves and is counted once', async () => {
  const first = await json(`/api/needs/${subject.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upvote', voter: 'persistence-test-voter' }),
  });
  const second = await json(`/api/needs/${subject.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upvote', voter: 'persistence-test-voter' }),
  });
  if (second.upvotes !== first.upvotes) throw new Error('the same voter was counted twice');
  const after = await reread(subject.id);
  if ((after.upvotes ?? 0) < 1) throw new Error('upvote did not persist');
  return `${after.upvotes} upvote, second attempt ignored`;
});

await check('invalid status is refused', async () => {
  const res = await fetch(`${BASE}/api/needs/${subject.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'banana' }),
  });
  if (res.ok) throw new Error('an invalid status was accepted');
  return `refused with ${res.status}`;
});

await check('unknown report gives 404', async () => {
  const res = await fetch(`${BASE}/api/needs/does-not-exist`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'open' }),
  });
  if (res.status !== 404) throw new Error(`expected 404, got ${res.status}`);
  return 'refused with 404';
});

await check('volunteer status change survives reload', async () => {
  const roster = await json('/api/volunteers');
  if (!roster.volunteers?.length) throw new Error('roster is empty; seed it first');
  const v = roster.volunteers[0];
  const target = v.status === 'busy' ? 'available' : 'busy';

  await json('/api/volunteers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: v.id, status: target }),
  });

  const after = (await json('/api/volunteers')).volunteers.find((x) => x.id === v.id);
  if (after.status !== target) throw new Error(`expected ${target}, re-read gave ${after.status}`);
  return `${v.name}: ${v.status} to ${after.status}`;
});

// Put the subject back the way it was, so the demo board is not left with a
// test-closed ticket.
await check('restore the report used for testing', async () => {
  await patch(subject.id, {
    status: original.status,
    assigned_department: original.assigned_department,
    assigned_worker_name: original.assigned_worker_name,
    assigned_worker_title: original.assigned_worker_title,
    actor: 'persistence test',
  });
  const after = await reread(subject.id);
  if (after.status !== original.status) throw new Error('could not restore the original status');
  return `back to ${after.status}`;
});

console.log(`\n${passed} passed, ${failed} failed`);
if (problems.length) {
  console.log('\nFailures:');
  problems.forEach((p) => console.log(`  ${p}`));
}
process.exit(failed === 0 ? 0 : 1);
