import { create } from 'zustand';

export type ReportSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReportStatus = 'Pending Verification' | 'Verified & Assigned' | 'In Progress' | 'Resolved';

export interface CommunityReport {
  id: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  upvotes: number;
  downvotes: number;
  status: ReportStatus;
  severity: ReportSeverity;
  date: string;
  author: string;
}

interface ReportStore {
  reports: CommunityReport[];
  upvoteReport: (id: string) => void;
  downvoteReport: (id: string) => void;
  addReport: (report: Omit<CommunityReport, 'id' | 'upvotes' | 'downvotes' | 'status' | 'severity' | 'date'>) => void;
  escalateReport: (id: string) => void; // Dev helper
}

// Initial mock reports spread around Delhi NCR
const initialReports: CommunityReport[] = [
  {
    id: 'REP-101',
    title: 'Severe Water Logging',
    description: 'The entire intersection is flooded after recent rains, making it impassable.',
    category: 'Infrastructure',
    lat: 28.59,
    lng: 77.22,
    upvotes: 12,
    downvotes: 1,
    status: 'Pending Verification',
    severity: 'Medium',
    date: new Date().toISOString().split('T')[0],
    author: 'Anonymous Citizen'
  },
  {
    id: 'REP-102',
    title: 'Fallen Tree Blocking Road',
    description: 'A large banyan tree fell during the storm, completely blocking Sector 4 main road.',
    category: 'Hazard',
    lat: 28.6139,
    lng: 77.2090,
    upvotes: 24, // One vote away from escalation
    downvotes: 0,
    status: 'Pending Verification',
    severity: 'High',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    author: 'Rahul Sharma'
  }
];

export const useReportStore = create<ReportStore>((set) => ({
  reports: initialReports,
  
  upvoteReport: (id) => set((state) => ({
    reports: state.reports.map((report) => {
      if (report.id === id) {
        const newUpvotes = report.upvotes + 1;
        // Escalation Logic: If votes reach 25, automatically verify and assign
        if (newUpvotes >= 25 && report.status === 'Pending Verification') {
          return { ...report, upvotes: newUpvotes, status: 'Verified & Assigned' };
        }
        return { ...report, upvotes: newUpvotes };
      }
      return report;
    })
  })),

  downvoteReport: (id) => set((state) => ({
    reports: state.reports.map((report) => 
      report.id === id ? { ...report, downvotes: report.downvotes + 1 } : report
    )
  })),

  addReport: (reportData) => set((state) => ({
    reports: [
      {
        ...reportData,
        id: `REP-${Math.floor(Math.random() * 10000)}`,
        upvotes: 0,
        downvotes: 0,
        status: 'Pending Verification',
        severity: 'Low',
        date: new Date().toISOString().split('T')[0]
      },
      ...state.reports
    ]
  })),

  // Dev helper to instantly escalate
  escalateReport: (id) => set((state) => ({
    reports: state.reports.map((report) => 
      report.id === id ? { ...report, upvotes: Math.max(report.upvotes, 25), status: 'Verified & Assigned' } : report
    )
  }))
}));
