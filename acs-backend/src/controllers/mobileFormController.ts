import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MobileFormSubmissionRequest } from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';
import { config } from '../config';

const prisma = new PrismaClient();

export class MobileFormController {
  // Submit residence verification form
  static async submitResidenceVerification(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { formData, attachmentIds, geoLocation, photos }: MobileFormSubmissionRequest = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      // Verify case access
      const where: any = { id: caseId };
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const existingCase = await prisma.case.findFirst({ where });

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate minimum photo requirement (≥5 geo-tagged photos)
      if (!photos || photos.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum 5 geo-tagged photos required for residence verification',
          error: {
            code: 'INSUFFICIENT_PHOTOS',
            details: {
              required: 5,
              provided: photos?.length || 0,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate that all photos have geo-location
      const photosWithoutGeo = photos.filter(photo => 
        !photo.geoLocation || 
        !photo.geoLocation.latitude || 
        !photo.geoLocation.longitude
      );

      if (photosWithoutGeo.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'All photos must have geo-location data',
          error: {
            code: 'MISSING_GEO_LOCATION',
            details: {
              photosWithoutGeo: photosWithoutGeo.length,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify attachments exist and belong to this case
      const attachments = await prisma.attachment.findMany({
        where: {
          id: { in: attachmentIds },
          caseId,
        },
      });

      if (attachments.length !== attachmentIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some attachments not found or do not belong to this case',
          error: {
            code: 'INVALID_ATTACHMENTS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Prepare verification data
      const verificationData = {
        formType: 'RESIDENCE',
        submittedAt: new Date().toISOString(),
        submittedBy: userId,
        geoLocation,
        formData,
        attachments: attachmentIds,
        photos: photos.map(photo => ({
          attachmentId: photo.attachmentId,
          geoLocation: photo.geoLocation,
        })),
        verification: {
          ...formData,
          photoCount: photos.length,
          geoTaggedPhotos: photos.length,
          submissionLocation: geoLocation,
        },
      };

      // Update case with verification data
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          verificationData: JSON.stringify(verificationData),
          verificationType: 'RESIDENCE',
          verificationOutcome: formData.outcome || 'VERIFIED',
          updatedAt: new Date(),
        },
      });

      // Update attachment geo-locations
      for (const photo of photos) {
        await prisma.attachment.update({
          where: { id: photo.attachmentId },
          data: {
            geoLocation: JSON.stringify(photo.geoLocation),
          },
        });
      }

      // Create residence verification report
      await prisma.residenceVerificationReport.create({
        data: {
          caseId,
          applicantName: formData.applicantName || '',
          applicantPhone: formData.applicantPhone,
          applicantEmail: formData.applicantEmail,
          residenceType: formData.residenceType || 'HOUSE',
          ownershipStatus: formData.ownershipStatus || 'OWNED',
          monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : null,
          landlordName: formData.landlordName,
          landlordPhone: formData.landlordPhone,
          residenceSince: formData.residenceSince ? new Date(formData.residenceSince) : null,
          familyMembers: formData.familyMembers ? parseInt(formData.familyMembers) : null,
          neighborVerification: formData.neighborVerification === 'true',
          neighborName: formData.neighborName,
          neighborPhone: formData.neighborPhone,
          propertyCondition: formData.propertyCondition,
          accessibilityNotes: formData.accessibilityNotes,
          verificationNotes: formData.verificationNotes,
          recommendationStatus: formData.recommendationStatus || 'POSITIVE',
        },
      });

      // Remove auto-save data
      await prisma.autoSave.deleteMany({
        where: {
          caseId,
          formType: 'RESIDENCE',
        },
      });

      await createAuditLog({
        action: 'RESIDENCE_VERIFICATION_SUBMITTED',
        entityType: 'CASE',
        entityId: caseId,
        userId,
        details: {
          formType: 'RESIDENCE',
          photoCount: photos.length,
          attachmentCount: attachmentIds.length,
          outcome: formData.outcome,
          hasGeoLocation: !!geoLocation,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Residence verification submitted successfully',
        data: {
          caseId: updatedCase.id,
          status: updatedCase.status,
          completedAt: updatedCase.completedAt?.toISOString(),
          verificationId: verificationData,
        },
      });
    } catch (error) {
      console.error('Submit residence verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'VERIFICATION_SUBMISSION_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Submit office verification form
  static async submitOfficeVerification(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { formData, attachmentIds, geoLocation, photos }: MobileFormSubmissionRequest = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      // Verify case access
      const where: any = { id: caseId };
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const existingCase = await prisma.case.findFirst({ where });

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate minimum photo requirement (≥5 geo-tagged photos)
      if (!photos || photos.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum 5 geo-tagged photos required for office verification',
          error: {
            code: 'INSUFFICIENT_PHOTOS',
            details: {
              required: 5,
              provided: photos?.length || 0,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate that all photos have geo-location
      const photosWithoutGeo = photos.filter(photo => 
        !photo.geoLocation || 
        !photo.geoLocation.latitude || 
        !photo.geoLocation.longitude
      );

      if (photosWithoutGeo.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'All photos must have geo-location data',
          error: {
            code: 'MISSING_GEO_LOCATION',
            details: {
              photosWithoutGeo: photosWithoutGeo.length,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify attachments exist and belong to this case
      const attachments = await prisma.attachment.findMany({
        where: {
          id: { in: attachmentIds },
          caseId,
        },
      });

      if (attachments.length !== attachmentIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some attachments not found or do not belong to this case',
          error: {
            code: 'INVALID_ATTACHMENTS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Prepare verification data
      const verificationData = {
        formType: 'OFFICE',
        submittedAt: new Date().toISOString(),
        submittedBy: userId,
        geoLocation,
        formData,
        attachments: attachmentIds,
        photos: photos.map(photo => ({
          attachmentId: photo.attachmentId,
          geoLocation: photo.geoLocation,
        })),
        verification: {
          ...formData,
          photoCount: photos.length,
          geoTaggedPhotos: photos.length,
          submissionLocation: geoLocation,
        },
      };

      // Update case with verification data
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          verificationData: JSON.stringify(verificationData),
          verificationType: 'OFFICE',
          verificationOutcome: formData.outcome || 'VERIFIED',
          updatedAt: new Date(),
        },
      });

      // Update attachment geo-locations
      for (const photo of photos) {
        await prisma.attachment.update({
          where: { id: photo.attachmentId },
          data: {
            geoLocation: JSON.stringify(photo.geoLocation),
          },
        });
      }

      // Create office verification report
      await prisma.officeVerificationReport.create({
        data: {
          caseId,
          companyName: formData.companyName || '',
          designation: formData.designation || '',
          department: formData.department,
          employeeId: formData.employeeId,
          joiningDate: formData.joiningDate ? new Date(formData.joiningDate) : null,
          monthlySalary: formData.monthlySalary ? parseFloat(formData.monthlySalary) : null,
          workingHours: formData.workingHours,
          hrContactName: formData.hrContactName,
          hrContactPhone: formData.hrContactPhone,
          officeAddress: formData.officeAddress || '',
          officeType: formData.officeType || 'CORPORATE',
          totalEmployees: formData.totalEmployees ? parseInt(formData.totalEmployees) : null,
          businessNature: formData.businessNature,
          verificationMethod: formData.verificationMethod || 'PHYSICAL',
          documentsSeen: formData.documentsSeen,
          verificationNotes: formData.verificationNotes,
          recommendationStatus: formData.recommendationStatus || 'POSITIVE',
        },
      });

      // Remove auto-save data
      await prisma.autoSave.deleteMany({
        where: {
          caseId,
          formType: 'OFFICE',
        },
      });

      await createAuditLog({
        action: 'OFFICE_VERIFICATION_SUBMITTED',
        entityType: 'CASE',
        entityId: caseId,
        userId,
        details: {
          formType: 'OFFICE',
          photoCount: photos.length,
          attachmentCount: attachmentIds.length,
          outcome: formData.outcome,
          hasGeoLocation: !!geoLocation,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Office verification submitted successfully',
        data: {
          caseId: updatedCase.id,
          status: updatedCase.status,
          completedAt: updatedCase.completedAt?.toISOString(),
          verificationId: verificationData,
        },
      });
    } catch (error) {
      console.error('Submit office verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'VERIFICATION_SUBMISSION_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get verification form template
  static async getFormTemplate(req: Request, res: Response) {
    try {
      const { formType } = req.params;

      if (!['RESIDENCE', 'OFFICE'].includes(formType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form type',
          error: {
            code: 'INVALID_FORM_TYPE',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Return form template based on type
      const templates = {
        RESIDENCE: {
          fields: [
            { name: 'applicantName', type: 'text', required: true, label: 'Applicant Name' },
            { name: 'addressConfirmed', type: 'boolean', required: true, label: 'Address Confirmed' },
            { name: 'residenceType', type: 'select', required: true, label: 'Residence Type', options: ['OWNED', 'RENTED', 'FAMILY'] },
            { name: 'familyMembers', type: 'number', required: false, label: 'Family Members' },
            { name: 'neighborVerification', type: 'boolean', required: true, label: 'Neighbor Verification' },
            { name: 'remarks', type: 'textarea', required: false, label: 'Remarks' },
            { name: 'outcome', type: 'select', required: true, label: 'Verification Outcome', options: ['VERIFIED', 'NOT_VERIFIED', 'PARTIAL'] },
          ],
          requiredPhotos: 5,
          photoTypes: ['BUILDING_EXTERIOR', 'BUILDING_INTERIOR', 'NAMEPLATE', 'SURROUNDINGS', 'APPLICANT'],
        },
        OFFICE: {
          fields: [
            { name: 'companyName', type: 'text', required: true, label: 'Company Name' },
            { name: 'designation', type: 'text', required: true, label: 'Designation' },
            { name: 'employeeId', type: 'text', required: false, label: 'Employee ID' },
            { name: 'workingHours', type: 'text', required: true, label: 'Working Hours' },
            { name: 'hrVerification', type: 'boolean', required: true, label: 'HR Verification' },
            { name: 'salaryConfirmed', type: 'boolean', required: false, label: 'Salary Confirmed' },
            { name: 'remarks', type: 'textarea', required: false, label: 'Remarks' },
            { name: 'outcome', type: 'select', required: true, label: 'Verification Outcome', options: ['VERIFIED', 'NOT_VERIFIED', 'PARTIAL'] },
          ],
          requiredPhotos: 5,
          photoTypes: ['OFFICE_EXTERIOR', 'OFFICE_INTERIOR', 'RECEPTION', 'EMPLOYEE_DESK', 'ID_CARD'],
        },
      };

      res.json({
        success: true,
        message: 'Form template retrieved successfully',
        data: templates[formType.toUpperCase() as keyof typeof templates],
      });
    } catch (error) {
      console.error('Get form template error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'TEMPLATE_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
