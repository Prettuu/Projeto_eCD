describe('Fluxo Completo de Compra - Primeiro Acesso', () => {
  const timestamp = Date.now();

  const clienteNovo = {
    nome: `Cliente Teste ${timestamp}`,
    email: `cliente.teste.${timestamp}@example.com`,
    cpf: `${timestamp.toString().slice(-11)}`,
    nascimento: '1990-01-15',
    senha: '123456',
    genero: 'M',
    ddd: '11',
    telefone: '987654321',
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

  it('Deve criar cliente novo, fazer login e completar compra', () => {
    cy.visit('/register/create');
    cy.wait(2000);

    cy.get('select[id="genero"], select[formcontrolname="genero"]').select(clienteNovo.genero);
    cy.get('input[id="nome"], input[formcontrolname="nome"]').type(clienteNovo.nome);
    cy.get('input[id="email"], input[formcontrolname="email"]').type(clienteNovo.email);
    cy.get('input[id="cpf"], input[formcontrolname="cpf"]').type(clienteNovo.cpf);
    cy.get('input[id="nascimento"], input[formcontrolname="dataNascimento"]').type(clienteNovo.nascimento);
    cy.get('input[id="senha"], input[formcontrolname="senha"]').type(clienteNovo.senha);

    cy.get('select[formcontrolname="tipo"]').first().select('celular', { force: true });
    cy.get('input[formcontrolname="ddd"]').first().type(clienteNovo.ddd);
    cy.get('input[formcontrolname="numero"]').first().type(clienteNovo.telefone);

    cy.get('input[formcontrolname="logradouro"]').first().type(clienteNovo.endereco.logradouro);
    cy.get('input[formcontrolname="numero"]').eq(1).type(clienteNovo.endereco.numero);
    cy.get('input[formcontrolname="bairro"]').first().type(clienteNovo.endereco.bairro);
    cy.get('input[formcontrolname="cep"]').first().type(clienteNovo.endereco.cep);
    cy.get('input[formcontrolname="cidade"]').first().type(clienteNovo.endereco.cidade);
    cy.get('input[formcontrolname="estado"]').first().type(clienteNovo.endereco.estado);
    cy.get('input[formcontrolname="pais"]').first().type(clienteNovo.endereco.pais);

    cy.get('.cards-array .card-item').last().within(() => {
      cy.get('input[formcontrolname="numero"]').clear().type('5555555555554444');
      cy.get('input[formcontrolname="nomeImpresso"]').type('CLIENTE TESTE');
      cy.get('select[formcontrolname="bandeira"]').select('Elo');
      cy.get('input[formcontrolname="codigoSeguranca"]').type('123');
    });

    cy.get('button[type="submit"]').contains(/atualizar|salvar/i).click();
    cy.wait(1500);

    cy.url().then(url => {
      if (!url.includes('/login')) cy.visit('/login');
    });

    cy.get('input[type="email"]').type(clienteNovo.email);
    cy.get('input[type="password"]').type(clienteNovo.senha);
    cy.contains('button', 'Entrar').click();
    cy.wait(3000);

    cy.url().should('include', '/app');

    cy.contains(/produtos/i).first().click();
    cy.wait(1500);
    cy.contains(/adicionar ao carrinho/i).first().click();
    cy.wait(1500);
    cy.contains(/carrinho/i).first().click();
    cy.wait(1500);
    cy.contains(/finalizar compra/i).click();

    cy.get('input[formcontrolname="cupom"]').type('COMPRA1');
    cy.contains('button', 'Aplicar').click();
    cy.wait(1000);

    cy.contains(/cartão/i).click();
    cy.get('select[formcontrolname="cardId"]').select('Elo - **** 4444');
    cy.wait(1000);
    cy.intercept('POST', '**/orders').as('createOrder');
    cy.wait(1000);
    cy.contains('button', 'Finalizar Pedido').click();

    cy.wait('@createOrder', { timeout: 20000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    cy.url().should('match', /orders\/view\/\d+/);

    cy.url().then(url => {
      cy.wrap(url.split('/').pop()).as('orderId');
    });
  });
});
