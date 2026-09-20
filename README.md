# HubSpot Service Lab

Laboratório prático desenvolvido para estudar e demonstrar uma integração entre um sistema externo de logística e o **HubSpot Service Hub**, utilizando uma API intermediária em Node.js, Fastify e TypeScript.

O projeto simula o recebimento de tickets de um sistema externo, aplica validações e regras de negócio e realiza a integração com a API REST do HubSpot.

## Objetivo

Demonstrar, na prática:

* Integração com a API REST do HubSpot;
* Criação, consulta e atualização de tickets;
* Organização de tickets utilizando pipelines e etapas;
* Validação de dados de entrada;
* Idempotência na criação de tickets;
* Tratamento de erros e timeouts de APIs externas;
* Aplicação de regras de negócio antes de enviar alterações ao HubSpot;
* Separação de responsabilidades entre controller, service e client de integração.

## Arquitetura

```text
Sistema externo de logística
            │
            │ HTTP
            ▼
┌───────────────────────────┐
│ Node.js + Fastify         │
│                           │
│ Controller                │
│     ↓                     │
│ Validation (Zod)          │
│     ↓                     │
│ Ticket Service            │
│     ↓                     │
│ HubSpot Client             │
└─────────────┬─────────────┘
              │
              │ REST API
              ▼
┌───────────────────────────┐
│ HubSpot Service Hub       │
│                           │
│ Tickets                   │
│ Pipeline                  │
│ Custom Properties         │
│ Conditional Properties    │
└───────────────────────────┘
```

## Tecnologias

* Node.js
* TypeScript
* Fastify
* Zod
* REST API
* HubSpot CRM API
* pnpm

## Funcionalidades

### Criação de tickets

A API disponibiliza um endpoint para receber tickets provenientes de um sistema externo.

```http
POST /api/tickets
```

Exemplo:

```json
{
	"externalTicketId": "MT-2026-000003",
	"customerName": "João Silva",
	"customerEmail": "joao@example.com",
	"carrier": "Jadlog",
	"issueCategory": "Pacote não localizado",
	"subject": "Pedido não localizado",
	"description": "O pedido não foi localizado pela transportadora.",
	"priority": "HIGH"
}
```

O ticket é criado no HubSpot com informações como:

* Assunto;
* Descrição;
* Prioridade;
* Transportadora;
* Categoria do problema;
* Sistema de origem;
* ID externo;
* Pipeline;
* Etapa do pipeline.

### Consulta de tickets

```http
GET /api/tickets/:id
```

Consulta um ticket diretamente pelo ID do objeto no HubSpot.

### Atualização de tickets

```http
PATCH /api/tickets/:id
```

Permite atualizar propriedades do ticket, incluindo prioridade, transportadora, categoria e status.

Exemplo:

```json
{
	"priority": "MEDIUM"
}
```

### Controle de status

O projeto possui uma abstração própria para os principais estados utilizados pelo sistema externo:

```text
NEW
RESOLVED
```

Esses estados são convertidos para as respectivas etapas do pipeline do HubSpot.

Atualmente:

```text
NEW      → Novo
RESOLVED → Resolvido
```

### Motivo da resolução

Ao tentar resolver um ticket pela API, o backend exige um motivo para a resolução.

Exemplo:

```json
{
	"status": "RESOLVED",
	"resolutionReason": "Problema resolvido"
}
```

O backend valida essa regra antes de enviar a alteração ao HubSpot e mapeia o campo para a propriedade interna:

```text
motivo_da_resolucao
```

O HubSpot também possui uma regra de propriedade dependente configurada no pipeline para solicitar o motivo quando um ticket é movido para a etapa `Resolvido` pela interface.

## Validação

As entradas da API são validadas utilizando Zod.

Entre as validações estão:

* Campos obrigatórios;
* Formato de e-mail;
* Valores permitidos para prioridade;
* Valores permitidos para transportadora;
* Valores permitidos para categoria do problema;
* Estados válidos do ticket;
* Motivo obrigatório ao resolver um ticket;
* Impedimento de requisições de atualização vazias.

Exemplo de resposta de validação:

```json
{
	"error": "VALIDATION_ERROR",
	"message": "Invalid request body"
}
```

## Idempotência

A criação de tickets utiliza o `externalTicketId` como identificador único proveniente do sistema externo.

Antes de criar um novo ticket, a API verifica se já existe um ticket no HubSpot com aquele identificador.

```text
POST
   ↓
Busca external_ticket_id
   ↓
Existe?
 ┌─┴─┐
Sim  Não
 ↓    ↓
Retorna  Cria
existente  ticket
```

Além disso, a propriedade `external_ticket_id` foi configurada no HubSpot como única.

O backend também trata uma possível condição de concorrência:

```text
Request A ──┐
            ├── verifica → não existe
Request B ──┘

Request A → cria ticket

Request B → recebe conflito
          → consulta novamente
          → retorna ticket existente
```

Dessa forma, requisições simultâneas não devem resultar em tickets duplicados para o mesmo identificador externo.

## Tratamento de erros

A comunicação com o HubSpot possui tratamento específico para falhas da API.

Os principais cenários tratados são:

### Timeout

As requisições para o HubSpot possuem um timeout de 15 segundos.

Caso o HubSpot não responda dentro desse período, a aplicação retorna:

```text
504 HUBSPOT_TIMEOUT
```

### Erros da API do HubSpot

Falhas retornadas pelo HubSpot são convertidas para um erro interno da aplicação sem expor detalhes da resposta externa ao cliente.

```text
502 HUBSPOT_API_ERROR
```

Os detalhes técnicos da resposta do HubSpot são registrados nos logs da aplicação para facilitar investigação.

### Erros inesperados

Erros não tratados especificamente retornam uma resposta genérica:

```json
{
	"error": "INTERNAL_SERVER_ERROR",
	"message": "An unexpected error occurred"
}
```

## Organização do projeto

```text
src/
├── clients/
│   └── hubspot.client.ts
│
├── config/
│   └── env.ts
│
├── errors/
│   ├── app.error.ts
│   ├── hubspot-api.error.ts
│   └── hubspot-timeout.error.ts
│
├── modules/
│   └── tickets/
│       ├── ticket.controller.ts
│       ├── ticket.schemas.ts
│       └── ticket.service.ts
│
├── app.ts
└── server.ts
```

A separação permite manter responsabilidades distintas:

* **Controller:** recebe requisições HTTP e valida entradas;
* **Schema:** define o contrato e as regras de validação;
* **Service:** concentra regras de negócio;
* **HubSpot Client:** responsável pela comunicação com a API externa;
* **Errors:** centraliza os erros específicos da aplicação e da integração.

## Configuração

Crie um arquivo `.env`:

```env
NODE_ENV=development
PORT=3000
HUBSPOT_ACCESS_TOKEN=your_private_app_token
```

O token do HubSpot deve ser mantido em variável de ambiente e não deve ser versionado.

## Instalação

Instale as dependências:

```bash
pnpm install
```

Execute em desenvolvimento:

```bash
pnpm dev
```

Verifique os tipos:

```bash
pnpm typecheck
```

Compile o projeto:

```bash
pnpm build
```

Execute a versão compilada:

```bash
pnpm start
```

## Endpoints

| Método | Endpoint           | Descrição                      |
| ------ | ------------------ | ------------------------------ |
| GET    | `/health`          | Verifica o estado da aplicação |
| POST   | `/api/tickets`     | Cria um ticket                 |
| GET    | `/api/tickets/:id` | Consulta um ticket             |
| PATCH  | `/api/tickets/:id` | Atualiza um ticket             |

## Exemplo de fluxo

Um fluxo típico da integração é:

```text
1. Sistema externo envia um novo ticket
             ↓
2. Fastify recebe a requisição
             ↓
3. Zod valida os dados
             ↓
4. Service verifica o externalTicketId
             ↓
5. HubSpot Client consulta o HubSpot
             ↓
6. Ticket é criado no pipeline
             ↓
7. HubSpot retorna o ID do ticket
             ↓
8. API retorna o resultado ao sistema externo
```

Para resolução:

```text
Sistema externo
      ↓
PATCH /api/tickets/:id
      ↓
status = RESOLVED?
      ↓
resolutionReason informado?
      ↓
   ┌──┴──┐
  Não    Sim
   ↓      ↓
  400    HubSpot
          ↓
       Resolvido
```

## Testes realizados

O laboratório foi validado através de requisições HTTP utilizando Insomnia.

Cenários testados:

* Criação de ticket;
* Consulta de ticket;
* Atualização de ticket;
* Resolução de ticket;
* Validação de dados inválidos;
* Tentativa de resolução sem motivo;
* Resolução com motivo;
* Retorno do ticket para a etapa `Novo`;
* Requisições duplicadas utilizando o mesmo `externalTicketId`;
* Timeout na comunicação com o HubSpot.

## Possíveis evoluções

Como laboratório, o projeto mantém o escopo focado na integração com o Service Hub.

Algumas possíveis evoluções seriam:

* Autenticação do sistema externo;
* Associação de tickets com contatos do HubSpot;
* Processamento assíncrono para integrações de maior volume;
* Observabilidade e métricas;
* Testes automatizados;
* Retry controlado para determinados erros transitórios;
* Processamento de eventos através de webhooks;
* Expansão do mapeamento de status e pipelines.

## Observação

Este projeto foi desenvolvido como um laboratório prático para estudo e demonstração de integração com o HubSpot Service Hub.

A implementação busca reproduzir um cenário próximo de uma integração real entre um sistema externo e uma plataforma de atendimento, com foco em validação, idempotência, tratamento de erros e regras de negócio.
