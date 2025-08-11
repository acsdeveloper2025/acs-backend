// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions. We can customize this based on error types.
  
  // Don't fail on ResizeObserver errors (common in React apps)
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  // Don't fail on network errors during development
  if (err.message.includes('Network Error') || err.message.includes('fetch')) {
    return false;
  }
  
  // Log the error for debugging
  console.error('Uncaught exception:', err);
  
  // Return true to fail the test, false to continue
  return true;
});

// Custom viewport commands
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});

// Performance monitoring
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage();

  // Clear cookies
  cy.clearCookies();
});

afterEach(() => {
  // Simple cleanup - removed performance monitoring to avoid errors
  cy.log('Test completed');
});

// Accessibility testing setup
import 'cypress-axe';

// Visual regression testing (if using percy)
// import '@percy/cypress';

// Code coverage (if enabled)
// import '@cypress/code-coverage/support';
