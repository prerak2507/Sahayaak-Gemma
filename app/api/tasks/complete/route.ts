import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, addDoc, collection, increment } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { taskId, needId } = await request.json();

    if (!taskId || !needId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Get the need to find the reporter and severity
    const needRef = doc(db, 'needs', needId);
    const needSnap = await getDoc(needRef);
    if (!needSnap.exists()) {
      return NextResponse.json({ error: 'Need not found' }, { status: 404 });
    }
    const needData = needSnap.data();

    // 2. Update Task & Need Status
    await updateDoc(doc(db, 'tasks', taskId), { status: 'completed', completed_at: new Date().toISOString() });
    await updateDoc(needRef, { status: 'completed', resolved_at: new Date().toISOString() });

    // 3. Notify the Reporter
    const reporterId = needData.reported_by;
    if (reporterId && reporterId !== 'anonymous') {
      await addDoc(collection(db, 'notifications'), {
        user_id: reporterId,
        title: 'Report Resolved! 🎉',
        message: `Your report "${needData.title}" has been fixed by a municipal worker. Thank you for your civic duty!`,
        read: false,
        created_at: new Date().toISOString(),
        type: 'resolution'
      });

      // 4. Gamification: Calculate and Award Trust Points
      // Base points + multiplier based on AI severity rating
      const severity = needData.severity_rating || needData.urgency_score || 5;
      const pointsEarned = Math.floor(severity * 15); // e.g., severity 8 = 120 points

      const userRef = doc(db, 'users', reporterId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentData = userSnap.data();
        let newStreak = (currentData.streak || 0) + 1;
        
        // Example badge logic: Unlock a badge if streak hits 5
        const badges = currentData.badges || [];
        if (newStreak >= 5 && !badges.includes('Civic Guardian')) {
          badges.push('Civic Guardian');
        }

        await updateDoc(userRef, {
          trust_score: increment(pointsEarned),
          streak: newStreak,
          badges: badges
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
