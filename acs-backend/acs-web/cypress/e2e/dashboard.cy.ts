describe('Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    
    // Mock dashboard API responses
    cy.intercept('GET', '/api/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalCases: 150,
          pendingCases: 25,
          completedCases: 120,
          rejectedCases: 5,
          avgTurnaroundTime: 3.5,
          completionRate: 85.2,
          monthlyStats: [
            { month: 'Jan', cases: 45, completed: 40 },
            { month: 'Feb', cases: 52, completed: 48 },
            { month: 'Mar', cases: 38, completed: 35 },
          ],
        },
      },
    }).as('dashboardStats');

    cy.intercept('GET', '/api/cases/recent', {
      statusCode: 200,
      body: {
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
          {
            id: 'case-2',
            caseNumber: 'CASE-2024-002',
            clientName: 'Another Client',
            applicantName: 'Jane Smith',
            status: 'IN_PROGRESS',
            priority: 2,
            createdAt: '2024-01-02T00:00:00Z',
          },
        ],
      },
    }).as('recentCases');

    cy.visit('/dashboard');
  });

  it('should display dashboard with all components', () => {
    cy.wait('@dashboardStats');
    cy.wait('@recentCases');

    // Check page title
    cy.get('[data-testid="page-title"]').should('contain.text', 'Dashboard');

    // Check KPI cards
    cy.get('[data-testid="kpi-total-cases"]').should('contain.text', '150');
    cy.get('[data-testid="kpi-pending-cases"]').should('contain.text', '25');
    cy.get('[data-testid="kpi-completed-cases"]').should('contain.text', '120');
    cy.get('[data-testid="kpi-completion-rate"]').should('contain.text', '85.2%');

    // Check charts
    cy.get('[data-testid="monthly-stats-chart"]').should('be.visible');
    cy.get('[data-testid="case-status-chart"]').should('be.visible');

    // Check recent cases table
    cy.get('[data-testid="recent-cases-table"]').should('be.visible');
    cy.get('[data-testid="case-row-case-1"]').should('contain.text', 'CASE-2024-001');
    cy.get('[data-testid="case-row-case-2"]').should('contain.text', 'CASE-2024-002');
  });

  it('should handle loading states', () => {
    // Mock slow API response
    cy.intercept('GET', '/api/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalCases: 150,
          pendingCases: 25,
          completedCases: 120,
          rejectedCases: 5,
        },
      },
      delay: 2000,
    }).as('slowDashboardStats');

    cy.visit('/dashboard');

    // Check loading states
    cy.get('[data-testid="kpi-loading"]').should('be.visible');
    cy.get('[data-testid="chart-loading"]').should('be.visible');

    cy.wait('@slowDashboardStats');

    // Loading should disappear
    cy.get('[data-testid="kpi-loading"]').should('not.exist');
    cy.get('[data-testid="chart-loading"]').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/dashboard/stats', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Internal server error',
        error: { code: 'SERVER_ERROR' },
      },
    }).as('dashboardError');

    cy.visit('/dashboard');
    cy.wait('@dashboardError');

    // Should show error state
    cy.get('[data-testid="dashboard-error"]').should('be.visible');
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('should retry failed requests', () => {
    // Mock initial error then success
    cy.intercept('GET', '/api/dashboard/stats', {
      statusCode: 500,
      body: { success: false, message: 'Server error' },
    }).as('dashboardError');

    cy.visit('/dashboard');
    cy.wait('@dashboardError');

    // Mock successful retry
    cy.intercept('GET', '/api/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalCases: 150,
          pendingCases: 25,
          completedCases: 120,
          rejectedCases: 5,
        },
      },
    }).as('dashboardSuccess');

    cy.get('[data-testid="retry-button"]').click();
    cy.wait('@dashboardSuccess');

    // Should show data
    cy.get('[data-testid="kpi-total-cases"]').should('contain.text', '150');
  });

  it('should navigate to cases page from quick actions', () => {
    cy.wait('@dashboardStats');

    cy.get('[data-testid="quick-action-view-cases"]').click();
    cy.url().should('include', '/cases');
  });

  it('should navigate to case detail from recent cases', () => {
    cy.wait('@recentCases');

    cy.get('[data-testid="case-link-case-1"]').click();
    cy.url().should('include', '/cases/case-1');
  });

  it('should filter recent cases', () => {
    cy.wait('@recentCases');

    // Mock filtered results
    cy.intercept('GET', '/api/cases/recent?status=PENDING', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'case-1',
            caseNumber: 'CASE-2024-001',
            status: 'PENDING',
          },
        ],
      },
    }).as('filteredCases');

    cy.get('[data-testid="status-filter"]').select('PENDING');
    cy.wait('@filteredCases');

    cy.get('[data-testid="recent-cases-table"]').should('contain.text', 'CASE-2024-001');
    cy.get('[data-testid="case-row-case-2"]').should('not.exist');
  });

  it('should refresh data', () => {
    cy.wait('@dashboardStats');

    // Mock refresh response
    cy.intercept('GET', '/api/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalCases: 155, // Updated value
          pendingCases: 30,
          completedCases: 120,
          rejectedCases: 5,
        },
      },
    }).as('refreshedStats');

    cy.get('[data-testid="refresh-button"]').click();
    cy.wait('@refreshedStats');

    cy.get('[data-testid="kpi-total-cases"]').should('contain.text', '155');
  });

  it('should be responsive on different screen sizes', () => {
    cy.wait('@dashboardStats');

    // Test mobile layout
    cy.setMobileViewport();
    cy.get('[data-testid="kpi-cards"]').should('have.class', 'grid-cols-1');
    cy.get('[data-testid="charts-container"]').should('have.class', 'flex-col');

    // Test tablet layout
    cy.setTabletViewport();
    cy.get('[data-testid="kpi-cards"]').should('have.class', 'grid-cols-2');

    // Test desktop layout
    cy.setDesktopViewport();
    cy.get('[data-testid="kpi-cards"]').should('have.class', 'grid-cols-4');
  });

  it('should support dark mode', () => {
    cy.wait('@dashboardStats');

    // Toggle to dark mode
    cy.toggleTheme();
    cy.get('html').should('have.class', 'dark');

    // Check that components adapt to dark mode
    cy.get('[data-testid="dashboard-container"]').should('have.class', 'dark:bg-gray-900');
  });

  it('should be accessible', () => {
    cy.wait('@dashboardStats');
    cy.wait('@recentCases');
    
    cy.checkAccessibility();
  });

  it('should handle real-time updates', () => {
    cy.wait('@dashboardStats');

    // Mock WebSocket connection and real-time update
    cy.window().then((win) => {
      // Simulate real-time case update
      win.dispatchEvent(new CustomEvent('case-updated', {
        detail: {
          caseId: 'case-1',
          status: 'COMPLETED',
        },
      }));
    });

    // Should update the UI
    cy.get('[data-testid="case-row-case-1"]').should('contain.text', 'COMPLETED');
  });

  it('should export dashboard data', () => {
    cy.wait('@dashboardStats');

    // Mock export endpoint
    cy.intercept('GET', '/api/dashboard/export', {
      statusCode: 200,
      body: 'CSV data here',
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="dashboard-export.csv"',
      },
    }).as('exportData');

    cy.get('[data-testid="export-button"]').click();
    cy.wait('@exportData');

    // Verify download was triggered (this is browser-dependent)
    cy.get('[data-testid="export-success"]').should('be.visible');
  });
});
