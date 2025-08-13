import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Download, FileText, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { Case } from '@/types/case';
import { cn } from '@/utils/cn';

interface CompletedCaseTableProps {
  cases: Case[];
  isLoading?: boolean;
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return 'bg-gray-100 text-gray-800';
    case 2:
      return 'bg-blue-100 text-blue-800';
    case 3:
      return 'bg-yellow-100 text-yellow-800';
    case 4:
      return 'bg-orange-100 text-orange-800';
    case 5:
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
      return 'Normal';
    case 3:
      return 'Medium';
    case 4:
      return 'High';
    case 5:
      return 'Critical';
    default:
      return 'Unknown';
  }
};

const getVerificationTypeColor = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'residence':
      return 'bg-green-100 text-green-800';
    case 'office':
      return 'bg-blue-100 text-blue-800';
    case 'business':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CompletedCaseTable: React.FC<CompletedCaseTableProps> = ({
  cases,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Verification Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((item) => (
              <TableRow key={item}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
                  <TableCell key={cell}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No completed cases found</h3>
        <p className="text-gray-500">
          There are no completed cases matching your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Verification Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Completed Date</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => (
            <TableRow key={caseItem.id}>
              <TableCell className="font-medium">
                <Link
                  to={`/cases/${caseItem.id}`}
                  className="text-primary hover:underline"
                >
                  #{caseItem.id.slice(-8)}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{caseItem.customerName}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    {caseItem.customerPhone && (
                      <span className="mr-2">{caseItem.customerPhone}</span>
                    )}
                    {caseItem.addressCity && (
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {caseItem.addressCity}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getVerificationTypeColor(caseItem.verificationType)}>
                  {caseItem.verificationType || 'Not specified'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(caseItem.priority)}>
                  {getPriorityLabel(caseItem.priority)}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{caseItem.assignedTo?.name || 'Unassigned'}</div>
                  <div className="text-sm text-gray-500">{caseItem.assignedTo?.username}</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{caseItem.client?.name}</div>
                  <div className="text-sm text-gray-500">{caseItem.client?.code}</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {caseItem.completedAt 
                      ? format(new Date(caseItem.completedAt), 'MMM dd, yyyy')
                      : format(new Date(caseItem.updatedAt), 'MMM dd, yyyy')
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    {caseItem.completedAt 
                      ? formatDistanceToNow(new Date(caseItem.completedAt), { addSuffix: true })
                      : formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })
                    }
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {caseItem.verificationOutcome ? (
                    <Badge variant={caseItem.verificationOutcome.toLowerCase().includes('positive') ? 'default' : 'secondary'}>
                      {caseItem.verificationOutcome}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-500">Pending review</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to={`/cases/${caseItem.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      View Attachments
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
