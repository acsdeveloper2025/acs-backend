import { Router } from 'express';
import { MobileAuthController } from '../controllers/mobileAuthController';
import { MobileCaseController } from '../controllers/mobileCaseController';
import { MobileAttachmentController, mobileUpload } from '../controllers/mobileAttachmentController';
import { MobileFormController } from '../controllers/mobileFormController';
import { MobileLocationController } from '../controllers/mobileLocationController';
import { MobileSyncController } from '../controllers/mobileSyncController';
import { authenticateToken } from '../middleware/auth';
import { validateMobileVersion, mobileRateLimit } from '../middleware/mobileValidation';

const router = Router();

// Apply mobile-specific rate limiting
router.use(mobileRateLimit(200, 15 * 60 * 1000)); // 200 requests per 15 minutes

// Mobile Authentication Routes
router.post('/auth/login', MobileAuthController.mobileLogin);
router.post('/auth/refresh', MobileAuthController.refreshToken);
router.post('/auth/logout', authenticateToken, MobileAuthController.mobileLogout);
router.post('/auth/version-check', MobileAuthController.checkVersion);
router.get('/auth/config', MobileAuthController.getAppConfig);
router.post('/auth/notifications/register', authenticateToken, MobileAuthController.registerNotifications);

// Device Management Routes (Admin only)
router.get('/devices/pending', authenticateToken, MobileAuthController.getPendingDevices);
router.post('/devices/:deviceId/approve', authenticateToken, MobileAuthController.approveDevice);
router.post('/devices/:deviceId/reject', authenticateToken, MobileAuthController.rejectDevice);
router.get('/devices/user/:userId', authenticateToken, MobileAuthController.getUserDevices);

// Mobile Case Management Routes
router.get('/cases', authenticateToken, validateMobileVersion, MobileCaseController.getMobileCases);
router.get('/cases/:caseId', authenticateToken, validateMobileVersion, MobileCaseController.getMobileCase);
router.put('/cases/:caseId/status', authenticateToken, validateMobileVersion, MobileCaseController.updateCaseStatus);
router.put('/cases/:caseId/priority', authenticateToken, validateMobileVersion, MobileCaseController.updateCasePriority);

// Mobile Auto-save Routes
router.post('/cases/:caseId/auto-save', authenticateToken, validateMobileVersion, MobileCaseController.autoSaveForm);
router.get('/cases/:caseId/auto-save/:formType', authenticateToken, validateMobileVersion, MobileCaseController.getAutoSavedForm);

// Mobile Attachment Routes
router.post('/cases/:caseId/attachments', 
  authenticateToken, 
  validateMobileVersion, 
  mobileUpload.array('files', 10), 
  MobileAttachmentController.uploadFiles
);
router.get('/cases/:caseId/attachments', authenticateToken, validateMobileVersion, MobileAttachmentController.getCaseAttachments);
router.get('/attachments/:attachmentId/content', authenticateToken, validateMobileVersion, MobileAttachmentController.getAttachmentContent);
router.delete('/attachments/:attachmentId', authenticateToken, validateMobileVersion, MobileAttachmentController.deleteAttachment);

// Mobile Form Submission Routes
router.post('/cases/:caseId/verification/residence', authenticateToken, validateMobileVersion, MobileFormController.submitResidenceVerification);
router.post('/cases/:caseId/verification/office', authenticateToken, validateMobileVersion, MobileFormController.submitOfficeVerification);
router.get('/forms/:formType/template', authenticateToken, validateMobileVersion, MobileFormController.getFormTemplate);

// Mobile Location Services Routes
router.post('/location/capture', authenticateToken, validateMobileVersion, MobileLocationController.captureLocation);
router.post('/location/validate', authenticateToken, validateMobileVersion, MobileLocationController.validateLocation);
router.get('/location/reverse-geocode', authenticateToken, validateMobileVersion, MobileLocationController.reverseGeocode);
router.get('/cases/:caseId/location-history', authenticateToken, validateMobileVersion, MobileLocationController.getCaseLocationHistory);
router.get('/location/trail', authenticateToken, validateMobileVersion, MobileLocationController.getUserLocationTrail);

// Mobile Sync Routes
router.post('/sync/upload', authenticateToken, validateMobileVersion, MobileSyncController.uploadSync);
router.get('/sync/download', authenticateToken, validateMobileVersion, MobileSyncController.downloadSync);
router.get('/sync/status', authenticateToken, validateMobileVersion, MobileSyncController.getSyncStatus);

export default router;
