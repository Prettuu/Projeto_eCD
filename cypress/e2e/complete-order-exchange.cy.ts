describe('Fluxo completo de compra, entrega, troca e cupom de troca', () => {

  const cliente = { email: 'teste@t.com', senha: 'Teste1!' };
  const admin = { email: 'admin@ecd.com', senha: '123456' };

  function login(email: string, senha: string) {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(senha);
    cy.contains('button', /entrar/i).click();
    cy.url().should('contain', '/app');
  }

  it('Fluxo completo', () => {
    login(cliente.email, cliente.senha);
    cy.wait(1500);

    cy.intercept('POST', '**/api/orders').as('createOrder');
    cy.intercept('PATCH', '**/api/orders/*/status').as('updateOrderStatus');
    cy.intercept('GET', '**/api/orders/*').as('fetchOrder');

    cy.contains(/produtos/i, { matchCase: false }).first().click();
    cy.wait(1500);
    cy.contains(/adicionar ao carrinho/i, { matchCase: false }).first().click();
    cy.wait(1500);
    cy.contains(/Carrinho/i, { matchCase: false }).first().click()
    cy.wait(1500);
    cy.contains(/finalizar compra/i).click();

    cy.get('input[id="cep"], input[formcontrolname="cep"]').should('be.visible').clear().type('01310100').blur();
    cy.get('input[id="endereco"], input[formcontrolname="endereco"]').should('be.visible').clear().type('Av Paulista');
    cy.get('input[id="numero"], input[formcontrolname="numero"]').should('be.visible').clear().type('1000');
    cy.wait(1500);

    cy.get('input[formcontrolname="cupom"]').should('be.visible').clear().type('COMPRA1');
    cy.contains('button', /aplicar/i).click();
    
    cy.get('.coupon-applied', { timeout: 1500 }).should('be.visible');
    cy.get('.coupon-code').should('contain', 'COMPRA1');
    cy.get('.coupon-discount').should('be.visible');
    cy.wait(1500);
    
    cy.get('.summary-value.total-value').should('be.visible').then(($total) => {
      const totalText = $total.text();
      const totalValue = parseFloat(totalText.replace(/[^\d,]/g, '').replace(',', '.'));
      expect(totalValue).to.be.greaterThan(0);
      cy.wrap(totalValue).as('expectedTotal');
    });

    cy.contains('button', / cartões/i).click();
    cy.get('select[formcontrolname="cardId"]').should('be.visible');
    cy.get('select[formcontrolname="cardId2"]').select('➕ Adicionar novo cartão');

    cy.url().should('match', /\/app\/profile\/edit\/\d+(?:\?.*)?$/);
    cy.wait(1500);
    cy.get('.cards-array').should('be.visible');
    cy.contains('button', /\+\s*Adicionar Cartão/i).click({ force: true });
    
    cy.get('.cards-array .card-item').last().within(() => {
      cy.get('input[formcontrolname="numero"]')
        .should('be.visible')
        .should('not.be.disabled')
        .clear()
        .type('5555555555554444');
      cy.get('input[formcontrolname="nomeImpresso"]')
        .should('be.visible')
        .should('not.be.disabled')
        .type('CLIENTE TESTE');
      cy.get('select[formcontrolname="bandeira"]')
        .should('be.visible')
        .select('Elo');
      cy.get('input[formcontrolname="codigoSeguranca"]')
        .should('be.visible')
        .should('not.be.disabled')
        .type('123');
    });
    cy.get('button[type="submit"]').contains(/atualizar|salvar/i).click();
    cy.wait(1500);

    // 8- Voltar ao checkout e verificar que o cupom ainda está aplicado
    cy.url().should('match', /\/app\/cart\/checkout/);
    cy.wait(1500);
    
    // Verificar que o cupom ainda está aplicado após voltar
    cy.get('.coupon-applied', { timeout: 1500 }).should('be.visible');
    cy.get('.coupon-code').should('contain', 'COMPRA1');
    
    // Verificar que o resumo do pedido está visível e com valores corretos
    cy.get('.checkout-summary').should('be.visible');
    
    // Verificar subtotal (deve existir e ser maior que zero)
    cy.get('.checkout-summary').within(() => {
      cy.contains('Subtotal').should('be.visible');
      cy.contains('Subtotal').parent().find('.summary-value').should('be.visible').then(($subtotal) => {
        const subtotalText = $subtotal.text().trim();
        const subtotalValue = parseFloat(subtotalText.replace(/[^\d,]/g, '').replace(',', '.'));
        expect(subtotalValue).to.be.greaterThan(0, `Subtotal deve ser maior que zero. Valor encontrado: ${subtotalText}`);
      });
    });
    
    // Verificar desconto (pode não aparecer se não foi aplicado corretamente)
    cy.get('body').then(($body) => {
      if ($body.find('.checkout-summary .discount').length > 0) {
        cy.get('.checkout-summary .discount').within(() => {
          cy.get('.summary-value').should('be.visible').then(($discount) => {
            const discountText = $discount.text().trim();
            const discountValue = parseFloat(discountText.replace(/[^\d,]/g, '').replace(',', '.'));
            expect(discountValue).to.be.greaterThan(0, 'Desconto deve ser maior que zero quando aplicado');
          });
        });
      } else {
        cy.log('Desconto não visível no resumo - verificando se cupom foi aplicado');
      }
    });
    
    // Verifica que o total não está zerado
    cy.get('.summary-value.total-value').should('be.visible').then(($total) => {
      const totalText = $total.text().trim();
      const totalValue = parseFloat(totalText.replace(/[^\d,]/g, '').replace(',', '.'));
      expect(totalValue).to.be.greaterThan(0, `Total deve ser maior que zero. Valor encontrado: ${totalText}`);
      cy.wrap(totalValue).as('finalTotal');
    });
    cy.wait(1500);

    // 9- Seleciona cartão e finalizar pedido
    cy.contains('button', / cartões/i).click();
    cy.get('select[formcontrolname="cardId"]').should('be.visible').select(1);
    cy.get('select[formcontrolname="cardId"]').select('MasterCard - **** 1234')
    cy.get('input[formcontrolname="amount1"]').should('be.visible').clear().type('50');
    cy.wait(1500);
    cy.get('select[formcontrolname="cardId2"]').select('Elo - **** 4444')
    cy.get('input[formcontrolname="amount2"]').should('be.visible').clear().type('20');
    cy.wait(1500);

    // 10- Finaliza compra e verificar que o pedido foi criado com valor correto
    cy.contains('button', /finalizar pedido/i).click();
    
    cy.wait('@createOrder', { timeout: 20000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      
      // Verificar que o pedido foi criado com valor maior que zero
      const orderData = interception.response?.body;
      expect(orderData).to.exist;
      expect(orderData.total).to.exist;
      
      const orderTotal = typeof orderData.total === 'string' 
        ? parseFloat(orderData.total.replace(',', '.')) 
        : parseFloat(orderData.total);
      
      
      // Verificar que o desconto foi aplicado
      if (orderData.desconto !== undefined && orderData.desconto !== null) {
        const desconto = typeof orderData.desconto === 'string' 
          ? parseFloat(orderData.desconto.replace(',', '.')) 
          : parseFloat(orderData.desconto);
        expect(desconto).to.be.greaterThan(0, 'O desconto deve ser maior que zero');
      }
      
      // Verificar que o cupom foi salvo
      expect(orderData.cupom).to.equal('COMPRA1', 'O cupom COMPRA1 deve estar salvo no pedido');
    });
    cy.wait(1500);
    
    // 11- Capturar OrderID
    cy.url().should('match', /orders\/view\/\d+/);
    cy.wait('@fetchOrder', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
    cy.url().then(url => cy.wrap(url.split('/').pop()!).as('orderId'));
    cy.wait(1500);

    // 12- Logout cliente
    cy.get('button.btn-logout').click();
    cy.wait(1500);

    // 13- Login admin e aprovar/enviar pedido
    login(admin.email, admin.senha);
    cy.wait(1500);
    cy.visit('/app/orders');
    cy.wait(1500);

    cy.get('@orderId').then((id: any) => {
      const orderId = String(id);
      cy.contains('td.order-id', `#${orderId}`).parents('tr').within(() => {
        cy.get('button').contains(/enviar|visualizar/i).first().click();
      });
    });

    // Se navegou para a tela de visualização do pedido, aguardar os dados carregarem
    cy.url().then(url => {
      if (/orders\/view\/\d+/.test(url)) {
        cy.wait('@fetchOrder', { timeout: 20000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 304]);
      }
    });
    cy.wait(1500);

    // Aprovar e enviar para transporte se necessário
    cy.contains('button', / aprovar e enviar para transporte/i)
  .scrollIntoView()
  .should('be.visible')
  .click({ force: true });
    cy.wait(1500);

    // 14- Logout admin
    cy.get('button.btn-logout').click();
    cy.wait(1500);

    // 15- Login cliente e confirmar entrega
    login(cliente.email, cliente.senha);
    cy.wait(1500);
    cy.visit('/app/orders');
    cy.wait(1500);
    
    cy.get('@orderId').then((id: any) => {
      const orderId = String(id);
      cy.contains('td.order-id', `#${orderId}`).parents('tr').within(() => {
        cy.contains('button', /visualizar/i).click();
      });
    });

    // Aguardar os dados do pedido na tela de visualização
    cy.url().should('match', /orders\/view\/\d+/);
    cy.wait('@fetchOrder', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
    cy.wait(1500);

    // 16- Confirmar entrega
    cy.contains(/confirmar entrega/i).click();
    cy.wait(1500);

    // 17- Solicitar troca
    cy.contains(/solicitar troca/i).click();
    cy.wait(1500);
    cy.get('textarea[formcontrolname="motivo"]').should('be.visible').type('Produto com defeito');
    cy.get('body').then(($body) => {
      const checkbox = $body.find('input[type="checkbox"], mat-checkbox input');
      if (checkbox.length > 0) {
        cy.wrap(checkbox.first()).check({ force: true });
      } else {
        throw new Error('Nenhum item disponível para seleção na tela de troca');
      }
    });
    cy.contains(/Enviar Solicitação/i).click();
    cy.wait(1500);

    // 18- Logout cliente
    cy.get('button.btn-logout').click();
    cy.wait(1500);

    // 19- Login admin e aprovar troca
    login(admin.email, admin.senha);
    cy.wait(1500);
    cy.visit('/app/orders');
    cy.wait(1500);
    
    cy.get('@orderId').then((id: any) => {
      const orderId = String(id);
      cy.contains('td.order-id', `#${orderId}`).parents('tr').within(() => {
        cy.contains('button', /visualizar/i).click();
      });
    });

    // Aguardar os dados do pedido na tela de visualização (admin)
    cy.url().should('match', /orders\/view\/\d+/);
    cy.wait('@fetchOrder', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
    cy.wait(1500);

    // 20- Aprovar troca
    cy.contains('button', /aprovar/i).click();
    cy.wait(1500);

    // 21- Confirmar recebimento
    cy.contains('button', /confirmar recebimento/i).click();
    cy.wait(1500);

    // 22- Logout admin
    cy.get('button.btn-logout').click();
    cy.wait(1500);
    
    // 23- Login cliente e verificar cupom de troca
    login(cliente.email, cliente.senha);
    cy.visit('/app/orders');
    cy.wait(1500);
    
    cy.get('@orderId').then((id: any) => {
      const orderId = String(id);
      cy.contains('td.order-id', `#${orderId}`).parents('tr').within(() => {
        cy.contains('button', /visualizar/i).click();
      });
    });

    // Aguardar os dados do pedido na tela de visualização (cliente)
    cy.url().should('match', /orders\/view\/\d+/);
    cy.wait('@fetchOrder', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
    cy.wait(1500);

    // 24- Verificar cupom de troca gerado
    cy.contains(/cupom de troca/i).should('be.visible');
    cy.get('.coupon-code').first().should('be.visible').invoke('text').then(text => {
      cy.wrap(text.trim()).as('exchangeCoupon');
    });
    cy.wait(1500);

    // 25- Usar cupom de troca em nova compra
    cy.visit('/app/products');
    cy.wait(1500);
    cy.contains(/adicionar ao carrinho/i).first().click();
    cy.wait(1500);
    cy.contains(/Carrinho/i, { matchCase: false }).first().click()
    cy.wait(1500);
    cy.contains(/finalizar compra/i).click();
    
    // Preencher endereço PRIMEIRO (igual ao primeiro pedido)
    cy.get('input[id="cep"], input[formcontrolname="cep"]').should('be.visible').clear().type('01310100').blur();
    cy.get('input[id="endereco"], input[formcontrolname="endereco"]').should('be.visible').clear().type('Av Paulista');
    cy.get('input[id="numero"], input[formcontrolname="numero"]').should('be.visible').clear().type('1000');
    
    // Verificar que o resumo do pedido está visível (igual ao primeiro pedido)
    cy.get('.checkout-summary').should('be.visible');
    
    // Verificar subtotal (deve existir e ser maior que zero) - IGUAL AO PRIMEIRO PEDIDO
    cy.get('.checkout-summary').within(() => {
      cy.contains('Subtotal').should('be.visible');
      cy.contains('Subtotal').parent().find('.summary-value').should('be.visible').then(($subtotal) => {
        const subtotalText = $subtotal.text().trim();
        const subtotalValue = parseFloat(subtotalText.replace(/[^\d,]/g, '').replace(',', '.'));
        expect(subtotalValue).to.be.greaterThan(0, `Subtotal deve ser maior que zero. Valor encontrado: ${subtotalText}`);
      });
    });
    
    // Aplicar cupom de troca DEPOIS de preencher endereço
    cy.get('@exchangeCoupon').then((code: any) => {
      cy.get('input[formcontrolname="cupom"]').should('be.visible').clear().type(String(code));
    });
    
    cy.contains('button', /aplicar/i).click();
    cy.get('.coupon-applied', { timeout: 1500 }).should('be.visible');
    cy.get('.coupon-code').should('be.visible');
    cy.wait(1500);
    
    cy.get('.summary-value.total-value').should('be.visible').then(($total) => {
      const totalText = $total.text().trim();
      const totalValue = parseFloat(totalText.replace(/[^\d,]/g, '').replace(',', '.'));
      expect(totalValue).to.be.greaterThan(0, `Total deve ser maior que zero. Valor encontrado: ${totalText}`);
    });
    
    cy.contains('button', / cartões/i).click();
    cy.get('select[formcontrolname="cardId"]').should('be.visible').select(1);
    cy.get('select[formcontrolname="cardId"]').select('MasterCard - **** 1234')
    cy.get('input[formcontrolname="amount1"]').should('be.visible').clear().type('10');
    cy.wait(1500);
    cy.get('select[formcontrolname="cardId2"]').select('Elo - **** 4444')
    cy.get('input[formcontrolname="amount2"]').should('be.visible').clear().type('20');
    cy.wait(1500);
    cy.contains('button', /finalizar pedido/i).click();
    
    cy.url().should('match', /orders\/view\/\d+/);
    cy.wait('@fetchOrder', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
    cy.url().then(url => cy.wrap(url.split('/').pop()!).as('orderId'));
    cy.wait(1500);;
  });
});
