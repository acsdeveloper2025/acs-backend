import { Case, CaseStatus, VerificationType, Attachment, VerificationOutcome } from '../types';
import AsyncStorage from '../polyfills/AsyncStorage';
import { migrateCasesVerificationOutcomes, isDeprecatedOutcome } from '../utils/verificationOutcomeMigration';
import { apiClient } from './apiClient';
import { getEnvironmentConfig } from '../config/environment';

const LOCAL_STORAGE_KEY = 'caseflow_cases';

// API interfaces
export interface CaseListParams {
  page?: number;
  limit?: number;
  status?: CaseStatus;
  verificationType?: VerificationType;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  assignedToMe?: boolean;
}

export interface CaseUpdateRequest {
  status?: CaseStatus;
  priority?: number;
  verificationOutcome?: string;
  notes?: string;
  assignedTo?: string;
}

export interface CaseListResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CaseDetailResponse {
  case: Case;
  history: Array<{
    id: string;
    action: string;
    timestamp: string;
    userId: string;
    userName: string;
    details?: any;
  }>;
}

// Helper function to generate realistic attachments
const generateAttachments = (caseId: string, count: number): Attachment[] => {
  const baseUrl = 'https://api.caseflow.com/v1';
  const attachmentTemplates = [
    { name: 'Property_Documents.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 2048576, uploadedBy: 'System Admin' },
    { name: 'Bank_Statement.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 1536000, uploadedBy: 'Financial Analyst' },
    { name: 'Identity_Verification.jpg', type: 'image' as const, mimeType: 'image/jpeg' as const, size: 892000, uploadedBy: 'Verification Officer' },
    { name: 'Site_Photo_Exterior.png', type: 'image' as const, mimeType: 'image/png' as const, size: 1024000, uploadedBy: 'Field Agent' },
    { name: 'Legal_Agreement.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 3145728, uploadedBy: 'Legal Team' },
    { name: 'Address_Proof.jpg', type: 'image' as const, mimeType: 'image/jpeg' as const, size: 756000, uploadedBy: 'Document Specialist' },
    { name: 'Compliance_Report.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 2097152, uploadedBy: 'Compliance Officer' },
    { name: 'Building_Interior.png', type: 'image' as const, mimeType: 'image/png' as const, size: 1310720, uploadedBy: 'Site Inspector' }
  ];

  return attachmentTemplates.slice(0, count).map((template, index) => ({
    id: `att-${caseId}-${index + 1}`,
    name: template.name,
    type: template.type,
    mimeType: template.mimeType,
    size: template.size,
    url: `${baseUrl}/files/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${caseId}`,
    thumbnailUrl: template.type === 'image' ? `${baseUrl}/files/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${caseId}-thumb` : undefined,
    uploadedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: template.uploadedBy,
    description: `${template.name} for case ${caseId}`
  }));
};

const getInitialMockData = (): Case[] => [
  // 1. Residence Verification - Positive (Assigned with 3 attachments)
  {
    id: 'RES-001',
    title: 'Residence Verification - Priya Sharma',
    description: 'Verify current residential address for personal loan application. Expected outcome: Positive verification.',
    customer: { name: 'Priya Sharma', contact: 'priya.sharma@email.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Residence,
    verificationOutcome: null,
    bankName: 'HDFC Bank',
    product: 'Personal Loan',
    trigger: 'Address Verification',
    visitAddress: '12B, Ocean View Apartments, Marine Drive, Mumbai',
    systemContactNumber: '9876543210',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    attachments: generateAttachments('RES-001', 3)
  },
  // 2. Residence Verification - Shifted (In Progress with 2 attachments)
  {
    id: 'RES-002',
    title: 'Residence Verification - Amit Patel (Shifted)',
    description: 'Verify new residential address after recent relocation. Expected outcome: Shifted verification.',
    customer: { name: 'Amit Patel', contact: 'amit.patel@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Residence,
    verificationOutcome: null,
    bankName: 'SBI',
    product: 'Home Loan',
    trigger: 'Address Change Verification',
    visitAddress: '78, New Colony, Sector 15, Gurgaon',
    systemContactNumber: '9876543211',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    priority: 1,
    attachments: generateAttachments('RES-002', 2)
  },

  // 3. Business Verification - Positive (Completed with 4 attachments)
  {
    id: 'BUS-001',
    title: 'Business Verification - Tech Solutions Inc.',
    description: 'Verify business operations and premises for corporate loan. Expected outcome: Positive verification.',
    customer: { name: 'Tech Solutions Inc.', contact: 'hr@techsolutions.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Business,
    verificationOutcome: 'positive',
    bankName: 'Axis Bank',
    product: 'Corporate Loan',
    trigger: 'Business Verification',
    visitAddress: 'Unit 501, Cyber Towers, Hitech City, Hyderabad',
    systemContactNumber: '9876543212',
    customerCallingCode: '+91',
    applicantStatus: 'Company',
    submissionStatus: 'success',
    attachments: generateAttachments('BUS-001', 4)
  },
  // 4. Office Verification - Positive (Assigned with 1 attachment)
  {
    id: 'OFF-001',
    title: 'Office Verification - Global Enterprises',
    description: 'Verify employee workplace and office operations. Expected outcome: Positive verification.',
    customer: { name: 'Global Enterprises', contact: 'hr@globalent.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Office,
    verificationOutcome: null,
    bankName: 'ICICI Bank',
    product: 'Personal Loan',
    trigger: 'Employment Verification',
    visitAddress: '15th Floor, Business Tower, Connaught Place, Delhi',
    systemContactNumber: '9876543213',
    customerCallingCode: '+91',
    applicantStatus: 'Employee',
    attachments: generateAttachments('OFF-001', 1)
  },

  // 5. Residence-cum-Office Verification (In Progress with 5 attachments)
  {
    id: 'RCO-001',
    title: 'Resi-cum-Office Check - Raj Kumar',
    description: 'Verify dual-use property for business loan application. Expected outcome: Positive verification.',
    customer: { name: 'Raj Kumar', contact: 'raj.kumar@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.ResidenceCumOffice,
    verificationOutcome: null,
    bankName: 'HDFC Bank',
    product: 'Business Loan',
    trigger: 'Dual Use Verification',
    visitAddress: '45, Startup Lane, Koramangala, Bengaluru',
    systemContactNumber: '9876543214',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    priority: 2,
    attachments: generateAttachments('RCO-001', 5)
  },
  // 6. Builder Verification - Positive (Completed with 3 attachments)
  {
    id: 'BLD-001',
    title: 'Builder Verification - Apex Constructions',
    description: 'Verify construction site and builder credentials. Expected outcome: Positive verification.',
    customer: { name: 'Apex Constructions', contact: 'projects@apexconst.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Builder,
    verificationOutcome: 'positive',
    bankName: 'SBI',
    product: 'Project Finance',
    trigger: 'Builder Verification',
    visitAddress: 'Plot 8, Sector 62, Noida',
    systemContactNumber: '9876543215',
    customerCallingCode: '+91',
    applicantStatus: 'Developer',
    submissionStatus: 'success',
    attachments: generateAttachments('BLD-001', 3)
  },

  // 7. Property APF Verification (Assigned with no attachments)
  {
    id: 'APF-001',
    title: 'Property APF Verification - Lotus Towers',
    description: 'Verify Approved Project Finance status for residential project. Expected outcome: Positive verification.',
    customer: { name: 'Lotus Towers Developer', contact: 'sales@lotustowers.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.PropertyAPF,
    verificationOutcome: null,
    bankName: 'Canara Bank',
    product: 'Project Finance',
    trigger: 'APF Status Verification',
    visitAddress: 'Lotus Towers project site, Airport Road, Mohali',
    systemContactNumber: '9876543216',
    customerCallingCode: '+91',
    applicantStatus: 'Developer',
    attachments: []
  },
  // 8. Property Individual Verification (In Progress with 2 attachments)
  {
    id: 'IND-001',
    title: 'Property Individual Verification - Anil Verma',
    description: 'Verify individual property ownership for mortgage application. Expected outcome: Positive verification.',
    customer: { name: 'Anil Verma', contact: 'anil.verma@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.PropertyIndividual,
    verificationOutcome: null,
    bankName: 'Bank of Baroda',
    product: 'Mortgage Loan',
    trigger: 'Property Title Verification',
    visitAddress: 'Bungalow No. 24, Jubilee Hills, Hyderabad',
    systemContactNumber: '9876543217',
    customerCallingCode: '+91',
    applicantStatus: 'Co-Applicant',
    priority: 3,
    attachments: generateAttachments('IND-001', 2)
  },

  // 9. NOC Verification (Completed with 1 attachment)
  {
    id: 'NOC-001',
    title: 'NOC Verification - Green Valley Society',
    description: 'Obtain No Objection Certificate from society management. Expected outcome: Positive verification.',
    customer: { name: 'Green Valley Society', contact: 'secretary@greenvalley.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.NOC,
    verificationOutcome: 'positive',
    bankName: 'Kotak Mahindra Bank',
    product: 'Property Sale',
    trigger: 'NOC Verification',
    visitAddress: 'Green Valley Society, MG Road, Pune',
    systemContactNumber: '9876543218',
    customerCallingCode: '+91',
    applicantStatus: 'Society',
    submissionStatus: 'success',
    attachments: generateAttachments('NOC-001', 1)
  },
  // 10. DSA/DST Connector Verification (Assigned with 4 attachments)
  {
    id: 'CON-001',
    title: 'DSA/DST Connector Verification - Quick Loans',
    description: 'Verify business premises and operations for DSA partner. Expected outcome: Positive verification.',
    customer: { name: 'Quick Loans Agency', contact: 'partner@quickloans.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Connector,
    verificationOutcome: null,
    bankName: 'Yes Bank',
    product: 'Partner Verification',
    trigger: 'Business Premises Check',
    visitAddress: '3rd Floor, Commercial Complex, Karol Bagh, Delhi',
    systemContactNumber: '9876543219',
    customerCallingCode: '+91',
    applicantStatus: 'Partner',
    attachments: generateAttachments('CON-001', 4)
  },

  // 11. Business Verification - NSP (Completed with submission failed)
  {
    id: 'BUS-002',
    title: 'Business Verification - Metro Traders (NSP)',
    description: 'Business verification with NSP outcome due to operational issues. Expected outcome: NSP verification.',
    customer: { name: 'Metro Traders', contact: 'info@metrotraders.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Business,
    verificationOutcome: 'nsp',
    bankName: 'Punjab National Bank',
    product: 'Working Capital Loan',
    trigger: 'Business Verification',
    visitAddress: '17, Industrial Area, Phase 2, Chandigarh',
    systemContactNumber: '9876543220',
    customerCallingCode: '+91',
    applicantStatus: 'Proprietor',
    submissionStatus: 'failed',
    submissionError: 'Network timeout during submission',
    attachments: generateAttachments('BUS-002', 2)
  },

  // 12. Residence Verification - Entry Restricted (In Progress with 0 attachments)
  {
    id: 'RES-003',
    title: 'Residence Verification - Sunita Devi (Entry Restricted)',
    description: 'Residence verification with restricted access. Expected outcome: Entry Restricted verification.',
    customer: { name: 'Sunita Devi', contact: 'sunita.devi@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Residence,
    verificationOutcome: null,
    bankName: 'Union Bank',
    product: 'Personal Loan',
    trigger: 'Address Verification',
    visitAddress: '23, Restricted Colony, Sector 8, Faridabad',
    systemContactNumber: '9876543221',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    priority: 4,
    attachments: []
  },
].map((c, index) => ({
  ...c,
  order: index,
  submissionStatus: c.submissionStatus as 'pending' | 'submitting' | 'success' | 'failed' | undefined,
  verificationOutcome: c.verificationOutcome as VerificationOutcome | null
}));

class CaseService {
  private config = getEnvironmentConfig();
  private useOfflineMode = false;

  constructor() {
    this.initializeData();
    this.useOfflineMode = this.config.features.enableOfflineMode;
  }

  private async initializeData() {
    const existingData = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    if (!existingData) {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getInitialMockData()));
    }
  }

  private async readFromStorage(): Promise<Case[]> {
    const data = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async writeToStorage(cases: Case[]): Promise<void> {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cases));
  }

  async getCases(params: CaseListParams = {}): Promise<CaseListResponse> {
    try {
      // If offline mode is enabled or no network, use local data
      if (this.useOfflineMode || !navigator.onLine) {
        const localCases = await this.getLocalCases();
        return this.filterAndPaginateLocalCases(localCases, params);
      }

      // Try to fetch from API
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.verificationType) queryParams.append('verificationType', params.verificationType);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.assignedToMe) queryParams.append('assignedToMe', 'true');

      const response = await apiClient.get<CaseListResponse>(`/cases?${queryParams.toString()}`);

      if (response.success && response.data) {
        // Cache the cases locally for offline access
        await this.cacheApiCases(response.data.cases);
        return response.data;
      } else {
        // Fallback to local data if API fails
        console.warn('API request failed, falling back to local data:', response.error);
        const localCases = await this.getLocalCases();
        return this.filterAndPaginateLocalCases(localCases, params);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      // Fallback to local data
      const localCases = await this.getLocalCases();
      return this.filterAndPaginateLocalCases(localCases, params);
    }
  }

  private async getLocalCases(): Promise<Case[]> {
    const cases = await this.readFromStorage();
    // Apply verification outcome migration for any deprecated outcomes
    const migratedCases = migrateCasesVerificationOutcomes(cases);

    // If any cases were migrated, save the updated data
    const hasMigrations = migratedCases.some((migratedCase, index) =>
      migratedCase.verificationOutcome !== cases[index].verificationOutcome
    );

    if (hasMigrations) {
      console.log('Verification outcome migrations applied, saving updated cases...');
      await this.writeToStorage(migratedCases);
    }

    return migratedCases;
  }

  private filterAndPaginateLocalCases(cases: Case[], params: CaseListParams): CaseListResponse {
    let filteredCases = [...cases];

    // Apply filters
    if (params.status) {
      filteredCases = filteredCases.filter(c => c.status === params.status);
    }
    if (params.verificationType) {
      filteredCases = filteredCases.filter(c => c.verificationType === params.verificationType);
    }
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredCases = filteredCases.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.customer.name.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (params.sortBy) {
      filteredCases.sort((a, b) => {
        const aValue = a[params.sortBy!];
        const bValue = b[params.sortBy!];
        const order = params.sortOrder === 'desc' ? -1 : 1;

        if (aValue < bValue) return -1 * order;
        if (aValue > bValue) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCases = filteredCases.slice(startIndex, endIndex);

    return {
      cases: paginatedCases,
      pagination: {
        page,
        limit,
        total: filteredCases.length,
        totalPages: Math.ceil(filteredCases.length / limit),
      },
    };
  }

  private async cacheApiCases(cases: Case[]): Promise<void> {
    try {
      // Merge with existing local cases, preferring API data
      const localCases = await this.readFromStorage();
      const mergedCases = [...cases];

      // Add any local-only cases that aren't in the API response
      localCases.forEach(localCase => {
        if (!cases.find(apiCase => apiCase.id === localCase.id)) {
          mergedCases.push(localCase);
        }
      });

      await this.writeToStorage(mergedCases);
    } catch (error) {
      console.error('Error caching API cases:', error);
    }
  }

  private async markForSync(caseId: string, action: 'create' | 'update' | 'delete', data?: any): Promise<void> {
    try {
      const syncQueue = await AsyncStorage.getItem('sync_queue') || '[]';
      const queue = JSON.parse(syncQueue);

      const syncItem = {
        id: `${action}_${caseId}_${Date.now()}`,
        caseId,
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(syncItem);
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error marking for sync:', error);
    }
  }

  async getCase(id: string): Promise<Case | undefined> {
    try {
      // Try to fetch from API first
      if (!this.useOfflineMode && navigator.onLine) {
        const response = await apiClient.get<CaseDetailResponse>(`/cases/${id}`);

        if (response.success && response.data) {
          // Cache the case locally
          await this.updateLocalCase(response.data.case);
          return response.data.case;
        }
      }

      // Fallback to local data
      const cases = await this.readFromStorage();
      return cases.find(c => c.id === id);
    } catch (error) {
      console.error('Error fetching case by ID:', error);
      // Fallback to local data
      const cases = await this.readFromStorage();
      return cases.find(c => c.id === id);
    }
  }

  private async updateLocalCase(updatedCase: Case): Promise<void> {
    try {
      const cases = await this.readFromStorage();
      const index = cases.findIndex(c => c.id === updatedCase.id);

      if (index >= 0) {
        cases[index] = updatedCase;
      } else {
        cases.push(updatedCase);
      }

      await this.writeToStorage(cases);
    } catch (error) {
      console.error('Error updating local case:', error);
    }
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    try {
      // Prepare API update request
      const apiUpdates: CaseUpdateRequest = {};
      if (updates.status) apiUpdates.status = updates.status;
      if (updates.priority) apiUpdates.priority = updates.priority;
      if (updates.verificationOutcome) apiUpdates.verificationOutcome = updates.verificationOutcome.toString();
      if (updates.notes) apiUpdates.notes = updates.notes;

      // Try to update via API first
      if (!this.useOfflineMode && navigator.onLine) {
        const response = await apiClient.put<{ case: Case }>(`/cases/${id}`, apiUpdates);

        if (response.success && response.data) {
          // Update local cache
          await this.updateLocalCase(response.data.case);
          return response.data.case;
        }
      }

      // Fallback to local update
      const cases = await this.readFromStorage();
      const caseIndex = cases.findIndex(c => c.id === id);
      if (caseIndex === -1) {
        throw new Error('Case not found');
      }
      const updatedCase = { ...cases[caseIndex], ...updates, updatedAt: new Date().toISOString() };
      cases[caseIndex] = updatedCase;
      await this.writeToStorage(cases);

      // Mark for sync if offline
      if (this.useOfflineMode || !navigator.onLine) {
        await this.markForSync(id, 'update', updates);
      }

      return updatedCase;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }
  
  async revokeCase(id: string, reason: string): Promise<void> {
    const cases = await this.readFromStorage();
    const updatedCases = cases.filter(c => c.id !== id);
    console.log(`Case ${id} revoked. Reason: ${reason}. Simulating sending to server.`);
    await this.writeToStorage(updatedCases);
  }

  async syncWithServer(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    console.log("Starting sync with server...");

    try {
      if (!navigator.onLine) {
        return { success: false, syncedCount: 0, errors: ['No internet connection'] };
      }

      const syncQueue = await AsyncStorage.getItem('sync_queue') || '[]';
      const queue = JSON.parse(syncQueue);

      if (queue.length === 0) {
        return { success: true, syncedCount: 0, errors: [] };
      }

      let syncedCount = 0;
      const errors: string[] = [];
      const remainingQueue = [];

      for (const item of queue) {
        try {
          let success = false;

          switch (item.action) {
            case 'update':
              const updateResponse = await apiClient.put(`/cases/${item.caseId}`, item.data);
              success = updateResponse.success;
              break;
            case 'create':
              const createResponse = await apiClient.post('/cases', item.data);
              success = createResponse.success;
              break;
            case 'delete':
              const deleteResponse = await apiClient.delete(`/cases/${item.caseId}`);
              success = deleteResponse.success;
              break;
          }

          if (success) {
            syncedCount++;
          } else {
            item.retryCount = (item.retryCount || 0) + 1;
            if (item.retryCount < this.config.offline.syncRetryAttempts) {
              remainingQueue.push(item);
            } else {
              errors.push(`Failed to sync ${item.action} for case ${item.caseId} after ${item.retryCount} attempts`);
            }
          }
        } catch (error) {
          item.retryCount = (item.retryCount || 0) + 1;
          if (item.retryCount < this.config.offline.syncRetryAttempts) {
            remainingQueue.push(item);
          } else {
            errors.push(`Error syncing ${item.action} for case ${item.caseId}: ${error}`);
          }
        }
      }

      // Update sync queue with remaining items
      await AsyncStorage.setItem('sync_queue', JSON.stringify(remainingQueue));

      // Refresh local data from server
      if (syncedCount > 0) {
        await this.getCases({ page: 1, limit: 50 }); // Refresh first page
      }

      return { success: errors.length === 0, syncedCount, errors };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, syncedCount: 0, errors: [error.toString()] };
    }
  }

  async submitCase(id: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Attempting to submit case ${id} to server...`);

    try {
      // Update case status to submitting
      await this.updateCase(id, {
        submissionStatus: 'submitting',
        lastSubmissionAttempt: new Date().toISOString()
      });

      // Get the case data to submit
      const caseData = await this.getCase(id);
      if (!caseData) {
        throw new Error('Case not found');
      }

      // Submit to API
      const response = await apiClient.post(`/cases/${id}/submit`, {
        caseData,
        timestamp: new Date().toISOString(),
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Submission failed');
      }

      // Mark as successfully submitted
      await this.updateCase(id, {
        submissionStatus: 'success',
        submissionError: undefined,
        isSaved: false, // Clear saved status since it's now submitted
        status: 'submitted' as CaseStatus,
      });

      console.log(`Case ${id} submitted successfully`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Mark as failed submission
      await this.updateCase(id, {
        submissionStatus: 'failed',
        submissionError: errorMessage
      });

      // If offline, mark for sync
      if (!navigator.onLine) {
        await this.markForSync(id, 'update', { status: 'submitted' });
      }

      console.error(`Case ${id} submission failed:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async resubmitCase(id: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Re-attempting to submit case ${id}...`);
    return this.submitCase(id);
  }
}

export const caseService = new CaseService();
