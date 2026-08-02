import React from 'react';
import { Milestone, Sparkles, Droplets, Filter, Zap, ShieldAlert, Flame, Globe } from 'lucide-react';

/**
 * Rajkot only.
 *
 * This platform serves one corporation. Carrying department rosters and
 * coordinates for Delhi, Surat, Ahmedabad, Pune and Mumbai meant a city
 * selector that could put the officer dashboard into a state with no data
 * behind it, and demo content that wandered between cities. Everything is
 * Rajkot now, and the gazetteer of record is lib/geo/rajkot.ts.
 */
export const CITY_COORDINATES: Record<string, [number, number]> = {
  "Rajkot": [22.3039, 70.8022],
  "Kalavad Road": [22.2904, 70.7749],
  "University Road": [22.2982, 70.7766],
  "Yagnik Road": [22.2996, 70.7974],
  "Gondal Road": [22.2848, 70.8038],
  "Madhapar": [22.3278, 70.7831],
  "150ft Ring Road": [22.2858, 70.7816]
};

export const ALL_DEPARTMENTS: Record<string, any[]> = {
  rajkot: [
    { id: 'pwd', name: 'PWD Roads', worker: 'Rahul Bajaj', title: 'Senior PWD Director', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-pwd', defaultLatency: '1.8 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'health_sanitation', name: 'Sanitation', worker: 'Tushar Trivedi', title: 'Chief Sanitation Commissioner', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-san', defaultLatency: '2.5 hours', health: 'HIGH LOAD', statusColor: 'bg-amber-500' },
    { id: 'water_works', name: 'Water Works', worker: 'Rajat Sharma', title: 'Senior Water Works Director', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-wat', defaultLatency: '1.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'drainage', name: 'Sewerage & Drainage', worker: 'Hemant Soren', title: 'Superintendent', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-dra', defaultLatency: '3.1 hours', health: 'CRITICAL', statusColor: 'bg-rose-500' },
    { id: 'electricity', name: 'Power & Grid', worker: 'Murali Divi', title: 'Grid Chief Commissioner', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-ele', defaultLatency: '0.9 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'encroachment', name: 'Encroachment', worker: 'Lachhman Das', title: 'Senior Encroachment Director', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-enc', defaultLatency: '4.0 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'fire_safety', name: 'Fire Safety', worker: 'Mansukh Rabari', title: 'Chief Fire Officer (CFO)', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-fir', defaultLatency: '0.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
  ]
};

export const getDeptIcon = (deptId: string, size = 16) => {
  switch (deptId) {
    case 'pwd': case 'rmc_roads': return <Milestone size={size} className="text-blue-400" />;
    case 'health_sanitation': case 'rmc_solid_waste': return <Sparkles size={size} className="text-teal-400" />;
    case 'water_works': case 'rmc_water': return <Droplets size={size} className="text-sky-400" />;
    case 'drainage': case 'rmc_drainage': return <Filter size={size} className="text-amber-400" />;
    case 'electricity': case 'pgvcl': return <Zap size={size} className="text-yellow-400" />;
    case 'encroachment': return <ShieldAlert size={size} className="text-rose-455" />;
    case 'fire_safety': return <Flame size={size} className="text-red-500 animate-pulse" />;
    default: return <Globe size={size} className="text-slate-400" />;
  }
};

export const ALL_DEPARTMENT_EMPLOYEES: Record<string, Record<string, any[]>> = {
  rajkot: {
    pwd: [
      { id: 'emp-rajkot-pwd-1', name: 'Vikram Sarabhai', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-20', defaultStatus: 'DISPATCHED', completionRate: '96%', phone: '+91 7154722025', expertise: ['General'] },
      { id: 'emp-rajkot-pwd-2', name: 'Uday Kotak', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-21', defaultStatus: 'DISPATCHED', completionRate: '82%', phone: '+91 4024619660', expertise: ['General'] },
      { id: 'emp-rajkot-pwd-3', name: 'Harsh Mariwala', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-22', defaultStatus: 'DISPATCHED', completionRate: '95%', phone: '+91 5670440517', expertise: ['General'] },
    ],
    health_sanitation: [
      { id: 'emp-rajkot-health_sanitation-1', name: 'Amrit Parmar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-23', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 8620167087', expertise: ['General'] },
      { id: 'emp-rajkot-health_sanitation-2', name: 'Vikram Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-24', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 5359946996', expertise: ['General'] },
      { id: 'emp-rajkot-health_sanitation-3', name: 'Bharat Gohil', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-25', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 9304859507', expertise: ['General'] },
    ],
    water_works: [
      { id: 'emp-rajkot-water_works-1', name: 'Prakash Jha', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-26', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 7111918188', expertise: ['General'] },
      { id: 'emp-rajkot-water_works-2', name: 'Harish Dave', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-27', defaultStatus: 'DISPATCHED', completionRate: '96%', phone: '+91 6371478550', expertise: ['General'] },
      { id: 'emp-rajkot-water_works-3', name: 'N. Biren', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-28', defaultStatus: 'DISPATCHED', completionRate: '80%', phone: '+91 6322126056', expertise: ['General'] },
    ],
    drainage: [
      { id: 'emp-rajkot-drainage-1', name: 'Suresh Desai', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-29', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 1176239470', expertise: ['General'] },
      { id: 'emp-rajkot-drainage-2', name: 'Samir Mehta', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-30', defaultStatus: 'DISPATCHED', completionRate: '93%', phone: '+91 1916534088', expertise: ['General'] },
      { id: 'emp-rajkot-drainage-3', name: 'Narayan Murthy', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-31', defaultStatus: 'DISPATCHED', completionRate: '87%', phone: '+91 6924251719', expertise: ['General'] },
    ],
    electricity: [
      { id: 'emp-rajkot-electricity-1', name: 'Mukesh Chudasama', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-32', defaultStatus: 'DISPATCHED', completionRate: '80%', phone: '+91 3613090562', expertise: ['General'] },
      { id: 'emp-rajkot-electricity-2', name: 'Amit Chawla', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-33', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 3101238863', expertise: ['General'] },
      { id: 'emp-rajkot-electricity-3', name: 'Nitin Jadeja', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-34', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 5511856747', expertise: ['General'] },
    ],
    encroachment: [
      { id: 'emp-rajkot-encroachment-1', name: 'Vikas Dubey', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-35', defaultStatus: 'DISPATCHED', completionRate: '99%', phone: '+91 3037165930', expertise: ['General'] },
      { id: 'emp-rajkot-encroachment-2', name: 'Ravi Modi', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-36', defaultStatus: 'DISPATCHED', completionRate: '81%', phone: '+91 9316208196', expertise: ['General'] },
    ],
    fire_safety: [
      { id: 'emp-rajkot-fire_safety-1', name: 'Dilip Shanghvi', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-37', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 3046545850', expertise: ['General'] },
      { id: 'emp-rajkot-fire_safety-2', name: 'Gautam Adani', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-38', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 8015230569', expertise: ['General'] },
    ],
  }
};

export const EXISTING_SCHEMES: Record<string, { name: string; description: string; coverage: string }> = {
  roads_potholes: { name: 'PM Gram Sadak Yojana (PMGSY)', description: 'Rural road connectivity', coverage: 'Rural areas only — urban potholes uncovered' },
  drainage_sewerage: { name: 'AMRUT 2.0', description: 'Atal Mission for Urban Transformation', coverage: 'Major cities only — peripheral wards under-serviced' },
  water_supply: { name: 'Jal Jeevan Mission', description: 'Tap water to all households', coverage: 'Last-mile delivery gaps in dense urban slums' },
  electricity_streetlights: { name: 'Saubhagya Yojana', description: 'Household electrification', coverage: 'Household-focused — public streetlight maintenance gap' },
  garbage_sanitation: { name: 'Swachh Bharat Mission 2.0', description: 'Solid waste management', coverage: 'Processing infrastructure shortfall in smaller wards' },
  food: { name: 'PM Garib Kalyan Ann Yojana', description: 'Free food grain distribution', coverage: 'Post-disaster rapid food kits not tailored' },
  medical: { name: 'Ayushman Bharat / Tele-MANAS', description: 'Health insurance + tele-mental health', coverage: 'High wait times; vernacular counselling deficit' },
  shelter: { name: 'PM Awas Yojana (Urban)', description: 'Affordable housing', coverage: 'Construction delays; temporary shelter gap during disasters' },
  encroachment: { name: 'Smart Cities Mission', description: 'Urban modernization & enforcement', coverage: 'Enforcement varies by municipal capacity' },
  fire_safety: { name: 'National Disaster Response Fund', description: 'Emergency disaster allocation', coverage: 'Reactive only — no proactive fire safety audits' },
  disaster_relief: { name: 'SDRF / NDRF', description: 'State & National disaster response', coverage: 'Post-disaster microloans not tailored for rapid reconstruction' },
  mental_health: { name: 'Tele MANAS', description: 'Tele mental health assistance', coverage: 'High wait times locally; vernacular support deficit' },
};
