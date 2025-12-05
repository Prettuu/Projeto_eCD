describe('CRUD de Clientes', () => {
  const cliente = {
    nome: 'João Teste',
    email: 'joao@teste.com',
    cpf: '12345678900',
    nascimento: '2000-01-01',
    senha: '123456',
    ddd: '11',
    numero: '999999999'
  };

  const endereco = {
    logradouro: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cep: '12345000',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil'
  };

  const cartao = {
    numero: '4111111111111111',
    nomeImpresso: 'JOAO TESTE',
    bandeira: 'Visa',
    codigoSeguranca: '123'
  };

  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[id="email"], input[type="email"]').type('admin@teste.com');
    cy.get('input[id="senha"], input[type="password"]').type('admin123');
    cy.contains('button', 'Entrar').click();
    cy.wait(2000);
    
    cy.visit('/app/clients');
    cy.wait(1000);
    cy.get('h1').should('contain', 'Clientes');
  });

  it('Deve listar clientes', () => {
    cy.get('table tbody tr').its('length').should('be.gte', 0);
  });

  it('Deve criar um novo cliente', () => {
    cy.contains('Novo cliente').should('be.visible').click();
    cy.wait(500);

    cy.get('select[id="genero"], select[formcontrolname="genero"]').select('M');
    cy.get('input[id="nome"], input[formcontrolname="nome"]').type(cliente.nome);
    cy.get('input[id="email"], input[formcontrolname="email"]').type(cliente.email);
    cy.get('input[id="cpf"], input[formcontrolname="cpf"]').type(cliente.cpf);
    cy.get('input[id="nascimento"], input[formcontrolname="dataNascimento"]').type(cliente.nascimento);
    cy.get('input[id="senha"], input[formcontrolname="senha"]').type(cliente.senha);

    cy.get('select[formcontrolname="tipo"]').first().select('celular', { force: true });
    cy.get('input[formcontrolname="ddd"]').first().type(cliente.ddd);
    cy.get('input[formcontrolname="numero"]').first().type(cliente.numero);
    
    cy.get('input[formcontrolname="logradouro"]').first().type(endereco.logradouro);
    cy.get('input[formcontrolname="numero"]').eq(1).type(endereco.numero);
    cy.get('input[formcontrolname="bairro"]').first().type(endereco.bairro);
    cy.get('input[formcontrolname="cep"]').first().type(endereco.cep);
    cy.get('input[formcontrolname="cidade"]').first().type(endereco.cidade);
    cy.get('input[formcontrolname="estado"]').first().type(endereco.estado);
    cy.get('input[formcontrolname="pais"]').first().type(endereco.pais);

    cy.contains('button', 'Adicionar Endereço').click();
    cy.wait(300);
    
    cy.get('input[formcontrolname="logradouro"]').eq(1).type('Rua Secundária');
    cy.get('input[formcontrolname="numero"]').eq(2).type('456');
    cy.get('input[formcontrolname="bairro"]').eq(1).type('Bairro Novo');
    cy.get('input[formcontrolname="cep"]').eq(1).type('12345001');
    cy.get('input[formcontrolname="cidade"]').eq(1).type('São Paulo');
    cy.get('input[formcontrolname="estado"]').eq(1).type('SP');
    cy.get('input[formcontrolname="pais"]').eq(1).type('Brasil');

    cy.contains('button', 'Adicionar Cartão').click();
    cy.wait(300);
    
    cy.get('input[formcontrolname="numero"]').last().type(cartao.numero);
    cy.get('input[formcontrolname="nomeImpresso"]').last().type(cartao.nomeImpresso);
    cy.get('select[formcontrolname="bandeira"]').last().select(cartao.bandeira);
    cy.get('input[formcontrolname="codigoSeguranca"]').last().type(cartao.codigoSeguranca);
    cy.get('input[type="checkbox"][formcontrolname="preferencial"]').last().check({ force: true });
    
    cy.get('button[type="submit"]').should('be.enabled').click();
    cy.wait(2000);
    cy.url().should('include', '/clients');
  });

  it('Deve pesquisar cliente pelo nome', () => {
    cy.get('input[placeholder="Pesquisar por nome, email ou CPF"]')
      .clear()
      .type(cliente.nome);

    cy.contains('Pesquisar').click();

    cy.get('table tbody', { timeout: 10000 })
      .should('contain', cliente.nome);
  });

  it('Deve editar cliente', () => {
    cy.contains('button', 'Editar').first().click();
    cy.wait(500);
    
    cy.get('input[id="nome"], input[formcontrolname="nome"]').clear().type('João Editado');
    
    cy.get('button[type="submit"]').should('be.enabled').click();
    cy.wait(2000);
    cy.url().should('include', '/clients');

    cy.get('table', { timeout: 5000 }).should('contain', 'João Editado');
  });

  it('Deve excluir cliente', () => {
    cy.contains('button', 'Excluir').first().click();
    cy.on('window:confirm', () => true);

    cy.wait(2000);
    cy.get('table', { timeout: 5000 }).should('not.contain', 'João Editado');
  });
});
