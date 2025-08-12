import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCase, useCaseAttachments } from '@/hooks/useCases';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, User, Building2, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: caseData, isLoading } = useCase(id!);
  const { data: attachmentsData } = useCaseAttachments(id!);
  // const { data: historyData } = useCaseHistory(id!);

  const caseItem = caseData?.data;
  const attachments = attachmentsData?.data || [];
  // const history = historyData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Case not found</h2>
        <p className="mt-2 text-gray-600">The case you're looking for doesn't exist.</p>
        <Link to="/cases">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-gray-100 text-gray-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 4:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Low';
      case 2:
        return 'Medium';
      case 3:
        return 'High';
      case 4:
        return 'Urgent';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/cases">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Case #{caseItem.id.slice(-8)}
            </h1>
            <p className="mt-2 text-gray-600">{caseItem.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(caseItem.status)}>
            {caseItem.status.replace('_', ' ')}
          </Badge>
          <Badge className={getPriorityColor(caseItem.priority)}>
            {getPriorityLabel(caseItem.priority)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="mt-1 text-gray-600">{caseItem.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{caseItem.customerName}</span>
                    </div>
                    {caseItem.customerPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{caseItem.customerPhone}</span>
                      </div>
                    )}
                    {caseItem.customerEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{caseItem.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Address</h4>
                  <div className="mt-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-sm">
                        <div>{caseItem.addressStreet}</div>
                        <div>{caseItem.addressCity}, {caseItem.addressState}</div>
                        <div>{caseItem.addressPincode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {caseItem.notes && (
                <div>
                  <h4 className="font-medium text-gray-900">Notes</h4>
                  <p className="mt-1 text-gray-600">{caseItem.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Documents and files related to this case
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">{attachment.filename}</div>
                        <div className="text-sm text-gray-500">{attachment.size}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No attachments found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Assigned To</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {caseItem.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Client</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {caseItem.client?.name}
                </p>
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Assigned</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {format(new Date(caseItem.assignedAt), 'PPP')}
                </p>
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Last Updated</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Edit Case
              </Button>
              <Button className="w-full" variant="outline">
                Reassign
              </Button>
              <Button className="w-full" variant="outline">
                Add Note
              </Button>
              {caseItem.status !== 'COMPLETED' && (
                <Button className="w-full">
                  Mark Complete
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
