// Shared types matching backend Mongoose models

export type UserRole = 'citizen' | 'volunteer' | 'admin';
export type IncidentCategory = 'medical' | 'fire' | 'flood' | 'trapped' | 'other';
export type IncidentStatus = 'reported' | 'acknowledged' | 'assigned' | 'resolved';
export type ShelterStatus = 'operational' | 'full' | 'closed';
export type DonationType = 'goods' | 'funds';
export type DonationStatus = 'pledged' | 'collected' | 'distributed';
export type Language = 'en' | 'hi' | 'es';

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location: Location;
  languagePreference: Language;
  skills?: string[];
}

export interface Incident {
  _id: string;
  reporterId: User | string;
  category: IncidentCategory;
  description: string;
  severity: number;
  status: IncidentStatus;
  location: Location;
  photoUrl?: string;
  assignedVolunteerIds: (User | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface Shelter {
  _id: string;
  name: string;
  location: Location;
  totalCapacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  contactInfo: string;
  resourcesAvailable: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerTeam {
  _id: string;
  name: string;
  memberIds: (User | string)[];
  specialization: string;
  assignedIncidentIds: (Incident | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  _id: string;
  donorId: User | string;
  type: DonationType;
  description: string;
  dropoffPointId?: Shelter | string;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  _id: string;
  actorId: User | string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  timestamp: string;
}

export interface DashboardStats {
  incidents: {
    total: number;
    active: number;
    reported: number;
    resolved: number;
  };
  shelters: {
    total: number;
    operational: number;
    full: number;
    nearCapacity: number;
  };
  users: {
    volunteers: number;
    citizens: number;
  };
  donations: {
    total: number;
    pending: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
