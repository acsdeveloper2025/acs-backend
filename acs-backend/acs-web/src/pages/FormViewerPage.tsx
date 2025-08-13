import React, { useState } from 'react';
import { FileText, Eye, Download, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormViewer } from '@/components/forms/FormViewer';
import { FormSubmission, FormType, VerificationType, VerificationOutcome } from '@/types/form';

export function FormViewerPage() {
  const [selectedFormType, setSelectedFormType] = useState<string>('residence-positive');
  const [viewMode, setViewMode] = useState<'readonly' | 'editable'>('readonly');

  // Sample form submission data
  const sampleSubmission: FormSubmission = {
    id: 'form-12345',
    caseId: 'CASE-2024-001',
    formType: FormType.RESIDENCE_POSITIVE,
    verificationType: VerificationType.RESIDENCE,
    outcome: VerificationOutcome.POSITIVE,
    status: 'APPROVED',
    submittedBy: 'John Doe',
    submittedAt: '2024-01-15T10:30:00Z',
    reviewedBy: 'Jane Smith',
    reviewedAt: '2024-01-15T14:45:00Z',
    reviewComments: 'Verification completed successfully. All documents verified and location confirmed.',
    sections: [
      {
        id: 'personal-info',
        title: 'Personal Information',
        description: 'Basic details about the applicant',
        defaultExpanded: true,
        fields: [
          {
            id: 'applicant-name',
            label: 'Applicant Name',
            type: 'text',
            value: 'Rajesh Kumar',
            required: true,
          },
          {
            id: 'applicant-age',
            label: 'Age',
            type: 'number',
            value: 35,
          },
          {
            id: 'applicant-relation',
            label: 'Relation to Applicant',
            type: 'select',
            value: 'self',
            options: [
              { label: 'Self', value: 'self' },
              { label: 'Spouse', value: 'spouse' },
              { label: 'Father', value: 'father' },
              { label: 'Mother', value: 'mother' },
              { label: 'Other', value: 'other' },
            ],
          },
          {
            id: 'contact-number',
            label: 'Contact Number',
            type: 'text',
            value: '+91 9876543210',
          },
        ],
      },
      {
        id: 'address-verification',
        title: 'Address Verification',
        description: 'Details about the address and location',
        defaultExpanded: true,
        fields: [
          {
            id: 'address-locatable',
            label: 'Address Locatable',
            type: 'select',
            value: 'easily-locatable',
            options: [
              { label: 'Easily Locatable', value: 'easily-locatable' },
              { label: 'Difficult to Locate', value: 'difficult-to-locate' },
              { label: 'Not Locatable', value: 'not-locatable' },
            ],
          },
          {
            id: 'address-rating',
            label: 'Address Rating',
            type: 'select',
            value: 'positive',
            options: [
              { label: 'Positive', value: 'positive' },
              { label: 'Negative', value: 'negative' },
              { label: 'Refer to Credit', value: 'refer-to-credit' },
            ],
          },
          {
            id: 'house-status',
            label: 'House Status',
            type: 'select',
            value: 'owned',
            options: [
              { label: 'Owned', value: 'owned' },
              { label: 'Rented', value: 'rented' },
              { label: 'Company Provided', value: 'company-provided' },
            ],
          },
          {
            id: 'locality-type',
            label: 'Locality Type',
            type: 'select',
            value: 'apartment',
            options: [
              { label: 'Apartment/Building', value: 'apartment' },
              { label: 'Independent House', value: 'independent-house' },
              { label: 'Row House', value: 'row-house' },
              { label: 'Bungalow', value: 'bungalow' },
            ],
          },
        ],
      },
      {
        id: 'verification-details',
        title: 'Verification Details',
        description: 'Information gathered during verification',
        defaultExpanded: false,
        fields: [
          {
            id: 'person-met',
            label: 'Person Met',
            type: 'text',
            value: 'Rajesh Kumar (Self)',
          },
          {
            id: 'staying-status',
            label: 'Staying Status',
            type: 'select',
            value: 'staying-since-long',
            options: [
              { label: 'Staying Since Long', value: 'staying-since-long' },
              { label: 'Recently Shifted', value: 'recently-shifted' },
              { label: 'Temporary Stay', value: 'temporary-stay' },
            ],
          },
          {
            id: 'document-shown',
            label: 'Document Shown',
            type: 'checkbox',
            value: true,
          },
          {
            id: 'document-type',
            label: 'Document Type',
            type: 'select',
            value: 'electricity-bill',
            options: [
              { label: 'Electricity Bill', value: 'electricity-bill' },
              { label: 'Aadhar Card', value: 'aadhar-card' },
              { label: 'PAN Card', value: 'pan-card' },
              { label: 'Passport', value: 'passport' },
            ],
          },
        ],
      },
      {
        id: 'final-assessment',
        title: 'Final Assessment',
        description: 'Verifier comments and final status',
        defaultExpanded: false,
        fields: [
          {
            id: 'final-status',
            label: 'Final Status',
            type: 'select',
            value: 'positive',
            options: [
              { label: 'Positive', value: 'positive' },
              { label: 'Negative', value: 'negative' },
              { label: 'Refer', value: 'refer' },
            ],
          },
          {
            id: 'verifier-comments',
            label: 'Verifier Comments',
            type: 'textarea',
            value: 'Applicant was present at the given address. All documents verified successfully. Neighbors confirmed the applicant has been staying at this address for the past 3 years. Positive verification recommended.',
          },
          {
            id: 'remarks',
            label: 'Additional Remarks',
            type: 'textarea',
            value: 'Well-maintained apartment complex with good security. Applicant was cooperative during verification.',
          },
        ],
      },
    ],
    attachments: [
      {
        id: 'photo-1',
        name: 'house_front_view.jpg',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        size: 2048576,
        mimeType: 'image/jpeg',
        capturedAt: '2024-01-15T10:45:00Z',
        description: 'Front view of the residence',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 5,
          timestamp: '2024-01-15T10:45:00Z',
        },
      },
      {
        id: 'photo-2',
        name: 'applicant_with_document.jpg',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
        size: 1536000,
        mimeType: 'image/jpeg',
        capturedAt: '2024-01-15T10:50:00Z',
        description: 'Applicant showing electricity bill',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 3,
          timestamp: '2024-01-15T10:50:00Z',
        },
      },
      {
        id: 'signature-1',
        name: 'applicant_signature.png',
        type: 'signature',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        size: 15360,
        mimeType: 'image/png',
        capturedAt: '2024-01-15T11:00:00Z',
        description: 'Digital signature of applicant',
      },
    ],
    location: {
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 5,
      address: 'Bandra West, Mumbai, Maharashtra 400050, India',
      timestamp: '2024-01-15T10:30:00Z',
    },
  };

  const formTypes = [
    { value: 'residence-positive', label: 'Residence - Positive' },
    { value: 'residence-shifted', label: 'Residence - Shifted' },
    { value: 'office-positive', label: 'Office - Positive' },
    { value: 'business-positive', label: 'Business - Positive' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Viewer</h1>
          <p className="text-muted-foreground">
            View and interact with verification form submissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Form Viewer Controls</span>
          </CardTitle>
          <CardDescription>
            Configure the form viewer settings and select different form types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Form Type</label>
              <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  {formTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readonly">Read Only</SelectItem>
                  <SelectItem value="editable">Editable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Viewer */}
      <Tabs defaultValue="viewer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="viewer">
            <FileText className="h-4 w-4 mr-2" />
            Form Viewer
          </TabsTrigger>
          <TabsTrigger value="json">
            <Eye className="h-4 w-4 mr-2" />
            JSON Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="space-y-4">
          <FormViewer
            submission={sampleSubmission}
            readonly={viewMode === 'readonly'}
            showAttachments={true}
            showLocation={true}
            showMetadata={true}
            onFieldChange={(fieldId, value) => {
              console.log('Field changed:', fieldId, value);
            }}
            onSectionToggle={(sectionId, expanded) => {
              console.log('Section toggled:', sectionId, expanded);
            }}
          />
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Submission JSON</CardTitle>
              <CardDescription>
                Raw JSON data structure of the form submission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(sampleSubmission, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
