'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { MapPin, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Camera, HardHat, Truck, Star, Download, FileText, Image as ImageIcon, ChevronRight, Activity } from 'lucide-react';
import { generateOfficialReport } from '@/lib/pdfGenerator';
import toast from 'react-hot-toast';

export default function GovtEmployeeDashboard() {
  const { user } = useAuthStore();
  const [departmentNeeds, setDepartmentNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
  const [verificationFeedback, setVerificationFeedback] = useState<{taskId: string, message: string} | null>(null);

  useEffect(() => {
    if (!user || !user.department) return;

    const q = query(
      collection(db, 'needs'),
      where('assigned_department', '==', user.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setDepartmentNeeds(tasksData.filter(t => !t.is_archived));
      setLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcceptTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, 'needs', taskId), {
        status: 'in_progress',
        assigned_worker_name: user?.full_name,
        assigned_worker_title: user?.title || 'Field Specialist',
        ai_progress: 15,
        routing_reason: `Accepted by Field Crew: ${user?.full_name}`
      });
      toast.success('Task Accepted. GPS telemetry active.', {
        icon: '🛰️',
        style: { background: '#1e293b', color: '#fff' }
      });
    } catch (err) {
      toast.error('Failed to accept task.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, task: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveTaskId(task.id);
    setVerificationState('uploading');
    setVerificationFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      
      // Compress image to prevent 413 Payload Too Large on Vercel
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        setVerificationState('analyzing');

        try {
          const res = await fetch('/api/ai/verify-solution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: compressedBase64,
              issueTitle: task.title,
              issueDescription: task.description || '',
              issueCategory: task.category || ''
            })
          });

        if (!res.ok) {
          const text = await res.text();
          console.error('API Error:', res.status, text);
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.valid) {
          await updateDoc(doc(db, 'needs', task.id), {
            status: 'completed',
            ai_progress: 100,
            completed_at: new Date().toISOString(),
            routing_reason: `AI Verified: ${data.feedback}`,
            resolution_image_url: compressedBase64,
            resolution_feedback: data.feedback
          });
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Task Resolved Successfully!</span>
              <span className="text-xs">{data.feedback}</span>
            </div>, 
            { icon: '✅', duration: 6000 }
          );
        } else {
          toast.error('Verification failed. Please see feedback.', { icon: '❌' });
          setVerificationFeedback({ taskId: task.id, message: data.feedback });
        }
      } catch (err) {
        console.error('Upload Error:', err);
        toast.error('Failed to verify task image.');
      } finally {
        setVerificationState('idle');
        setActiveTaskId(null);
        e.target.value = ''; // reset input
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const generateReport = () => {
    generateOfficialReport({
      title: 'Monthly Performance Audit',
      referenceNo: 'City-PERF-' + new Date().getFullYear(),
      date: new Date().toLocaleDateString(),
      category: 'Employee Performance Log'
    });
    toast.success('Monthly Performance Report generated and downloaded as PDF!', { icon: '📄' });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Activity className="text-indigo-600 animate-pulse mb-4" size={40} />
        <div className="text-slate-500 font-medium tracking-widest uppercase text-sm">Loading Dispatch Hub</div>
      </div>
    );
  }

  const pendingTasks = departmentNeeds.filter(t => t.status !== 'completed' && t.assigned_worker_name !== user.full_name);
  const myActiveTasks = departmentNeeds.filter(t => t.status === 'in_progress' && t.assigned_worker_name === user.full_name);
  
  // Completed in the last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const completedTasks = departmentNeeds.filter(t => {
    if (t.status !== 'completed' || t.assigned_worker_name !== user.full_name) return false;
    if (!t.completed_at) return true;
    return new Date(t.completed_at) > oneMonthAgo;
  }).sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-12">
      
      {/* ━━━ PREMIUM ENTERPRISE HEADER ━━━ */}
      <div className="bg-slate-950 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shrink-0 relative z-10">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">{user.full_name?.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-950 rounded-full z-20" title="Status: Online & Ready" />
              </div>
              
              <div>
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest mb-2">
                  <ShieldAlert size={12} /> {user.department?.replace('_', ' ')} Technician
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
                  {user.full_name}
                </h1>
                <p className="text-slate-400 font-medium flex items-center gap-2">
                  ID: <span className="text-slate-300 font-mono text-sm">{user.id.split('-')[0].toUpperCase()}</span>
                </p>
              </div>
            </div>

            {/* Profile Detail Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
              {[
                { icon: MapPin, label: 'Assigned Zone', value: 'Rajkot Central' },
                { icon: Truck, label: 'Equipment', value: 'Fleet #04' },
                { icon: Star, label: 'SLA Rating', value: '98% Top Tier', color: 'text-emerald-400' },
                { icon: HardHat, label: 'Supervisor', value: 'D. Sharma' }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                    <item.icon size={12}/> {item.label}
                  </div>
                  <div className={`text-sm font-bold ${item.color || 'text-white'}`}>{item.value}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ━━━ LEFT COLUMN: TASKS ━━━ */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Active Operations (Highlight) */}
            {myActiveTasks.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Active Deployment</h2>
                </div>
                
                <div className="space-y-4">
                  {myActiveTasks.map(task => (
                    <div key={task.id} className="bg-white border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest mb-3 inline-block">
                            EN ROUTE / IN PROGRESS
                          </span>
                          <h3 className="font-black text-slate-900 text-2xl leading-tight">{task.title}</h3>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm"><MapPin size={20} className="text-indigo-600" /></div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Location</p>
                          <p className="font-semibold text-slate-800">{task.landmark || 'GPS Assigned Location'}</p>
                        </div>
                      </div>
                      
                      {verificationFeedback?.taskId === task.id && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm flex items-start gap-3">
                          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="font-bold mb-1">AI Verification Failed</p>
                            <p>{verificationFeedback?.message}</p>
                          </div>
                        </div>
                      )}

                      {activeTaskId === task.id ? (
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                          <Activity className="text-indigo-600 animate-pulse" size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                            {verificationState === 'uploading' ? 'Establishing Secure Uplink...' : 'AI Vision Engine Validating...'}
                          </span>
                        </div>
                      ) : (
                        <label className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
                          <Camera size={18} /> Upload Resolution Proof
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, task)} 
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Dispatches */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Dispatch Queue ({pendingTasks.length})</h2>
              </div>
              
              <div className="space-y-4">
                {pendingTasks.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-lg mb-1">Queue Clear</h3>
                    <p className="text-slate-500">No pending dispatches in your operational sector.</p>
                  </div>
                ) : (
                  pendingTasks.map(task => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row group">
                      
                      {/* Image Thumbnail */}
                      <div className="w-full sm:w-56 h-48 sm:h-auto bg-slate-100 relative flex items-center justify-center shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200">
                        {task.image_url ? (
                          <img src={task.image_url} alt="Incident" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 gap-2">
                            <ImageIcon size={32} strokeWidth={1.5} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Visuals</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            task.urgency_score >= 8 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            Severity {task.urgency_score}/10
                          </span>
                        </div>
                      </div>
                      
                      {/* Task Details */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xl mb-2 leading-tight group-hover:text-indigo-700 transition-colors">{task.title}</h3>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 bg-slate-50 inline-flex px-3 py-1.5 rounded-lg border border-slate-100">
                            <MapPin size={14} className="text-slate-400" />
                            <span>{task.landmark || 'Location Pending GPS'}</span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-6 leading-relaxed">{task.description}</p>
                        </div>

                        <button 
                          onClick={() => handleAcceptTask(task.id)}
                          className="w-full sm:w-auto py-3 px-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                          Accept Dispatch <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ━━━ RIGHT COLUMN: PERFORMANCE ━━━ */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Monthly Report</h2>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sticky top-6">
              
              {/* Summary Stats Container */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tasks Done</div>
                    <div className="text-3xl font-black text-slate-900">{completedTasks.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Resolution</div>
                    <div className="text-3xl font-black text-slate-900">{completedTasks.length > 0 ? '1.5h' : '--'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Resolutions</h3>
                {completedTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-100">No tasks completed this month.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {completedTasks.map(task => (
                      <div key={task.id} className="group flex flex-col gap-2 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 cursor-default">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{task.title}</h4>
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            task.urgency_score >= 8 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Sev {task.urgency_score}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1"><Clock size={10} /> {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Unknown'}</div>
                          <div className="text-emerald-600">Verified</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={generateReport}
                className="w-full py-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Official Report
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
