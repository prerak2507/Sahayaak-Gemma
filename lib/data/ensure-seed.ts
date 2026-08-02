import { store } from '@/lib/store';
import { invalidateBoard } from '@/lib/data/board-cache';
import { DEMO_VOLUNTEERS, buildVolunteer } from '@/lib/data/volunteers';
import fixture from '@/lib/data/fixtures/seeded-board.json';

let seedingInProgress: Promise<void> | null = null;

/**
 * Ensures the store has demo data loaded.
 *
 * On fresh clones, Vercel deployments, or clean local starts, the local store
 * or database starts empty. This function automatically seeds the pre-generated
 * demo board (from lib/data/fixtures/seeded-board.json) and volunteers if the
 * `needs` collection contains 0 documents.
 */
export async function ensureSeeded(): Promise<void> {
  try {
    const existing = await store().list('needs');
    if (existing.length > 0) return;

    if (seedingInProgress) {
      await seedingInProgress;
      return;
    }

    seedingInProgress = (async () => {
      const doubleCheck = await store().list('needs');
      if (doubleCheck.length > 0) return;

      console.log('[auto-seed] Store is empty. Auto-seeding prebuilt demo data...');

      const now = Date.now();
      const rows = fixture as Array<Record<string, unknown>>;

      // Spread the ages across the last two days so the board reads as a live backlog
      for (let i = 0; i < rows.length; i++) {
        const ageMinutes = 5 + Math.round((i / Math.max(rows.length - 1, 1)) * 2800);
        const at = new Date(now - ageMinutes * 60000).toISOString();
        await store().add('needs', {
          ...rows[i],
          created_at: at,
          updated_at: at,
          seed_mode: 'prebuilt',
        });
      }

      const existingVolunteers = await store().list('volunteers');
      if (existingVolunteers.length === 0) {
        for (const v of DEMO_VOLUNTEERS) {
          await store().add('volunteers', buildVolunteer(v));
        }
      }

      invalidateBoard();
      console.log(`[auto-seed] Loaded ${rows.length} prebuilt reports and ${DEMO_VOLUNTEERS.length} volunteers.`);
    })();

    await seedingInProgress;
  } catch (err) {
    console.error('[auto-seed] Failed to auto-seed demo data:', err);
  } finally {
    seedingInProgress = null;
  }
}
