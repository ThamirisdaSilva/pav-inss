const errorSchema = {
  type: "object",
  properties: {
    erro: { type: "string", example: "ACESSO_NEGADO" },
    mensagem: { type: "string", example: "Você não possui permissão para realizar esta operação." },
    requestId: { type: "string", example: "REQ-A8B72F" }
  }
};

const commonErrors = {
  400: { description: "Requisição inválida", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  401: { description: "Autenticação ausente ou inválida", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  403: { description: "Perfil sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  404: { description: "Recurso inexistente", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  409: { description: "Conflito com o estado atual", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  422: { description: "Dados semanticamente inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  500: { description: "Erro interno", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
  503: { description: "Serviço temporariamente indisponível", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } }
};

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Sistema Didático de Prova de Vida Digital",
    version: "1.0.0",
    description: "API fictícia para aulas de HTTP, REST, segurança, testes e homologação. Nenhum dado real é utilizado."
  },
  servers: [{ url: "http://localhost:3000/api", description: "Ambiente local" }],
  tags: [
    { name: "Saúde" },
    { name: "Autenticação" },
    { name: "Prova de Vida" },
    { name: "Auditoria" },
    { name: "Demonstração" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Token didático" }
    },
    schemas: {
      Erro: errorSchema,
      Login: {
        type: "object",
        required: ["usuario", "senha"],
        properties: {
          usuario: { type: "string", example: "cidadao.demo" },
          senha: { type: "string", example: "123456" }
        }
      },
      NovaProvaVida: {
        type: "object",
        required: ["cpf", "numeroBeneficio"],
        properties: {
          cpf: { type: "string", example: "12345678900" },
          numeroBeneficio: { type: "string", example: "987654321" }
        }
      },
      Validacao: {
        type: "object",
        required: ["biometriaValida"],
        properties: { biometriaValida: { type: "boolean", example: true } }
      },
      ProvaVida: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1002 },
          protocolo: { type: "string", example: "PV-2026-001002" },
          cpf: { type: "string", example: "***.***.***-00" },
          numeroBeneficio: { type: "string", example: "******321" },
          status: { type: "string", enum: ["AGUARDANDO_VALIDACAO", "VALIDADA", "REPROVADA"] },
          dataCriacao: { type: "string", format: "date-time" },
          dataConclusao: { type: "string", format: "date-time", nullable: true },
          requestId: { type: "string", example: "REQ-A8B72F" }
        }
      }
    }
  },
  paths: {
    "/saude": {
      get: {
        tags: ["Saúde"], summary: "Verifica se a API está disponível",
        responses: { 200: { description: "API disponível", content: { "application/json": { example: { status: "UP", requestId: "REQ-A8B72F" } } } } }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"], summary: "Autentica um usuário fictício",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } } },
        responses: {
          200: { description: "Login realizado", content: { "application/json": { example: { token: "TOKEN_CIDADAO", usuario: { nome: "Maria da Silva", perfil: "cidadao" }, requestId: "REQ-A8B72F" } } } },
          400: commonErrors[400], 401: commonErrors[401]
        }
      }
    },
    "/provas-vida": {
      post: {
        tags: ["Prova de Vida"], summary: "Cria uma solicitação de prova de vida",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NovaProvaVida" } } } },
        responses: {
          201: { description: "Prova de vida criada", content: { "application/json": { schema: { $ref: "#/components/schemas/ProvaVida" } } } },
          400: commonErrors[400], 401: commonErrors[401], 403: commonErrors[403], 409: commonErrors[409], 422: commonErrors[422]
        }
      }
    },
    "/provas-vida/{id}": {
      get: {
        tags: ["Prova de Vida"], summary: "Consulta uma prova de vida",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, example: 1001 }],
        responses: {
          200: { description: "Consulta realizada", content: { "application/json": { schema: { $ref: "#/components/schemas/ProvaVida" } } } },
          401: commonErrors[401], 403: commonErrors[403], 404: commonErrors[404], 500: commonErrors[500]
        }
      }
    },
    "/provas-vida/{id}/validacao": {
      post: {
        tags: ["Prova de Vida"], summary: "Executa uma biometria simulada",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, example: 1002 }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Validacao" } } } },
        responses: {
          200: { description: "Validação concluída", content: { "application/json": { schema: { $ref: "#/components/schemas/ProvaVida" } } } },
          400: commonErrors[400], 401: commonErrors[401], 403: commonErrors[403], 404: commonErrors[404], 409: commonErrors[409], 503: commonErrors[503]
        }
      }
    },
    "/provas-vida/{id}/recibo": {
      get: {
        tags: ["Prova de Vida"], summary: "Consulta o recibo da prova de vida",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, example: 1001 }],
        responses: {
          200: { description: "Recibo disponível", content: { "application/json": { example: { protocolo: "PV-2026-001001", cpf: "***.***.***-00", numeroBeneficio: "******321", data: "2026-09-15T10:15:00.000Z", status: "VALIDADA", requestId: "REQ-A8B72F" } } } },
          401: commonErrors[401], 403: commonErrors[403], 404: commonErrors[404], 409: commonErrors[409]
        }
      }
    },
    "/auditoria": {
      get: {
        tags: ["Auditoria"], summary: "Lista os registros de auditoria",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Registros encontrados" }, 401: commonErrors[401], 403: commonErrors[403] }
      }
    },
    "/demo/status": {
      get: {
        tags: ["Demonstração"], summary: "Consulta o estado do modo didático",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Estado atual" }, 401: commonErrors[401] }
      }
    },
    "/demo/servico-biometria": {
      post: {
        tags: ["Demonstração"], summary: "Altera o estado simulado do serviço biométrico",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["normal", "lento", "indisponivel"], example: "indisponivel" } } } } } },
        responses: { 200: { description: "Estado alterado" }, 400: commonErrors[400], 401: commonErrors[401], 403: commonErrors[403], 404: commonErrors[404] }
      }
    }
  }
};
