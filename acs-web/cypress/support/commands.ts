/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsAgent(): Chainable<void>;
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      checkAccessibility(): Chainable<void>;
      mockApiResponse(method: string, url: string, response: any): Chainable<void>;
      seedTestData(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      fillForm(formData: Record<string, any>): Chainable<void>;
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>;
      waitForLoading(): Chainable<void>;
      sortTable(column: string, direction?: 'asc' | 'desc'): Chainable<void>;
      filterTable(filterValue: string): Chainable<void>;
      toggleTheme(): Chainable<void>;
      setTheme(theme: 'light' | 'dark' | 'system'): Chainable<void>;
      expectError(message: string): Chainable<void>;
      expectSuccess(message: string): Chainable<void>;
    }
  }
}

// Authentication commands
Cypress.Commands.add('login', (username = 'admin@test.com', password = 'password123') => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(username);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for successful login
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@test.com', 'password123');
});

Cypress.Commands.add('loginAsAgent', () => {
  cy.login('agent@test.com', 'password123');
});

// Page load optimization
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      if (win.document.readyState === 'complete') {
        resolve();
      } else {
        win.addEventListener('load', resolve);
      }
    });
  });
  
  // Wait for React to finish rendering
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
});

// Accessibility testing
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: false }, // Disable color contrast for now
    },
  });
});

// API mocking
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any) => {
  cy.intercept(method, url, response).as(`mock${method}${url.replace(/[^a-zA-Z0-9]/g, '')}`);
});

// Test data management
Cypress.Commands.add('seedTestData', () => {
  // Mock successful API responses for test data
  cy.mockApiResponse('GET', '/api/cases*', {
    success: true,
    data: [
      {
        id: 'case-1',
        caseNumber: 'CASE-2024-001',
        clientName: 'Test Client',
        applicantName: 'John Doe',
        status: 'PENDING',
        priority: 1,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  });

  cy.mockApiResponse('GET', '/api/clients*', {
    success: true,
    data: [
      {
        id: 'client-1',
        name: 'Test Client',
        email: 'client@test.com',
        isActive: true,
      },
    ],
  });

  cy.mockApiResponse('GET', '/api/dashboard/stats', {
    success: true,
    data: {
      totalCases: 150,
      pendingCases: 25,
      completedCases: 120,
      rejectedCases: 5,
      avgTurnaroundTime: 3.5,
      completionRate: 85.2,
    },
  });
});

Cypress.Commands.add('cleanupTestData', () => {
  // Clear any test data or reset state
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Form helpers
Cypress.Commands.add('fillForm', (formData: Record<string, any>) => {
  Object.entries(formData).forEach(([field, value]) => {
    if (typeof value === 'string') {
      cy.get(`[data-testid="${field}-input"]`).clear().type(value);
    } else if (typeof value === 'boolean') {
      if (value) {
        cy.get(`[data-testid="${field}-checkbox"]`).check();
      } else {
        cy.get(`[data-testid="${field}-checkbox"]`).uncheck();
      }
    }
  });
});

// File upload helper
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType = 'image/jpeg') => {
  cy.fixture(fileName, 'base64').then((fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, fileType);
    const file = new File([blob], fileName, { type: fileType });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    cy.get(selector).then((input) => {
      const inputElement = input[0] as HTMLInputElement;
      inputElement.files = dataTransfer.files;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
});

// Wait for loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
  cy.get('[data-testid="loading-overlay"]').should('not.exist');
});

// Table interactions
Cypress.Commands.add('sortTable', (column: string, direction: 'asc' | 'desc' = 'asc') => {
  cy.get(`[data-testid="table-header-${column}"]`).click();
  if (direction === 'desc') {
    cy.get(`[data-testid="table-header-${column}"]`).click();
  }
});

Cypress.Commands.add('filterTable', (filterValue: string) => {
  cy.get('[data-testid="table-search"]').clear().type(filterValue);
  cy.waitForLoading();
});

// Theme testing
Cypress.Commands.add('toggleTheme', () => {
  cy.get('[data-testid="theme-toggle"]').click();
});

Cypress.Commands.add('setTheme', (theme: 'light' | 'dark' | 'system') => {
  cy.get('[data-testid="theme-selector"]').select(theme);
});

// Error handling
Cypress.Commands.add('expectError', (message: string) => {
  cy.get('[data-testid="error-message"]').should('contain.text', message);
});

Cypress.Commands.add('expectSuccess', (message: string) => {
  cy.get('[data-testid="success-message"]').should('contain.text', message);
});

// Export for TypeScript
export {};
