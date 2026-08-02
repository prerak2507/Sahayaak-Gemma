import React from 'react';
import { Milestone, Sparkles, Droplets, Filter, Zap, ShieldAlert, Flame, Globe } from 'lucide-react';

export const CITY_COORDINATES: Record<string, [number, number]> = {
  "Delhi": [
    28.6139,
    77.209
  ],
  "Rajkot": [
    22.3039,
    70.8022
  ],
  "Surat": [
    21.1702,
    72.8311
  ],
  "Ahmedabad": [
    23.0225,
    72.5714
  ],
  "Pune": [
    18.5204,
    73.8567
  ],
  "Connaught Place": [
    28.6315,
    77.2167
  ],
  "ITO": [
    28.6276,
    77.2411
  ],
  "Karol Bagh": [
    28.651,
    77.1903
  ],
  "Kalavad Road": [
    22.2904,
    70.7749
  ],
  "University Road": [
    22.2982,
    70.7766
  ],
  "150ft Ring Road": [
    22.2858,
    70.7816
  ]
};

export const ALL_DEPARTMENTS: Record<string, any[]> = {
  delhi: [
    { id: 'pwd', name: 'PWD Roads', worker: 'Cyrus Poonawalla', title: 'Senior PWD Director', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-pwd', defaultLatency: '1.8 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'health_sanitation', name: 'Sanitation', worker: 'Arvind Vaghela', title: 'Chief Sanitation Commissioner', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-san', defaultLatency: '2.5 hours', health: 'HIGH LOAD', statusColor: 'bg-amber-500' },
    { id: 'water_works', name: 'Water Works', worker: 'Sanjay Dave', title: 'Senior Water Works Director', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-wat', defaultLatency: '1.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'drainage', name: 'Sewerage & Drainage', worker: 'Bhupendra Chauhan', title: 'Superintendent', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-dra', defaultLatency: '3.1 hours', health: 'CRITICAL', statusColor: 'bg-rose-500' },
    { id: 'electricity', name: 'Power & Grid', worker: 'Udupi Rao', title: 'Grid Chief Commissioner', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-ele', defaultLatency: '0.9 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'encroachment', name: 'Encroachment', worker: 'Ritesh Vala', title: 'Senior Encroachment Director', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-enc', defaultLatency: '4.0 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'fire_safety', name: 'Fire Safety', worker: 'Bhagwant Mann', title: 'Chief Fire Officer (CFO)', avatar: 'https://i.pravatar.cc/150?u=delhi-hod-fir', defaultLatency: '0.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
  ],
  rajkot: [
    { id: 'pwd', name: 'PWD Roads', worker: 'Rahul Bajaj', title: 'Senior PWD Director', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-pwd', defaultLatency: '1.8 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'health_sanitation', name: 'Sanitation', worker: 'Tushar Trivedi', title: 'Chief Sanitation Commissioner', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-san', defaultLatency: '2.5 hours', health: 'HIGH LOAD', statusColor: 'bg-amber-500' },
    { id: 'water_works', name: 'Water Works', worker: 'Rajat Sharma', title: 'Senior Water Works Director', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-wat', defaultLatency: '1.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'drainage', name: 'Sewerage & Drainage', worker: 'Hemant Soren', title: 'Superintendent', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-dra', defaultLatency: '3.1 hours', health: 'CRITICAL', statusColor: 'bg-rose-500' },
    { id: 'electricity', name: 'Power & Grid', worker: 'Murali Divi', title: 'Grid Chief Commissioner', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-ele', defaultLatency: '0.9 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'encroachment', name: 'Encroachment', worker: 'Lachhman Das', title: 'Senior Encroachment Director', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-enc', defaultLatency: '4.0 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'fire_safety', name: 'Fire Safety', worker: 'Mansukh Rabari', title: 'Chief Fire Officer (CFO)', avatar: 'https://i.pravatar.cc/150?u=rajkot-hod-fir', defaultLatency: '0.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
  ],
  surat: [
    { id: 'pwd', name: 'PWD Roads', worker: 'Manik Saha', title: 'Senior PWD Director', avatar: 'https://i.pravatar.cc/150?u=surat-hod-pwd', defaultLatency: '1.8 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'health_sanitation', name: 'Sanitation', worker: 'Mukesh Ambani', title: 'Chief Sanitation Commissioner', avatar: 'https://i.pravatar.cc/150?u=surat-hod-san', defaultLatency: '2.5 hours', health: 'HIGH LOAD', statusColor: 'bg-amber-500' },
    { id: 'water_works', name: 'Water Works', worker: 'Manu Rabari', title: 'Senior Water Works Director', avatar: 'https://i.pravatar.cc/150?u=surat-hod-wat', defaultLatency: '1.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'drainage', name: 'Sewerage & Drainage', worker: 'Anand Mahindra', title: 'Superintendent', avatar: 'https://i.pravatar.cc/150?u=surat-hod-dra', defaultLatency: '3.1 hours', health: 'CRITICAL', statusColor: 'bg-rose-500' },
    { id: 'electricity', name: 'Power & Grid', worker: 'Harsh Vardhan', title: 'Grid Chief Commissioner', avatar: 'https://i.pravatar.cc/150?u=surat-hod-ele', defaultLatency: '0.9 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'encroachment', name: 'Encroachment', worker: 'Anil Kakodkar', title: 'Senior Encroachment Director', avatar: 'https://i.pravatar.cc/150?u=surat-hod-enc', defaultLatency: '4.0 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'fire_safety', name: 'Fire Safety', worker: 'Sandeep Sharma', title: 'Chief Fire Officer (CFO)', avatar: 'https://i.pravatar.cc/150?u=surat-hod-fir', defaultLatency: '0.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
  ],
  ahmedabad: [
    { id: 'pwd', name: 'PWD Roads', worker: 'Sanjay Chudasama', title: 'Senior PWD Director', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-pwd', defaultLatency: '1.8 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'health_sanitation', name: 'Sanitation', worker: 'Sunil Mittal', title: 'Chief Sanitation Commissioner', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-san', defaultLatency: '2.5 hours', health: 'HIGH LOAD', statusColor: 'bg-amber-500' },
    { id: 'water_works', name: 'Water Works', worker: 'Naveen Patnaik', title: 'Senior Water Works Director', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-wat', defaultLatency: '1.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'drainage', name: 'Sewerage & Drainage', worker: 'Karan Patel', title: 'Superintendent', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-dra', defaultLatency: '3.1 hours', health: 'CRITICAL', statusColor: 'bg-rose-500' },
    { id: 'electricity', name: 'Power & Grid', worker: 'Vishal Bhardwaj', title: 'Grid Chief Commissioner', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-ele', defaultLatency: '0.9 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'encroachment', name: 'Encroachment', worker: 'Nishant Tiwari', title: 'Senior Encroachment Director', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-enc', defaultLatency: '4.0 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'fire_safety', name: 'Fire Safety', worker: 'Himanta Biswa', title: 'Chief Fire Officer (CFO)', avatar: 'https://i.pravatar.cc/150?u=ahmedabad-hod-fir', defaultLatency: '0.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
  ],
  pune: [
    { id: 'pwd', name: 'PWD Roads', worker: 'Kanti Bhai', title: 'Senior PWD Director', avatar: 'https://i.pravatar.cc/150?u=pune-hod-pwd', defaultLatency: '1.8 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'health_sanitation', name: 'Sanitation', worker: 'Pankaj Patel', title: 'Chief Sanitation Commissioner', avatar: 'https://i.pravatar.cc/150?u=pune-hod-san', defaultLatency: '2.5 hours', health: 'HIGH LOAD', statusColor: 'bg-amber-500' },
    { id: 'water_works', name: 'Water Works', worker: 'Revanth Reddy', title: 'Senior Water Works Director', avatar: 'https://i.pravatar.cc/150?u=pune-hod-wat', defaultLatency: '1.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'drainage', name: 'Sewerage & Drainage', worker: 'Ratan Tata', title: 'Superintendent', avatar: 'https://i.pravatar.cc/150?u=pune-hod-dra', defaultLatency: '3.1 hours', health: 'CRITICAL', statusColor: 'bg-rose-500' },
    { id: 'electricity', name: 'Power & Grid', worker: 'PWD Field Engineers', title: 'Grid Chief Commissioner', avatar: 'https://i.pravatar.cc/150?u=pune-hod-ele', defaultLatency: '0.9 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'encroachment', name: 'Encroachment', worker: 'Zoramthanga', title: 'Senior Encroachment Director', avatar: 'https://i.pravatar.cc/150?u=pune-hod-enc', defaultLatency: '4.0 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
    { id: 'fire_safety', name: 'Fire Safety', worker: 'Priya Verma', title: 'Chief Fire Officer (CFO)', avatar: 'https://i.pravatar.cc/150?u=pune-hod-fir', defaultLatency: '0.2 hours', health: 'STABLE', statusColor: 'bg-emerald-500' },
  ],
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
  delhi: {
    pwd: [
      { id: 'emp-pwd-1', name: 'Jayesh Rathod', title: 'PWD Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-pwd-1', defaultStatus: 'DISPATCHED', completionRate: '99%', phone: '+91 94281 99999', expertise: ['General'] },
      { id: 'emp-delhi-pwd-1', name: 'Karsanbhai Patel', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-1', defaultStatus: 'DISPATCHED', completionRate: '85%', phone: '+91 6268606373', expertise: ['General'] },
      { id: 'emp-delhi-pwd-2', name: 'Adi Godrej', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-2', defaultStatus: 'DISPATCHED', completionRate: '86%', phone: '+91 7849956094', expertise: ['General'] },
      { id: 'emp-delhi-pwd-3', name: 'Mahesh Reddy', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-3', defaultStatus: 'DISPATCHED', completionRate: '94%', phone: '+91 7932379207', expertise: ['General'] },
    ],
    health_sanitation: [
      { id: 'emp-san-2', name: 'Hasmukh Vora', title: 'Solid Waste Supervisor', avatar: 'https://i.pravatar.cc/150?u=emp-san-2', defaultStatus: 'DISPATCHED', completionRate: '100%', phone: '+91 94281 67890', expertise: ['General'] },
      { id: 'emp-delhi-health_sanitation-1', name: 'Lalit Kumar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-4', defaultStatus: 'DISPATCHED', completionRate: '82%', phone: '+91 4531282146', expertise: ['General'] },
      { id: 'emp-delhi-health_sanitation-2', name: 'Amit Shah', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-5', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 9317657839', expertise: ['General'] },
      { id: 'emp-delhi-health_sanitation-3', name: 'Deepak Joshi', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-6', defaultStatus: 'DISPATCHED', completionRate: '98%', phone: '+91 9288585833', expertise: ['General'] },
    ],
    water_works: [
      { id: 'emp-delhi-water_works-1', name: 'Yogi Adityanath', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-7', defaultStatus: 'DISPATCHED', completionRate: '94%', phone: '+91 6587338349', expertise: ['General'] },
      { id: 'emp-delhi-water_works-2', name: 'Rajan Raheja', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-8', defaultStatus: 'DISPATCHED', completionRate: '95%', phone: '+91 9658415993', expertise: ['General'] },
      { id: 'emp-delhi-water_works-3', name: 'Dinesh Rathod', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-9', defaultStatus: 'DISPATCHED', completionRate: '92%', phone: '+91 6258710839', expertise: ['General'] },
    ],
    drainage: [
      { id: 'emp-delhi-drainage-1', name: 'Radhakishan Damani', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-10', defaultStatus: 'DISPATCHED', completionRate: '80%', phone: '+91 8237654922', expertise: ['General'] },
      { id: 'emp-delhi-drainage-2', name: 'Sudhir Mehta', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-11', defaultStatus: 'DISPATCHED', completionRate: '87%', phone: '+91 7326028742', expertise: ['General'] },
      { id: 'emp-delhi-drainage-3', name: 'Anil Mehta', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-12', defaultStatus: 'DISPATCHED', completionRate: '99%', phone: '+91 3396163274', expertise: ['General'] },
    ],
    electricity: [
      { id: 'emp-delhi-electricity-1', name: 'Ravi Pillai', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-13', defaultStatus: 'DISPATCHED', completionRate: '80%', phone: '+91 1671553602', expertise: ['General'] },
      { id: 'emp-delhi-electricity-2', name: 'K. Chandrashekar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-14', defaultStatus: 'DISPATCHED', completionRate: '89%', phone: '+91 2238503894', expertise: ['General'] },
      { id: 'emp-delhi-electricity-3', name: 'Rajnath Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-15', defaultStatus: 'DISPATCHED', completionRate: '93%', phone: '+91 5281877356', expertise: ['General'] },
    ],
    encroachment: [
      { id: 'emp-delhi-encroachment-1', name: 'Mohit Desai', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-16', defaultStatus: 'DISPATCHED', completionRate: '92%', phone: '+91 8873599064', expertise: ['General'] },
      { id: 'emp-delhi-encroachment-2', name: 'Ashok Gehlot', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-17', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 9915644169', expertise: ['General'] },
    ],
    fire_safety: [
      { id: 'emp-delhi-fire_safety-1', name: 'Benu Gopal', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-18', defaultStatus: 'DISPATCHED', completionRate: '84%', phone: '+91 1163956764', expertise: ['General'] },
      { id: 'emp-delhi-fire_safety-2', name: 'Savitri Jindal', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-19', defaultStatus: 'DISPATCHED', completionRate: '82%', phone: '+91 8563584596', expertise: ['General'] },
    ],
  },
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
  },
  surat: {
    pwd: [
      { id: 'emp-surat-pwd-1', name: 'Pravin Solanki', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-39', defaultStatus: 'DISPATCHED', completionRate: '88%', phone: '+91 1439242445', expertise: ['General'] },
      { id: 'emp-surat-pwd-2', name: 'Neiphiu Rio', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-40', defaultStatus: 'DISPATCHED', completionRate: '91%', phone: '+91 2142658201', expertise: ['General'] },
      { id: 'emp-surat-pwd-3', name: 'Sunil Dutt', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-41', defaultStatus: 'DISPATCHED', completionRate: '86%', phone: '+91 6089169733', expertise: ['General'] },
    ],
    health_sanitation: [
      { id: 'emp-surat-health_sanitation-1', name: 'Sohan Prasad', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-42', defaultStatus: 'DISPATCHED', completionRate: '93%', phone: '+91 1180438790', expertise: ['General'] },
      { id: 'emp-surat-health_sanitation-2', name: 'Azim Premji', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-43', defaultStatus: 'DISPATCHED', completionRate: '84%', phone: '+91 3210780760', expertise: ['General'] },
      { id: 'emp-surat-health_sanitation-3', name: 'Bhavdeep Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-44', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 9287973255', expertise: ['General'] },
    ],
    water_works: [
      { id: 'emp-surat-water_works-1', name: 'Mitesh Patel', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-45', defaultStatus: 'DISPATCHED', completionRate: '84%', phone: '+91 2874651585', expertise: ['General'] },
      { id: 'emp-surat-water_works-2', name: 'Chetan Zala', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-46', defaultStatus: 'DISPATCHED', completionRate: '96%', phone: '+91 1096924199', expertise: ['General'] },
      { id: 'emp-surat-water_works-3', name: 'Conrad Sangma', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-47', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 1764492465', expertise: ['General'] },
    ],
    drainage: [
      { id: 'emp-surat-drainage-1', name: 'Ketan Chawda', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-48', defaultStatus: 'DISPATCHED', completionRate: '92%', phone: '+91 7258557319', expertise: ['General'] },
      { id: 'emp-surat-drainage-2', name: 'Kamlesh Vadher', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-49', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 6367268458', expertise: ['General'] },
      { id: 'emp-surat-drainage-3', name: 'Homi Bhabha', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-50', defaultStatus: 'DISPATCHED', completionRate: '89%', phone: '+91 8839393376', expertise: ['General'] },
    ],
    electricity: [
      { id: 'emp-surat-electricity-1', name: 'Rajesh Kumar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-51', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 8944417592', expertise: ['General'] },
      { id: 'emp-surat-electricity-2', name: 'Pushkar Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-52', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 9902365008', expertise: ['General'] },
      { id: 'emp-surat-electricity-3', name: 'Aman Verma', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-53', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 4146926698', expertise: ['General'] },
    ],
    encroachment: [
      { id: 'emp-surat-encroachment-1', name: 'Kushal Pal', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-54', defaultStatus: 'DISPATCHED', completionRate: '88%', phone: '+91 3483981362', expertise: ['General'] },
      { id: 'emp-surat-encroachment-2', name: 'Jignesh Patel', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-55', defaultStatus: 'DISPATCHED', completionRate: '93%', phone: '+91 3713100155', expertise: ['General'] },
    ],
    fire_safety: [
      { id: 'emp-surat-fire_safety-1', name: 'Nitish Kumar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-56', defaultStatus: 'DISPATCHED', completionRate: '94%', phone: '+91 1472367027', expertise: ['General'] },
      { id: 'emp-surat-fire_safety-2', name: 'Ashwin Dani', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-57', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 3046931160', expertise: ['General'] },
    ],
  },
  ahmedabad: {
    pwd: [
      { id: 'emp-ahmedabad-pwd-1', name: 'Anandiben Patel', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-58', defaultStatus: 'DISPATCHED', completionRate: '93%', phone: '+91 8377480543', expertise: ['General'] },
      { id: 'emp-ahmedabad-pwd-2', name: 'Vijay Rupani', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-59', defaultStatus: 'DISPATCHED', completionRate: '80%', phone: '+91 5977437871', expertise: ['General'] },
      { id: 'emp-ahmedabad-pwd-3', name: 'Ramesh Koli', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-60', defaultStatus: 'DISPATCHED', completionRate: '81%', phone: '+91 3909917618', expertise: ['General'] },
    ],
    health_sanitation: [
      { id: 'emp-ahmedabad-health_sanitation-1', name: 'Eknath Shinde', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-61', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 4897195059', expertise: ['General'] },
      { id: 'emp-ahmedabad-health_sanitation-2', name: 'Arjan Kher', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-62', defaultStatus: 'DISPATCHED', completionRate: '91%', phone: '+91 9235537210', expertise: ['General'] },
      { id: 'emp-ahmedabad-health_sanitation-3', name: 'Siddaramaiah', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-63', defaultStatus: 'DISPATCHED', completionRate: '89%', phone: '+91 2807266729', expertise: ['General'] },
    ],
    water_works: [
      { id: 'emp-ahmedabad-water_works-1', name: 'Jagan Mohan', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-64', defaultStatus: 'DISPATCHED', completionRate: '82%', phone: '+91 6167890141', expertise: ['General'] },
      { id: 'emp-ahmedabad-water_works-2', name: 'Paresh Joshi', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-65', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 9769224085', expertise: ['General'] },
      { id: 'emp-ahmedabad-water_works-3', name: 'Ramesh Bhai', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-66', defaultStatus: 'DISPATCHED', completionRate: '98%', phone: '+91 8801280373', expertise: ['General'] },
    ],
    drainage: [
      { id: 'emp-ahmedabad-drainage-1', name: 'Rajesh Solanki', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-67', defaultStatus: 'DISPATCHED', completionRate: '98%', phone: '+91 5020730419', expertise: ['General'] },
      { id: 'emp-ahmedabad-drainage-2', name: 'Satish Dhawan', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-68', defaultStatus: 'DISPATCHED', completionRate: '88%', phone: '+91 9705518090', expertise: ['General'] },
      { id: 'emp-ahmedabad-drainage-3', name: 'Shiv Nadar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-69', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 2671922756', expertise: ['General'] },
    ],
    electricity: [
      { id: 'emp-ahmedabad-electricity-1', name: 'Vijay Parmar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-70', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 4510983461', expertise: ['General'] },
      { id: 'emp-ahmedabad-electricity-2', name: 'Nilesh Vaghela', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-71', defaultStatus: 'DISPATCHED', completionRate: '96%', phone: '+91 8871783937', expertise: ['General'] },
      { id: 'emp-ahmedabad-electricity-3', name: 'Haresh Bhai', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-72', defaultStatus: 'DISPATCHED', completionRate: '84%', phone: '+91 8666777132', expertise: ['General'] },
    ],
    encroachment: [
      { id: 'emp-ahmedabad-encroachment-1', name: 'Prem Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-73', defaultStatus: 'DISPATCHED', completionRate: '81%', phone: '+91 1377648333', expertise: ['General'] },
      { id: 'emp-ahmedabad-encroachment-2', name: 'Shivraj Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-74', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 6637158472', expertise: ['General'] },
    ],
    fire_safety: [
      { id: 'emp-ahmedabad-fire_safety-1', name: 'Rajendra Prasad', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-75', defaultStatus: 'DISPATCHED', completionRate: '81%', phone: '+91 9208366770', expertise: ['General'] },
      { id: 'emp-ahmedabad-fire_safety-2', name: 'Ravi Prakash', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-76', defaultStatus: 'DISPATCHED', completionRate: '91%', phone: '+91 4367592979', expertise: ['General'] },
    ],
  },
  pune: {
    pwd: [
      { id: 'emp-pune-pwd-1', name: 'Ashok Parmar', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-77', defaultStatus: 'DISPATCHED', completionRate: '90%', phone: '+91 6708431146', expertise: ['General'] },
      { id: 'emp-pune-pwd-2', name: 'Nitin Gadkari', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-78', defaultStatus: 'DISPATCHED', completionRate: '81%', phone: '+91 7650878475', expertise: ['General'] },
      { id: 'emp-pune-pwd-3', name: 'Bablu Prasad', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-79', defaultStatus: 'DISPATCHED', completionRate: '84%', phone: '+91 1952376862', expertise: ['General'] },
    ],
    health_sanitation: [
      { id: 'emp-pune-health_sanitation-1', name: 'Suresh Solanki', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-80', defaultStatus: 'DISPATCHED', completionRate: '96%', phone: '+91 3914760364', expertise: ['General'] },
      { id: 'emp-pune-health_sanitation-2', name: 'M. K. Stalin', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-81', defaultStatus: 'DISPATCHED', completionRate: '82%', phone: '+91 3556889773', expertise: ['General'] },
      { id: 'emp-pune-health_sanitation-3', name: 'Vinod Gupta', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-82', defaultStatus: 'DISPATCHED', completionRate: '82%', phone: '+91 4210330812', expertise: ['General'] },
    ],
    water_works: [
      { id: 'emp-pune-water_works-1', name: 'Bhupesh Baghel', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-83', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 8431026524', expertise: ['General'] },
      { id: 'emp-pune-water_works-2', name: 'Pallonji Mistry', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-84', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 5883592081', expertise: ['General'] },
      { id: 'emp-pune-water_works-3', name: 'Kavita Singh', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-85', defaultStatus: 'DISPATCHED', completionRate: '94%', phone: '+91 8114738547', expertise: ['General'] },
    ],
    drainage: [
      { id: 'emp-pune-drainage-1', name: 'Narendra Modi', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-86', defaultStatus: 'DISPATCHED', completionRate: '96%', phone: '+91 5207406843', expertise: ['General'] },
      { id: 'emp-pune-drainage-2', name: 'Arvind Kejriwal', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-87', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 7667381718', expertise: ['General'] },
      { id: 'emp-pune-drainage-3', name: 'Pramod Sawant', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-88', defaultStatus: 'DISPATCHED', completionRate: '97%', phone: '+91 7136322168', expertise: ['General'] },
    ],
    electricity: [
      { id: 'emp-pune-electricity-1', name: 'Pinarayi Vijayan', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-89', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 5120127257', expertise: ['General'] },
      { id: 'emp-pune-electricity-2', name: 'Deva Solanki', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-90', defaultStatus: 'DISPATCHED', completionRate: '85%', phone: '+91 4952415529', expertise: ['General'] },
      { id: 'emp-pune-electricity-3', name: 'Hasmukh Vora', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-91', defaultStatus: 'DISPATCHED', completionRate: '86%', phone: '+91 6224337686', expertise: ['General'] },
    ],
    encroachment: [
      { id: 'emp-pune-encroachment-1', name: 'Bharat Makwana', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-92', defaultStatus: 'DISPATCHED', completionRate: '86%', phone: '+91 3513773384', expertise: ['General'] },
      { id: 'emp-pune-encroachment-2', name: 'Cyrus Poonawalla', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-93', defaultStatus: 'DISPATCHED', completionRate: '94%', phone: '+91 4550215401', expertise: ['General'] },
    ],
    fire_safety: [
      { id: 'emp-pune-fire_safety-1', name: 'Arvind Vaghela', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-94', defaultStatus: 'DISPATCHED', completionRate: '83%', phone: '+91 9851963214', expertise: ['General'] },
      { id: 'emp-pune-fire_safety-2', name: 'Sanjay Dave', title: 'Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-95', defaultStatus: 'DISPATCHED', completionRate: '86%', phone: '+91 8255453148', expertise: ['General'] },
    ],
  },
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
