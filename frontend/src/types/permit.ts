export interface Permit {
  id: number;
  name: string;
  number: string;
  issueDate: string | null;
  expiryDate: string;
  issuedBy: string;
  isActive: boolean;
  parentId: number | null;
  renewalUrl: string | null;
  documentUrl: string | null;
  facility: number;
  facilityName?: string;
  uploadedBy?: number;
  uploadedByUsername?: string;
  status: 'active' | 'expiring' | 'expired' | 'superseded';
  createdAt: string;
  updatedAt: string;
}

export interface PermitHistory {
  id: number;
  permit: number;
  action: string;
  user: number | null;
  userName: string;
  notes: string;
  documentUrl: string | null;
  date: string;
  createdAt: string;
}

export interface PermitStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

export type PermitFilter = 'all' | 'active' | 'expiring' | 'expired';
