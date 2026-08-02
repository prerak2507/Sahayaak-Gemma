import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { scopeToCity } from '@/lib/data/needs';
import { DEMO_VOLUNTEERS, buildVolunteer } from '@/lib/data/volunteers';
import { ensureSeeded } from '@/lib/data/ensure-seed';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const organisation = new URL(request.url).searchParams.get('organisation');

  try {
    await ensureSeeded();
    const volunteers = scopeToCity(await store().list('volunteers')).filter(
      (v: any) => !organisation || v.organisation === organisation
    );

    return NextResponse.json({ volunteers, count: volunteers.length });
  } catch (error) {
    console.error('[api/volunteers] read failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), volunteers: [], count: 0 },
      { status: 503 }
    );
  }
}

/** Seeds the demo roster. Idempotent: clears the city's volunteers first. */
export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get('seed') !== '1') {
    return NextResponse.json({ error: 'Pass ?seed=1 to seed the roster' }, { status: 400 });
  }

  try {
    await store().removeWhere('volunteers', (v: any) => v.city === 'Rajkot');
    for (const v of DEMO_VOLUNTEERS) {
      await store().add('volunteers', buildVolunteer(v));
    }

    return NextResponse.json({ ok: true, seeded: DEMO_VOLUNTEERS.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/** Updates one volunteer. Only fields an operator is allowed to change. */
export async function PATCH(request: Request) {
  let body: { id?: string; status?: string; skills?: string[]; ward?: string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const allowed = ['available', 'busy', 'on_break', 'offline'];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of ${allowed.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    if (!(await store().get('volunteers', body.id))) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) patch.status = body.status;
    if (body.skills) patch.skills = body.skills;
    if (body.ward !== undefined) patch.ward = body.ward;

    await store().update('volunteers', body.id, patch);
    const updated = await store().get('volunteers', body.id);

    return NextResponse.json({ ok: true, volunteer: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
