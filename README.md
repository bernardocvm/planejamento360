# Finanças 360 Local

Sistema web app React/Vite para controle financeiro pessoal e familiar, com foco em:

- DRE pessoal mensal
- Fluxo de caixa pessoal e familiar
- Orçamento por categoria
- Balanço patrimonial, ativos e passivos
- Importação de extratos em CSV
- Backup e restauração local em JSON
- Uso offline-first no navegador, sem servidor e sem mensalidade inicial

## Como rodar no seu PC

### 1. Instale o Node.js
Baixe em: https://nodejs.org/

### 2. Abra o terminal na pasta do projeto
No Windows, entre na pasta `financas-360-local` e selecione a barra de endereço do Explorer. Digite `cmd` e pressione Enter.

### 3. Instale as dependências
```bash
npm install
```

### 4. Rode o sistema
```bash
npm run dev
```

Depois abra o endereço informado no terminal, normalmente:

```text
http://localhost:5173
```

## Como gerar a versão para publicar na web

```bash
npm run build
```

A pasta `dist` será criada. Ela pode ser publicada no Netlify, GitHub Pages, Vercel ou outro serviço de site estático.

## Como usar sem custo inicial de hospedagem

Nesta versão, os dados ficam no navegador de cada usuário via localStorage. Isso permite publicar como site estático gratuito, sem servidor e sem banco de dados online.

Importante: cada navegador terá sua própria base. Para trocar de computador, use o botão de backup e depois restaure o arquivo JSON no outro dispositivo.

## Segurança e privacidade

Não publique backups, extratos ou dados financeiros reais em repositório público. Publique apenas o código do app.

## Formato CSV recomendado

Veja o arquivo:

```text
samples/extrato-modelo.csv
```

Colunas recomendadas:

```text
data;descricao;valor;conta;categoria;tipo
```

## Próximas evoluções sugeridas

- Transformar em PWA instalável
- Migrar localStorage para IndexedDB
- Criar importadores por banco/cartão
- Adicionar exportação Excel/PDF
- Criar modo multiusuário com login
- Adicionar backend com Supabase ou Firebase no futuro
