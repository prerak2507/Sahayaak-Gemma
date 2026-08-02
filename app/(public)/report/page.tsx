'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, MapPin, Mic, MicOff, AlertCircle, Sparkles, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS, NeedCategory } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { ConfettiCelebration } from '@/components/shared/ConfettiCelebration';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Disable SSR for map
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false, loading: () => <div className="h-[300px] w-full bg-[var(--surface-2)] animate-pulse rounded-xl" /> });

// Compress image helper
const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    return data.display_name || "Unknown Location";
  } catch (e) {
    return `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export default function ReportPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Data state
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [category, setCategory] = useState<NeedCategory>('roads_potholes');
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setDescription(prev => prev + " " + transcript.trim());
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await compressImage(file, 800, 0.7);
      setPhotoData(base64);
      
      // Step 1: Initial AI Analysis
      const res = await fetch('/api/ai/verify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();

      // A failure here is not an approval. If Gemma could not look at the
      // photo, say so rather than letting it through unchecked.
      if (!res.ok) {
        toast.error(data.userMessage || 'The photo could not be checked. Try again.');
        setPhotoData(null);
        return;
      }

      if (data.valid === false) {
        toast.error(data.reason || 'That photo does not show a civic problem.');
        setPhotoData(null);
      } else {
        setDescription(data.description || '');
        if (data.category && data.category !== 'other') {
          setCategory(data.category);
        }
        toast.success('Gemma read your photo. Check the description and edit it if needed.');
        setStep(2);
      }
    } catch (err) {
      toast.error('The photo could not be processed. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const verifyAndProceedToLocation = async () => {
    if (!description.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    setIsUploading(true);
    try {
      // Only cross-check when there is a photo to check against. A typed
      // report with no image goes straight through.
      if (!photoData) {
        setStep(3);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const address = await fetchAddress(pos.coords.latitude, pos.coords.longitude);
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address });
          });
        }
        return;
      }

      const res = await fetch('/api/ai/cross-verify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoData, userDescription: description }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.userMessage || 'We could not check your description against the photo.');
        return;
      }

      // The endpoint returns `matches`. This used to read `data.valid`, which
      // is never present, so the check failed for every report that had one.
      if (!data.matches) {
        toast.error(data.reason || 'Your description does not match the photo. Please correct it.');
      } else {
        toast.success('Photo and description match.');
        setStep(3);
        // Auto detect location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const address = await fetchAddress(lat, lng);
            setLocation({ lat, lng, address });
          });
        }
      }
    } catch (err) {
      toast.error('We could not verify that description. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      toast.error('Please set a location');
      return;
    }

    setIsSubmitting(true);

    /**
     * Submitting means asking Gemma what this is.
     *
     * This used to write straight to Firestore with a department derived from
     * a dropdown, urgency hardcoded to 5, and the title made by truncating the
     * description at fifty characters. The model was never consulted on the one
     * flow the whole product exists for, and the write was rejected by the
     * security rules anyway, so nothing was saved either.
     *
     * Now the report goes to /api/ai/validate, which triages it, routes it,
     * assigns a crew and persists it. Whatever the resident picked in the
     * category dropdown is passed as a hint, not as the answer.
     */
    try {
      const res = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          imageBase64: photoData || undefined,
          contextNote: [
            location.address ? `Resident placed a pin at: ${location.address}` : null,
            category ? `Resident selected the category: ${category}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          location,
          persist: true,
          source_type: 'web',
          reported_by: user?.id || 'anonymous',
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        toast.error(body.userMessage || 'We could not process that report. Please try again.');
        return;
      }

      // Gemma refused it. Tell the resident why rather than pretending it filed.
      if (body.triage && body.triage.valid === false) {
        const reasons: Record<string, string> = {
          abusive_or_explicit: 'That report contains language we cannot accept.',
          spam_or_test: 'That does not look like a real report. Please describe the problem.',
          no_issue_described: 'Please describe what is actually wrong.',
          private_property:
            'That fault is inside a private property. The corporation maintains public assets, so this one is not ours to fix.',
        };
        toast.error(reasons[body.triage.rejection_reason] || 'That report could not be accepted.');
        return;
      }

      setTriageResult(body);
      setShowConfetti(true);
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong on our side. Your report was not lost, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24">
      {showConfetti && <ConfettiCelebration onComplete={() => { setShowConfetti(false); router.push('/citizen/dashboard'); }} />}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* How it works info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 font-mukta mb-2">Smart Community Reporting</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sahaayak uses AI to verify your reports instantly. Once submitted, your report goes to the <strong>Community Validation Map</strong>. 
                It requires <strong className="text-blue-600">25 upvotes</strong> from local citizens before it is officially escalated to government authorities!
              </p>
            </div>
          </div>
        </div>

        {/* Steps Tracker */}
        <div className="flex justify-between items-center mb-8 px-4 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500" style={{ width: `${(step - 1) * 33}%` }} />
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= i ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400 border-2 border-white'}`}>
              {step > i ? <Check size={14} /> : i}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <Camera size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 font-mukta mb-3">Snap a Photo of the Issue</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
                  Take a clear photo of the infrastructure or social issue. Our AI will automatically analyze it and describe the problem.
                </p>
                
                <div className="relative">
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
                  <button className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${isUploading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'}`}>
                    {isUploading ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AI Analyzing Image...</>
                    ) : (
                      <><Camera size={20} /> Open Camera / Gallery</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: EDIT & VOICE */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <h3 className="text-xl font-black text-slate-800 font-mukta mb-2">Review AI Description</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Edit the description below in your own language. You can also use voice typing!
                </p>

                {photoData && (
                  <div className="mb-6 rounded-2xl overflow-hidden h-40 bg-slate-100 relative">
                    <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="relative mb-6">
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-slate-700"
                    placeholder="Describe the issue..."
                  />
                  <button 
                    onClick={toggleListening}
                    className={`absolute bottom-4 right-4 p-3 rounded-xl flex items-center gap-2 shadow-sm transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value as NeedCategory)}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={verifyAndProceedToLocation}
                  disabled={isUploading}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? "Cross-Verifying with AI..." : "Verify & Continue"} <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <h3 className="text-xl font-black text-slate-800 font-mukta mb-2">Pin the Location</h3>
                <p className="text-slate-500 text-sm mb-6">
                  We've auto-detected your location. Adjust the pin exactly where the issue is.
                </p>

                <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6 relative z-0">
                  <LocationPicker
                    lat={location?.lat || 28.6139}
                    lng={location?.lng || 77.2090}
                    onChange={async (lat, lng) => {
                      setLocation({ lat, lng, address: "Fetching address..." });
                      const addr = await fetchAddress(lat, lng);
                      setLocation({ lat, lng, address: addr });
                    }}
                  />
                </div>

                {location?.address && (
                  <p className="text-sm font-medium text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" /> {location.address}
                  </p>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Submitting to Community..." : "Submit Report for Validation"}
                </button>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-12 text-center">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-800 font-mukta mb-2">Report filed</h3>

                {/* What Gemma actually decided, shown back to the resident.
                    A confirmation that only says "submitted" tells them nothing
                    about who is coming or when. */}
                {triageResult?.triage && (
                  <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-3 max-w-md mx-auto">
                    {triageResult.triage.summary_native && (
                      <p className="text-sm text-slate-800 font-semibold leading-relaxed">
                        {triageResult.triage.summary_native}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sent to</span>
                        <span className="font-bold text-slate-800">
                          {triageResult.triage.assignment_type === 'ngo'
                            ? 'A partner NGO'
                            : `RMC ${String(triageResult.triage.assigned_department || '').replace(/_/g, ' ')}`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Priority</span>
                        <span className="font-bold text-slate-800">{triageResult.triage.urgency_score} of 10</span>
                      </div>
                      {triageResult.triage.location && (
                        <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Location</span>
                          <span className="font-bold text-slate-800">{triageResult.triage.location.name}</span>
                        </div>
                      )}
                      {triageResult.dispatch?.action?.assignment?.worker && (
                        <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Crew</span>
                          <span className="font-bold text-slate-800">
                            {triageResult.dispatch.action.assignment.worker.name}
                          </span>
                        </div>
                      )}
                      {triageResult.dispatch?.action?.targetHours && (
                        <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Target</span>
                          <span className="font-bold text-slate-800">
                            within {triageResult.dispatch.action.targetHours} hours
                          </span>
                        </div>
                      )}
                    </div>

                    {triageResult.dispatch?.action?.kind === 'emergency' && (
                      <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                        Treated as an emergency. The control room has been paged.
                      </p>
                    )}

                    {triageResult.triage.needs_location_pin && (
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        We could not place this on the map from your description. Open it from your
                        reports and drop a pin so a crew can find it.
                      </p>
                    )}

                    {triageResult.triage._meta && (
                      <p className="text-[10px] text-slate-400 font-medium pt-1">
                        Read and routed by {triageResult.triage._meta.model} running{' '}
                        {triageResult.triage._meta.host === 'local' ? 'on this machine' : 'in the cloud'},
                        in {(triageResult.triage._meta.latencyMs / 1000).toFixed(1)}s.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => { setStep(1); setPhotoData(null); setDescription(''); setTriageResult(null); }}
                    className="px-8 py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Report another issue
                  </button>
                  <Link
                    href="/map"
                    className="px-8 py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors"
                  >
                    See it on the map
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
