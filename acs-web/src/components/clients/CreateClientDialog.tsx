import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { clientsService } from '@/services/clients';

const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100, 'Name too long'),
  code: z.string()
    .min(2, 'Client code must be at least 2 characters')
    .max(10, 'Client code must be at most 10 characters')
    .regex(/^[A-Z0-9_]+$/, 'Client code must contain only uppercase letters, numbers, and underscores'),
});

type CreateClientFormData = z.infer<typeof createClientSchema>;

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientFormData) => clientsService.createClient(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error creating client:', error);

      // Handle different types of errors
      if (error.response?.status === 400 && error.response?.data?.error?.code === 'DUPLICATE_CODE') {
        toast.error('Client code already exists. Please choose a different code.');
      } else if (error.response?.status === 401) {
        toast.error('You are not authorized to create clients. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to create clients.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create client. Please try again.');
      }
    },
  });

  const onSubmit = (data: CreateClientFormData) => {
    createMutation.mutate(data);
  };

  const handleCodeChange = (value: string) => {
    // Auto-format code to uppercase and replace spaces with underscores
    const formattedCode = value.toUpperCase().replace(/\s+/g, '_');
    form.setValue('code', formattedCode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Add a new client organization to the system. The client code will be used for identification.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createMutation.isPending && (
              <div className="text-sm text-muted-foreground">
                Creating client...
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter client name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Auto-generate code from name if code is empty
                        if (!form.getValues('code')) {
                          const autoCode = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9\s]/g, '')
                            .replace(/\s+/g, '_')
                            .substring(0, 10);
                          form.setValue('code', autoCode);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    The full name of the client organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter client code"
                      {...field}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the client (uppercase letters, numbers, and underscores only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
