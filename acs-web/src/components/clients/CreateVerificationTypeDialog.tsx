import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { clientsService } from '@/services/clients';

const createVerificationTypeSchema = z.object({
  name: z.string().min(1, 'Verification type name is required').max(100, 'Name too long'),
  productId: z.string().min(1, 'Product selection is required'),
});

type CreateVerificationTypeFormData = z.infer<typeof createVerificationTypeSchema>;

interface CreateVerificationTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVerificationTypeDialog({ open, onOpenChange }: CreateVerificationTypeDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateVerificationTypeFormData>({
    resolver: zodResolver(createVerificationTypeSchema),
    defaultValues: {
      name: '',
      productId: '',
    },
  });

  // Fetch products for the dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => clientsService.getProducts(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVerificationTypeFormData) => clientsService.createVerificationType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-types'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Verification type created successfully');
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create verification type');
    },
  });

  const onSubmit = (data: CreateVerificationTypeFormData) => {
    createMutation.mutate(data);
  };

  const products = productsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Verification Type</DialogTitle>
          <DialogDescription>
            Add a new verification type to a product.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {product.client?.name} ({product.client?.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the product this verification type belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Type Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter verification type name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of the verification type (e.g., "Residence Verification", "Office Verification")
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
                {createMutation.isPending ? 'Creating...' : 'Create Type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
