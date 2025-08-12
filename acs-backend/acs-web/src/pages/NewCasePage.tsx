import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NewCaseForm } from '@/components/cases/NewCaseForm';
import { useCreateCase } from '@/hooks/useCases';
import { ArrowLeft, Plus, Save, Send } from 'lucide-react';
import type { CreateCaseData } from '@/services/cases';

export const NewCasePage: React.FC = () => {
  const navigate = useNavigate();
  const createCaseMutation = useCreateCase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateCaseData) => {
    setIsSubmitting(true);
    try {
      await createCaseMutation.mutateAsync(data);
      navigate('/cases');
    } catch (error) {
      console.error('Failed to create case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/cases');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Case</h1>
            <p className="mt-2 text-gray-600">
              Assign a new verification case to a field user
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Case Assignment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-800 space-y-2">
            <p>• Fill in all required customer and address information</p>
            <p>• Select the appropriate verification type and client</p>
            <p>• Choose a field user to assign the case to</p>
            <p>• Set priority level and due date if needed</p>
            <p>• Add any special instructions or notes for the field user</p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
          <CardDescription>
            Enter the case information and assignment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewCaseForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
};
