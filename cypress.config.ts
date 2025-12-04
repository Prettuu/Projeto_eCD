import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1366,
    viewportHeight: 768,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    video: false,
    chromeWebSecurity: false,
    env: {
      apiUrl: 'http://localhost:3000/api',
      adminEmail: 'admin@ecd.com',
      adminPass: '123456',
    },
  },
});
