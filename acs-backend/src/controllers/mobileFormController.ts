import { Request, Response } from 'express';
import { MobileFormSubmissionRequest } from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';
import { config } from '../config';
import { query } from '@/config/database';

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

      const vals: any[] = [caseId];
      let caseSql = `SELECT id FROM cases WHERE id = $1`;
      if (userRole === 'FIELD') { caseSql += ` AND "assignedToId" = $2`; vals.push(userId); }
      const caseRes = await query(caseSql, vals);
      const existingCase = caseRes.rows[0];

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
      const attRes = await query(`SELECT id FROM attachments WHERE id = ANY($1::text[]) AND "caseId" = $2`, [attachmentIds, caseId]);
      const attachments = attRes.rows;

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
      await query(`UPDATE cases SET status = 'COMPLETED', "completedAt" = CURRENT_TIMESTAMP, "verificationData" = $1, "verificationType" = 'RESIDENCE', "verificationOutcome" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $3`, [JSON.stringify(verificationData), formData.outcome || 'VERIFIED', caseId]);
      const caseUpd = await query(`SELECT id, status, "completedAt" FROM cases WHERE id = $1`, [caseId]);
      const updatedCase = caseUpd.rows[0];

      // Update attachment geo-locations
      for (const photo of photos) {
        await query(`UPDATE attachments SET "geoLocation" = $1 WHERE id = $2`, [JSON.stringify(photo.geoLocation), photo.attachmentId]);
      }

      // Create residence verification report
      await query(
        `INSERT INTO residence_verification_reports (
          id, "caseId", "applicantName", "applicantPhone", "applicantEmail", residenceType, ownershipStatus, monthlyRent, landlordName, landlordPhone,
          residenceSince, familyMembers, neighborVerification, neighborName, neighborPhone, propertyCondition, accessibilityNotes, verificationNotes, recommendationStatus, verifiedAt
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
        )`,
        [
          caseId,
          formData.applicantName || '',
          formData.applicantPhone,
          formData.applicantEmail,
          formData.residenceType || 'HOUSE',
          formData.ownershipStatus || 'OWNED',
          formData.monthlyRent ? parseFloat(formData.monthlyRent) : null,
          formData.landlordName,
          formData.landlordPhone,
          formData.residenceSince ? new Date(formData.residenceSince) : null,
          formData.familyMembers ? parseInt(formData.familyMembers) : null,
          formData.neighborVerification === 'true',
          formData.neighborName,
          formData.neighborPhone,
          formData.propertyCondition,
          formData.accessibilityNotes,
          formData.verificationNotes,
          formData.recommendationStatus || 'POSITIVE',
        ]
      );

      // Remove auto-save data
      await query(`DELETE FROM auto_saves WHERE "caseId" = $1 AND "formType" = 'RESIDENCE'`, [caseId]);

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

      const vals2: any[] = [caseId];
      let caseSql2 = `SELECT id FROM cases WHERE id = $1`;
      if (userRole === 'FIELD') { caseSql2 += ` AND "assignedToId" = $2`; vals2.push(userId); }
      const caseRes2 = await query(caseSql2, vals2);
      const existingCase = caseRes2.rows[0];

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
      const attRes2 = await query(`SELECT id FROM attachments WHERE id = ANY($1::text[]) AND "caseId" = $2`, [attachmentIds, caseId]);
      const attachments = attRes2.rows;

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
      await query(`UPDATE cases SET status = 'COMPLETED', "completedAt" = CURRENT_TIMESTAMP, "verificationData" = $1, "verificationType" = 'OFFICE', "verificationOutcome" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $3`, [JSON.stringify(verificationData), formData.outcome || 'VERIFIED', caseId]);
      const caseUpd2 = await query(`SELECT id, status, "completedAt" FROM cases WHERE id = $1`, [caseId]);
      const updatedCase = caseUpd2.rows[0];

      // Update attachment geo-locations
      for (const photo of photos) {
        await query(`UPDATE attachments SET "geoLocation" = $1 WHERE id = $2`, [JSON.stringify(photo.geoLocation), photo.attachmentId]);
      }

      // Create office verification report
      await query(
        `INSERT INTO office_verification_reports (
          id, "caseId", "companyName", designation, department, "employeeId", "joiningDate", "monthlySalary", "workingHours", "hrContactName",
          "hrContactPhone", "officeAddress", "officeType", "totalEmployees", "businessNature", "verificationMethod", "documentsSeen", "verificationNotes", "recommendationStatus", "verifiedAt"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
        )`,
        [
          caseId,
          formData.companyName || '',
          formData.designation || '',
          formData.department,
          formData.employeeId,
          formData.joiningDate ? new Date(formData.joiningDate) : null,
          formData.monthlySalary ? parseFloat(formData.monthlySalary) : null,
          formData.workingHours,
          formData.hrContactName,
          formData.hrContactPhone,
          formData.officeAddress || '',
          formData.officeType || 'CORPORATE',
          formData.totalEmployees ? parseInt(formData.totalEmployees) : null,
          formData.businessNature,
          formData.verificationMethod || 'PHYSICAL',
          formData.documentsSeen,
          formData.verificationNotes,
          formData.recommendationStatus || 'POSITIVE',
        ]
      );

      // Remove auto-save data
      await query(`DELETE FROM auto_saves WHERE "caseId" = $1 AND "formType" = 'OFFICE'`, [caseId]);

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
