export type CaseStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Case {
  id: string;
  title: string;
  description: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  latitude?: number;
  longitude?: number;
  status: CaseStatus;
  verificationType?: string;
  verificationOutcome?: string;
  assignedAt: string;
  updatedAt: string;
  completedAt?: string;
  priority: number;
  notes?: string;
  assignedToId: string;
  clientId: string;
  verificationTypeId?: string;
  createdAt?: string;
  createdBy?: string;
  updatedBy?: string;
  assignedTo: {
    id: string;
    name: string;
    username: string;
  };
  client: {
    id: string;
    name: string;
    code: string;
  };
  verificationTypeRef?: {
    id: string;
    name: string;
  };
}

export interface CaseFilters {
  status?: CaseStatus;
  search?: string;
  assignedTo?: string;
  clientId?: string;
  priority?: number;
  dateFrom?: string;
  dateTo?: string;
}
