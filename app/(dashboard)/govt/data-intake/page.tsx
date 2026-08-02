'use client';
import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Database, Check, AlertCircle, FileText, Sliders, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';

export default function GovernmentDataIntakePage() {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setData(results.data);
        toast.success(`Loaded ${results.data.length} official records successfully.`);
      },
      error: (error) => {
        toast.error('Failed to parse official CSV: ' + error.message);
      }
    });
  };

  const processAndUpload = async () => {
    if (data.length === 0) return;
    setIsUploading(true);
    
    try {
      const batch = writeBatch(db);
      const needsRef = collection(db, 'needs');

      data.forEach(row => {
        const newNeedRef = doc(needsRef);
        // Smart routing based on CSV category
        const cat = (row.category || 'other').toLowerCase();
        let assignedDept = 'pwd';
        if (cat.includes('sanitation') || cat.includes('garbage') || cat.includes('health')) {
          assignedDept = 'health_sanitation';
        } else if (cat.includes('water')) {
          assignedDept = 'water_works';
        } else if (cat.includes('drainage') || cat.includes('sewer')) {
          assignedDept = 'drainage';
        } else if (cat.includes('electric') || cat.includes('light') || cat.includes('power')) {
          assignedDept = 'electricity';
        } else if (cat.includes('fire') || cat.includes('rescue')) {
          assignedDept = 'fire_safety';
        } else if (cat.includes('encroachment')) {
          assignedDept = 'encroachment';
        }

        batch.set(newNeedRef, {
          title: row.title || 'Official Ingested Grievance',
          description: row.description || 'Uploaded via City sovereign data switchboard.',
          category: cat,
          status: 'verified', // Pre-verified by Government
          city: row.city || 'Delhi',
          district: row.district || 'Central Zone',
          population_count: parseInt(row.population) || 10,
          urgency_score: parseFloat(row.urgency) || 7.5,
          assignment_type: 'government', // Managed by Municipal Corps
          assigned_department: assignedDept,
          created_at: new Date().toISOString(),
          official_ingest: true
        });
      });

      await batch.commit();
      
      toast.success(`Sovereign Sync: Successfully ingested ${data.length} municipal records!`);
      setData([]);
      setHeaders([]);
    } catch (err: any) {
      toast.error('Ingestion failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-800 p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Sovereign Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 shadow-lg shadow-slate-100/50 backdrop-blur-md p-6 rounded-[2rem] relative z-10">
        <div>
          <span className="text-[9px] font-mono text-blue-650 font-extrabold uppercase tracking-widest flex items-center gap-1">
            <Sliders size={12} className="text-blue-600 animate-spin" /> City OFFICIAL CONTROL DECK
          </span>
          <h1 className="text-3xl font-black font-mukta text-slate-850 tracking-tight mt-1 flex items-center gap-2">
            🗄️ Sovereign Bulk Data Intake Switchboard
          </h1>
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">
            Ingest mass grievance records, offline municipal surveys, sensor telemetry, and dispatch directly.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-black uppercase tracking-widest shadow-sm">
            <ShieldCheck size={14} className="text-blue-600" /> SECURE INTEGRITY CHANNEL
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Sovereign CSV Drop Box */}
        <div className="bg-white/80 border border-slate-200 shadow-md rounded-[2rem] p-8 flex flex-col items-center justify-center text-center border-dashed border-2 min-h-[350px]">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6">
            <Upload size={28} />
          </div>
          <h3 className="font-extrabold text-lg text-slate-800 mb-2 font-mukta uppercase tracking-wider">Ingest Municipal CSV</h3>
          <p className="text-xs text-slate-450 font-medium max-w-xs mb-8 leading-relaxed">
            Upload offline ward registers, weather sensor datasets, or departmental incident logs.
            <br />
            <span className="text-blue-600 font-bold mt-2 block">Pre-verifies reports and auto-routes to departments.</span>
          </p>
          
          <label className="px-6 py-3 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer">
            Select CSV File
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="hidden" 
            />
          </label>
        </div>

        {/* Data Verification Preview */}
        <div className="bg-white/80 border border-slate-200 shadow-md rounded-[2rem] lg:col-span-2 flex flex-col overflow-hidden p-0 relative">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-slate-700 font-mukta">
              <FileText size={18} className="text-slate-500" /> Administrative Telemetry Preview
            </h3>
            {data.length > 0 && (
              <span className="text-xs font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 uppercase">
                {data.length} official records loaded
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-50/50 p-6 max-h-[400px] custom-scrollbar">
            {data.length > 0 ? (
              <table className="w-full text-left text-xs bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    {headers.slice(0, 5).map(h => (
                      <th key={h} className="p-3 font-extrabold uppercase tracking-wider">{h}</th>
                    ))}
                    {headers.length > 5 && <th className="p-3 font-extrabold">...</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {data.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      {headers.slice(0, 5).map(h => (
                        <td key={h} className="p-3 truncate max-w-[150px]">{row[h]}</td>
                      ))}
                      {headers.length > 5 && <td className="p-3 text-slate-400">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-3 py-20 italic">
                <AlertCircle size={36} className="opacity-30 text-blue-500 animate-bounce" />
                <p className="text-xs font-bold text-slate-450 uppercase tracking-widest">Awaiting CSV ingestion queue</p>
              </div>
            )}
          </div>
          
          {data.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button 
                onClick={() => { setData([]); setHeaders([]); }} 
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase text-red-500 transition-colors"
                disabled={isUploading}
              >
                Flush Queue
              </button>
              <button 
                onClick={processAndUpload} 
                className="px-6 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? 'Ingesting...' : 'Ingest and Publish Needs'} <Check size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
