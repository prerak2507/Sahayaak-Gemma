'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { MapPin, Clock, ArrowLeft, Navigation, CheckCircle2, Phone, MessageSquare, Shield, AlertTriangle, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Need, Task } from '@/types';
import { timeAgo, getUrgencyClass } from '@/lib/utils';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<(Task & { need: Need }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const taskRef = doc(db, 'tasks', id as string);
    const unsubscribe = onSnapshot(taskRef, async (docSnap) => {
      if (!docSnap.exists()) {
        setLoading(false);
        return;
      }

      const taskData = docSnap.data() as Task;
      const needDoc = await getDoc(doc(db, 'needs', taskData.need_id));
      
      if (needDoc.exists()) {
        setTask({
          ...taskData,
          id: docSnap.id,
          need: { id: needDoc.id, ...needDoc.data() } as Need
        } as (Task & { need: Need }));
      }
      setLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => unsubscribe();
  }, [id]);

  const handleComplete = async () => {
    if (!task) return;
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: 'completed' });
      await updateDoc(doc(db, 'needs', task.need.id), { status: 'completed' });
      toast.success('Task marked as completed!');
      router.push('/volunteer/dashboard');
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Task Details...</div>;
  if (!task) return (
    <div className="p-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Task Not Found</h2>
      <Link href="/volunteer/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <Link href="/volunteer/dashboard" className="flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--saffron)] transition-colors font-bold text-sm mb-4">
        <ArrowLeft size={16} /> BACK TO DASHBOARD
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="h-[300px] w-full bg-[var(--surface-2)] relative">
              <MapContainer 
                center={[task.need.location_lat, task.need.location_lng]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[task.need.location_lat, task.need.location_lng]}>
                  <Popup>{task.need.title}</Popup>
                </Marker>
              </MapContainer>
              <div className="absolute top-4 right-4 z-[1000]">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${task.need.location_lat},${task.need.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary shadow-xl flex items-center gap-2"
                >
                  <Navigation size={18} /> Open in Google Maps
                </a>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-[var(--surface-2)] text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)] border border-[var(--border)]">
                      {task.need.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-600 border border-blue-100">
                      STATUS: {task.status.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold font-mukta text-[var(--ink)] leading-tight">{task.need.title}</h1>
                </div>
              </div>

              <div className="prose max-w-none text-[var(--ink-muted)] mb-8">
                <p className="leading-relaxed">{task.need.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--ink-faint)] uppercase mb-1">Location</p>
                  <p className="text-sm font-bold flex items-center gap-2">
                    <MapPin size={14} className="text-[var(--saffron)]" /> {task.need.city}, {task.need.district}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--ink-faint)] uppercase mb-1">Time Logged</p>
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" /> {timeAgo(task.need.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Safety First</h4>
              <p className="text-xs text-amber-700 leading-relaxed">Always coordinate with the NGO supervisor before approaching a site. Ensure you have the necessary safety gear for this category of intervention.</p>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="card border-[var(--saffron)] shadow-lg shadow-[var(--saffron-glow)]">
            <h3 className="font-bold font-mukta text-lg mb-6 flex items-center gap-2">
              <Shield size={20} className="text-[var(--saffron)]" /> Task Control
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleComplete}
                className="btn-primary w-full justify-center py-4 text-base font-bold shadow-xl"
              >
                <CheckCircle2 size={20} className="mr-2" /> Mark as Completed
              </button>
              
              <button className="btn-ghost w-full justify-center border border-[var(--border)]">
                <Phone size={18} className="mr-2" /> Call NGO Support
              </button>
              <button className="btn-ghost w-full justify-center border border-[var(--border)]">
                <MessageSquare size={18} className="mr-2" /> Message Reporter
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <p className="text-[10px] text-center text-[var(--ink-faint)] font-bold uppercase tracking-widest mb-4">Verification Level</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-8 h-1 rounded-full ${i <= 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-500" /> Collaborative Status
            </h4>
            <p className="text-xs text-[var(--ink-muted)] mb-4">This task was verified by 2 other volunteers in your district.</p>
            <div className="flex -space-x-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">V{i}</div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

