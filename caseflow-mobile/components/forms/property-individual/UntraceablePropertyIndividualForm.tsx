import React, { useMemo, useState } from 'react';
import {
  Case, UntraceablePropertyIndividualReportData, CallRemarkUntraceable, LocalityTypeResiCumOffice, DominatedArea, FinalStatusUntraceable, CaseStatus, CapturedImage
} from '../../../types';
import { useCases } from '../../../context/CaseContext';
import { FormField, SelectField, TextAreaField } from '../../FormControls';
import ConfirmationModal from '../../ConfirmationModal';
import ImageCapture from '../../ImageCapture';
import SelfieCapture from '../../SelfieCapture';
import PermissionStatus from '../../PermissionStatus';
import AutoSaveFormWrapper from '../../AutoSaveFormWrapper';
import { FORM_TYPES } from '../../../constants/formTypes';
import {
  createImageChangeHandler,
  createSelfieImageChangeHandler,
  createAutoSaveImagesChangeHandler,
  combineImagesForAutoSave,
  createFormDataChangeHandler,
  createDataRestoredHandler
} from '../../../utils/imageAutoSaveHelpers';

interface UntraceablePropertyIndividualFormProps {
  caseData: Case;
}

const getEnumOptions = (enumObject: object) => Object.values(enumObject).map(value => (
  <option key={value} value={value}>{value}</option>
));

const UntraceablePropertyIndividualForm: React.FC<UntraceablePropertyIndividualFormProps> = ({ caseData }) => {
  const { updateUntraceablePropertyIndividualReport, updateCaseStatus, toggleSaveCase } = useCases();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const report = caseData.untraceablePropertyIndividualReport;
  const isReadOnly = caseData.status === CaseStatus.Completed || caseData.isSaved;
  const MIN_IMAGES = 5;

  // Auto-save handlers
  const handleFormDataChange = (formData: any) => {
    if (!isReadOnly) {
      updateUntraceablePropertyIndividualReport(caseData.id, formData);
    }
  };

  const handleAutoSaveImagesChange = (images: CapturedImage[]) => {
    if (!isReadOnly && report) {
      updateUntraceablePropertyIndividualReport(caseData.id, { ...report, images });
    }
  };

  const handleDataRestored = (data: any) => {
    if (!isReadOnly && data.formData) {
      updateUntraceablePropertyIndividualReport(caseData.id, data.formData);
    }
  };

  if (!report) {
    return <p className="text-medium-text">No Untraceable Property (Individual) report data available.</p>;
  }

  const isFormValid = useMemo(() => {
    if (!report) return false;

    if (report.images.length < MIN_IMAGES) return false;

    // Require at least one selfie image
    if (!report.selfieImages || report.selfieImages.length === 0) return false;

    const checkFields = (fields: (keyof UntraceablePropertyIndividualReportData)[]) => fields.every(field => {
        const value = report[field];
        return value !== null && value !== undefined && value !== '';
    });

    const baseFields: (keyof UntraceablePropertyIndividualReportData)[] = [
        'metPerson', 'callRemark', 'locality', 'landmark1', 'landmark2', 'landmark3', 'landmark4',
        'dominatedArea', 'otherObservation', 'finalStatus'
    ];
    if (!checkFields(baseFields)) return false;

    if (report.finalStatus === FinalStatusUntraceable.Hold) {
        if (!report.holdReason || report.holdReason.trim() === '') return false;
    }

    return true;
  }, [report]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | null = value;

    if (e.target.tagName === 'SELECT' && value === '') {
      processedValue = null;
    }

    const updates: Partial<UntraceablePropertyIndividualReportData> = { [name]: processedValue };
    updateUntraceablePropertyIndividualReport(caseData.id, updates);
  };
  
  const handleImagesChange = (images: CapturedImage[]) => {
    updateUntraceablePropertyIndividualReport(caseData.id, { images });
  };

  const handleSelfieImagesChange = (selfieImages: CapturedImage[]) => {
    updateUntraceablePropertyIndividualReport(caseData.id, { selfieImages });
  };
  
  const options = useMemo(() => ({
    callRemark: getEnumOptions(CallRemarkUntraceable),
    localityType: getEnumOptions(LocalityTypeResiCumOffice),
    dominatedArea: getEnumOptions(DominatedArea),
    finalStatus: getEnumOptions(FinalStatusUntraceable),
  }), []);

  return (
    <AutoSaveFormWrapper
      caseId={caseData.id}
      formType={FORM_TYPES.PROPERTY_INDIVIDUAL_UNTRACEABLE}
      formData={report}
      images={combineImagesForAutoSave(report)}
      onFormDataChange={handleFormDataChange}
      onImagesChange={handleAutoSaveImagesChange}
      onDataRestored={handleDataRestored}
      autoSaveOptions={{
        enableAutoSave: !isReadOnly,
        showIndicator: !isReadOnly,
      }}
    >
      <div className="space-y-4 pt-4 border-t border-dark-border">
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border mb-4">
        <h5 className="font-semibold text-brand-primary">Case Details</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Customer Name" id="case-customerName" name="case-customerName" value={caseData.customer.name} onChange={() => {}} disabled />
            <FormField label="Bank Name" id="case-bankName" name="case-bankName" value={caseData.bankName || ''} onChange={() => {}} disabled />
            <FormField label="Product" id="case-product" name="case-product" value={caseData.product || ''} onChange={() => {}} disabled />
            <FormField label="Trigger" id="case-trigger" name="case-trigger" value={caseData.trigger || ''} onChange={() => {}} disabled />
            <div className="md:col-span-2">
              <FormField label="Visit Address" id="case-visitAddress" name="case-visitAddress" value={caseData.visitAddress || ''} onChange={() => {}} disabled />
            </div>
            <FormField label="System Contact Number" id="case-systemContactNumber" name="case-systemContactNumber" value={caseData.systemContactNumber || ''} onChange={() => {}} disabled />
            <FormField label="Customer Calling Code" id="case-customerCallingCode" name="case-customerCallingCode" value={caseData.customerCallingCode || ''} onChange={() => {}} disabled />
            <FormField label="Applicant Status" id="case-applicantStatus" name="case-applicantStatus" value={caseData.applicantStatus || ''} onChange={() => {}} disabled />
        </div>
      </div>
      
      <FormField label="Met Person" id="metPerson" name="metPerson" value={report.metPerson} onChange={handleChange} disabled={isReadOnly} />
      <SelectField label="Call Remark" id="callRemark" name="callRemark" value={report.callRemark || ''} onChange={handleChange} disabled={isReadOnly}><option value="">Select...</option>{options.callRemark}</SelectField>
      <SelectField label="Locality" id="locality" name="locality" value={report.locality || ''} onChange={handleChange} disabled={isReadOnly}><option value="">Select...</option>{options.localityType}</SelectField>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Landmark 1" id="landmark1" name="landmark1" value={report.landmark1} onChange={handleChange} disabled={isReadOnly} />
        <FormField label="Landmark 2" id="landmark2" name="landmark2" value={report.landmark2} onChange={handleChange} disabled={isReadOnly} />
        <FormField label="Landmark 3" id="landmark3" name="landmark3" value={report.landmark3} onChange={handleChange} disabled={isReadOnly} />
        <FormField label="Landmark 4" id="landmark4" name="landmark4" value={report.landmark4} onChange={handleChange} disabled={isReadOnly} />
      </div>

      <SelectField label="Dominated Area" id="dominatedArea" name="dominatedArea" value={report.dominatedArea || ''} onChange={handleChange} disabled={isReadOnly}><option value="">Select...</option>{options.dominatedArea}</SelectField>
      <TextAreaField label="Other Observation" id="otherObservation" name="otherObservation" value={report.otherObservation} onChange={handleChange} disabled={isReadOnly} />
      
      <SelectField label="Final Status" id="finalStatus" name="finalStatus" value={report.finalStatus || ''} onChange={handleChange} disabled={isReadOnly}><option value="">Select...</option>{options.finalStatus}</SelectField>
      {report.finalStatus === FinalStatusUntraceable.Hold && <FormField label="Reason for Hold" id="holdReason" name="holdReason" value={report.holdReason} onChange={handleChange} disabled={isReadOnly} />}

      {/* Permission Status Section */}
      <PermissionStatus showOnlyDenied={true} />

      {/* Image Capture Section */}
      <ImageCapture
        images={report.images}
        onImagesChange={handleImagesChange}
        isReadOnly={isReadOnly}
        minImages={MIN_IMAGES}
        compact={true}
      />

      {/* Selfie Capture Section */}
      <SelfieCapture
        images={report.selfieImages || []}
        onImagesChange={handleSelfieImagesChange}
        isReadOnly={isReadOnly}
        required={true}
        title="🤳 Verification Selfie (Required)"
        compact={true}
      />

      {!isReadOnly && caseData.status === CaseStatus.InProgress && (
          <>
            <div className="mt-6">
                <button 
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={!isFormValid}
                    className="w-full px-6 py-3 text-sm font-semibold rounded-md bg-brand-primary hover:bg-brand-secondary text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Submit
                </button>
                {!isFormValid && <p className="text-xs text-red-400 text-center mt-2">Please fill all fields and capture at least {MIN_IMAGES} photos to submit.</p>}
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onSave={() => {
                    toggleSaveCase(caseData.id, true);
                    setIsConfirmModalOpen(false);
                }}
                onConfirm={() => {
                    updateCaseStatus(caseData.id, CaseStatus.Completed);
                    setIsConfirmModalOpen(false);
                }}
                title="Submit or Save Case"
                confirmText="Submit Case"
                saveText="Save for Offline"
            >
                <p className="text-medium-text">
                    You can submit the case to mark it as complete, or save it for offline access if you have a poor internet connection.
                </p>
            </ConfirmationModal>
          </>
      )}
      </div>
    </AutoSaveFormWrapper>
  );
};

export default UntraceablePropertyIndividualForm;