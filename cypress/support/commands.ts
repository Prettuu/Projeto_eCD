/// <reference types="cypress" />

Cypress.Commands.add('ensureApiReady', () => {
  const api = Cypress.env('apiUrl') || 'http://localhost:3000/api';
  cy.request({ method: 'GET', url: `${api}/products`, failOnStatusCode: false })
    .its('status')
    .should('be.oneOf', [200, 304]);
});

Cypress.Commands.add('ensureFrontendReady', () => {
  cy.visit('/');
  cy.get('body', { timeout: 20000 }).should('be.visible');
});

// Comando: login padrão
Cypress.Commands.add('loginAs', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input#email, input[type="email"]').clear().type(email);
  cy.get('input#senha, input[type="password"]').clear().type(password, { log: false });
  cy.contains('button', /entrar/i).click();
  cy.url({ timeout: 15000 }).should('include', '/app');

  cy.window().then((win) => {
    const userId = win.localStorage.getItem('userId');
    const role = win.localStorage.getItem('role');
    if (role === 'CLIENT' && userId) {
      win.localStorage.setItem('clientId', userId);
    }
  });
});

Cypress.Commands.add('selectNewCardOption', () => {
  cy.get('select#cardId, select[formcontrolname="cardId"], select[formcontrolname="creditCardId"]', { timeout: 15000 })
    .should('be.visible')
    .should('not.be.disabled')
    .then(($s) => {
      const el = $s[0] as HTMLSelectElement;
      const options = Array.from(el.options).map((o) => ({ value: o.value, text: (o.text || '').trim() }));
      const byValue = options.find((o) => o.value === 'NEW_CARD');
      const byText = options.find((o) => /adicionar.*cart(ã|a)o|novo.*cart(ã|a)o|add.*card/i.test(o.text));
      if (byValue) cy.wrap($s).select('NEW_CARD', { force: true });
      else if (byText) cy.wrap($s).select(byText.text, { force: true });
      else cy.wrap(null).then(() => { throw new Error('Não foi encontrada opção para adicionar novo cartão'); });
    });
});

Cypress.Commands.add('selectValidCard', () => {
  cy.get('select#cardId, select[formcontrolname="cardId"], select[formcontrolname="creditCardId"]', { timeout: 15000 })
    .should('be.visible')
    .should('not.be.disabled')
    .then(($s) => {
      const el = $s[0] as HTMLSelectElement;
      const options = Array.from(el.options)
        .filter((o) => o.value && o.value !== 'NEW_CARD' && o.value !== 'null' && !/selecione/i.test(o.text || ''))
        .map((o) => ({ value: o.value, text: (o.text || '').trim() }));

      const preferred = options.find((o) => /mastercard/i.test(o.text) || /4444/.test(o.text));
      const pick = preferred || options[options.length - 1];
      if (!pick) throw new Error('Nenhum cartão válido disponível');
      cy.wrap($s).select(pick.value, { force: true });
    });
});

declare global {
  namespace Cypress {
    interface Chainable {
      ensureApiReady(): Chainable<void>;
      ensureFrontendReady(): Chainable<void>;
      loginAs(email: string, password: string): Chainable<void>;
      selectNewCardOption(): Chainable<void>;
      selectValidCard(): Chainable<void>;
    }
  }
}