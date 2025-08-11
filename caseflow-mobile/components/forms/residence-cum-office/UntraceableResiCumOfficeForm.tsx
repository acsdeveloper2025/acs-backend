import React, { useMemo, useState } from 'react';
import {
  Case, UntraceableResiCumOfficeReportData, CallRemarkUntraceable, LocalityTypeResiCumOffice,
  DominatedArea, FinalStatus, CaseStatus, CapturedImage
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

interface UntraceableResiCumOfficeFormProps {
  caseData: Case;
}

const getEnumOptions = (enumObject: object) => Object.values(enumObject).map(value => (
  <option key={value} value={value}>{value}</option>
));

const UntraceableResiCumOfficeForm: React.FC<UntraceableResiCumOfficeFormProps> = ({ caseData }) => {
  const { updateUntraceableResiCumOfficeReport, updateCaseStatus, toggleSaveCase } = useCases();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const report = caseData.untraceableResiCumOfficeReport;
  const isReadOnly = caseData.status === CaseStatus.Completed || caseData.isSaved;
  const MIN_IMAGES = 5;

  // Auto-save handlers
  const handleFormDataChange = (formData: any) => {
    if (!isReadOnly) {
      updateUntraceableResiCumOfficeReport(caseData.id, formData);
    }
  };

  const handleAutoSaveImagesChange = (images: CapturedImage[]) => {
    if (!isReadOnly && report) {
      updateUntraceableResiCumOfficeReport(caseData.id, { ...report, images });
    }
  };

  const handleDataRestored = (data: any) => {
    if (!isReadOnly && data.formData) {
      updateUntraceableResiCumOfficeReport(caseData.id, data.formData);
    }
  };

  if (!report) {
    return <p className="text-medium-text">No Untraceable Resi-cum-Office report data available.</p>;
  }

  const isFormValid = useMemo(() => {
    if (!report) return false;

    if (report.images.length < MIN_IMAGES) return false;

    // Require at least one selfie image
    if (!report.selfieImages || report.selfieImages.length === 0) return false;

    const checkFields = (fields: (keyof UntraceableResiCumOfficeReportData)[]) => fields.every(field => {
        const value = report[field];
        return value !== null && value !== undefined && value !== '';
    });

    const baseFields: (keyof UntraceableResiCumOfficeReportData)[] = [
        'metPerson', 'callRemark', 'locality', 'landmark1', 'landmark2', 'landmark3', 'landmark4',
        'dominatedArea', 'otherObservation', 'finalStatus'
    ];

    if (!checkFields(baseFields)) return false;

    if (report.finalStatus === FinalStatus.Hold) {
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

    const updates: Partial<UntraceableResiCumOfficeReportData> = { [name]: processedValue };
    updateUntraceableResiCumOfficeReport(caseData.id, updates);
  };
  
  const handleImagesChange = (images: CapturedImage[]) => {
    updateUntraceableResiCumOfficeReport(caseData.id, { images });
  };

  const handleSelfieImagesChange = (selfieImages: CapturedImage[]) => {
    updateUntraceableResiCumOfficeReport(caseData.id, { selfieImages });
  };
  
  const options = useMemo(() => ({
    callRemark: getEnumOptions(CallRemarkUntraceable),
    localityType: getEnumOptions(LocalityTypeResiCumOffice),
    dominatedArea: getEnumOptions(DominatedArea),
    finalStatus: getEnumOptions(FinalStatus),
  }), []);

  return (
    <AutoSaveFormWrapper
      caseId={caseData.id}
      formType={FORM_TYPES.RESIDENCE_CUM_OFFICE_UNTRACEABLE}
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
      <h3 className="text-lg font-semibold text-brand-primary">Untraceable Residence-cum-Office Report</h3>

      {/* Customer Information Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Customer Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-sm">
            <span className="text-medium-text">Customer Name: </span>
            <span className="text-light-text">{caseData.customer.name}</span>
          </div>
          <div className="text-sm">
            <span className="text-medium-text">Bank Name: </span>
            <span className="text-light-text">{caseData.bankName || 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-medium-text">Product: </span>
            <span className="text-light-text">{caseData.product || 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-medium-text">Trigger: </span>
            <span className="text-light-text">{caseData.trigger || 'N/A'}</span>
          </div>
        </div>
        <div className="text-sm">
          <span className="text-medium-text">Visit Address: </span>
          <span className="text-light-text">{caseData.visitAddress || 'N/A'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-sm">
            <span className="text-medium-text">System Contact: </span>
            <span className="text-light-text">{caseData.systemContactNumber || 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-medium-text">Customer Code: </span>
            <span className="text-light-text">{caseData.customerCallingCode || 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-medium-text">Applicant Status: </span>
            <span className="text-light-text">{caseData.applicantStatus || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Investigation Details Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Investigation Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Met Person" id="metPerson" name="metPerson" value={report.metPerson} onChange={handleChange} disabled={isReadOnly} />
          <SelectField label="Call Remark" id="callRemark" name="callRemark" value={report.callRemark || ''} onChange={handleChange} disabled={isReadOnly}>
            <option value="">Select...</option>
            {options.callRemark}
          </SelectField>
          <SelectField label="Locality" id="locality" name="locality" value={report.locality || ''} onChange={handleChange} disabled={isReadOnly}>
            <option value="">Select...</option>
            {options.localityType}
          </SelectField>
        </div>
      </div>

      {/* Location Details Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Landmark 1" id="landmark1" name="landmark1" value={report.landmark1} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Landmark 2" id="landmark2" name="landmark2" value={report.landmark2} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Landmark 3" id="landmark3" name="landmark3" value={report.landmark3} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Landmark 4" id="landmark4" name="landmark4" value={report.landmark4} onChange={handleChange} disabled={isReadOnly} />
        </div>
      </div>

      {/* Area Assessment Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Area Assessment</h4>
        <SelectField label="Dominated Area" id="dominatedArea" name="dominatedArea" value={report.dominatedArea || ''} onChange={handleChange} disabled={isReadOnly}>
          <option value="">Select...</option>
          {options.dominatedArea}
        </SelectField>
        <TextAreaField label="Other Observation" id="otherObservation" name="otherObservation" value={report.otherObservation} onChange={handleChange} disabled={isReadOnly} />
      </div>

      {/* Final Status Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Final Status</h4>
        <SelectField label="Final Status" id="finalStatus" name="finalStatus" value={report.finalStatus || ''} onChange={handleChange} disabled={isReadOnly}>
          <option value="">Select...</option>
          {options.finalStatus}
        </SelectField>
        {report.finalStatus === FinalStatus.Hold && (
          <FormField label="Reason for Hold" id="holdReason" name="holdReason" value={report.holdReason} onChange={handleChange} disabled={isReadOnly} />
        )}
      </div>

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

export default UntraceableResiCumOfficeForm;