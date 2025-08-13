describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="email-error"]').should('contain.text', 'Email is required');
    cy.get('[data-testid="password-error"]').should('contain.text', 'Password is required');
  });

  it('should show validation error for invalid email', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="email-error"]').should('contain.text', 'Invalid email format');
  });

  it('should login successfully with valid credentials', () => {
    // Mock successful login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        },
      },
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl + '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    // Mock failed login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Invalid credentials',
        error: {
          code: 'INVALID_CREDENTIALS',
        },
      },
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    cy.expectError('Invalid credentials');
    cy.url().should('include', '/login');
  });

  it('should handle network errors gracefully', () => {
    // Mock network error
    cy.intercept('POST', '/api/auth/login', {
      forceNetworkError: true,
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    cy.expectError('Network error occurred');
  });

  it('should show loading state during login', () => {
    // Mock slow login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: { id: 'user-1', email: 'admin@test.com', role: 'ADMIN' },
          tokens: { accessToken: 'token' },
        },
      },
      delay: 2000,
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    // Check loading state
    cy.get('[data-testid="login-button"]').should('be.disabled');
    cy.get('[data-testid="loading-spinner"]').should('be.visible');

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });

  it('should redirect to intended page after login', () => {
    // Try to access protected page
    cy.visit('/cases');
    cy.url().should('include', '/login');

    // Login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: { id: 'user-1', email: 'admin@test.com', role: 'ADMIN' },
          tokens: { accessToken: 'token' },
        },
      },
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    // Should redirect to originally intended page
    cy.url().should('include', '/cases');
  });

  it('should logout successfully', () => {
    // First login
    cy.loginAsAdmin();
    cy.visit('/dashboard');

    // Mock logout response
    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200,
      body: { success: true },
    }).as('logoutRequest');

    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    cy.wait('@logoutRequest');
    cy.url().should('include', '/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
  });

  it('should handle token expiration', () => {
    // Login first
    cy.loginAsAdmin();
    cy.visit('/dashboard');

    // Mock API call with expired token
    cy.intercept('GET', '/api/cases*', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Token expired',
        error: { code: 'TOKEN_EXPIRED' },
      },
    }).as('expiredTokenRequest');

    // Try to navigate to cases page
    cy.get('[data-testid="nav-cases"]').click();

    cy.wait('@expiredTokenRequest');
    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should be accessible', () => {
    cy.checkAccessibility();
  });

  it('should work on mobile devices', () => {
    cy.setMobileViewport();
    
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');

    // Test mobile-specific interactions
    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    
    // Check that form is still usable on mobile
    cy.get('[data-testid="login-button"]').should('not.be.disabled');
  });
});
