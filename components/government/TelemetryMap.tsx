import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Radio, Lock } from 'lucide-react';
import { createRoot } from 'react-dom/client';

// Generate a random offset to simulate spread out volunteers within a ~10km radius of city center
const generateRandomOffset = (baseCoord: [number, number], radiusKm: number) => {
  const r = radiusKm / 111.3; // roughly 1 degree = 111.3km
  const y0 = baseCoord[0];
  const x0 = baseCoord[1];
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y1 = w * Math.sin(t);
  const x1 = x / Math.cos(y0);
  return [y0 + y1, x0 + x1] as [number, number];
};

interface TelemetryMapProps {
  employees: any[];
  tasks?: any[];
  cityCenter: [number, number];
  focusId?: string;
}

// Component to handle auto-panning if focusId is present
const MapPanner = ({ focusCoord }: { focusCoord: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (focusCoord) {
      map.flyTo(focusCoord, 14, { duration: 1.5 });
    }
  }, [focusCoord, map]);
  return null;
};

export default function TelemetryMap({ employees, tasks = [], cityCenter, focusId }: TelemetryMapProps) {
  const [employeeLocations, setEmployeeLocations] = useState<any[]>([]);
  const [taskLocations, setTaskLocations] = useState<any[]>([]);
  const [isWorkHours, setIsWorkHours] = useState(true);

  useEffect(() => {
    // Check if current time is within 9 AM to 6 PM (18:00)
    const currentHour = new Date().getHours();
    const activeShift = currentHour >= 9 && currentHour < 18;
    setIsWorkHours(activeShift);

    // Generate deterministic locations for tasks
    const mappedTasks = tasks.map((task, idx) => {
      // Use wider offset for tasks
      const offsetLat = (Math.sin(idx * 45) * 0.08);
      const offsetLng = (Math.cos(idx * 45) * 0.08);
      return {
        ...task,
        coord: [cityCenter[0] + offsetLat, cityCenter[1] + offsetLng] as [number, number]
      };
    });
    setTaskLocations(mappedTasks);

    // Map employees to task locations
    const mappedEmps = employees.map((emp, idx) => {
      let exactCoord: [number, number];
      
      // If the employee is the HOD, keep them at the city center (Command Center)
      if (emp.id.startsWith('hod-')) {
        exactCoord = [cityCenter[0], cityCenter[1]];
      } 
      // If tasks exist, assign the volunteer to a specific task location
      else if (mappedTasks.length > 0) {
        const assignedTask = mappedTasks[idx % mappedTasks.length];
        // Add a micro-offset so the volunteer icon doesn't completely hide the task icon
        exactCoord = [assignedTask.coord[0] + 0.002, assignedTask.coord[1] + 0.002];
      } 
      // Fallback if no tasks
      else {
        const offsetLat = (Math.sin(idx * 10) * 0.05);
        const offsetLng = (Math.cos(idx * 10) * 0.05);
        exactCoord = [cityCenter[0] + offsetLat, cityCenter[1] + offsetLng];
      }
      
      return {
        ...emp,
        exactCoord,
        blurredCoord: [cityCenter[0] + (Math.sin(idx)*0.01), cityCenter[1] + (Math.cos(idx)*0.01)]
      };
    });
    
    setEmployeeLocations(mappedEmps);
  }, [employees, tasks, cityCenter]);

  // Create custom HTML icons for Leaflet
  const createIcon = (emp: any, locked: boolean) => {
    const div = document.createElement('div');
    const root = createRoot(div);
    
    if (locked) {
      root.render(
        <div className="flex flex-col items-center drop-shadow-xl relative z-10 group">
          <div className="w-10 h-10 bg-slate-800 text-white rounded-full border-2 border-slate-600 flex items-center justify-center relative overflow-hidden shadow-xl">
             <Lock size={18} className="text-slate-400" />
          </div>
          <div className="px-2 py-1 bg-slate-900 text-slate-300 text-[10px] font-black uppercase rounded mt-1 shadow-lg whitespace-nowrap">
            Privacy Locked
          </div>
        </div>
      );
    } else {
      root.render(
        <div className={`flex flex-col items-center drop-shadow-xl relative z-10 ${emp.id === focusId ? 'animate-bounce' : ''}`}>
          <div className="absolute -inset-2 bg-indigo-500/20 rounded-full animate-ping" />
          <div className="w-10 h-10 bg-white rounded-full border-[3px] border-indigo-600 flex items-center justify-center relative overflow-hidden shadow-xl z-10">
            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
          </div>
          <div className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded mt-1 shadow-lg whitespace-nowrap z-10">
            {emp.name}
          </div>
        </div>
      );
    }
    
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: div,
      iconSize: [40, 60],
      iconAnchor: [20, 30],
      popupAnchor: [0, -30]
    });
  };

  const createTaskIcon = (task: any) => {
    const div = document.createElement('div');
    const root = createRoot(div);
    const isCritical = task.urgency_score >= 8;
    
    root.render(
      <div className="flex flex-col items-center drop-shadow-lg relative z-0">
        {isCritical && <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping" />}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden z-10 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}>
          <Shield size={14} className="text-white" />
        </div>
        <div className={`px-2 py-0.5 text-white text-[8px] font-black uppercase rounded mt-1 shadow-lg whitespace-nowrap z-10 ${isCritical ? 'bg-red-600' : 'bg-amber-600'}`}>
          Task {isCritical && '(Critical)'}
        </div>
      </div>
    );

    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: div,
      iconSize: [30, 40],
      iconAnchor: [15, 20],
      popupAnchor: [0, -20]
    });
  };

  const focusEmployee = employeeLocations.find(e => e.id === focusId);
  const targetCoord = focusEmployee ? (isWorkHours ? focusEmployee.exactCoord : focusEmployee.blurredCoord) : cityCenter;

  return (
    <div className="w-full h-full relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      <MapContainer 
        center={targetCoord} 
        zoom={12} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
        />
        
        <MapPanner focusCoord={focusEmployee ? targetCoord : null} />

        {/* Render Tasks */}
        {taskLocations.map((task) => (
          <Marker 
            key={`task-${task.id}`} 
            position={task.coord}
            icon={createTaskIcon(task)}
            zIndexOffset={-100}
          >
            <Popup className="rounded-2xl custom-popup">
              <div className="p-2 min-w-[200px]">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  task.urgency_score >= 8 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  Urgency: {task.urgency_score}/10
                </span>
                <h4 className="font-bold text-slate-800 text-sm mt-2">{task.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{task.description || 'Active incident in the municipal zone.'}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Employees */}
        {employeeLocations.map((emp) => (
          <Marker 
            key={emp.id} 
            position={isWorkHours ? emp.exactCoord : emp.blurredCoord}
            icon={createIcon(emp, !isWorkHours)}
            zIndexOffset={emp.id === focusId ? 1000 : 0}
          >
            <Popup className="rounded-2xl custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-3">
                  <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{emp.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.title}</p>
                  </div>
                </div>
                
                {!isWorkHours ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                    <Lock size={16} className="text-slate-400" />
                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                      Location tracking disabled. Field Engineer is currently off-shift.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-indigo-50/50 rounded-lg">
                      <span className="text-[10px] text-indigo-900 font-bold">Status</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black">{emp.defaultStatus || 'ACTIVE'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-lg">
                      <span className="text-[10px] text-emerald-900 font-bold">Efficiency</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black">{emp.completionRate || 'N/A'}</span>
                    </div>
                    <button className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Radio size={12} /> Contact Radio
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Status UI */}
      <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl w-64">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-1">
          <Shield size={16} className="text-indigo-600" />
          Telemetry Status
        </h3>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-4 border-b border-slate-100 pb-3">
          {isWorkHours ? 'Active Shift Operations' : 'Off-Shift Privacy Mode'}
        </p>

        {isWorkHours ? (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
            <Radio size={14} className="text-emerald-500 animate-pulse mt-0.5 shrink-0" />
            <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
              Live GPS tracking is active. All field crew members are transmitting high-precision coordinates.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-2">
            <Lock size={14} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-700 font-bold leading-relaxed">
              Standard shifts ended. GPS ping is disabled for personnel privacy. General sector shown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
