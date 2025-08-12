import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock user for testing
export const mockUser = {
  id: 'test-user-1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock auth context value
export const mockAuthContext = {
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn(() => true),
  hasAnyRole: vi.fn(() => true),
};

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
  authContext?: typeof mockAuthContext;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    authContext = mockAuthContext,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                {children}
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Mock API responses
export function mockApiResponse<T>(data: T, success = true) {
  return {
    success,
    message: success ? 'Success' : 'Error',
    data: success ? data : undefined,
    error: success ? undefined : { code: 'TEST_ERROR', details: {} },
  };
}

// Mock paginated response
export function mockPaginatedResponse<T>(
  data: T[],
  page = 1,
  limit = 10,
  total?: number
) {
  return {
    success: true,
    message: 'Success',
    data,
    pagination: {
      page,
      limit,
      total: total ?? data.length,
      totalPages: Math.ceil((total ?? data.length) / limit),
    },
  };
}

// Mock cases data
export const mockCase = {
  id: 'case-1',
  caseNumber: 'CASE-2024-001',
  clientId: 'client-1',
  clientName: 'Test Client',
  applicantName: 'John Doe',
  verificationType: 'RESIDENCE',
  status: 'PENDING',
  priority: 1,
  assignedTo: 'agent-1',
  assignedToName: 'Test Agent',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  dueDate: '2024-01-15T00:00:00Z',
  address: '123 Test Street, Test City',
  contactNumber: '+1234567890',
  documents: [],
  notes: [],
};

// Mock clients data
export const mockClient = {
  id: 'client-1',
  name: 'Test Client',
  email: 'client@test.com',
  phone: '+1234567890',
  address: '123 Client Street',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock form submission data
export const mockFormSubmission = {
  id: 'form-1',
  caseId: 'case-1',
  formType: 'RESIDENCE_POSITIVE',
  verificationType: 'RESIDENCE',
  outcome: 'POSITIVE',
  status: 'SUBMITTED',
  submittedBy: 'agent-1',
  submittedAt: '2024-01-01T00:00:00Z',
  sections: [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Basic details',
      defaultExpanded: true,
      fields: [
        {
          id: 'name',
          label: 'Name',
          type: 'text',
          value: 'John Doe',
          required: true,
        },
      ],
    },
  ],
  attachments: [],
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 5,
    timestamp: '2024-01-01T00:00:00Z',
  },
};

// Test helpers
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
};

// Custom matchers
export const customMatchers = {
  toBeInTheDocument: expect.any(Function),
  toHaveClass: expect.any(Function),
  toHaveAttribute: expect.any(Function),
  toHaveTextContent: expect.any(Function),
  toBeVisible: expect.any(Function),
  toBeDisabled: expect.any(Function),
  toBeEnabled: expect.any(Function),
  toHaveValue: expect.any(Function),
  toBeChecked: expect.any(Function),
  toHaveFocus: expect.any(Function),
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
