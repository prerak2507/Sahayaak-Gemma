'use client';
import React, { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Radar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ALL_DEPARTMENT_EMPLOYEES, ALL_DEPARTMENTS, CITY_COORDINATES } from '@/lib/data/govt-data';
import { useGovtStore } from '@/stores/govtStore';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useNeeds } from '@/lib/data/use-needs';

const TelemetryMap = dynamic(() => import('@/components/government/TelemetryMap'), { ssr: false });

export default function TelemetryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeCity } = useGovtStore();
  
  const deptId = searchParams?.get('deptId');
  const focusId = searchParams?.get('focusId');
  const [tasks, setTasks] = React.useState<any[]>([]);

  // Read through the server. This used to subscribe to Firestore from the
  // browser, which the rules deny, and then merge seven fabricated incidents
  // into whatever came back, so a department's telemetry was never its own.
  const { needs: boardNeeds } = useNeeds({ assignment: 'government' });

  React.useEffect(() => {
    if (!deptId) {
      setTasks([]);
      return;
    }
    setTasks(
      boardNeeds.filter((n) => n.assigned_department === deptId && n.status !== 'completed')
    );
  }, [boardNeeds, deptId]);

  const employees = useMemo(() => {
    if (!deptId) return [];
    const cityKey = activeCity ? activeCity.toLowerCase() : 'delhi';
    const deptEmployees = ALL_DEPARTMENT_EMPLOYEES[cityKey]?.[deptId] || [];
    
    // Check if we need to include the HOD in the map
    const deptConfig = ALL_DEPARTMENTS[cityKey]?.find((d: any) => d.id === deptId);
    let allPersonnel = [...deptEmployees];
    
    if (deptConfig && deptConfig.worker) {
      allPersonnel.unshift({
        id: `hod-${deptId}`,
        name: deptConfig.worker,
        title: deptConfig.title,
        avatar: deptConfig.avatar,
        defaultStatus: 'COMMAND',
        completionRate: 'N/A'
      });
    }
    
    return allPersonnel;
  }, [deptId, activeCity]);

  const cityKey = activeCity ? activeCity.charAt(0).toUpperCase() + activeCity.slice(1).toLowerCase() : 'Delhi';
  const cityCenter = CITY_COORDINATES[cityKey] || [28.6139, 77.2090];
  
  const deptName = useMemo(() => {
    const cKey = activeCity ? activeCity.toLowerCase() : 'delhi';
    const deptConfig = ALL_DEPARTMENTS[cKey]?.find((d: any) => d.id === deptId);
    return deptConfig ? deptConfig.name : 'Unknown Department';
  }, [deptId, activeCity]);

  return (
    <div className="w-full h-[calc(100vh-6rem)] p-6 bg-white flex flex-col relative animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Radar size={24} className="text-indigo-600 animate-spin-slow" />
              Live Telemetry Hub
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              {deptId ? `Monitoring: ${deptName} (${employees.length} Personnel)` : 'No department selected'}
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-grow w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 relative">
        {employees.length > 0 ? (
          <TelemetryMap 
            employees={employees} 
            tasks={tasks}
            cityCenter={cityCenter} 
            focusId={focusId || undefined}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Radar size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-bold">No active telemetry signal detected.</p>
            <p className="text-xs mt-1">Select a valid department from the dashboard.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
