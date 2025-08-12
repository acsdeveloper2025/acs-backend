import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for demonstration (replace with actual database operations)
let cases: any[] = [
  {
    id: 'case_1',
    title: 'Residence Verification - John Doe',
    description: 'Verify residential address for loan application',
    status: 'PENDING',
    priority: 1,
    clientId: 'client_1',
    assignedToId: 'user_1',
    createdById: 'user_3',
    address: '123 Main St, City, State 12345',
    contactPerson: 'John Doe',
    contactPhone: '+1234567890',
    verificationType: 'RESIDENCE',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    completedAt: null,
    notes: [],
    attachments: [],
    history: [],
  },
  {
    id: 'case_2',
    title: 'Office Verification - Tech Solutions Inc',
    description: 'Verify office premises for business loan',
    status: 'IN_PROGRESS',
    priority: 2,
    clientId: 'client_2',
    assignedToId: 'user_2',
    createdById: 'user_3',
    address: '456 Business Ave, City, State 67890',
    contactPerson: 'Jane Smith',
    contactPhone: '+1234567891',
    verificationType: 'OFFICE',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    completedAt: null,
    notes: [
      { id: 'note_1', text: 'Initial visit scheduled', createdBy: 'user_2', createdAt: '2024-01-02T10:00:00.000Z' }
    ],
    attachments: [],
    history: [
      { id: 'hist_1', action: 'CASE_CREATED', description: 'Case created', userId: 'user_3', timestamp: '2024-01-02T00:00:00.000Z' },
      { id: 'hist_2', action: 'CASE_ASSIGNED', description: 'Case assigned to field agent', userId: 'user_3', timestamp: '2024-01-02T00:30:00.000Z' },
    ],
  },
  {
    id: 'case_3',
    title: 'Residence Verification - Alice Johnson',
    description: 'Verify residential address for personal loan',
    status: 'COMPLETED',
    priority: 1,
    clientId: 'client_1',
    assignedToId: 'user_1',
    createdById: 'user_3',
    address: '789 Oak St, City, State 54321',
    contactPerson: 'Alice Johnson',
    contactPhone: '+1234567892',
    verificationType: 'RESIDENCE',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
    completedAt: '2024-01-05T00:00:00.000Z',
    notes: [
      { id: 'note_2', text: 'Verification completed successfully', createdBy: 'user_1', createdAt: '2024-01-05T00:00:00.000Z' }
    ],
    attachments: ['attachment_1', 'attachment_2'],
    history: [
      { id: 'hist_3', action: 'CASE_CREATED', description: 'Case created', userId: 'user_3', timestamp: '2024-01-03T00:00:00.000Z' },
      { id: 'hist_4', action: 'CASE_ASSIGNED', description: 'Case assigned to field agent', userId: 'user_3', timestamp: '2024-01-03T00:30:00.000Z' },
      { id: 'hist_5', action: 'CASE_COMPLETED', description: 'Case completed', userId: 'user_1', timestamp: '2024-01-05T00:00:00.000Z' },
    ],
  },
];

// GET /api/cases - List cases with pagination and filters
export const getCases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      assignedTo, 
      clientId, 
      priority, 
      dateFrom, 
      dateTo 
    } = req.query;

    let filteredCases = [...cases];

    // Apply filters
    if (status) {
      filteredCases = filteredCases.filter(c => c.status === status);
    }
    if (assignedTo) {
      filteredCases = filteredCases.filter(c => c.assignedToId === assignedTo);
    }
    if (clientId) {
      filteredCases = filteredCases.filter(c => c.clientId === clientId);
    }
    if (priority) {
      filteredCases = filteredCases.filter(c => c.priority === Number(priority));
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCases = filteredCases.filter(c => 
        c.title.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm) ||
        c.contactPerson.toLowerCase().includes(searchTerm) ||
        c.address.toLowerCase().includes(searchTerm)
      );
    }
    if (dateFrom) {
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) >= new Date(dateFrom as string));
    }
    if (dateTo) {
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) <= new Date(dateTo as string));
    }

    // Apply pagination
    const startIndex = ((page as number) - 1) * (limit as number);
    const endIndex = startIndex + (limit as number);
    const paginatedCases = filteredCases.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedCases.length} cases`, { 
      userId: req.user?.id,
      filters: { status, assignedTo, clientId, priority, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedCases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredCases.length,
        totalPages: Math.ceil(filteredCases.length / (limit as number)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cases',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cases/:id - Get case by ID
export const getCaseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = cases.find(c => c.id === id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved case ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    logger.error('Error retrieving case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases - Create new case
export const createCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      clientId, 
      assignedToId, 
      address, 
      contactPerson, 
      contactPhone, 
      verificationType, 
      priority = 2, 
      deadline 
    } = req.body;

    const newCase = {
      id: `case_${Date.now()}`,
      title,
      description,
      status: 'PENDING',
      priority,
      clientId,
      assignedToId,
      createdById: req.user?.id,
      address,
      contactPerson,
      contactPhone,
      verificationType,
      deadline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      notes: [],
      attachments: [],
      history: [
        {
          id: `hist_${Date.now()}`,
          action: 'CASE_CREATED',
          description: 'Case created',
          userId: req.user?.id,
          timestamp: new Date().toISOString(),
        }
      ],
    };

    cases.push(newCase);

    logger.info(`Created new case: ${newCase.id}`, { 
      userId: req.user?.id,
      caseTitle: title,
      clientId,
      assignedToId
    });

    res.status(201).json({
      success: true,
      data: newCase,
      message: 'Case created successfully',
    });
  } catch (error) {
    logger.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id - Update case
export const updateCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case
    const updatedCase = {
      ...cases[caseIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Add history entry
    updatedCase.history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_UPDATED',
      description: `Case updated: ${Object.keys(updateData).join(', ')}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    cases[caseIndex] = updatedCase;

    logger.info(`Updated case: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedCase,
      message: 'Case updated successfully',
    });
  } catch (error) {
    logger.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/cases/:id - Delete case
export const deleteCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedCase = cases[caseIndex];
    cases.splice(caseIndex, 1);

    logger.info(`Deleted case: ${id}`, { 
      userId: req.user?.id,
      caseTitle: deletedCase.title
    });

    res.json({
      success: true,
      message: 'Case deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id/status - Update case status
export const updateCaseStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const oldStatus = cases[caseIndex].status;
    cases[caseIndex].status = status;
    cases[caseIndex].updatedAt = new Date().toISOString();

    // If status is completed, set completion date
    if (status === 'COMPLETED' || status === 'APPROVED') {
      cases[caseIndex].completedAt = new Date().toISOString();
    }

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'STATUS_UPDATED',
      description: `Status changed from ${oldStatus} to ${status}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Updated case status: ${id}`, {
      userId: req.user?.id,
      oldStatus,
      newStatus: status
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating case status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case status',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id/priority - Update case priority
export const updateCasePriority = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const oldPriority = cases[caseIndex].priority;
    cases[caseIndex].priority = priority;
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'PRIORITY_UPDATED',
      description: `Priority changed from ${oldPriority} to ${priority}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Updated case priority: ${id}`, {
      userId: req.user?.id,
      oldPriority,
      newPriority: priority
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case priority updated successfully',
    });
  } catch (error) {
    logger.error('Error updating case priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case priority',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cases/:id/assign - Assign case
export const assignCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const oldAssignee = cases[caseIndex].assignedToId;
    cases[caseIndex].assignedToId = assignedToId;
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_ASSIGNED',
      description: `Case reassigned from ${oldAssignee || 'unassigned'} to ${assignedToId}`,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Assigned case: ${id}`, {
      userId: req.user?.id,
      oldAssignee,
      newAssignee: assignedToId
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case assigned successfully',
    });
  } catch (error) {
    logger.error('Error assigning case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/notes - Add case note
export const addCaseNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const newNote = {
      id: `note_${Date.now()}`,
      text: note,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };

    cases[caseIndex].notes.push(newNote);
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'NOTE_ADDED',
      description: 'Note added to case',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Added note to case: ${id}`, {
      userId: req.user?.id,
      noteLength: note.length
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Note added successfully',
    });
  } catch (error) {
    logger.error('Error adding case note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add case note',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cases/:id/history - Get case history
export const getCaseHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = cases.find(c => c.id === id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    res.json({
      success: true,
      data: caseData.history,
    });
  } catch (error) {
    logger.error('Error getting case history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get case history',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/complete - Complete case
export const completeCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, attachments } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status and completion date
    cases[caseIndex].status = 'COMPLETED';
    cases[caseIndex].completedAt = new Date().toISOString();
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add completion notes if provided
    if (notes) {
      const completionNote = {
        id: `note_${Date.now()}`,
        text: notes,
        createdBy: req.user?.id,
        createdAt: new Date().toISOString(),
      };
      cases[caseIndex].notes.push(completionNote);
    }

    // Add attachments if provided
    if (attachments && Array.isArray(attachments)) {
      cases[caseIndex].attachments.push(...attachments);
    }

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_COMPLETED',
      description: 'Case marked as completed',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Completed case: ${id}`, {
      userId: req.user?.id,
      hasNotes: !!notes,
      attachmentCount: attachments?.length || 0
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case completed successfully',
    });
  } catch (error) {
    logger.error('Error completing case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/approve - Approve case
export const approveCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status
    cases[caseIndex].status = 'APPROVED';
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add feedback as note if provided
    if (feedback) {
      const feedbackNote = {
        id: `note_${Date.now()}`,
        text: `Approval feedback: ${feedback}`,
        createdBy: req.user?.id,
        createdAt: new Date().toISOString(),
      };
      cases[caseIndex].notes.push(feedbackNote);
    }

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_APPROVED',
      description: 'Case approved',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Approved case: ${id}`, {
      userId: req.user?.id,
      hasFeedback: !!feedback
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case approved successfully',
    });
  } catch (error) {
    logger.error('Error approving case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/reject - Reject case
export const rejectCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status
    cases[caseIndex].status = 'REJECTED';
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add rejection reason as note
    const rejectionNote = {
      id: `note_${Date.now()}`,
      text: `Rejection reason: ${reason}`,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    cases[caseIndex].notes.push(rejectionNote);

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'CASE_REJECTED',
      description: 'Case rejected',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Rejected case: ${id}`, {
      userId: req.user?.id,
      reason
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Case rejected successfully',
    });
  } catch (error) {
    logger.error('Error rejecting case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject case',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cases/:id/rework - Request rework
export const requestRework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update case status
    cases[caseIndex].status = 'REWORK_REQUIRED';
    cases[caseIndex].updatedAt = new Date().toISOString();

    // Add rework feedback as note
    const reworkNote = {
      id: `note_${Date.now()}`,
      text: `Rework required: ${feedback}`,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    cases[caseIndex].notes.push(reworkNote);

    // Add history entry
    cases[caseIndex].history.push({
      id: `hist_${Date.now()}`,
      action: 'REWORK_REQUESTED',
      description: 'Rework requested',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Requested rework for case: ${id}`, {
      userId: req.user?.id,
      feedback
    });

    res.json({
      success: true,
      data: cases[caseIndex],
      message: 'Rework requested successfully',
    });
  } catch (error) {
    logger.error('Error requesting rework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request rework',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
