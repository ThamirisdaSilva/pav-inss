# Sistema Didático de Prova de Vida Digital

Projeto fictício para aulas de APIs, segurança, privacidade, resiliência, testes e homologação.

Nenhum dado real é utilizado. A biometria é totalmente simulada. O projeto não se integra ao INSS, Gov.br ou a qualquer sistema governamental.

## 1. Objetivo do projeto

O sistema permite demonstrar, de forma simples:

- HTTP e REST;
- endpoints, requests, responses e JSON;
- códigos HTTP;
- autenticação e autorização;
- perfis de acesso;
- privacidade e mascaramento de dados;
- logs e auditoria;
- tratamento padronizado de erros;
- indisponibilidade e timeout;
- Swagger/OpenAPI;
- testes de API e homologação.

## 2. Tecnologias

- Node.js 18 ou superior;
- Express;
- JavaScript;
- HTML, CSS e JavaScript puro;
- Swagger UI e OpenAPI;
- arquivos JSON locais.

Não utiliza React, Angular, banco de dados ou Docker.

## 3. Arquitetura didática

O backend segue um caminho simples:

```text
Rota
  ↓
Controller
  ↓
Service com a regra
  ↓
Arquivo JSON
  ↓
Response HTTP
```

Os middlewares executam funções comuns antes ou depois das rotas:

- `requestId.js`: cria um identificador para cada requisição;
- `authentication.js`: verifica o Bearer Token;
- `authorization.js`: verifica o perfil do usuário;
- `errorHandler.js`: padroniza os erros e esconde detalhes internos.

## 4. Estrutura de diretórios

```text
prova-vida-digital/
├── server.js
├── package.json
├── README.md
├── docs/
│   └── openapi.js
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── data/
│   ├── usuarios.json
│   ├── provasVida.json
│   ├── auditoria.json
│   └── seed/
├── scripts/
│   └── reset.js
└── tests/
    └── api.test.js
```

## 5. Instalação

Abra o terminal dentro da pasta do projeto:

```bash
cd prova-vida-digital
npm install
```

## 6. Execução

```bash
npm start
```

Endereços:

- Frontend: <http://localhost:3000>
- Swagger: <http://localhost:3000/api-docs>
- API: <http://localhost:3000/api>
- Saúde da API: <http://localhost:3000/api/saude>

Para encerrar, pressione `Ctrl+C` no terminal.

Se a porta 3000 já estiver ocupada, crie um arquivo `.env` e use outra porta:

```env
PORT=3100
```

Nesse caso, troque também o endereço do servidor no Swagger em `docs/openapi.js`.

## 7. Usuários de demonstração

| Perfil | Usuário | Senha | Token didático |
|---|---|---|---|
| Cidadão | `cidadao.demo` | `123456` | `TOKEN_CIDADAO` |
| Servidor | `servidor.demo` | `123456` | `TOKEN_SERVIDOR` |
| Auditor | `auditor.demo` | `123456` | `TOKEN_AUDITOR` |
| Visitante | `visitante.demo` | `123456` | `TOKEN_VISITANTE` |

As senhas e os tokens são deliberadamente simples porque o projeto é educacional. Não reutilize esse modelo num sistema real.

## 8. Dados iniciais

| ID | Proprietário | Status | Uso sugerido |
|---|---|---|---|
| 1001 | `cidadao.demo` | `VALIDADA` | Consulta e recibo |
| 1002 | `cidadao.demo` | `AGUARDANDO_VALIDACAO` | Simulação de biometria |
| 1003 | outro cidadão fictício | `REPROVADA` | Demonstração de acesso negado |
| 9999 | inexistente | - | Demonstração de 404 |

## 9. Swagger

Abra <http://localhost:3000/api-docs>.

Para usar um endpoint protegido:

1. Execute `POST /auth/login`.
2. Copie o token retornado.
3. Clique em **Authorize**.
4. Cole somente o token, por exemplo `TOKEN_CIDADAO`.
5. Clique em **Authorize** e feche a janela.
6. Execute os endpoints protegidos.

O Swagger está organizado nas tags Saúde, Autenticação, Prova de Vida, Auditoria e Demonstração.

## 10. Endpoints principais

| Método | Endpoint | Função | Perfis |
|---|---|---|---|
| GET | `/api/saude` | Verifica a disponibilidade | Público |
| POST | `/api/auth/login` | Realiza login | Público |
| POST | `/api/provas-vida` | Cria a própria prova | Cidadão |
| GET | `/api/provas-vida/:id` | Consulta uma prova | Cidadão proprietário, servidor ou auditor |
| POST | `/api/provas-vida/:id/validacao` | Simula a biometria | Cidadão proprietário |
| GET | `/api/provas-vida/:id/recibo` | Consulta o recibo | Cidadão proprietário, servidor ou auditor |
| GET | `/api/auditoria` | Consulta os registros | Auditor |
| GET | `/api/demo/status` | Consulta o estado didático | Usuário autenticado |
| POST | `/api/demo/servico-biometria` | Muda a simulação | Servidor ou auditor |

## 11. Autenticação

O projeto usa Bearer Tokens fictícios.

Exemplo de login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "usuario": "cidadao.demo",
  "senha": "123456"
}
```

Exemplo de endpoint protegido:

```http
Authorization: Bearer TOKEN_CIDADAO
```

Resultados didáticos:

- sem token: `401 Unauthorized`;
- token inválido: `401 Unauthorized`;
- token válido sem permissão: `403 Forbidden`;
- token válido com permissão: operação executada.

## 12. Perfis e autorização

### Cidadão

- cria a própria prova de vida;
- consulta a própria prova;
- executa a própria validação;
- consulta o próprio recibo.

### Servidor

- consulta provas de vida;
- acompanha os status;
- não altera a prova de vida.

### Auditor

- consulta provas e recibos;
- consulta a auditoria;
- não altera a prova de vida.

### Visitante

- consegue autenticar-se;
- não consulta nem altera provas de vida.

## 13. Validações e códigos HTTP

O projeto permite demonstrar:

- `200 OK`: consulta ou validação realizada;
- `201 Created`: prova de vida criada;
- `400 Bad Request`: campo obrigatório ausente ou JSON inválido;
- `401 Unauthorized`: token ausente ou inválido;
- `403 Forbidden`: perfil ou proprietário sem permissão;
- `404 Not Found`: prova ou rota inexistente;
- `409 Conflict`: prova duplicada, concluída ou recibo ainda indisponível;
- `422 Unprocessable Entity`: CPF ou benefício com formato inválido;
- `500 Internal Server Error`: erro interno ou BUG_3 didático;
- `503 Service Unavailable`: serviço biométrico simulado como indisponível.

Os erros seguem o formato:

```json
{
  "erro": "ACESSO_NEGADO",
  "mensagem": "Você não possui permissão para realizar esta operação.",
  "requestId": "REQ-A82D31"
}
```

O frontend não recebe stack trace.

## 14. Request ID e auditoria

Cada requisição recebe um identificador semelhante a `REQ-A8B72F`.

Ele aparece:

- no header `X-Request-Id`;
- no JSON de resposta;
- nos registros de auditoria.

Os registros ficam em `data/auditoria.json`.

O sistema registra login, acesso negado, criação, consulta, validação e consulta de recibo. Ele não registra senha, token completo ou dado biométrico.

## 15. Privacidade

As respostas públicas mascaram os dados:

- CPF: `***.***.***-00`;
- benefício: `******321`.

Os arquivos JSON contêm somente dados fictícios preparados para a aula.

## 16. Modo demonstração

O modo demonstração fica ativo por padrão.

Para configurar, copie `.env.example` para `.env` e defina:

```env
DEMO_MODE=true
```

No frontend, o Painel de demonstração mostra usuário, perfil e token mascarado.

Servidor e auditor podem escolher o estado do serviço biométrico:

- `normal`: resposta imediata;
- `lento`: espera cerca de cinco segundos;
- `indisponivel`: responde com HTTP 503.

O estado fica em memória. Reiniciar o servidor restaura o estado `normal`.

## 17. Simulação de indisponibilidade

1. Entre como `servidor.demo` ou `auditor.demo`.
2. No Painel de demonstração, selecione **Indisponível**.
3. Aplique a simulação.
4. Troque para o perfil `cidadao.demo`.
5. Tente validar a prova 1002.
6. A API responderá `503 Service Unavailable`.
7. O frontend mostrará uma mensagem amigável.

Também é possível alterar pelo Swagger:

```json
{
  "status": "indisponivel"
}
```

## 18. Simulação de timeout

1. Entre como servidor ou auditor.
2. Altere o serviço biométrico para `lento`.
3. Troque para o cidadão.
4. Valide uma prova que esteja aguardando validação.

O backend espera aproximadamente cinco segundos. O frontend utiliza `AbortController` e cancela a espera depois de aproximadamente três segundos.

Mensagem apresentada:

```text
A operação demorou mais que o esperado. Tente novamente.
```

Observação didática: cancelar a espera no navegador não garante que o servidor tenha interrompido o processamento. Consulte novamente o recurso antes de repetir a operação. Esse comportamento permite discutir idempotência e resultados incertos.

## 19. Modo com bugs didáticos

Os bugs ficam desativados por padrão.

Crie ou edite o arquivo `.env`:

```env
TEACHING_BUGS=true
BUG_1=false
BUG_2=false
BUG_3=false
```

Ative somente um bug por vez:

### BUG_1

```env
TEACHING_BUGS=true
BUG_1=true
```

Uma biometria inválida é aprovada incorretamente.

### BUG_2

```env
TEACHING_BUGS=true
BUG_2=true
```

O middleware de autorização deixa de bloquear um perfil sem permissão. As verificações de propriedade existentes no service continuam protegendo operações específicas.

### BUG_3

```env
TEACHING_BUGS=true
BUG_3=true
```

Uma consulta de recurso inexistente responde com 500 em vez de 404.

Reinicie o servidor depois de alterar `.env`.

Nunca utilize `TEACHING_BUGS=true` fora da aula.

## 20. Reset dos dados

Pare o servidor e execute:

```bash
npm run reset
```

O comando restaura:

- `data/usuarios.json`;
- `data/provasVida.json`;
- `data/auditoria.json`.

Depois, execute novamente `npm start`.

## 21. Testes automáticos básicos

Execute:

```bash
npm test
```

Os testes verificam saúde, login, requestId, 401, 403, 404, 409, 422, mascaramento e acesso à auditoria.

Antes de uma aula, recomenda-se executar:

```bash
npm run reset
npm test
npm start
```

## 22. Relação entre frontend e API

O arquivo `public/app.js` mantém funções com nomes diretos:

- `login()`;
- `iniciarProvaVida()`;
- `realizarValidacao()`;
- `consultarProvaVida()`;
- `consultarRecibo()`.

Cada função executa `fetch()` de forma explícita. Durante a aula, abra o console do navegador para acompanhar:

```text
[API]
POST /api/provas-vida
Request: {...}
Status: 201
Response: {...}
```

O console não imprime senha nem token completo.

## 23. Roteiro rápido para demonstração em aula

1. Execute `npm run reset`.
2. Execute `npm start`.
3. Abra o frontend.
4. Entre como cidadão.
5. Consulte a prova 1001.
6. Abra o recibo e use o botão de impressão.
7. Abra o Swagger.
8. Execute uma consulta sem token e mostre o 401.
9. Faça login como visitante, autorize o Swagger e mostre o 403.
10. Autorize como cidadão e consulte a prova 1001 para mostrar o 200.
11. Consulte a prova 1003 como cidadão para mostrar a proteção por proprietário.
12. Consulte a prova 9999 como servidor para mostrar o 404.
13. Valide a prova 1002 e repita a validação para mostrar o 409.
14. Entre como auditor e consulte `/api/auditoria`.
15. Entre como servidor e coloque o serviço biométrico como indisponível.
16. Volte ao cidadão e demonstre o 503.
17. Restaure os dados e coloque o serviço no modo lento.
18. Demonstre o timeout do frontend.

## 24. Sequência recomendada por aula

### M12 — Segurança, privacidade e resiliência

Login, Bearer Token, 401, 403, perfis, mascaramento, auditoria, requestId, indisponibilidade e timeout.

### M14 — Estratégia e plano de testes

Definição de casos positivos, negativos, permissões, estados, critérios de entrada e critérios de saída.

### M16 — Defeitos, métricas e homologação

Execução dos cenários, coleta do requestId, registro de evidência, severidade, prioridade e bugs didáticos.

### M18 — Construção, revisão, apresentação e feedback

Revisão do fluxo completo, contrato OpenAPI, demonstração integrada e apresentação das decisões.

## 25. Limitações intencionais

Este projeto usa arquivos JSON, senhas simples e tokens fixos para facilitar a explicação. Um sistema real precisaria de banco de dados, senhas com hash, tokens com expiração, gestão segura de segredos, controles adicionais de privacidade, observabilidade e infraestrutura adequada.
