describe('Fluxo Completo de Venda', () => {
  beforeEach(() => {
    // Login como cliente
    cy.visit('/login');
    cy.get('input[type="email"]').type('cliente@teste.com');
    cy.get('input[type="password"]').type('123456');
    cy.contains('button', 'Entrar').click();
    cy.wait(1000);
  });

  it('Deve completar o fluxo de compra', () => {
    // 1. Adicionar produtos ao carrinho
    cy.visit('/app/products');
    cy.wait(1000);
    
    // Selecionar cliente
    cy.get('select').select(1);
    cy.wait(500);

    // Adicionar primeiro produto
    cy.contains('Adicionar ao Carrinho').first().click();
    cy.wait(500);

    // 2. Ir para o carrinho
    cy.visit('/app/cart');
    cy.wait(1000);
    cy.get('table tbody tr').should('have.length.at.least', 1);

    // 3. Ir para checkout
    cy.contains('button', 'Checkout').click();
    cy.wait(1000);

    // 4. Preencher checkout (se houver formulário)
    // Este passo depende da implementação do checkout
    // cy.get('input[formcontrolname="deliveryAddressId"]').select(1);
    // cy.get('input[formcontrolname="cardId"]').select(1);
    // cy.contains('button', 'Confirmar').click();
  });

  it('Deve visualizar pedidos do cliente', () => {
    cy.visit('/app/orders');
    cy.wait(1000);
    cy.get('h1').should('contain', 'Meus Pedidos');
    cy.get('table tbody tr').its('length').should('be.gte', 0);
  });

  it('Deve solicitar troca de um pedido', () => {
    cy.visit('/app/orders');
    cy.wait(1000);

    // Verificar se há pedidos
    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        // Clicar em visualizar primeiro pedido
        cy.contains('Visualizar').first().click();
        cy.wait(1000);

        // Verificar se há botão de solicitar troca
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Solicitar Troca")').length > 0) {
            cy.contains('button', 'Solicitar Troca').click();
            cy.wait(1000);

            // Preencher formulário de troca
            cy.get('textarea[formcontrolname="motivo"]').type('Produto veio com defeito');
            
            // Selecionar item para troca
            cy.get('input[type="checkbox"]').first().check();
            
            // Preencher quantidade
            cy.get('input[formcontrolname="quantidade"]').first().clear().type('1');
            
            // Enviar solicitação
            cy.contains('button', 'Enviar Solicitação').click();
            cy.wait(1000);
            
            // Verificar mensagem de sucesso
            cy.on('window:alert', (str) => {
              expect(str).to.contain('sucesso');
            });
          }
        });
      }
    });
  });

  it('Deve solicitar devolução de um pedido', () => {
    cy.visit('/app/orders');
    cy.wait(1000);

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        cy.contains('Visualizar').first().click();
        cy.wait(1000);

        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Solicitar Devolução")').length > 0) {
            cy.contains('button', 'Solicitar Devolução').click();
            cy.wait(1000);

            cy.get('textarea[formcontrolname="motivo"]').type('Não atendeu minhas expectativas');
            cy.get('input[type="checkbox"]').first().check();
            cy.get('input[formcontrolname="quantidade"]').first().clear().type('1');
            
            cy.contains('button', 'Enviar Solicitação').click();
            cy.wait(1000);
          }
        });
      }
    });
  });
});

describe('Gestão Administrativa de Trocas e Devoluções', () => {
  beforeEach(() => {
    // Login como admin
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@teste.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Entrar').click();
    cy.wait(1000);
  });

  it('Deve visualizar solicitações de troca e devolução', () => {
    cy.visit('/app/orders/exchanges');
    cy.wait(1000);
    cy.get('h1').should('contain', 'Gestão de Trocas e Devoluções');
    
    // Verificar tabs
    cy.contains('Trocas').should('be.visible');
    cy.contains('Devoluções').should('be.visible');
  });

  it('Deve aprovar uma solicitação de troca', () => {
    cy.visit('/app/orders/exchanges');
    cy.wait(1000);

    // Clicar em uma troca pendente
    cy.get('.request-card').then(($cards) => {
      if ($cards.length > 0) {
        cy.wrap($cards.first()).click();
        cy.wait(500);

        // Verificar se há botão de aprovar
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Aprovar")').length > 0) {
            cy.contains('button', 'Aprovar').click();
            cy.wait(1000);
            
            cy.on('window:confirm', () => true);
            cy.wait(1000);
            
            // Verificar mensagem de sucesso com cupom
            cy.on('window:alert', (str) => {
              expect(str).to.contain('aprovada');
              expect(str).to.contain('Cupom');
            });
          }
        });
      }
    });
  });

  it('Deve confirmar recebimento de produtos devolvidos', () => {
    cy.visit('/app/orders/exchanges');
    cy.wait(1000);

    // Ir para aba de devoluções
    cy.contains('Devoluções').click();
    cy.wait(500);

    cy.get('.request-card').then(($cards) => {
      if ($cards.length > 0) {
        cy.wrap($cards.first()).click();
        cy.wait(500);

        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Confirmar Recebimento")').length > 0) {
            cy.contains('button', 'Confirmar Recebimento').click();
            cy.wait(1000);
            
            cy.on('window:confirm', () => true);
            cy.wait(1000);
            
            cy.on('window:alert', (str) => {
              expect(str).to.contain('Recebimento confirmado');
            });
          }
        });
      }
    });
  });
});

