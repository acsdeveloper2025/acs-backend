import React, { useEffect } from 'react';
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
import { toast } from 'sonner';
import { locationsService } from '@/services/locations';
import { Pincode } from '@/types/location';

const editPincodeSchema = z.object({
  code: z.string()
    .min(6, 'Pincode must be 6 digits')
    .max(6, 'Pincode must be 6 digits')
    .regex(/^\d{6}$/, 'Pincode must contain only numbers'),
  area: z.string().min(1, 'Area name is required').max(100, 'Area name too long'),
  cityId: z.string().min(1, 'City selection is required'),
});

type EditPincodeFormData = z.infer<typeof editPincodeSchema>;

interface EditPincodeDialogProps {
  pincode: Pincode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPincodeDialog({ pincode, open, onOpenChange }: EditPincodeDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditPincodeFormData>({
    resolver: zodResolver(editPincodeSchema),
    defaultValues: {
      code: pincode.code,
      area: pincode.area,
      cityId: pincode.cityId,
    },
  });

  useEffect(() => {
    if (pincode) {
      form.reset({
        code: pincode.code,
        area: pincode.area,
        cityId: pincode.cityId,
      });
    }
  }, [pincode, form]);

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => locationsService.getCities(),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditPincodeFormData) => locationsService.updatePincode(pincode.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pincodes'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('Pincode updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update pincode');
    },
  });

  const onSubmit = (data: EditPincodeFormData) => {
    updateMutation.mutate(data);
  };

  const cities = citiesData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Pincode</DialogTitle>
          <DialogDescription>
            Update the pincode information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit pincode"
                      {...field}
                      className="font-mono"
                      maxLength={6}
                    />
                  </FormControl>
                  <FormDescription>
                    6-digit postal code (numbers only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter area name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          <div className="flex flex-col">
                            <span>{city.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {city.state}, {city.country}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Pincode'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
