'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useGovtStore } from '@/stores/govtStore';
import { UserRole } from '@/types';
import { Shield, Building2, UserCircle, Map, LayoutDashboard, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'otp' | 'dev'>('otp');
  const [clickCount, setClickCount] = useState(0);
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStep, setKycStep] = useState(1);
  const [mockPhone, setMockPhone] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [mockAadhar, setMockAadhar] = useState('');
  const [isKycLoading, setIsKycLoading] = useState(false);
  const router = useRouter();
  const loginAsDemo = useAuthStore(s => s.loginAsDemo);
  const activeCity = useGovtStore(s => s.activeCity);

  const getCorpName = () => {
    if (activeCity === 'rajkot') return 'RMC';
    if (activeCity === 'delhi') return 'City';
    return 'Global Mode (City)';
  };
  const corpName = getCorpName();

  const handleDemoLogin = (roleOrKey: string) => {
    if (roleOrKey === 'public') {
      router.push('/');
      return;
    }
    loginAsDemo(roleOrKey);
    toast.success(`Logged in successfully!`);
    
    // Redirect based on role or sub-identity key
    if (roleOrKey.startsWith('govt_') || roleOrKey === 'govt_officer') {
      router.push('/govt/dashboard');
    } else {
      switch (roleOrKey) {
        case 'citizen': router.push('/citizen/dashboard'); break;
        case 'volunteer': router.push('/volunteer/dashboard'); break;
        case 'ngo_coordinator': router.push('/ngo/dashboard'); break;
        case 'platform_admin': router.push('/admin/overview'); break;
        default: router.push('/');
      }
    }
  };

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone === 'ADMIN' && password === 'Admin_seva') {
      loginAsDemo('platform_admin');
      toast.success('Super Admin Mode: Global Access Granted', {
        icon: '🛡️',
        style: { background: '#1e1b4b', color: '#fff' }
      });
      window.location.href = '/admin/super';
    } else {
      toast.error('Invalid Developer Credentials');
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-[var(--border)]">
      {/* Left Panel - Branding */}
      <div className="w-full md:w-5/12 bg-[var(--sidebar-bg)] p-8 text-white flex flex-col justify-between">
        <div>
          <div 
            className="flex items-center gap-1 mb-8 cursor-pointer"
            onClick={() => {
              const newCount = clickCount + 1;
              setClickCount(newCount);
              if (newCount === 5) {
                setLoginMode('dev');
                toast('Developer Mode Unlocked', { icon: '🔓' });
              }
            }}
          >
            <span className="text-3xl font-bold font-mukta text-[var(--saffron)] select-none">Sahaayak</span>
          </div>
          <h2 className="text-2xl font-bold font-mukta mb-4">Connecting community needs to volunteers in minutes.</h2>
          <p className="text-gray-600 text-sm mb-8">
            Join thousands of volunteers and NGOs working together to create measurable impact across India.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-sm italic text-gray-300">"Sahaayak completely transformed how we respond during floods. We found volunteers in 10 minutes instead of hours."</p>
              <p className="text-xs text-[var(--saffron)] mt-2 font-bold">— Sanjeevani Relief NGO</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-sm italic text-gray-300">"I love being able to help out in my own neighborhood and track the real impact I'm making."</p>
              <p className="text-xs text-[var(--saffron)] mt-2 font-bold">— Arjun M., Field Engineer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col">
        
        {/* Demo Section */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-4">
            Try Sahaayak instantly (No signup needed)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <button 
              onClick={() => handleDemoLogin('ngo_coordinator')}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--teal)] bg-[var(--teal-light)] text-[var(--teal-dark)] hover:bg-[var(--teal)] hover:text-white transition-all text-left"
            >
              <Building2 size={24} />
              <div>
                <p className="font-bold font-mukta">NGO Coordinator</p>
                <p className="text-xs opacity-80">Disha Foundation</p>
              </div>
            </button>
            
            <button 
              onClick={() => {
                setMockPhone('+91 ');
                setMockOtp('');
                setKycStep(1);
                setShowKycModal(true);
              }}
              className="flex items-center gap-3 p-3 rounded-xl border border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-600 hover:text-white transition-all text-left"
            >
              <Shield size={24} />
              <div>
                <p className="font-bold font-mukta text-xs">Verified Citizen</p>
                <p className="text-[10px] opacity-80 flex items-center gap-1">Aadhar KYC <CheckCircle2 size={10} /></p>
              </div>
            </button>
            
            <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-3 mt-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🏢 {corpName} Municipal Roles (Choose a specific tier):</p>
            </div>

            {/* City Engineer (God eye view) */}
            <button 
              onClick={() => handleDemoLogin('govt_officer')}
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-900 hover:from-blue-600 hover:to-indigo-600 hover:text-white transition-all text-left shadow-md col-span-1 sm:col-span-2 group"
            >
              <Shield size={28} className="text-blue-600 group-hover:text-white transition-colors" />
              <div>
                <p className="font-extrabold font-mukta text-xs flex items-center gap-1.5 text-blue-950 group-hover:text-white transition-colors">
                  👑 {corpName} City Engineer's Portal 
                  <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black group-hover:bg-white/20 group-hover:text-white">CITY ENGINEER</span>
                </p>
                <p className="text-[9px] opacity-80 font-semibold mt-0.5 text-slate-600 group-hover:text-blue-100 transition-colors">Chief City Engineer, Dr. Kavita Patel — City KPIs, AI balances, global operations.</p>
              </div>
            </button>

            {/* City Department HOD */}
            <button 
              onClick={() => handleDemoLogin('govt_worker_pwd')}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-950 hover:bg-indigo-650 hover:text-white transition-all text-left group"
            >
              <Building2 size={24} className="text-indigo-600 group-hover:text-white" />
              <div>
                <p className="font-extrabold font-mukta text-xs text-indigo-950 group-hover:text-white">🏢 PWD Roads Director</p>
                <p className="text-[9px] opacity-80 font-medium text-slate-500 group-hover:text-indigo-100">Rajesh Kumar — Scoped PWD crew dispatches, HOD directives.</p>
              </div>
            </button>

            {/* City Field Technician */}
            <button 
              onClick={() => handleDemoLogin('govt_employee_pwd')}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-250 bg-emerald-50/50 text-emerald-950 hover:bg-emerald-650 hover:text-white transition-all text-left group"
            >
              <UserCircle size={24} className="text-emerald-700 group-hover:text-white" />
              <div>
                <p className="font-extrabold font-mukta text-xs text-emerald-950 group-hover:text-white">👷 PWD Field Engineers</p>
                <p className="text-[9px] opacity-80 font-medium text-slate-655 group-hover:text-emerald-100">PWD Field Engineers — Resolve dispatches, live GPS tracker.</p>
              </div>
            </button>
            
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Platform Admin Access</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-inner mb-2 group transition-all hover:border-slate-300">
          <form onSubmit={handleDevLogin} className="space-y-4 max-w-sm mx-auto w-full">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">System Admin ID</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Hint: ADMIN"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Secure Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hint: Admin_seva"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>
            <button type="submit" className="w-full justify-center py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95 mt-2">
              <LayoutDashboard size={16} className="text-emerald-400" /> Authorize Super Admin
            </button>
          </form>
        </div>
      </div>

      {/* KYC MOCK MODAL */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold font-mukta mb-1">Citizen Verification</h3>
            <p className="text-xs text-gray-500 mb-6">As per new City guidelines, KYC is required to prevent false reports.</p>
            
            {kycStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enter Mobile Number</label>
                  <input type="tel" value={mockPhone} onChange={e => setMockPhone(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 XXXXX XXXXX" />
                </div>
                <button onClick={() => {
                  const digits = mockPhone.replace(/\D/g, '');
                  if(digits.length < 10) { toast.error('Enter a valid 10 digit phone number'); return; }
                  setIsKycLoading(true);
                  setTimeout(() => { 
                    setIsKycLoading(false); 
                    setKycStep(2); 
                    toast.success('OTP sent via SMS!'); 
                  }, 800);
                }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">{isKycLoading ? 'Sending...' : 'Send OTP'}</button>
              </div>
            )}
            
            {kycStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-digit OTP</label>
                  <input type="text" value={mockOtp} onChange={e => setMockOtp(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg" placeholder="------" maxLength={6} />
                </div>
                <button onClick={() => {
                  if(mockOtp.length < 4) { toast.error('Enter the OTP'); return; }
                  setIsKycLoading(true);
                  setTimeout(() => {
                    setIsKycLoading(false);
                    const cleanPhone = mockPhone.replace(/\D/g, '');
                    if (cleanPhone.includes('7575063381')) {
                      toast.success('Logged in successfully!');
                      setShowKycModal(false);
                      handleDemoLogin('citizen');
                    } else {
                      setKycStep(4);
                    }
                  }, 800);
                }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">{isKycLoading ? 'Verifying...' : 'Verify OTP'}</button>
              </div>
            )}
            
            {kycStep === 4 && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield size={32} />
                </div>
                <h4 className="font-bold text-red-600">KYC Not Verified</h4>
                <p className="text-sm text-slate-600">
                  This phone number is not linked with an Aadhar KYC profile. To prevent false reports, you must verify your identity first.
                </p>
                <a 
                  href="https://myaadhaar.uidai.gov.in/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Verify at UIDAI Official Website
                </a>
                <button 
                  onClick={() => setShowKycModal(false)}
                  className="block w-full text-slate-500 text-sm font-bold mt-2 hover:text-slate-700"
                >
                  Cancel Login
                </button>
              </div>
            )}
            
            <button onClick={() => setShowKycModal(false)} className="w-full mt-3 py-2 text-xs text-gray-500 hover:text-gray-800 font-bold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
