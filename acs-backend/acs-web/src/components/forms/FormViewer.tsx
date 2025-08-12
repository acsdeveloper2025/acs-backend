import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, MapPin, Clock, User, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormViewerProps, FormSection, FormField } from '@/types/form';
import { FormFieldViewer } from './FormFieldViewer';
import { FormAttachmentsViewer } from './FormAttachmentsViewer';
import { FormLocationViewer } from './FormLocationViewer';
import { FormMetadataViewer } from './FormMetadataViewer';

export function FormViewer({
  submission,
  template,
  readonly = true,
  showAttachments = true,
  showLocation = true,
  showMetadata = true,
  onFieldChange,
  onSectionToggle,
}: FormViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(submission.sections.filter(s => s.defaultExpanded !== false).map(s => s.id))
  );

  const handleSectionToggle = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
    onSectionToggle?.(sectionId, newExpanded.has(sectionId));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      SUBMITTED: { variant: 'default' as const, label: 'Submitted' },
      UNDER_REVIEW: { variant: 'outline' as const, label: 'Under Review' },
      APPROVED: { variant: 'default' as const, label: 'Approved' },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFormTypeLabel = (formType: string) => {
    return formType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {getFormTypeLabel(submission.formType)} Form
                </CardTitle>
                <CardDescription>
                  {submission.verificationType} • {submission.outcome}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(submission.status)}
              <Badge variant="outline">
                Case #{submission.caseId}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Metadata */}
      {showMetadata && (
        <FormMetadataViewer submission={submission} />
      )}

      {/* Form Sections */}
      <div className="space-y-4">
        {submission.sections.map((section) => (
          <Card key={section.id}>
            <Collapsible
              open={expandedSections.has(section.id)}
              onOpenChange={() => handleSectionToggle(section.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {section.description && (
                        <CardDescription>{section.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {section.fields.length} fields
                      </Badge>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map((field) => (
                      <FormFieldViewer
                        key={field.id}
                        field={field}
                        readonly={readonly}
                        onChange={(value) => onFieldChange?.(field.id, value)}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Form Attachments */}
      {showAttachments && submission.attachments.length > 0 && (
        <FormAttachmentsViewer
          attachments={submission.attachments}
          readonly={readonly}
        />
      )}

      {/* Form Location */}
      {showLocation && submission.location && (
        <FormLocationViewer
          location={submission.location}
          readonly={readonly}
        />
      )}

      {/* Review Comments */}
      {submission.reviewComments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Review Comments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{submission.reviewComments}</p>
              {submission.reviewedBy && submission.reviewedAt && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Reviewed by {submission.reviewedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(submission.reviewedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      {!readonly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(submission.submittedAt).toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Print Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
