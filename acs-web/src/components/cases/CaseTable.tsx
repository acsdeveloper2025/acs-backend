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
import { MoreHorizontal, Eye, Edit, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Case } from '@/types/case';
import { cn } from '@/utils/cn';

interface CaseTableProps {
  cases: Case[];
  isLoading?: boolean;
  onUpdateStatus?: (caseId: string, status: string) => void;
  onAssignCase?: (caseId: string, userId: string) => void;
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

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  isLoading,
  onUpdateStatus,
  onAssignCase,
}) => {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((item) => (
              <TableRow key={item}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
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
        <p className="text-gray-500">No cases found matching your criteria.</p>
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
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Updated</TableHead>
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
                  <div className="text-sm text-gray-500">{caseItem.customerPhone}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn('text-xs', getStatusColor(caseItem.status))}>
                  {caseItem.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn('text-xs', getPriorityColor(caseItem.priority))}>
                  {getPriorityLabel(caseItem.priority)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {caseItem.assignedTo?.name || 'Unassigned'}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {caseItem.client?.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })}
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
                    <DropdownMenuItem asChild>
                      <Link to={`/cases/${caseItem.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Case
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onAssignCase && (
                      <DropdownMenuItem onClick={() => onAssignCase(caseItem.id, 'user-id')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Reassign
                      </DropdownMenuItem>
                    )}
                    {onUpdateStatus && caseItem.status !== 'COMPLETED' && (
                      <DropdownMenuItem onClick={() => onUpdateStatus(caseItem.id, 'COMPLETED')}>
                        Mark Complete
                      </DropdownMenuItem>
                    )}
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
