import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WardMetric {
  id: string;
  name: string;
  open: number;
  red: number;
  amber: number;
  green: number;
  sla: number;
  top: string;
}

export interface CityData {
  [city: string]: WardMetric[];
}

export interface EmployeeStatus {
  lat: number;
  lng: number;
  landmark: string;
  status: 'STANDBY' | 'DISPATCHED' | 'ON LEAVE';
}

interface SentimentPost {
  id: string;
  user: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  time: string;
}

interface ForecastAlert {
  id: string;
  ward: string;
  risk: number;
  type: string;
  timeframe: string;
}

export interface GovtState {
  activeCity: string;
  setActiveCity: (city: string) => void;

  // City Metrics
  cityWards: CityData;
  updateWardMetric: (city: string, wardId: string, updates: Partial<CityData[string][0]>) => void;
  
  // Executive Dashboard Editing Mode
  isEditingMetrics: boolean;
  toggleEditingMetrics: () => void;
  
  // Personnel GPS & Status
  employeePositions: Record<string, EmployeeStatus>;
  updateEmployeeStatus: (empId: string, status: EmployeeStatus['status']) => void;
  simulateEmployeeGPS: (empId: string, landmark: string, lat: number, lng: number) => void;

  // Predictive AI Forecasting
  forecastData: ForecastAlert[];
  deployPreventiveUnit: (forecastId: string) => void;

  // Public Sentiment Monitor
  sentimentScore: number;
  sentimentFeed: SentimentPost[];
  issuePRStatement: (customText?: string) => void;

  // National Escalation
  emergencyState: boolean;
  triggerEmergency: () => void;
  revokeEmergency: () => void;
}

const initialCityWards: CityData = {
  Delhi: [
    { id: 'd1', name: 'Connaught Place', open: 4, red: 1, amber: 1, green: 2, sla: 94, top: 'Streetlight outage' },
    { id: 'd2', name: 'ITO', open: 11, red: 5, amber: 4, green: 2, sla: 61, top: 'Sewage overflow' },
    { id: 'd3', name: 'Karol Bagh', open: 7, red: 2, amber: 3, green: 2, sla: 78, top: 'Pothole cluster' }
  ],
  Rajkot: [
    { id: 'r1', name: 'Kalavad Road', open: 5, red: 2, amber: 1, green: 2, sla: 88, top: 'Drain blockage' },
    { id: 'r2', name: 'University Road', open: 3, red: 0, amber: 2, green: 1, sla: 96, top: 'Streetlight out' },
    { id: 'r3', name: '150ft Ring Road', open: 8, red: 3, amber: 3, green: 2, sla: 72, top: 'Water pipe leak' }
  ]
};

const initialEmployeePositions: Record<string, EmployeeStatus> = {
  'emp-pwd-1': { lat: 28.6315, lng: 77.2167, landmark: 'Connaught Place', status: 'DISPATCHED' },
  'emp-pwd-2': { lat: 28.6280, lng: 77.2433, landmark: 'ITO', status: 'STANDBY' },
  'emp-pwd-3': { lat: 28.6538, lng: 77.1888, landmark: 'Karol Bagh', status: 'ON LEAVE' },
  'emp-san-1': { lat: 28.6139, lng: 77.2090, landmark: 'India Gate', status: 'DISPATCHED' },
  'emp-san-2': { lat: 28.5355, lng: 77.2410, landmark: 'Okhla', status: 'STANDBY' },
  'emp-san-3': { lat: 28.6448, lng: 77.2167, landmark: 'Paharganj', status: 'DISPATCHED' },
  'emp-water-1': { lat: 28.5244, lng: 77.1855, landmark: 'Qutub Minar', status: 'DISPATCHED' },
  'emp-water-2': { lat: 28.6692, lng: 77.2273, landmark: 'Civil Lines', status: 'STANDBY' }
};

const initialForecasts: ForecastAlert[] = [
  { id: 'f1', ward: 'ITO', risk: 85, type: 'Severe Waterlogging', timeframe: 'Next 12 Hours' },
  { id: 'f2', ward: 'Paharganj', risk: 62, type: 'Power Grid Failure', timeframe: 'Next 24 Hours' },
  { id: 'f3', ward: 'Karol Bagh', risk: 45, type: 'Traffic Gridlock', timeframe: 'Next 2 Hours' }
];

const initialSentiment: SentimentPost[] = [
  { id: 's1', user: '@DelhiCitizen99', text: 'Power is out AGAIN in Paharganj. MCD doing nothing!', sentiment: 'negative', time: '10m ago' },
  { id: 's2', user: '@UrbanWatcher', text: 'Noticed new pothole repairs near CP. Finally some action.', sentiment: 'positive', time: '22m ago' },
  { id: 's3', user: '@AngryCommuter', text: 'Waterlogging at ITO is getting dangerous. Need immediate suction pumps!', sentiment: 'negative', time: '45m ago' }
];

export const useGovtStore = create<GovtState>()(
  persist(
    (set) => ({
      activeCity: 'rajkot',
      setActiveCity: (city) => set({ 
        activeCity: city,
        forecastData: initialForecasts,
        sentimentScore: 42,
        sentimentFeed: initialSentiment,
        emergencyState: false
      }),

      // City Metrics
      cityWards: initialCityWards,
      updateWardMetric: (city, wardId, updates) => set((state) => {
        const cityData = state.cityWards[city] || [];
        const newCityData = cityData.map(ward => 
          ward.id === wardId ? { ...ward, ...updates } : ward
        );
        return { cityWards: { ...state.cityWards, [city]: newCityData } };
      }),
      
      // Edit Mode
      isEditingMetrics: false,
      toggleEditingMetrics: () => set((state) => ({ isEditingMetrics: !state.isEditingMetrics })),
      
      // Personnel Data
      employeePositions: initialEmployeePositions,
      updateEmployeeStatus: (empId, status) => set((state) => {
        const current = state.employeePositions[empId] || { lat: 28.6139, lng: 77.2090, landmark: 'Central Delhi', status: 'STANDBY' };
        return {
          employeePositions: {
            ...state.employeePositions,
            [empId]: { ...current, status }
          }
        };
      }),
      simulateEmployeeGPS: (empId, landmark, lat, lng) => set((state) => {
        const current = state.employeePositions[empId] || { lat, lng, landmark, status: 'STANDBY' };
        return {
          employeePositions: {
            ...state.employeePositions,
            [empId]: { ...current, lat, lng, landmark }
          }
        };
      }),

      // Predictive Forecasting
      forecastData: initialForecasts,
      deployPreventiveUnit: (forecastId) => set((state) => ({
        forecastData: state.forecastData.map(f => 
          f.id === forecastId ? { ...f, risk: Math.max(0, f.risk - 40) } : f
        )
      })),

      // Public Sentiment
      sentimentScore: 42, // Starting out slightly negative (out of 100)
      sentimentFeed: initialSentiment,
      issuePRStatement: (customText?: string) => set((state) => {
        const newPost: SentimentPost = {
          id: `s_${Date.now()}_${Math.random()}`,
          user: '@OfficialMCD',
          text: customText || '🚨 We hear you! Rapid response teams have been deployed to all critical zones. #DelhiUpdates',
          sentiment: 'positive',
          time: 'Just now'
        };
        const updatedScore = Math.min(100, state.sentimentScore + 15);
        return {
          sentimentScore: updatedScore,
          sentimentFeed: [newPost, ...state.sentimentFeed].slice(0, 15) // keep top 15
        };
      }),

      // National Escalation
      emergencyState: false,
      triggerEmergency: () => set({ emergencyState: true }),
      revokeEmergency: () => set({ emergencyState: false })
    }),
    {
      name: 'sahaayak-govt-store', // Key in localStorage
    }
  )
);

