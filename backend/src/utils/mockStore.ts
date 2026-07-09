import { Types } from 'mongoose';

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'volunteer' | 'admin';
  phone: string;
  location: { lat: number; lng: number };
  languagePreference: 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'pa' | 'ml' | 'kn' | 'or' | 'as';
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockIncident {
  _id: string;
  reporterId: string;
  category: 'medical' | 'fire' | 'flood' | 'trapped' | 'other';
  description: string;
  severity: number;
  status: 'reported' | 'acknowledged' | 'assigned' | 'resolved';
  location: { lat: number; lng: number };
  photoUrl?: string;
  assignedVolunteerIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockShelter {
  _id: string;
  name: string;
  location: { lat: number; lng: number };
  totalCapacity: number;
  currentOccupancy: number;
  status: 'operational' | 'full' | 'closed';
  contactInfo: string;
  resourcesAvailable: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTeam {
  _id: string;
  name: string;
  memberIds: string[];
  specialization: string;
  assignedIncidentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDonation {
  _id: string;
  donorId: string;
  type: 'goods' | 'funds';
  description: string;
  dropoffPointId?: string;
  status: 'pledged' | 'collected' | 'distributed';
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuditLog {
  _id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// In-Memory Database Collections
// ---------------------------------------------------------------------------
export const mockUsers: MockUser[] = [
  {
    _id: '60c72b2f9b1d8e1234567890',
    name: 'Jane Doe',
    email: 'citizen@aasha.space',
    passwordHash: '', // Set on login or unused in mock mode
    role: 'citizen',
    phone: '+91 98765 00001',
    location: { lat: 28.6139, lng: 77.2090 },
    languagePreference: 'en',
    skills: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '60c72b2f9b1d8e1234567891',
    name: 'John Doe',
    email: 'volunteer@aasha.space',
    passwordHash: '',
    role: 'volunteer',
    phone: '+91 98765 00002',
    location: { lat: 28.6250, lng: 77.2200 },
    languagePreference: 'en',
    skills: ['medical', 'transport', 'general'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '60c72b2f9b1d8e1234567892',
    name: 'System Admin',
    email: 'admin@aasha.space',
    passwordHash: '',
    role: 'admin',
    phone: '+91 98765 00003',
    location: { lat: 28.6300, lng: 77.2150 },
    languagePreference: 'en',
    skills: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const mockIncidents: MockIncident[] = [
  {
    _id: '60c72b2f9b1d8e12345678a1',
    reporterId: '60c72b2f9b1d8e1234567890', // Jane Doe
    category: 'medical',
    description: 'Elderly citizen needs immediate medical assistance and oxygen supply.',
    severity: 4,
    status: 'reported',
    location: { lat: 28.6150, lng: 77.2050 },
    assignedVolunteerIds: [],
    createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    _id: '60c72b2f9b1d8e12345678a2',
    reporterId: '60c72b2f9b1d8e1234567890',
    category: 'flood',
    description: 'Water levels rising rapidly on the main street. Basements are flooded.',
    severity: 5,
    status: 'assigned',
    location: { lat: 28.6280, lng: 77.2250 },
    assignedVolunteerIds: ['60c72b2f9b1d8e1234567891'], // John Doe
    createdAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    _id: '60c72b2f9b1d8e12345678a3',
    reporterId: '60c72b2f9b1d8e1234567890',
    category: 'other',
    description: 'Fallen tree blocking the arterial road to the primary hospital.',
    severity: 2,
    status: 'resolved',
    location: { lat: 28.6100, lng: 77.2180 },
    assignedVolunteerIds: [],
    createdAt: new Date(Date.now() - 3600000 * 24), // 24 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 20),
  }
];

export const mockShelters: MockShelter[] = [
  {
    _id: '60c72b2f9b1d8e12345678b1',
    name: 'Central Community Hall Shelter',
    location: { lat: 28.6200, lng: 77.2100 },
    totalCapacity: 500,
    currentOccupancy: 435, // 87% occupied (near capacity)
    status: 'operational',
    contactInfo: '011-23456789',
    resourcesAvailable: ['water', 'food', 'medical', 'blankets'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '60c72b2f9b1d8e12345678b2',
    name: 'East Wing Rescue & Relief Center',
    location: { lat: 28.6350, lng: 77.2300 },
    totalCapacity: 200,
    currentOccupancy: 200, // 100% occupied (full)
    status: 'full',
    contactInfo: '011-98765432',
    resourcesAvailable: ['water', 'food', 'first-aid'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '60c72b2f9b1d8e12345678b3',
    name: 'West Side Secondary Relief Camp',
    location: { lat: 28.6050, lng: 77.1950 },
    totalCapacity: 300,
    currentOccupancy: 45, // 15% occupied
    status: 'operational',
    contactInfo: '011-87654321',
    resourcesAvailable: ['water', 'food', 'beds'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const mockTeams: MockTeam[] = [
  {
    _id: '60c72b2f9b1d8e12345678c1',
    name: 'Delhi First Responders',
    memberIds: ['60c72b2f9b1d8e1234567891'], // John Doe
    specialization: 'medical',
    assignedIncidentIds: ['60c72b2f9b1d8e12345678a2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '60c72b2f9b1d8e12345678c2',
    name: 'North Delhi Relief Force',
    memberIds: [],
    specialization: 'general',
    assignedIncidentIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const mockDonations: MockDonation[] = [
  {
    _id: '60c72b2f9b1d8e12345678d1',
    donorId: '60c72b2f9b1d8e1234567890', // Jane Doe
    type: 'goods',
    description: '10 boxes of dry rations and 5 cases of bottled water.',
    dropoffPointId: '60c72b2f9b1d8e12345678b1',
    status: 'pledged',
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(Date.now() - 3600000 * 4),
  }
];

export const mockAuditLogs: MockAuditLog[] = [
  {
    _id: '60c72b2f9b1d8e12345678e1',
    actorId: '60c72b2f9b1d8e1234567892', // Admin
    action: 'LOGIN',
    targetType: 'User',
    targetId: '60c72b2f9b1d8e1234567892',
    details: 'Admin logged into portal',
    timestamp: new Date(Date.now() - 3600000 * 1),
  }
];

// Helper to log audit actions in mock mode
export function logMockAudit(actorId: string, action: string, targetType: string, targetId: string, details?: string) {
  mockAuditLogs.unshift({
    _id: new Types.ObjectId().toString(),
    actorId,
    action,
    targetType,
    targetId,
    details: details || '',
    timestamp: new Date(),
  });
}
