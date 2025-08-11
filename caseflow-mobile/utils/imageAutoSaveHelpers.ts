import { CapturedImage } from '../types';

/**
 * Helper functions for image auto-save functionality
 * These functions ensure proper auto-save integration for all verification forms
 */

/**
 * Creates image change handler that triggers auto-save for regular photos
 * @param updateReport - Function to update the report in context
 * @param caseId - Case ID
 * @param report - Current report data
 * @param handleAutoSaveImagesChange - Auto-save callback from AutoSaveFormWrapper
 * @returns Image change handler function
 */
export const createImageChangeHandler = (
  updateReport: (caseId: string, updates: any) => void,
  caseId: string,
  report: any,
  handleAutoSaveImagesChange: (images: CapturedImage[]) => void
) => {
  return (images: CapturedImage[]) => {
    // Add metadata to identify these as regular images
    const imagesWithMetadata = images.map(img => ({
      ...img,
      componentType: 'photo' as const
    }));
    
    const updatedReport = { ...report, images: imagesWithMetadata };
    updateReport(caseId, updatedReport);
    
    // Trigger auto-save with all images (regular + selfie)
    const allImages = [
      ...imagesWithMetadata,
      ...(report.selfieImages || []).map((img: CapturedImage) => ({ ...img, componentType: 'selfie' as const }))
    ];
    handleAutoSaveImagesChange(allImages);
  };
};

/**
 * Creates selfie image change handler that triggers auto-save for selfie photos
 * @param updateReport - Function to update the report in context
 * @param caseId - Case ID
 * @param report - Current report data
 * @param handleAutoSaveImagesChange - Auto-save callback from AutoSaveFormWrapper
 * @returns Selfie image change handler function
 */
export const createSelfieImageChangeHandler = (
  updateReport: (caseId: string, updates: any) => void,
  caseId: string,
  report: any,
  handleAutoSaveImagesChange: (images: CapturedImage[]) => void
) => {
  return (selfieImages: CapturedImage[]) => {
    // Add metadata to identify these as selfie images
    const selfieImagesWithMetadata = selfieImages.map(img => ({
      ...img,
      componentType: 'selfie' as const
    }));
    
    const updatedReport = { ...report, selfieImages: selfieImagesWithMetadata };
    updateReport(caseId, updatedReport);
    
    // Trigger auto-save with all images (regular + selfie)
    const allImages = [
      ...(report.images || []).map((img: CapturedImage) => ({ ...img, componentType: 'photo' as const })),
      ...selfieImagesWithMetadata
    ];
    handleAutoSaveImagesChange(allImages);
  };
};

/**
 * Creates auto-save images change handler for AutoSaveFormWrapper
 * This handler is used when restoring draft data from auto-save
 * @param updateReport - Function to update the report in context
 * @param caseId - Case ID
 * @param report - Current report data
 * @param isReadOnly - Whether the form is in read-only mode
 * @returns Auto-save images change handler function
 */
export const createAutoSaveImagesChangeHandler = (
  updateReport: (caseId: string, updates: any) => void,
  caseId: string,
  report: any,
  isReadOnly: boolean
) => {
  return (allImages: CapturedImage[]) => {
    // This callback is used by AutoSaveFormWrapper for auto-save restoration
    // Split images based on componentType metadata
    if (!isReadOnly && report) {
      const selfieImages = allImages.filter(img => img.componentType === 'selfie');
      const regularImages = allImages.filter(img => img.componentType !== 'selfie');
      
      updateReport(caseId, { 
        ...report, 
        images: regularImages,
        selfieImages: selfieImages
      });
    }
  };
};

/**
 * Combines regular and selfie images with proper metadata for AutoSaveFormWrapper
 * @param report - Current report data
 * @returns Combined array of all images with componentType metadata
 */
export const combineImagesForAutoSave = (report: any): CapturedImage[] => {
  return [
    ...(report?.images || []).map((img: CapturedImage) => ({ ...img, componentType: 'photo' as const })),
    ...(report?.selfieImages || []).map((img: CapturedImage) => ({ ...img, componentType: 'selfie' as const }))
  ];
};

/**
 * Type-safe wrapper for form data change handler
 * @param updateReport - Function to update the report in context
 * @param caseId - Case ID
 * @param isReadOnly - Whether the form is in read-only mode
 * @returns Form data change handler function
 */
export const createFormDataChangeHandler = (
  updateReport: (caseId: string, updates: any) => void,
  caseId: string,
  isReadOnly: boolean
) => {
  return (formData: any) => {
    if (!isReadOnly) {
      updateReport(caseId, formData);
    }
  };
};

/**
 * Creates data restored handler for AutoSaveFormWrapper
 * @param updateReport - Function to update the report in context
 * @param caseId - Case ID
 * @param isReadOnly - Whether the form is in read-only mode
 * @returns Data restored handler function
 */
export const createDataRestoredHandler = (
  updateReport: (caseId: string, updates: any) => void,
  caseId: string,
  isReadOnly: boolean
) => {
  return (data: any) => {
    if (!isReadOnly && data.formData) {
      updateReport(caseId, data.formData);
    }
  };
};
