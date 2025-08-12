import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { usersService } from '@/services/users';
import { User } from '@/types/user';

interface ResetPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const queryClient = useQueryClient();

  const generatePasswordMutation = useMutation({
    mutationFn: (userId: string) => usersService.generateTemporaryPassword(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Temporary password generated successfully');
      // In a real app, you might want to show the password or send it via email
      console.log('Temporary password:', data.data?.temporaryPassword);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate temporary password');
    },
  });

  const handleGeneratePassword = () => {
    generatePasswordMutation.mutate(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Reset Password</span>
          </DialogTitle>
          <DialogDescription>
            Generate a temporary password for {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              This will generate a new temporary password for the user. The user will be required to change it on their next login.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">User Information:</h4>
            <div className="text-sm text-muted-foreground">
              <p>Name: {user.name}</p>
              <p>Username: {user.username}</p>
              <p>Email: {user.email}</p>
              <p>Employee ID: {user.employeeId}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generatePasswordMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGeneratePassword}
            disabled={generatePasswordMutation.isPending}
          >
            {generatePasswordMutation.isPending ? 'Generating...' : 'Generate Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
