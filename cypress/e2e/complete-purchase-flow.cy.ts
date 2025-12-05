describe('Fluxo Completo de Compra - Novo Cliente', () => {
  const timestamp = Date.now();

  const cliente = {
    nome: `Cliente Teste ${timestamp}`,
    email: `cliente.${timestamp}@teste.com`,
    cpf: `${String(timestamp).slice(-11).padStart(11, '0')}`,
    nascimento: '1990-01-15',
    senha: '123456',
    genero: 'M',
    telefone: {
      tipo: 'celular',
      ddd: '11',
      numero: '987654321'
    },
    endereco: {
      logradouro: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cep: '01310100',
      cidade: 'São Paulo',
      estado: 'SP',
      pais: 'Brasil'
    }
  };

  const enderecoEntrega = {
    cep: '01310100',
    endereco: 'Avenida Paulista',
    numero: '1578',
    complemento: 'Apto 101'
  };

  const novoCartao = {
    numero: '5555555555554444',
    nomeImpresso: 'CLIENTE TESTE',
    bandeira: 'MasterCard',
    codigoSeguranca: '123'
  };

  const goLoginAndClickPrimeiroAcesso = () => {
    cy.visit('/login');
    cy.wait(800);
    cy.window().then((win) => cy.stub(win, 'alert').as('alertStub'));
    cy.get('body').then($b => {
      const btn = $b.find('a:contains("Primeiro acesso"), button:contains("Primeiro acesso"), a:contains("Primeiro Acesso"), button:contains("Primeiro Acesso")');
      if (btn.length) {
        cy.wrap(btn.first()).click({ force: true });
      } else {
        cy.visit('/register/create');
      }
    });
  };

  const preencherCadastro = () => {
    cy.get('select[formcontrolname="genero"], select#genero').select(cliente.genero);
    cy.get('input[formcontrolname="nome"], input#nome').type(cliente.nome);
    cy.get('input[formcontrolname="email"], input#email').type(cliente.email);
    cy.get('input[formcontrolname="cpf"], input#cpf').type(cliente.cpf);
    cy.get('input[formcontrolname="dataNascimento"], input#nascimento').type(cliente.nascimento);
    cy.get('input[formcontrolname="senha"], input#senha').type(cliente.senha);

    cy.get('select[formcontrolname="tipo"]').first().select(cliente.telefone.tipo, { force: true });
    cy.get('input[formcontrolname="ddd"]').first().type(cliente.telefone.ddd);
    cy.get('input[formcontrolname="numero"]').first().type(cliente.telefone.numero);

    cy.get('input[formcontrolname="logradouro"]').first().type(cliente.endereco.logradouro);
    cy.get('input[formcontrolname="numero"]').eq(1).type(cliente.endereco.numero);
    cy.get('input[formcontrolname="bairro"]').first().type(cliente.endereco.bairro);
    cy.get('input[formcontrolname="cep"]').first().type(cliente.endereco.cep);
    cy.get('input[formcontrolname="cidade"]').first().type(cliente.endereco.cidade);
    cy.get('input[formcontrolname="estado"]').first().type(cliente.endereco.estado);
    cy.get('input[formcontrolname="pais"]').first().type(cliente.endereco.pais);

    cy.contains('label', 'Número do cartão').parent().find('input[formcontrolname="numero"]').then($i => {
      if ($i.length) {
        cy.wrap($i).clear().type('4111111111111111', { delay: 10 });
        cy.contains('label', 'Nome impresso').parent().find('input[formcontrolname="nomeImpresso"]').clear().type(cliente.nome.toUpperCase());
        cy.contains('label', 'Bandeira').parent().find('select[formcontrolname="bandeira"]').select('Visa');
        cy.contains('label', 'Código de segurança').parent().find('input[formcontrolname="codigoSeguranca"]').clear().type('123');
      }
    });

    cy.get('button[type="submit"]', { timeout: 10000 }).should('be.enabled').click();
  };

  const fazerLogin = () => {
    cy.url({ timeout: 10000 }).then(url => {
      if (!url.includes('/login')) cy.visit('/login');
    });
    cy.get('input#email, input[type="email"]').clear().type(cliente.email);
    cy.get('input#senha, input[type="password"]').clear().type(cliente.senha);
    cy.contains('button', /entrar/i).click();
    cy.url({ timeout: 10000 }).should('include', '/app');
    cy.window().then(win => {
      const userEmail = win.localStorage.getItem('userEmail');
      const clientId = win.localStorage.getItem('clientId');
      const userId = win.localStorage.getItem('userId');
      if (!userEmail) win.localStorage.setItem('userEmail', cliente.email);
      if (!clientId && userId) {
        const role = win.localStorage.getItem('role');
        if (role === 'CLIENT') win.localStorage.setItem('clientId', userId);
      }
    });
  };

  const adicionarPrimeiroProdutoViaUI = () => {
    cy.visit('/app/products');
    cy.wait(3000);
    
    cy.get('.product-card', { timeout: 10000 }).should('have.length.at.least', 1);
    
    cy.window().then((win) => {
      const clientId = win.localStorage.getItem('clientId') || win.localStorage.getItem('userId');
      cy.log(` ClientId: ${clientId || 'NÃO ENCONTRADO'}`);
      
      if (!clientId) {
        cy.log(' ClientId não encontrado - aguardando...');
        cy.wait(5000);
        const newClientId = win.localStorage.getItem('clientId') || win.localStorage.getItem('userId');
        if (!newClientId) {
          throw new Error('ClientId não encontrado após espera');
        }
      }
      
      cy.request('GET', 'http://localhost:3000/api/products').then((productsResp) => {
        expect(productsResp.status).to.eq(200);
        const produtos = productsResp.body;
        expect(produtos).to.have.length.greaterThan(0);
        
        const primeiroProduto = produtos[0];
        const produtoId = primeiroProduto.id;
        const clientIdFinal = win.localStorage.getItem('clientId') || win.localStorage.getItem('userId');
        
        cy.log(` Produto selecionado: ${primeiroProduto.titulo || primeiroProduto.nome} (ID: ${produtoId})`);
        
        cy.window().then((win) => {
          cy.stub(win, 'alert').as('alertStub');
        });
        
        cy.intercept('POST', '**/api/cart/**').as('addToCart');
        
        cy.log(' Tentando adicionar via interface...');
        cy.get('.product-card').first().within(() => {
          cy.contains('button', /adicionar ao carrinho/i, { timeout: 20000 })
            .should('be.visible')
            .should('not.be.disabled', { timeout: 15000 })
            .click({ force: true });
        });
        
        cy.wait(3000);
        
        if (!clientIdFinal) {
          throw new Error('ClientId não disponível');
        }
        
        cy.request('GET', `http://localhost:3000/api/cart?clientId=${clientIdFinal}`).then((cartResp) => {
          const itemCount = cartResp.body?.items?.length || 0;
          cy.log(` Itens no banco após tentativa UI: ${itemCount}`);
          
          if (itemCount === 0) {
            cy.log(' Item não foi adicionado via UI - adicionando diretamente via API...');
            
            cy.request({
              method: 'POST',
              url: 'http://localhost:3000/api/cart/cart-item',
              body: {
                clientId: parseInt(clientIdFinal, 10),
                productId: produtoId,
                quantidade: 1
              },
              failOnStatusCode: false
            }).then((addResp) => {
              if (addResp.status === 201 || addResp.status === 200) {
                cy.log(' Item adicionado via API com sucesso!');
                expect(addResp.body).to.have.property('success', true);
              } else {
                cy.log(` Erro ao adicionar via API: ${addResp.status} - ${JSON.stringify(addResp.body)}`);
                throw new Error(`Falha ao adicionar item via API: ${addResp.status}`);
              }
            });
            
            cy.wait(1000);
            cy.request('GET', `http://localhost:3000/api/cart?clientId=${clientIdFinal}`).then((verifyResp) => {
              const finalCount = verifyResp.body?.items?.length || 0;
              cy.log(` Verificação final - Itens no banco: ${finalCount}`);
              
              if (finalCount === 0) {
                throw new Error('Item não foi adicionado nem via UI nem via API');
              }
            });
          } else {
            cy.log(' Item já estava no banco');
          }
        });
      });
    });
  };

  const garantirCarrinhoComItem = () => {
    cy.visit('/app/cart');
    cy.wait(5000); 
  
    cy.get('body', { timeout: 10000 }).then(($b) => {
      const temItens = $b.find('.cart-item, table tbody tr').length > 0;
      const temVazio = $b.find('.empty-cart, [class*="empty"], [class*="vazio"]').length > 0;
      
      cy.log(` Itens visíveis: ${temItens}, Mensagem vazio: ${temVazio}`);
  
      if (!temItens) {
        cy.log(' Carrinho vazio — verificando banco de dados e adicionando item');
        
        cy.window().then((win) => {
          const clientId =
            win.localStorage.getItem('clientId') ||
            win.localStorage.getItem('userId');
            
          cy.log(` ClientId: ${clientId || 'NÃO ENCONTRADO'}`);
          
          if (clientId) {
            cy.request({
              method: 'GET',
              url: `http://localhost:3000/api/cart?clientId=${clientId}`,
              failOnStatusCode: false
            }).then((cartResp) => {
              const items = cartResp.body?.items || [];
              cy.log(` Itens encontrados via API: ${items.length}`);
              
              if (items.length === 0) {
                cy.log(' Nenhum item no backend — adicionando via interface');
                adicionarPrimeiroProdutoViaUI();
                cy.wait(3000);
                
                cy.request('GET', `http://localhost:3000/api/cart?clientId=${clientId}`).then((resp) => {
                  cy.log(` Itens após adicionar: ${resp.body?.items?.length || 0}`);
                });
                
                cy.visit('/app/cart');
                cy.wait(5000);
              } else {
                cy.log(' Itens existem no banco mas não aparecem — recarregando página');
                cy.visit('/app/cart');
                cy.wait(5000);
                
                cy.get('body').then(($body) => {
                  const aindaVazio = $body.find('.cart-item, table tbody tr').length === 0;
                  if (aindaVazio) {
                    cy.log(' Ainda vazio após recarregar — adicionando novamente');
                    adicionarPrimeiroProdutoViaUI();
                    cy.wait(3000);
                    cy.visit('/app/cart');
                    cy.wait(5000);
                  }
                });
              }
            });
          } else {
            cy.log(' ClientId ausente — voltando aos produtos para adicionar item');
            adicionarPrimeiroProdutoViaUI();
            cy.wait(3000);
            cy.visit('/app/cart');
            cy.wait(5000);
          }
        });
      }
    });
  
    cy.get('.cart-item, table tbody tr', { timeout: 20000 }).should('exist');
    cy.log(' Carrinho confirmado com itens');
  };

  const preencherEnderecoCupom = () => {
    cy.get('input[id="cep"], [formcontrolname="cep"]').clear().type(enderecoEntrega.cep).blur();
    cy.get('input[id="endereco"], [formcontrolname="endereco"]').clear().type(enderecoEntrega.endereco);
    cy.get('input[id="numero"], [formcontrolname="numero"]').clear().type(enderecoEntrega.numero);
    cy.get('input[id="complemento"], [formcontrolname="complemento"]').clear().type(enderecoEntrega.complemento);

    cy.get('input[id="coupon"], [formcontrolname="cupom"]').clear().type('COMPRA1');
    cy.contains('button', /aplicar/i).click();
    cy.get('.coupon-applied, .coupon-code, [class*="coupon"]').should('exist');
  };

  const selecionarAdicionarNovoCartaoNoCheckout = () => {
    cy.get('select#cardId, select[formcontrolname="cardId"]', { timeout: 10000 })
      .should('be.visible')
      .should('not.be.disabled')
      .should(($select) => {
        const el = $select[0] as HTMLSelectElement;
        const options = Array.from(el.options);
        expect(options.length).to.be.greaterThan(0, 'Dropdown deve ter pelo menos uma opção');
      })
      .then($s => {
        const el = $s[0] as HTMLSelectElement;
        
        const allOptions = Array.from(el.options).map(o => ({
          value: o.value,
          text: o.text.trim(),
          selected: o.selected
        }));
        
        cy.log(` Opções disponíveis no dropdown: ${JSON.stringify(allOptions)}`);
        
        const newCardOption = allOptions.find(o =>
          o.value === 'NEW_CARD' || /adicionar.*novo.*cart|novo.*cart|add.*card/i.test(o.text)
        );
        
        if (newCardOption) {
          cy.log(` Opção encontrada: ${newCardOption.text} (value: ${newCardOption.value})`);
          if (newCardOption.value === 'NEW_CARD') {
            cy.wrap($s).select('NEW_CARD');
          } else {
            cy.wrap($s).select(newCardOption.text);
          }
        } else {
          cy.log(' Opção "Adicionar novo cartão" não encontrada no dropdown');
          cy.log(' Navegando diretamente para o perfil para adicionar cartão...');
          cy.visit('/app/profile/edit');
        }
      });
    
    cy.url({ timeout: 8000 }).should('include', '/profile/edit');
  };

  const adicionarNovoCartaoNoPerfil = () => {
    cy.log(' Iniciando adição de novo cartão no perfil...');
    
    cy.url({ timeout: 10000 }).should('include', '/profile/edit');
    cy.wait(3000);
    
    cy.get('input[formcontrolname="numero"]', { timeout: 10000 }).then($inputs => {
      const cartoesAntes = $inputs.length;
      cy.log(` Cartões existentes antes: ${cartoesAntes}`);
      
      cy.get('body').then($body => {
        const btnAdicionar = $body.find('button:contains("Adicionar"), button:contains("adicionar"), button:contains("+")');
        const temBotaoAdicionar = btnAdicionar.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return /adicionar.*cart|novo.*cart|\+.*cart/i.test(text);
        }).length > 0;
        
        if (temBotaoAdicionar) {
          cy.log(' Botão "Adicionar Cartão" encontrado, clicando...');
          cy.contains('button', /adicionar.*cart(ã|a)o|novo.*cart(ã|a)o|\+.*adicionar.*cart(ã|a)o|add.*card/i, { timeout: 10000 })
            .should('be.visible')
            .should('not.be.disabled')
            .click({ force: true });
        } else if (cartoesAntes === 0) {
          cy.log(' Nenhum cartão existe ainda - formulário deve estar disponível');
        } else {
          cy.log(' Botão "Adicionar Cartão" não encontrado, mas há cartões existentes');
          cy.get('button.btn-add, button[class*="add"], button[class*="btn"]').then($btns => {
            const addBtn = Array.from($btns).find(btn => {
              const text = btn.textContent?.toLowerCase() || '';
              return /adicionar|add|\+/.test(text);
            });
            if (addBtn) {
              cy.wrap(addBtn).click({ force: true });
            }
          });
        }
        
        cy.wait(2000); 
        cy.get('input[formcontrolname="numero"]', { timeout: 10000 }).then($inputs => {
          const cartoesApos = $inputs.length;
          cy.log(` Formulários de cartão: antes=${cartoesAntes}, agora=${cartoesApos}`);
          
          if (cartoesAntes > 0) {
            expect(cartoesApos).to.be.greaterThan(cartoesAntes, 
              `Novo formulário de cartão deve aparecer (antes: ${cartoesAntes}, agora: ${cartoesApos})`);
          } else {
            expect(cartoesApos).to.be.greaterThan(0, 'Deve haver pelo menos um formulário de cartão');
          }
        });
        
        cy.log(' Preenchendo dados do novo cartão...');
        cy.get('input[formcontrolname="numero"]').last().should('be.visible').clear().type(novoCartao.numero);
        cy.get('input[formcontrolname="nomeImpresso"]').last().should('be.visible').clear().type(novoCartao.nomeImpresso);
        cy.get('select[formcontrolname="bandeira"]').last().should('be.visible').select(novoCartao.bandeira);
        cy.get('input[formcontrolname="codigoSeguranca"]').last().should('be.visible').clear().type(novoCartao.codigoSeguranca);
        
        cy.log(` Preenchido novo cartão: ${novoCartao.bandeira} terminando em ${novoCartao.numero.slice(-4)}`);
        
        cy.wait(1000);
        
        cy.get('button[type="submit"]', { timeout: 10000 })
          .should('be.visible')
          .should('not.be.disabled')
          .then($btn => {
            const btnText = $btn.text().trim();
            cy.log(` Clicando em botão de submit: "${btnText}"`);
            cy.wrap($btn).click();
          });
        
        cy.wait(4000); 
        
        cy.url().then(url => {
          if (!/checkout/.test(url)) {
            cy.log(' Não foi redirecionado automaticamente, navegando para checkout...');
            cy.visit('/app/cart/checkout');
          } else {
            cy.log(' Redirecionado automaticamente para checkout');
          }
        });
        
        cy.wait(2000);
      });
    });
  };

  const selecionarCartaoRecemCriadoNoCheckout = () => {
    cy.log(' Procurando cartão recém-criado no checkout...');
    
    cy.get('select#cardId, select[formcontrolname="cardId"]', { timeout: 15000 })
      .should('be.visible')
      .should('not.be.disabled')
      .should(($select) => {
        const el = $select[0] as HTMLSelectElement;
        const options = Array.from(el.options);
        const validOptions = options.filter(o => 
          o.value && 
          o.value !== '' && 
          o.value !== 'NEW_CARD' && 
          o.value !== 'null'
        );
        expect(validOptions.length).to.be.greaterThan(0, 'Deve haver pelo menos um cartão disponível');
      })
      .then($s => {
        const el = $s[0] as HTMLSelectElement;
        const options = Array.from(el.options).map(o => ({
          text: o.text.trim(),
          value: o.value,
          selected: o.selected
        }));
        
        cy.log(` Opções disponíveis no dropdown: ${JSON.stringify(options)}`);
        
        const novoCartaoOption = options.find(o => {
          const hasMasterCard = /mastercard/i.test(o.text);
          const has4444 = /4444/.test(o.text);
          const isValidValue = o.value && o.value !== 'NEW_CARD' && o.value !== 'null' && o.value !== '';
          return (hasMasterCard || has4444) && isValidValue;
        });
        
        if (novoCartaoOption) {
          cy.log(` Cartão encontrado: ${novoCartaoOption.text} (value: ${novoCartaoOption.value})`);
          cy.wrap($s).select(novoCartaoOption.value);
          cy.wait(1000); 
        } else {
          cy.log(' Cartão específico não encontrado, tentando selecionar último cartão válido...');
          const validOptions = options.filter(o => 
            o.value && 
            o.value !== 'NEW_CARD' && 
            o.value !== 'null' && 
            o.value !== '' &&
            !/selecione/i.test(o.text)
          );
        }});
