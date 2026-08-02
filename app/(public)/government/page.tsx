'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Building2, MapPin, AlertTriangle, ShieldAlert, Award, FileText, 
  BarChart3, RefreshCw, ChevronRight, X, Flame, Shield, ArrowRight,
  TrendingUp, TrendingDown, Minus, ThumbsUp, Activity, CheckCircle2, CloudRain
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line
} from 'recharts';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet map to prevent SSR issues
const FailureMap = dynamic(() => import('@/components/government/FailureMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-slate-900 rounded-[2rem] border border-slate-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold">Configuring Geospatial Node Overlays...</p>
      </div>
    </div>
  )
});

// Floating AI assistant component imported dynamically
const CivicPulseAI = dynamic(() => import('@/components/shared/CivicPulseAI'), { ssr: false });

export const initialCityData = {
  Ahmedabad: [
    { id: 'w1', name: 'Ward 1 Satellite', open: 4, red: 1, amber: 1, green: 2, sla: 94, top: 'Streetlight outage near Sarkhej-Gandhinagar Highway' },
    { id: 'w2', name: 'Ward 2 Bodakdev', open: 11, red: 5, amber: 4, green: 2, sla: 61, top: 'Sewage overflow on 100 Feet Road — 3 days unresolved' },
    { id: 'w3', name: 'Ward 3 Maninagar', open: 7, red: 2, amber: 3, green: 2, sla: 78, top: 'Pothole cluster near railway crossing — reported 9 times' },
    { id: 'w4', name: 'Ward 4 Naroda', open: 14, red: 8, amber: 4, green: 2, sla: 43, top: 'Illegal dumping near industrial area — satellite flagged' },
    { id: 'w5', name: 'Ward 5 Vejalpur', open: 3, red: 0, amber: 1, green: 2, sla: 97, top: 'Park maintenance request — benches broken' },
    { id: 'w6', name: 'Ward 6 Prahladnagar', open: 8, red: 4, amber: 3, green: 1, sla: 72, top: 'Drain blockage before monsoon — flood risk detected' }
  ],
  Delhi: [
    { id: 'r1', name: 'Ward A Mavdi', open: 3, red: 0, amber: 1, green: 2, sla: 96, top: 'Water pressure drop near Mavdi Circle main valve' },
    { id: 'r2', name: 'Ward B Amin Marg', open: 9, red: 4, amber: 3, green: 2, sla: 68, top: 'Drainage blockage behind crystal mall complex' },
    { id: 'r3', name: 'Ward C Kalavad Road', open: 6, red: 2, amber: 2, green: 2, sla: 84, top: 'Streetlight cluster failure near Kotecha Chowk' },
    { id: 'r4', name: 'Ward D Yagnik Road', open: 12, red: 6, amber: 4, green: 2, sla: 50, top: 'Pothole cluster reported near Imperial palace hotel' },
    { id: 'r5', name: 'Ward E Kotecha', open: 2, red: 0, amber: 0, green: 2, sla: 98, top: 'Garbage bins replacement request near girls high school' },
    { id: 'r6', name: 'Ward F Nana Mava', open: 5, red: 1, amber: 2, green: 2, sla: 88, top: 'Illegal debris dumping reported on Nana Mava bypass' }
  ],
  Surat: [
    { id: 's1', name: 'Ward 1 Adajan', open: 5, red: 1, amber: 2, green: 2, sla: 92, top: 'Minor gas pipe check near Star Bazaar crossroads' },
    { id: 's2', name: 'Ward 2 Vesu', open: 10, red: 5, amber: 3, green: 2, sla: 65, top: 'Garbage dump near public garden main entrance' },
    { id: 's3', name: 'Ward 3 Varachha', open: 8, red: 3, amber: 3, green: 2, sla: 75, top: 'Asphalt crumbling near Varachha railway bypass' },
    { id: 's4', name: 'Ward 4 Katargam', open: 13, red: 7, amber: 4, green: 2, sla: 48, top: 'Water pipeline leakage reported in cluster GIDC' },
    { id: 's5', name: 'Ward 5 Athwa', open: 3, red: 0, amber: 1, green: 2, sla: 97, top: 'Park maintenance and benches broken' },
    { id: 's6', name: 'Ward 6 Dindoli', open: 6, red: 2, amber: 2, green: 2, sla: 80, top: 'Drain blockage near low lying residential sectors' }
  ],
  Vadodara: [
    { id: 'v1', name: 'Ward A Alkapuri', open: 4, red: 1, amber: 1, green: 2, sla: 93, top: 'Streetlight outage near Sayajiganj underpass' },
    { id: 'v2', name: 'Ward B Sayajiganj', open: 11, red: 5, amber: 4, green: 2, sla: 60, top: 'Sewage overflow on main road — 2 days unresolved' },
    { id: 'v3', name: 'Ward C Akota', open: 7, red: 2, amber: 3, green: 2, sla: 81, top: 'Potholes cluster near Akota Bridge access loop' },
    { id: 'v4', name: 'Ward D Gotri', open: 12, red: 7, amber: 3, green: 2, sla: 52, top: 'Illegal debris dump near new corporate towers' },
    { id: 'v5', name: 'Ward E Fatehgunj', open: 2, red: 0, amber: 1, green: 1, sla: 98, top: 'Garbage bin overflow near university gate' },
    { id: 'v6', name: 'Ward F Makarpura', open: 8, red: 3, amber: 3, green: 2, sla: 73, top: 'Pipeline leakage in Makarpura GIDC Sector 3' }
  ],
  Gandhinagar: [
    { id: 'g1', name: 'Sector 21 Node', open: 3, red: 0, amber: 1, green: 2, sla: 97, top: 'Minor water pipe seepage near Sector 21 market' },
    { id: 'g2', name: 'Sector 11 Node', open: 8, red: 3, amber: 3, green: 2, sla: 74, top: 'Drainage line check near Sachivalaya Gate 4' },
    { id: 'g3', name: 'Sector 7 Node', open: 5, red: 1, amber: 2, green: 2, sla: 89, top: 'Streetlight flickering complaints near sector park' },
    { id: 'g4', name: 'Sector 24 Node', open: 10, red: 5, amber: 3, green: 2, sla: 62, top: 'Road surface patch repairs needed on Sector 24 access' },
    { id: 'g5', name: 'Sector 30 Node', open: 2, red: 0, amber: 0, green: 2, sla: 99, top: 'Minor foliage cleanup requested near Sector 30' },
    { id: 'g6', name: 'Sector 2 Node', open: 4, red: 1, amber: 2, green: 1, sla: 91, top: 'Garbage dump clearance near community hall entrance' }
  ]
};

export default function GovernmentDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const allowedRoles = ['govt_officer', 'govt_employee', 'super_admin', 'platform_admin'];
      if (!isAuthenticated || !allowedRoles.includes(user?.role || '')) {
        toast.error("Access Denied: City Engineer (God eye view) clearance required.", { id: 'auth-err' });
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [activeCellData, setActiveCellData] = useState<{ ward: string; category: string; complaints: string[] } | null>(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, boolean>>({});

  const [cityWards, setCityWards] = useState<Record<string, Array<{ id: string; name: string; open: number; red: number; amber: number; green: number; sla: number; top: string }>>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sahaayak_city_wards');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return initialCityData;
  });

  useEffect(() => {
    localStorage.setItem('sahaayak_city_wards', JSON.stringify(cityWards));
  }, [cityWards]);

  const currentWards = cityWards[selectedCity as keyof typeof cityWards] || cityWards['Ahmedabad'] || [];

  const [editingWard, setEditingWard] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(0);
  const [editRed, setEditRed] = useState(0);
  const [editAmber, setEditAmber] = useState(0);
  const [editGreen, setEditGreen] = useState(0);
  const [editSla, setEditSla] = useState(0);
  const [editTop, setEditTop] = useState('');

  useEffect(() => {
    if (editingWard) {
      setEditOpen(editingWard.open);
      setEditRed(editingWard.red);
      setEditAmber(editingWard.amber);
      setEditGreen(editingWard.green);
      setEditSla(editingWard.sla);
      setEditTop(editingWard.top);
    }
  }, [editingWard]);

  const handleSaveWard = () => {
    if (!editingWard) return;
    const updated = {
      ...editingWard,
      open: editOpen,
      red: editRed,
      amber: editAmber,
      green: editGreen,
      sla: editSla,
      top: editTop
    };

    setCityWards(prev => {
      const list = prev[selectedCity as keyof typeof prev] || [];
      const updatedList = list.map(w => w.id === editingWard.id ? updated : w);
      const newCityWards = {
        ...prev,
        [selectedCity]: updatedList
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sahaayak_city_wards', JSON.stringify(newCityWards));
      }
      return newCityWards;
    });

    setEditingWard(null);
    toast.success(`Updated ${editingWard.name} successfully!`, { icon: '📝' });
  };

  // Wards details list for the Slide-in Drawer
  const wardIssues: Record<string, Array<{ id: string; title: string; category: string; severity: 'high' | 'medium' | 'low'; time: string; status: string }>> = {
    'Ward 1 Satellite': [
      { id: 'iss-s1', title: 'Streetlight outage near Sarkhej-Gandhinagar Highway', category: 'Streetlights', severity: 'medium', time: '14 hours open', status: 'In Progress' },
      { id: 'iss-s2', title: 'Pothole on secondary bypass road', category: 'Roads', severity: 'low', time: '2 days open', status: 'Open' },
      { id: 'iss-s3', title: 'Garbage dump near public school entrance', category: 'Waste Management', severity: 'high', time: '6 hours open', status: 'Dispatched' }
    ],
    'Ward 2 Bodakdev': [
      { id: 'iss-b1', title: 'Sewage overflow on 100 Feet Road — 3 days unresolved', category: 'Drains', severity: 'high', time: '3 days open', status: 'Open' },
      { id: 'iss-b2', title: 'Major leakage in main water feed pipeline', category: 'Water Supply', severity: 'high', time: '24 hours open', status: 'In Progress' },
      { id: 'iss-b3', title: 'Streetlight feeder line short circuit on SG Road', category: 'Streetlights', severity: 'medium', time: '5 days open', status: 'Open' },
      { id: 'iss-b4', title: 'Encroachment of illegal commercial stalls on footpath', category: 'Roads', severity: 'high', time: '4 days open', status: 'Open' }
    ],
    'Ward 3 Maninagar': [
      { id: 'iss-m1', title: 'Pothole cluster near railway crossing — reported 9 times', category: 'Roads', severity: 'high', time: '6 days open', status: 'Open' },
      { id: 'iss-m2', title: 'Drain overflow causing street muddy water build-up', category: 'Drains', severity: 'medium', time: '18 hours open', status: 'Dispatched' }
    ],
    'Ward 4 Naroda': [
      { id: 'iss-n1', title: 'Illegal dumping near industrial area — satellite flagged', category: 'Waste Management', severity: 'high', time: '4 days open', status: 'Open' },
      { id: 'iss-n2', title: 'Water contamination supply issues in residential block B', category: 'Water Supply', severity: 'high', time: '3 days open', status: 'Open' },
      { id: 'iss-n3', title: 'Drain backup near GIDC industrial estate gates', category: 'Drains', severity: 'medium', time: '2 days open', status: 'In Progress' }
    ],
    'Ward 5 Vejalpur': [
      { id: 'iss-v1', title: 'Park maintenance request — benches broken', category: 'Roads', severity: 'low', time: '4 days open', status: 'Open' },
      { id: 'iss-v2', title: 'Garbage bins overflow in public community center parking lot', category: 'Waste Management', severity: 'medium', time: '12 hours open', status: 'Dispatched' }
    ],
    'Ward 6 Prahladnagar': [
      { id: 'iss-p1', title: 'Drain blockage before monsoon — flood risk detected', category: 'Drains', severity: 'high', time: '3 days open', status: 'Open' },
      { id: 'iss-p2', title: 'Illegal parking blocking fire hydrant access', category: 'Roads', severity: 'medium', time: '6 hours open', status: 'Open' },
      { id: 'iss-p3', title: 'Pothole cluster near Prahladnagar Crossroads — 2 vehicles damaged', category: 'Roads', severity: 'high', time: '1 day open', status: 'Open' }
    ]
  };

  // Section B Grid Table seed
  const healthTwinData = [
    { ward: 'Ward 1 Satellite', roads: 'green', drains: 'green', lights: 'amber', water: 'green', waste: 'green' },
    { ward: 'Ward 2 Bodakdev', roads: 'red', drains: 'red', lights: 'amber', water: 'red', waste: 'amber' },
    { ward: 'Ward 3 Maninagar', roads: 'red', drains: 'amber', lights: 'green', water: 'green', waste: 'green' },
    { ward: 'Ward 4 Naroda', roads: 'amber', drains: 'red', lights: 'red', water: 'red', waste: 'red' },
    { ward: 'Ward 5 Vejalpur', roads: 'green', drains: 'green', lights: 'green', water: 'green', waste: 'amber' },
    { ward: 'Ward 6 Prahladnagar', roads: 'red', drains: 'red', lights: 'green', water: 'green', waste: 'green' }
  ];

  // Map category code to human readable complaints for cell click
  const getCellComplaints = (ward: string, category: string): string[] => {
    const list = wardIssues[ward] || [];
    const catMap: Record<string, string> = {
      roads: 'Roads',
      drains: 'Drains',
      lights: 'Streetlights',
      water: 'Water Supply',
      waste: 'Waste Management'
    };
    return list.filter(item => item.category === catMap[category]).map(item => item.title);
  };

  const handleCellClick = (ward: string, category: string, status: string) => {
    if (status === 'green') return; // Only show for problematic cells
    const complaints = getCellComplaints(ward, category);
    setActiveCellData({
      ward,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      complaints: complaints.length > 0 ? complaints : ['1 unresolved complaint pending in this category']
    });
  };

  // Section C actions
  const handleDispatchDrain = (wardId: string, alertText: string) => {
    setDispatchStatus(prev => ({ ...prev, [wardId]: true }));
    toast.success(`Success: Emergency drainage team dispatched to ${alertText}`, { icon: '⚡' });
  };

  const handleApproveAllTasks = () => {
    toast.success('3 tasks dispatched to Ward 6 sanitation team', { icon: '🚨' });
  };

  // Section D actions
  const [modalPrediction, setModalPrediction] = useState<string | null>(null);
  const handleCreatePreventive = (title: string) => {
    setModalPrediction(title);
  };

  const confirmPreventive = () => {
    toast.success(`Work order created for ${modalPrediction} preventive repair`, { icon: '🛠️' });
    setModalPrediction(null);
  };

  // Section H Citizen engagement chart data
  const chartData = [
    { name: 'Ward 5 Vejalpur', Score: 91, Reporters: 847, Upvotes: 1240 },
    { name: 'Ward 1 Satellite', Score: 82, Reporters: 623, Upvotes: 987 },
    { name: 'Ward 3 Maninagar', Score: 68, Reporters: 441, Upvotes: 634 },
    { name: 'Ward 6 Prahladnagar', Score: 61, Reporters: 387, Upvotes: 521 },
    { name: 'Ward 2 Bodakdev', Score: 44, Reporters: 298, Upvotes: 334 },
    { name: 'Ward 4 Naroda', Score: 31, Reporters: 187, Upvotes: 201 }
  ];

  if (!isAuthenticated || user?.role !== 'govt_officer') {
    return (
      <div className="bg-slate-950 min-h-screen text-slate-100 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Verifying secure credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans pb-24 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-extrabold font-mukta text-white">
                Municipal Commissioner View — {selectedCity}
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Ward-level open queues and active Service Level Agreement metrics
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target City Node</span>
                <select 
                  value={selectedCity} 
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-teal-400 font-bold text-xs rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="Ahmedabad">Ahmedabad Hub</option>
                  <option value="Delhi">Delhi Hub</option>
                  <option value="Surat">Surat Hub</option>
                  <option value="Vadodara">Vadodara Hub</option>
                  <option value="Gandhinagar">Gandhinagar Hub</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentWards.map((ward) => (
              <div 
                key={ward.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/20 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-slate-200">{ward.name}</h3>
                    <span className={`text-2xl font-black ${ward.open < 5 ? 'text-emerald-400' : ward.open <= 10 ? 'text-amber-400' : 'text-rose-500'}`}>
                      {ward.open}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity:</span>
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex items-center justify-center text-[7px] text-white font-black">{ward.red}</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex items-center justify-center text-[7px] text-white font-black">{ward.amber}</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[7px] text-white font-black">{ward.green}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>SLA Compliance</span>
                      <span className={ward.sla < 60 ? 'text-rose-400' : 'text-teal-400'}>{ward.sla}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${ward.sla < 65 ? 'bg-rose-500' : 'bg-teal-500'}`} 
                        style={{ width: `${ward.sla}%` }} 
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Incident</p>
                    <p className="text-xs text-slate-300 font-semibold truncate mt-1">{ward.top}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedWard(ward.name);
                      setIsSlideOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-teal-950 border border-slate-800 hover:border-teal-500/20 text-slate-300 hover:text-teal-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    View Ward <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => setEditingWard(ward)}
                    className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center"
                    title="Edit Ward Data"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION B — WARD INFRASTRUCTURE HEALTH TWIN */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white">
              Ward Infrastructure Health — Live
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Real-time health grids across civic departments. Click on warning/alert cells to inspect.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800/80">
            <table className="w-full border-collapse bg-slate-950/60 text-left text-xs font-medium text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Ward / Sub-Department</th>
                  <th className="px-6 py-4">Roads</th>
                  <th className="px-6 py-4">Drains</th>
                  <th className="px-6 py-4">Streetlights</th>
                  <th className="px-6 py-4">Water Supply</th>
                  <th className="px-6 py-4">Waste Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {healthTwinData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-slate-200">{row.ward}</td>
                    
                    {/* Roads cell */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleCellClick(row.ward, 'roads', row.roads)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider transition-all cursor-pointer ${
                          row.roads === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          row.roads === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        {row.roads === 'green' ? 'Healthy' : row.roads === 'amber' ? 'Warning' : 'Critical'}
                      </button>
                    </td>

                    {/* Drains cell */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleCellClick(row.ward, 'drains', row.drains)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider transition-all cursor-pointer ${
                          row.drains === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          row.drains === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        {row.drains === 'green' ? 'Healthy' : row.drains === 'amber' ? 'Warning' : 'Critical'}
                      </button>
                    </td>

                    {/* Streetlights cell */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleCellClick(row.ward, 'lights', row.lights)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider transition-all cursor-pointer ${
                          row.lights === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          row.lights === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        {row.lights === 'green' ? 'Healthy' : row.lights === 'amber' ? 'Warning' : 'Critical'}
                      </button>
                    </td>

                    {/* Water cell */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleCellClick(row.ward, 'water', row.water)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider transition-all cursor-pointer ${
                          row.water === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          row.water === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        {row.water === 'green' ? 'Healthy' : row.water === 'amber' ? 'Warning' : 'Critical'}
                      </button>
                    </td>

                    {/* Waste cell */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleCellClick(row.ward, 'waste', row.waste)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider transition-all cursor-pointer ${
                          row.waste === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          row.waste === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        {row.waste === 'green' ? 'Healthy' : row.waste === 'amber' ? 'Warning' : 'Critical'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* CELL POPOVER DETAILS DISPLAY */}
          {/* ========================================================================= */}
          {activeCellData && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] w-[90%] max-w-md bg-slate-900 border border-teal-500/30 shadow-2xl p-6 rounded-[2rem] animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-teal-400">{activeCellData.ward}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeCellData.category} Issues</p>
                </div>
                <button 
                  onClick={() => setActiveCellData(null)}
                  className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto">
                {activeCellData.complaints.map((item, index) => (
                  <div key={index} className="flex gap-2 text-xs">
                    <span className="text-teal-400 font-bold shrink-0">#{index+1}</span>
                    <p className="font-medium leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setSelectedWard(activeCellData.ward);
                  setActiveCellData(null);
                  setIsSlideOpen(true);
                }}
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-mukta font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Inspect All Ward Tasks <ArrowRight size={14} />
              </button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION C — AI FLOOD & WEATHER RISK INTELLIGENCE */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white flex items-center gap-2">
              <CloudRain className="text-teal-400" size={24} /> Monsoon Risk Intelligence — Next 72 Hours
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Predictive models cross-referencing open drainage backlogs with forecasted weather indices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: High Risk */}
            <div className="bg-slate-900/80 border border-rose-500/20 hover:border-rose-500/40 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-rose-500/10 text-rose-400 border-l border-b border-rose-500/20 text-[9px] font-black uppercase tracking-widest rounded-bl-xl">
                High Risk
              </div>
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-200">Prahladnagar (Ward 6)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Rain forecast: <span className="text-rose-400">28mm in next 24 hours</span>. 4 open drain complaints in this ward. 2 of those are near low-lying areas. AI predicts severe flooding risk if drains are not cleared before 6 PM today.
                </p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1"><CloudRain size={10} /> AI Auto-Tasks</span>
                  <ul className="space-y-1 text-[11px] font-semibold text-slate-300">
                    <li>1. Clear drain blockage, Judges Bungalow Road</li>
                    <li>2. Inspect storm drain near Prahladnagar Circle</li>
                    <li>3. Alert sanitation team for Ward 6</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button 
                  onClick={() => handleDispatchDrain('w6', 'Ward 6 Prahladnagar')}
                  disabled={dispatchStatus['w6']}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
                    dispatchStatus['w6'] ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-teal-700 hover:bg-teal-600 text-white'
                  }`}
                >
                  {dispatchStatus['w6'] ? '✓ Dispatched Drainage Team' : 'Dispatch Drain Team'}
                </button>
                <button 
                  onClick={handleApproveAllTasks}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Approve All Tasks
                </button>
              </div>
            </div>

            {/* Card 2: Medium Risk */}
            <div className="bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-amber-500/10 text-amber-400 border-l border-b border-amber-500/20 text-[9px] font-black uppercase tracking-widest rounded-bl-xl">
                Moderate Risk
              </div>
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-200">Naroda (Ward 4)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Rain forecast: <span className="text-amber-400">18mm in 48 hours</span>. Industrial drain complaints near GIDC area. Overflow risk is moderate. Ground teams advised to perform spot clearance check.
                </p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1"><CloudRain size={10} /> AI Auto-Tasks</span>
                  <ul className="space-y-1 text-[11px] font-semibold text-slate-300">
                    <li>1. Clear industrial silt near GIDC Gates</li>
                    <li>2. Test pressure levels at Naroda Pump station</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button 
                  onClick={() => handleDispatchDrain('w4', 'Ward 4 Naroda GIDC')}
                  disabled={dispatchStatus['w4']}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
                    dispatchStatus['w4'] ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-teal-700 hover:bg-teal-600 text-white'
                  }`}
                >
                  {dispatchStatus['w4'] ? '✓ Dispatched Drainage Team' : 'Dispatch Drain Team'}
                </button>
              </div>
            </div>

            {/* Card 3: Low Risk */}
            <div className="bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-emerald-500/10 text-emerald-400 border-l border-b border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-bl-xl">
                Low Risk
              </div>
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-200">Bodakdev (Ward 2)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Rain forecast: <span className="text-emerald-400">12mm in next 72 hours</span>. Open drain complaints are located in elevated areas. Low flood risk, but SLA breaches on water piping remain high priority.
                </p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1"><CloudRain size={10} /> AI Auto-Tasks</span>
                  <ul className="space-y-1 text-[11px] font-semibold text-slate-300">
                    <li>1. Relocate standby valve crews to SG Highway</li>
                    <li>2. Conduct minor visual inspection on open pipelines</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button 
                  onClick={() => handleDispatchDrain('w2', 'Ward 2 Bodakdev')}
                  disabled={dispatchStatus['w2']}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
                    dispatchStatus['w2'] ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-teal-700 hover:bg-teal-600 text-white'
                  }`}
                >
                  {dispatchStatus['w2'] ? '✓ Dispatched Drainage Team' : 'Dispatch Drain Team'}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION D — PREDICTIVE INFRASTRUCTURE FAILURE MAP */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white">
              Predicted Infrastructure Failures — Next 30 Days
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              AI analysis of complaint density, historical seasonal parameters, and geodetic coordinate grids.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Live Predictive failure Map (Rendered via Leaflet dynamically) */}
            <div className="w-full">
              <FailureMap />
            </div>

            {/* List of 5 AI predictions */}
            <div className="flex flex-col justify-between space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 block">
                Top 5 Predicted Failures
              </span>
              
              {[
                { title: 'Drain system, Ward 6 Prahladnagar', prob: 87, days: 15, reason: '4 complaints in last 30 days, monsoon season historically increases failure 3x here.' },
                { title: 'Road surface, Ward 3 Maninagar', prob: 74, days: 20, reason: 'Same pothole cluster reported 9 times. Patch repairs insufficient.' },
                { title: 'Water pipeline, Ward 4 Naroda', prob: 61, days: 25, reason: 'Low pressure complaints 3x in last 45 days.' },
                { title: 'Streetlight circuit, Ward 2 Bodakdev', prob: 52, days: 30, reason: '5 individual light failures in same zone suggest feeder line issue.' },
                { title: 'Waste overflow, Ward 4 Naroda', prob: 48, days: 28, reason: 'Industrial complaint density increasing.' }
              ].map((p, index) => (
                <div 
                  key={index}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex flex-col items-center justify-center font-bold font-mukta text-[10px] ${
                    p.prob >= 80 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    p.prob >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  }`}>
                    <span>{p.prob}%</span>
                    <span>Prob</span>
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{p.title}</h4>
                      <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{p.days} Days</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed line-clamp-1">{p.reason}</p>
                    <button 
                      onClick={() => handleCreatePreventive(p.title)}
                      className="inline-flex items-center gap-1 text-[9px] font-black text-teal-400 uppercase tracking-wider hover:text-teal-300"
                    >
                      Create Preventive Task <ArrowRight size={8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION E — WARD PERFORMANCE RANKING */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white">
              Weekly Ward Performance Ranking
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Normalised metrics adjusted by population density, geographic area, and response latencies.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800/80 mb-6">
            <table className="w-full border-collapse bg-slate-950/60 text-left text-xs font-medium text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Ward Node</th>
                  <th className="px-6 py-4">Resolution Rate</th>
                  <th className="px-6 py-4">Avg Response Time</th>
                  <th className="px-6 py-4">SLA Compliance</th>
                  <th className="px-6 py-4">Citizen Satisfaction</th>
                  <th className="px-6 py-4 text-center">Composite Score</th>
                  <th className="px-6 py-4 text-center">Weekly Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs font-semibold">
                
                {[
                  { rank: 1, name: 'Ward 5 Vejalpur', rate: '96%', time: '8 min', sla: '97%', satisfaction: '4.8/5', score: 94, trend: 'up' },
                  { rank: 2, name: 'Ward 1 Satellite', rate: '91%', time: '11 min', sla: '94%', satisfaction: '4.6/5', score: 89, trend: 'up' },
                  { rank: 3, name: 'Ward 6 Prahladnagar', rate: '84%', time: '14 min', sla: '72%', satisfaction: '4.1/5', score: 76, trend: 'down' },
                  { rank: 4, name: 'Ward 3 Maninagar', rate: '79%', time: '18 min', sla: '78%', satisfaction: '3.9/5', score: 73, trend: 'flat' },
                  { rank: 5, name: 'Ward 2 Bodakdev', rate: '71%', time: '24 min', sla: '61%', satisfaction: '3.4/5', score: 62, trend: 'down' },
                  { rank: 6, name: 'Ward 4 Naroda', rate: '58%', time: '31 min', sla: '43%', satisfaction: '3.1/5', score: 49, trend: 'down' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-400">
                      {row.rank === 1 ? '🥇 1' : row.rank === 2 ? '🥈 2' : row.rank === 3 ? '🥉 3' : row.rank}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-200">{row.name}</td>
                    <td className="px-6 py-4 text-slate-300">{row.rate}</td>
                    <td className="px-6 py-4 text-slate-400">{row.time}</td>
                    <td className="px-6 py-4 text-slate-300">{row.sla}</td>
                    <td className="px-6 py-4 text-teal-400">{row.satisfaction}</td>
                    <td className="px-6 py-4 font-black text-center text-teal-400 bg-slate-900/20">{row.score}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {row.trend === 'up' && <TrendingUp size={16} className="text-emerald-400" />}
                        {row.trend === 'down' && <TrendingDown size={16} className="text-rose-500 animate-bounce" />}
                        {row.trend === 'flat' && <Minus size={16} className="text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-center">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-xs shrink-0 font-bold">🤖</span>
            <p className="text-xs text-amber-400 leading-relaxed font-semibold">
              <span className="font-extrabold">AI Insight:</span> Ward 4 Naroda has declined 3 consecutive weeks. Primary cause: industrial complaint density. Recommend dedicated sanitation officer deployment.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION F — POLICY COMPLIANCE TRACKER */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white">
              Municipal SLA Policy Compliance
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Mandated resolution deadlines monitored via automated platform timers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex gap-6 items-center">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center font-black text-slate-200">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-800 fill-none" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" className="stroke-teal-500 fill-none" strokeWidth="6" strokeDasharray="213" strokeDashoffset="68" />
                </svg>
                <span className="text-sm font-mukta">68%</span>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-slate-200">Pothole Resolution — 7-day SLA</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  32% of pothole complaints breached 7-day SLA. Ward 4 (Naroda): 0% compliant. Ward 2 (Bodakdev): 44% compliant.
                </p>
                <button onClick={() => { setSelectedWard('Ward 4 Naroda'); setIsSlideOpen(true); }} className="text-[10px] font-black text-teal-400 uppercase tracking-wider hover:underline">
                  View Breached Complaints
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex gap-6 items-center">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center font-black text-slate-200">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-800 fill-none" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" className="stroke-rose-500 fill-none" strokeWidth="6" strokeDasharray="213" strokeDashoffset="98" />
                </svg>
                <span className="text-sm font-mukta">54%</span>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-slate-200">Drain Cleaning — 3-day SLA</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Critical ahead of monsoon. 6 drains open beyond SLA. Ward 6 (Prahladnagar) is at highest flood risk.
                </p>
                <button onClick={() => { setSelectedWard('Ward 6 Prahladnagar'); setIsSlideOpen(true); }} className="text-[10px] font-black text-teal-400 uppercase tracking-wider hover:underline">
                  View Breached Complaints
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex gap-6 items-center">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center font-black text-slate-200">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-800 fill-none" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" className="stroke-teal-500 fill-none" strokeWidth="6" strokeDasharray="213" strokeDashoffset="36" />
                </svg>
                <span className="text-sm font-mukta">83%</span>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-slate-200">Streetlight Repair — 5-day SLA</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Generally healthy. 2 streetlights in Ward 2 have breached 10 days — escalation recommended.
                </p>
                <button onClick={() => { setSelectedWard('Ward 2 Bodakdev'); setIsSlideOpen(true); }} className="text-[10px] font-black text-teal-400 uppercase tracking-wider hover:underline">
                  View Breached Complaints
                </button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex gap-6 items-center">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center font-black text-slate-200">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-800 fill-none" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" className="stroke-teal-400 fill-none" strokeWidth="6" strokeDasharray="213" strokeDashoffset="19" />
                </svg>
                <span className="text-sm font-mukta">91%</span>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-slate-200">Water Supply — 24-hour SLA</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Best performing category this month. Ward 5 (Vejalpur) has maintained 100% compliance.
                </p>
                <button onClick={() => { setSelectedWard('Ward 5 Vejalpur'); setIsSlideOpen(true); }} className="text-[10px] font-black text-teal-400 uppercase tracking-wider hover:underline">
                  View Breached Complaints
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION G — SMART CITIES MISSION SUSTAINABILITY REPORT */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white">
              Monthly Smart Cities Mission KPI Report — May 2026
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Auto-generated metrics ready for submission to state and federal urban ministries.
            </p>
            <p className="text-[10px] text-amber-400/90 font-bold mt-2 uppercase tracking-wider">
              Sample figures, illustrating the format. Your own numbers appear on the officer dashboard.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-800/80">
              
              <div className="space-y-1 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Resolution Time</span>
                <span className="text-2xl font-black text-teal-400">16.4 mins</span>
                <span className="text-[9px] font-extrabold bg-teal-950 text-teal-400 px-2 py-0.5 rounded border border-teal-900">Target Met ✓</span>
              </div>

              <div className="space-y-1 flex flex-col items-center pl-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SLA Compliance Rate</span>
                <span className="text-2xl font-black text-rose-500">72%</span>
                <span className="text-[9px] font-extrabold bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-900">Missed ✗</span>
              </div>

              <div className="space-y-1 flex flex-col items-center pl-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Satisfaction</span>
                <span className="text-2xl font-black text-teal-400">4.1 / 5</span>
                <span className="text-[9px] font-extrabold bg-teal-950 text-teal-400 px-2 py-0.5 rounded border border-teal-900">Target Met ✓</span>
              </div>

              <div className="space-y-1 flex flex-col items-center pl-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issues Resolved (MoM)</span>
                <span className="text-2xl font-black text-teal-400">1,240</span>
                <span className="text-[9px] font-extrabold bg-teal-950 text-teal-400 px-2 py-0.5 rounded border border-teal-900">↑ 25% Increase</span>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3 bg-slate-950/60 p-6 rounded-2xl border border-slate-850">
              <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText size={12} /> Executive summary
                <span className="ml-1 font-bold text-slate-500 normal-case tracking-normal">
                  sample output, not live data
                </span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Rajkot civic load eased over the month, with drainage still carrying the backlog. SLA compliance sits below target in Mavdi and Kotecha Chowk. Monsoon preparedness is the immediate priority given the open storm drain complaints on Yagnik Road. Recommended: stage desilting crews in Mavdi before the first heavy rain, audit the Nana Mava drain network, and hold a pothole rapid-response team for the Gondal Road corridor.
              </p>
              <p className="text-[9px] text-slate-500 font-semibold">
                An illustration of what Gemma produces from a month of real reports. Your own summary is generated from your data on the officer dashboard.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => window.print()}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Download PDF Report
              </button>
              <button 
                onClick={() => toast.success('Report submitted successfully to the Gujarat Urban Development Department!', { icon: '🏛️' })}
                className="px-6 py-3 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Send to State Government
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION H — CITIZEN ENGAGEMENT SCORE */}
        {/* ========================================================================= */}
        <section className="mb-12 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold font-mukta text-white">
              Ward Citizen Engagement — May 2026
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Active citizen feedback logs, complaint submissions, and upvotes per ward.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Horizontal Bar Chart */}
            <div className="w-full h-80 bg-slate-900/60 border border-slate-850 p-6 rounded-3xl">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748B" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', color: '#fff' }} />
                  <Bar dataKey="Score" fill="#0F766E" radius={[0, 8, 8, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insight Card */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                  <ThumbsUp size={18} className="text-teal-400" /> Engagement Deep Dive
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Ward 4 Naroda has the lowest citizen engagement. Low reporting from industrial areas often masks real infrastructure stress. Recommend offline complaint collection drives and multilingual outreach in Gujarati and Hindi.
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Highest Score</span>
                    <span className="text-sm font-black text-teal-400 mt-1 block">Vejalpur (91)</span>
                  </div>
                  <div className="flex-1 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lowest Score</span>
                    <span className="text-sm font-black text-rose-500 mt-1 block">Naroda (31)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* 🔮 SLIDE-IN RIGHT PANEL FOR WARD INSPECTION */}
      {/* ========================================================================= */}
      {isSlideOpen && selectedWard && (
        <div className="fixed inset-0 z-[2000] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsSlideOpen(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col p-8 animate-in slide-in-from-right duration-350">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold font-mukta text-white">{selectedWard} Queue</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">District Inspection</p>
              </div>
              <button 
                onClick={() => setIsSlideOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-3xl font-light text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="flex gap-2 mb-4">
                {['all', 'high', 'medium'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      activeTab === tab 
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab} Priority
                  </button>
                ))}
              </div>

              {(wardIssues[selectedWard] || [])
                .filter(item => activeTab === 'all' || item.severity === activeTab)
                .map((issue) => (
                  <div 
                    key={issue.id} 
                    className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        issue.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {issue.severity} Priority
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">{issue.time}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold leading-relaxed text-slate-200">{issue.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{issue.category}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        issue.status === 'Dispatched' ? 'text-teal-400' : 'text-amber-400'
                      }`}>{issue.status}</span>
                      <button 
                        onClick={() => {
                          toast.success(`Dispatched field team for: "${issue.title}"`, { icon: '🛠️' });
                        }}
                        className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-teal-500/20 text-slate-300 hover:text-teal-400 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Re-Dispatch
                      </button>
                    </div>
                  </div>
                ))}

              {(wardIssues[selectedWard] || []).length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No active incidents recorded for this ward.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVENTIVE WORK ORDER MODAL */}
      {/* ========================================================================= */}
      {modalPrediction && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalPrediction(null)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mb-6">
              <Shield size={32} />
            </div>
            
            <h3 className="text-lg font-extrabold font-mukta text-white mb-2">Create Preventive Work Order</h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
              Create and assign a preventive work order for:<br/>
              <span className="text-slate-200 font-extrabold mt-1 block">"{modalPrediction}"</span>
            </p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setModalPrediction(null)} 
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmPreventive}
                className="flex-[2] py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Confirm Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ COMMISSIONER WARD DATA EDIT MODAL */}
      {/* ========================================================================= */}
      {editingWard && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditingWard(null)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold font-mukta text-white">Edit Ward Node Parameters</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{selectedCity} Commissioner overrides</p>
              </div>
              <button 
                onClick={() => setEditingWard(null)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 mb-8 text-left max-h-[380px] overflow-y-auto pr-2">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ward Node Name</p>
                <p className="text-xs font-bold text-slate-200 mt-1">{editingWard.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Open Issues</label>
                  <input 
                    type="number" 
                    value={editOpen} 
                    onChange={(e) => setEditOpen(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SLA Compliance (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={editSla} 
                    onChange={(e) => setEditSla(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Severity Distribution</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-rose-400 uppercase block">Red (High)</span>
                    <input 
                      type="number" 
                      value={editRed} 
                      onChange={(e) => setEditRed(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-amber-400 uppercase block">Amber (Med)</span>
                    <input 
                      type="number" 
                      value={editAmber} 
                      onChange={(e) => setEditAmber(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase block">Green (Low)</span>
                    <input 
                      type="number" 
                      value={editGreen} 
                      onChange={(e) => setEditGreen(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Incident Description</label>
                <textarea 
                  value={editTop} 
                  onChange={(e) => setEditTop(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setEditingWard(null)} 
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveWard}
                className="flex-[2] py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Save Overrides
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 FLOATING CHAT ASSISTANT COMPONENT INTEGRATED */}
      <CivicPulseAI />

    </div>
  );
}
