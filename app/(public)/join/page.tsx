'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Check, MapPin, Navigation, Mail, Phone, User, CheckCircle2 } from 'lucide-react';
import { SKILLS_LIST, SUPPORTED_LANGUAGES, CITIES } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ConfettiCelebration } from '@/components/shared/ConfettiCelebration';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false, loading: () => <div className="h-[300px] w-full bg-[var(--surface-2)] animate-pulse rounded-xl" /> });

export default function JoinPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const loginAsDemo = useAuthStore(s => s.loginAsDemo);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    skills: [] as string[],
    languages: ['en', 'hi'] as string[],
    lat: CITIES[0].lat,
    lng: CITIES[0].lng,
    radius: 5,
    availability: {} as Record<string, boolean>,
  });

  const [showConfetti, setShowConfetti] = useState(false);

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.phone)) {
      toast.error('Name and Phone are required.');
      return;
    }
    if (step === 2 && formData.skills.length < 2) {
      toast.error('Please select at least 2 skills.');
      return;
    }
    setStep(s => Math.min(5, s + 1));
  };
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleLanguage = (code: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(code) 
        ? prev.languages.filter(l => l !== code)
        : [...prev.languages, code]
    }));
  };

  const toggleAvailability = (day: string, period: string) => {
    const key = `${day}_${period}`;
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key]
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are compulsory to join as a volunteer.');
      setStep(1);
      return;
    }

    if (formData.skills.length < 2) {
      toast.error('Please select at least 2 skills.');
      setStep(2);
      return;
    }

    try {
      const volunteerRef = doc(collection(db, 'volunteers'));
      await setDoc(volunteerRef, {
        ...formData,
        id: volunteerRef.id,
        role: 'volunteer',
        created_at: new Date().toISOString(),
        is_active: true
      });
      
      setShowConfetti(true);
    } catch (error: any) {
      toast.error('Failed to register: ' + error.message);
    }
  };

  const handleFinish = () => {
    loginAsDemo('volunteer');
    router.push('/volunteer/dashboard');
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = ['Morning', 'Afternoon', 'Evening'];

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {showConfetti && <ConfettiCelebration onComplete={handleFinish} message="Welcome to Sahaayak, Arjun!" />}
      
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative relative z-10">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[var(--border)] -z-10" />
          <div 
            className="absolute left-0 top-1/2 h-0.5 bg-[var(--saffron)] -z-10 transition-all duration-500" 
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
          
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                  step >= i 
                    ? 'bg-[var(--saffron)] text-white shadow-lg' 
                    : 'bg-[var(--surface)] text-[var(--ink-faint)] border border-[var(--border)]'
                }`}
              >
                {step > i ? <Check size={18} /> : i}
              </div>
              <span className={`text-xs mt-2 font-medium ${step >= i ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]'}`}>
                {i === 1 ? 'Account' : i === 2 ? 'Skills' : i === 3 ? 'Location' : i === 4 ? 'Availability' : 'Success'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-8 overflow-hidden relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={1}>
          
          {step === 1 && (
            <motion.div key="step1" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <h2 className="text-2xl font-bold font-mukta">Create your account</h2>
              <p className="text-[var(--ink-muted)] text-sm mb-6">Enter your details to get started.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" size={18} />
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[var(--saffron-glow)] focus:border-[var(--saffron)] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" size={18} />
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] text-sm">+91</span>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-17 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[var(--saffron-glow)] focus:border-[var(--saffron)] outline-none" placeholder="98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" size={18} />
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[var(--saffron-glow)] focus:border-[var(--saffron)] outline-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <h2 className="text-2xl font-bold font-mukta">What are your skills?</h2>
              <p className="text-[var(--ink-muted)] text-sm mb-6">Select at least 2 skills to help us match you with the right tasks.</p>
              
              <div className="flex flex-wrap gap-3">
                {SKILLS_LIST.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-full text-sm font-medium lowercase transition-colors ${
                      formData.skills.includes(skill)
                        ? 'bg-[var(--saffron)] text-white'
                        : 'bg-[var(--surface-2)] text-[var(--ink-muted)] hover:bg-[var(--surface-3)]'
                    }`}
                  >
                    {skill.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <h2 className="text-2xl font-bold font-mukta">Location & Languages</h2>
              
              <div>
                <label className="block text-sm font-medium mb-3">Languages you speak</label>
                <div className="flex flex-wrap gap-2 mb-8">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                        formData.languages.includes(lang.code)
                          ? 'border-[var(--saffron)] bg-[var(--saffron-light)] text-[var(--saffron-dark)]'
                          : 'border-[var(--border)] bg-transparent text-[var(--ink-muted)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Where can you volunteer?</label>
                  <button className="text-xs text-[var(--saffron)] font-medium flex items-center gap-1">
                    <Navigation size={12} /> Use GPS
                  </button>
                </div>
                <LocationPicker 
                  lat={formData.lat} 
                  lng={formData.lng} 
                  onChange={(lat, lng) => setFormData({...formData, lat, lng})} 
                  showRadius 
                  radiusKm={formData.radius} 
                />
                
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--ink-muted)]">Coverage Radius</label>
                    <span className="text-sm font-bold text-[var(--saffron)]">{formData.radius} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="50" 
                    value={formData.radius}
                    onChange={(e) => setFormData({...formData, radius: parseInt(e.target.value)})}
                    className="w-full accent-[var(--saffron)]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <h2 className="text-2xl font-bold font-mukta">Your Availability</h2>
              <p className="text-[var(--ink-muted)] text-sm mb-6">Tap the times you are usually free to volunteer.</p>
              
              <div className="overflow-x-auto pb-4">
                <table className="w-full border-collapse min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="p-2 border-b border-[var(--border)]"></th>
                      {days.map(day => <th key={day} className="p-2 border-b border-[var(--border)] text-sm font-medium text-[var(--ink-muted)]">{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period}>
                        <td className="p-2 text-sm font-medium text-[var(--ink-muted)]">{period}</td>
                        {days.map(day => {
                          const isSelected = formData.availability[`${day}_${period.toLowerCase()}`];
                          return (
                            <td key={day} className="p-1">
                              <button
                                onClick={() => toggleAvailability(day, period.toLowerCase())}
                                className={`w-full h-12 rounded-lg transition-colors border ${
                                  isSelected 
                                    ? 'bg-[var(--saffron)] border-[var(--saffron)] shadow-sm' 
                                    : 'bg-[var(--surface-2)] border-transparent hover:bg-[var(--surface-3)]'
                                }`}
                              >
                                {isSelected && <Check size={16} className="mx-auto text-white" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 text-center py-8">
              <div className="w-24 h-24 rounded-full bg-[var(--low-light)] text-[var(--low)] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold font-mukta text-[var(--ink)]">You're all set!</h2>
              <p className="text-[var(--ink-muted)] text-lg">Your volunteer profile is complete.</p>
              
              <div className="max-w-sm mx-auto bg-[var(--surface-2)] p-6 rounded-xl mt-8 text-left">
                <h4 className="font-bold font-mukta mb-4">Your Profile Highlights</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between border-b pb-2">
                    <span className="text-[var(--ink-muted)]">Skills</span>
                    <span className="font-semibold">{formData.skills.length} added</span>
                  </li>
                  <li className="flex justify-between border-b pb-2">
                    <span className="text-[var(--ink-muted)]">Languages</span>
                    <span className="font-semibold">{formData.languages.join(', ').toUpperCase()}</span>
                  </li>
                  <li className="flex justify-between border-b pb-2">
                    <span className="text-[var(--ink-muted)]">Coverage</span>
                    <span className="font-semibold">{formData.radius} km radius</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-between">
          {step > 1 && step < 5 ? (
            <button onClick={handlePrev} className="btn-ghost">Back</button>
          ) : <div />}
          
          {step < 4 && (
            <button 
              onClick={handleNext} 
              className="btn-primary"
              disabled={step === 2 && formData.skills.length < 2}
            >
              Continue
            </button>
          )}
          {step === 4 && (
            <button onClick={handleSubmit} className="btn-primary">Complete Signup</button>
          )}
          {step === 5 && (
            <button onClick={handleFinish} className="btn-primary w-full justify-center text-lg py-4">Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
}
