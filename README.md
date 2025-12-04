# Projeto eCD

## Sobre

eCD é um projeto acadêmico / sem fins lucrativos desenvolvido originalmente por Felipe Pretto minisitrado pelo orientador Rodrigo Rocha Silva. Ele contém um front-end em Angular e um back-end em Node.js + TypeScript com Sequelize e MySQL. O repositório atual inclui ambos os lados (cliente e servidor) e testes E2E com Cypress.

## Tutoriais

### Clone

Para clonar, digite no terminal GIT:

`git clone https://github.com/Prettuu/projeto_ecd.git`

Após isso, ele irá clonar este repositório para seu computador.

### Instalando e iniciando

Após o clone, você, com o Node.js instalado, digite no terminal:

`npm i`

Assim, todas as dependências do projeto irão ser instaladas na sua máquina. Após isso, você pode digitar:

`npm start` ou `ng serve`, assim, o projeto estará rodando em sua máquina!

### Contribuindo

Todas as alterações devem ser feitas em uma branch separada, ou em Develop.

Após as alterações, digite em seu terminal `git add` com os nomes dos arquivos que você alterou, e então commite tudo com `git commit -m "mensagem"`.

Após o commit, envie um `git push`, para que assim, suas alterações possam ser analisadas.

## Tecnologias

- Front-end: Angular 16
- Back-end: Node.js + TypeScript, Express, Sequelize (MySQL)
- Testes E2E: Cypress
- Ferramentas: dotenv, JWT, bcryptjs, node-cron

## Requisitos

- Node.js 18+ e npm
- MySQL (ou um container com MySQL)
