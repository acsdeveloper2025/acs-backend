describe('Client Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    
    // Mock the clients API endpoints
    cy.intercept('GET', '/api/clients*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'client-1',
            name: 'Test Client 1',
            code: 'TC001',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'client-2', 
            name: 'Test Client 2',
            code: 'TC002',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
      },
    }).as('getClients');

    // Navigate to clients page
    cy.visit('/clients');
    cy.wait('@getClients');
  });

  describe('Client List Display', () => {
    it('should display the clients page correctly', () => {
      cy.get('[data-testid="clients-page"]').should('be.visible');
      cy.get('[data-testid="page-title"]').should('contain.text', 'Clients');
      cy.get('[data-testid="add-client-button"]').should('be.visible');
      cy.get('[data-testid="clients-table"]').should('be.visible');
    });

    it('should display existing clients in the table', () => {
      cy.get('[data-testid="clients-table"]').within(() => {
        cy.get('tbody tr').should('have.length', 2);
        
        // Check first client
        cy.get('tbody tr').first().within(() => {
          cy.get('td').eq(0).should('contain.text', 'Test Client 1');
          cy.get('td').eq(1).should('contain.text', 'TC001');
        });
        
        // Check second client
        cy.get('tbody tr').last().within(() => {
          cy.get('td').eq(0).should('contain.text', 'Test Client 2');
          cy.get('td').eq(1).should('contain.text', 'TC002');
        });
      });
    });

    it('should show search functionality', () => {
      cy.get('[data-testid="search-input"]').should('be.visible');
      cy.get('[data-testid="search-input"]').should('have.attr', 'placeholder', 'Search clients...');
    });
  });

  describe('Client Creation - The Fixed Functionality', () => {
    it('should open create client dialog when add button is clicked', () => {
      cy.get('[data-testid="add-client-button"]').click();
      cy.get('[data-testid="create-client-dialog"]').should('be.visible');
      cy.get('[data-testid="dialog-title"]').should('contain.text', 'Create New Client');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="add-client-button"]').click();
      cy.get('[data-testid="create-client-button"]').click();
      
      cy.get('[data-testid="name-error"]').should('contain.text', 'Name is required');
      cy.get('[data-testid="code-error"]').should('contain.text', 'Code is required');
    });

    it('should create a new client and update the list immediately (MAIN FIX TEST)', () => {
      // Mock successful client creation
      cy.intercept('POST', '/api/clients', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 'client-3',
            name: 'New Test Client',
            code: 'NTC001',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        delay: 1000, // Simulate network delay
      }).as('createClient');

      // Mock updated clients list (with new client)
      cy.intercept('GET', '/api/clients*', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'client-3',
              name: 'New Test Client', 
              code: 'NTC001',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'client-1',
              name: 'Test Client 1',
              code: 'TC001',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'client-2',
              name: 'Test Client 2', 
              code: 'TC002',
              createdAt: '2024-01-02T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
            },
          ],
        },
      }).as('getUpdatedClients');

      // Open create dialog
      cy.get('[data-testid="add-client-button"]').click();
      
      // Fill in the form
      cy.get('[data-testid="client-name-input"]').type('New Test Client');
      cy.get('[data-testid="client-code-input"]').type('NTC001');
      
      // Submit the form
      cy.get('[data-testid="create-client-button"]').click();
      
      // Verify the API call was made
      cy.wait('@createClient');
      
      // Verify success message
      cy.get('[data-testid="toast-success"]').should('contain.text', 'Client created successfully');
      
      // Verify dialog is closed
      cy.get('[data-testid="create-client-dialog"]').should('not.exist');
      
      // CRITICAL TEST: Verify the new client appears in the list immediately
      // This tests our fix for the query invalidation issue
      cy.wait('@getUpdatedClients');
      cy.get('[data-testid="clients-table"]').within(() => {
        cy.get('tbody tr').should('have.length', 3);
        
        // The new client should be at the top (most recent)
        cy.get('tbody tr').first().within(() => {
          cy.get('td').eq(0).should('contain.text', 'New Test Client');
          cy.get('td').eq(1).should('contain.text', 'NTC001');
        });
      });
    });

    it('should show optimistic update (immediate UI feedback)', () => {
      // Mock slow client creation to test optimistic updates
      cy.intercept('POST', '/api/clients', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 'client-optimistic',
            name: 'Optimistic Client',
            code: 'OPT001',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        delay: 3000, // Long delay to test optimistic update
      }).as('createClientSlow');

      cy.get('[data-testid="add-client-button"]').click();
      cy.get('[data-testid="client-name-input"]').type('Optimistic Client');
      cy.get('[data-testid="client-code-input"]').type('OPT001');
      cy.get('[data-testid="create-client-button"]').click();

      // The client should appear immediately (optimistic update)
      // even before the API call completes
      cy.get('[data-testid="clients-table"]').within(() => {
        cy.get('tbody tr').should('have.length', 3);
        cy.get('tbody tr').first().within(() => {
          cy.get('td').eq(0).should('contain.text', 'Optimistic Client');
          cy.get('td').eq(1).should('contain.text', 'OPT001');
        });
      });

      // Wait for the actual API call to complete
      cy.wait('@createClientSlow');
    });

    it('should handle duplicate client code error', () => {
      cy.intercept('POST', '/api/clients', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Client code already exists',
          error: {
            code: 'DUPLICATE_CODE',
          },
        },
      }).as('createClientDuplicate');

      cy.get('[data-testid="add-client-button"]').click();
      cy.get('[data-testid="client-name-input"]').type('Duplicate Client');
      cy.get('[data-testid="client-code-input"]').type('TC001'); // Existing code
      cy.get('[data-testid="create-client-button"]').click();

      cy.wait('@createClientDuplicate');
      cy.get('[data-testid="toast-error"]').should('contain.text', 'Client code already exists');
      
      // Dialog should remain open for correction
      cy.get('[data-testid="create-client-dialog"]').should('be.visible');
    });
  });

  describe('Client Search and Filtering', () => {
    it('should filter clients based on search query', () => {
      // Mock search results
      cy.intercept('GET', '/api/clients*search=Test%20Client%201*', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'client-1',
              name: 'Test Client 1',
              code: 'TC001',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      }).as('searchClients');

      cy.get('[data-testid="search-input"]').type('Test Client 1');
      cy.wait('@searchClients');

      cy.get('[data-testid="clients-table"]').within(() => {
        cy.get('tbody tr').should('have.length', 1);
        cy.get('tbody tr').first().within(() => {
          cy.get('td').eq(0).should('contain.text', 'Test Client 1');
        });
      });
    });
  });

  describe('Accessibility and Mobile', () => {
    it('should be accessible', () => {
      cy.checkAccessibility();
    });

    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-testid="clients-page"]').should('be.visible');
      cy.get('[data-testid="add-client-button"]').should('be.visible');
      cy.get('[data-testid="clients-table"]').should('be.visible');
      
      // Test mobile client creation
      cy.get('[data-testid="add-client-button"]').click();
      cy.get('[data-testid="create-client-dialog"]').should('be.visible');
    });
  });
});
