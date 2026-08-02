'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Database, Check, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export default function DataIntakePage() {
  const { user } = useAuthStore();
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
        toast.success(`Loaded ${results.data.length} records successfully.`);
      },
      error: (error) => {
        toast.error('Failed to parse CSV: ' + error.message);
      }
    });
  };

  const processAndUpload = async () => {
    if (data.length === 0) return;
    setIsUploading(true);
    
    // In actual implementation, map headers to DB columns here.
    // Assuming CSV has simple mapped fields for demo.
    
    try {
      const batch = writeBatch(db);
      const needsRef = collection(db, 'needs');

      data.forEach(row => {
        const newNeedRef = doc(needsRef);
        batch.set(newNeedRef, {
          title: row.title || 'Bulk Reported Need',
          description: row.description || '',
          category: row.category || 'other',
          status: 'reported',
          city: row.city || 'Delhi',
          population_count: parseInt(row.population) || 1,
          urgency_score: parseFloat(row.urgency) || 5.0,
          created_at: new Date().toISOString(),
          pending_verification: true,
          assignment_type: 'pending_verification'
        });
      });

      // 🚨 Route to Commissioner's Telemetry Notification Feed!
      const notifRef = doc(collection(db, 'notifications'));
      const userNgoName = user?.email?.includes('asha') ? 'Asha Relief Foundation' :
                          user?.email?.includes('redcross') ? 'Red Cross Delhi' :
                          user?.email?.includes('sanjeevani') ? 'Sanjeevani Social Hub' : 'Partner NGO';

      batch.set(notifRef, {
        id: notifRef.id,
        user_id: 'demo-govt-001', // Government Commissioner kavita.patel@gujarat.gov.in
        text: `🚨 NGO Data Import: "${userNgoName}" uploaded ${data.length} bulk records requiring City verification.`,
        type: 'CRITICAL',
        is_read: false,
        created_at: new Date().toISOString(),
        details: {
          title: `NGO Data Import Feed [${data.length} Records]`,
          desc: `CSV datasets uploaded by NGO Coordinator (${user?.email || 'N/A'}). Verification and department routing required.`,
          department: 'all',
          urgencyScore: 8.5
        }
      });

      await batch.commit();
      
      toast.success(`Uploaded ${data.length} records. Pending administrative verification.`);
      setData([]);
      setHeaders([]);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold font-mukta text-[var(--ink)] flex items-center gap-2">
          <Database className="text-teal-600" /> Bulk Data Intake
        </h1>
        <p className="text-[var(--ink-muted)]">Upload CSV files from legacy systems or offline surveys to instantly sync them with Sahaayak.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Upload Panel */}
        <div className="card md:col-span-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-2)] border-dashed border-2">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm mb-4">
            <Upload size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2">Upload CSV Data</h3>
          <p className="text-sm text-[var(--ink-muted)] mb-4">File must contain headers. Supported columns: title, description, category, city, urgency, population.</p>
          <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 rounded-lg font-medium mb-6 max-w-xs">
            ⚠️ <strong>Verification Active:</strong> All bulk ingested records require City Government verification before appearing on active maps or dashboards.
          </div>
          
          <label className="btn-primary cursor-pointer">
            Select File
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="hidden" 
            />
          </label>
        </div>

        {/* Data Preview Panel */}
        <div className="card md:col-span-2 flex flex-col overflow-hidden p-0 relative">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-white">
            <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Data Preview</h3>
            {data.length > 0 && (
              <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-1 rounded">
                {data.length} records found
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-50 p-4">
            {data.length > 0 ? (
              <table className="w-full text-left text-sm bg-white border border-[var(--border)] rounded-lg overflow-hidden">
                <thead className="bg-[var(--surface-2)]">
                  <tr>
                    {headers.slice(0, 5).map(h => (
                      <th key={h} className="p-2 border-b border-[var(--border)] font-semibold">{h}</th>
                    ))}
                    {headers.length > 5 && <th className="p-2 border-b border-[var(--border)] font-semibold">...</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]">
                      {headers.slice(0, 5).map(h => (
                        <td key={h} className="p-2 truncate max-w-[150px]">{row[h]}</td>
                      ))}
                      {headers.length > 5 && <td className="p-2 text-gray-600">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 flex-col gap-2">
                <AlertCircle size={32} className="opacity-20" />
                <p>No data loaded yet</p>
              </div>
            )}
          </div>
          
          {data.length > 0 && (
            <div className="p-4 border-t border-[var(--border)] bg-white flex justify-end gap-3">
              <button 
                onClick={() => { setData([]); setHeaders([]); }} 
                className="btn-ghost text-red-600"
                disabled={isUploading}
              >
                Clear
              </button>
              <button 
                onClick={processAndUpload} 
                className="btn-primary bg-teal-600 hover:bg-teal-700 shadow-teal-500/30"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Sync to Sahaayak'} <Check size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
