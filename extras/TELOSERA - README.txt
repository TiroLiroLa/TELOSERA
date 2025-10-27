Este documento contém todas as instruções necessárias para configurar o ambiente de desenvolvimento e executar o projeto TELOSERA localmente.

---

## 1. Pré-requisitos de Software

Antes de começar, certifique-se de que você tem os seguintes softwares instalados na sua máquina.

### 1.1. Node.js e npm

A aplicação foi desenvolvida utilizando Node.js. A versão recomendada é a **LTS (Long-Term Support)**.

*   **O que é?** Node.js é o ambiente que executa nosso código JavaScript no backend. O npm (Node Package Manager) é o gerenciador de pacotes que usamos para instalar as dependências do projeto.
*   **Como instalar:**
    1.  Vá para o site oficial: [https://nodejs.org/](https://nodejs.org/)
    2.  Baixe e instale a versão marcada como **LTS**.
    3.  Para verificar se a instalação foi bem-sucedida, abra seu terminal (CMD, PowerShell, Git Bash, etc.) e execute os comandos:
        ```bash
        node -v
        npm -v
        ```
    4.  Eles devem retornar os números das versões instaladas.

### 1.2. PostgreSQL e PostGIS

Nosso banco de dados é o PostgreSQL, com a extensão PostGIS para funcionalidades geoespaciais.

*   **O que é?** PostgreSQL é um sistema de gerenciamento de banco de dados relacional. PostGIS é uma extensão que adiciona suporte para objetos geográficos, permitindo cálculos de distância e armazenamento de localizações.
*   **Como instalar:**
    1.  Vá para o site do EDB, que fornece um instalador fácil para Windows/Mac: [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
    2.  Baixe a versão **14 ou superior**.
    3.  Durante a instalação, você será solicitado a:
        *   **Selecionar componentes:** Certifique-se de que **"Stack Builder"** esteja marcado. Precisaremos dele para instalar o PostGIS.
        *   **Definir uma senha:** Crie uma senha forte para o usuário padrão `postgres`. **Anote esta senha, você precisará dela!**
        *   Manter a porta padrão (`5432`).
    4.  Após a instalação do PostgreSQL terminar, o **Stack Builder** será iniciado.
    5.  No Stack Builder, selecione a sua instalação do PostgreSQL na lista.
    6.  Na próxima tela, expanda a categoria **"Spatial Extensions"** e selecione a versão mais recente do **PostGIS**.
    7.  Prossiga com a instalação do PostGIS, aceitando as opções padrão.

### 1.3. pgAdmin 4

*   **O que é?** Uma ferramenta gráfica para administrar e interagir com seu banco de dados PostgreSQL.
*   **Como instalar:** O pgAdmin geralmente já vem incluído no instalador do PostgreSQL do EDB. Se não, você pode baixá-lo separadamente ou usar outra ferramenta de sua preferência (como DBeaver).

---

## 2. Configuração do Projeto

Com todos os softwares instalados, siga estes passos para configurar o projeto.

### 2.1. Configurando o Banco de Dados

1.  **Abra o pgAdmin 4.**
2.  Conecte-se ao seu servidor local (geralmente `localhost:5432` com usuário `postgres` e a senha que você definiu).
3.  Na árvore de navegação à esquerda, clique com o botão direito em **"Databases" -> "Create" -> "Database..."**.
4.  Dê ao banco o nome de **`telosera_db`** e clique em "Save".
5.  Clique com o botão direito no novo banco `telosera_db` e selecione **"Query Tool"**.
6.  Abra o arquivo **`Telosera SQL`** (que está na pasta extras/ do projeto), copie **todo** o seu conteúdo.
7.  Cole o conteúdo na janela do "Query Tool".
8.  Clique no botão de "Execute" (geralmente um ícone de raio/play). Isso criará todas as tabelas, funções e extensões necessárias, incluindo `pgcrypto` e `postgis`. Se tudo correr bem, você verá uma mensagem de "Query returned successfully".

### 2.2. Configurando as Variáveis de Ambiente

O backend precisa saber como se conectar ao seu banco de dados.

1.  Navegue até a pasta **`server`** do projeto.
2.  Você encontrará um arquivo chamado `.env.example` (se não houver, crie um). Renomeie este arquivo para **`.env`**.
3.  Abra o arquivo `.env` e preencha com suas informações:

    ```
    DB_USER=postgres
    DB_HOST=localhost
    DB_DATABASE=telosera_db
    DB_PASSWORD=sua_senha_do_postgres_aqui
    DB_PORT=5432
    PORT=3001
    JWT_SECRET=use_uma_frase_longa_e_secreta_aqui_para_os_tokens_jwt
    ```
4.  **Importante:** Substitua `sua_senha_do_postgres_aqui` pela senha que você criou durante a instalação do PostgreSQL.

### 2.3. Instalando as Dependências

O projeto é dividido em `server` (backend) e `client` (frontend). Cada parte tem suas próprias dependências que precisam ser instaladas.

1.  **Instalando dependências do Backend:**
    *   Abra um terminal na pasta **`server`**.
    *   Execute o comando:
        ```bash
        npm install
        ```

2.  **Instalando dependências do Frontend:**
    *   Abra **outro** terminal na pasta **`client`**.
    *   Execute o comando:
        ```bash
        npm install
        ```

---

## 3. Executando a Aplicação

Para rodar o projeto, você precisará de **dois terminais abertos simultaneamente**.

### 3.1. Rodando o Backend (Servidor)

*   No terminal que está na pasta **`server`**, execute o comando:
    ```bash
    npm run dev
    ```
*   Você deve ver a mensagem "Servidor rodando na porta 3001". Este terminal deve permanecer aberto enquanto você usa a aplicação.

### 3.2. Rodando o Frontend (Cliente)

*   No terminal que está na pasta **`client`**, execute o comando:
    ```bash
    npm start
    ```
*   Este comando deve abrir automaticamente uma nova aba no seu navegador no endereço **`http://localhost:3000`**.
*   Se não abrir, acesse essa URL manualmente.

---

## 4. Acesso à Aplicação

*   **Aplicação Web:** [http://localhost:3000](http://localhost:3000)
*   **API do Backend:** [http://localhost:3001](http://localhost:3001) (para testes)