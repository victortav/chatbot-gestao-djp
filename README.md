# Chatbot Gestao DJP

Base de backend em `Node.js + NestJS + PostgreSQL + OpenAI` para interpretar mensagens livres de frequencia, pedir confirmacao e enviar para uma API externa.

## O que ja esta pronto

- Endpoint para extrair frequencia de uma mensagem livre
- Persistencia em PostgreSQL
- Mensagem de confirmacao no formato desejado
- Endpoint para confirmar e enviar para sua API de frequencia
- Listagem simples das submissões salvas

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=chatbot_gestao_djp
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
OPENAI_API_KEY=<SECRET>
OPENAI_MODEL=gpt-5-mini
USE_MOCK_OPENAI=false
FREQUENCY_API_URL=https://sua-api.com/frequencias
FREQUENCY_API_TOKEN=
```

## Rodando tudo com Docker

Esse e o caminho mais simples, porque nao depende do Node instalado na sua maquina.

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Se quiser testar sem OpenAI real no comeco, deixe no `.env`:

```env
USE_MOCK_OPENAI=true
```

3. Suba tudo:

```bash
docker compose up --build
```

Isso sobe:

- `app`: NestJS em `http://localhost:3000`
- `postgres`: PostgreSQL em `localhost:5432`

## Problemas comuns com OpenAI no Docker

Se `USE_MOCK_OPENAI=false` e a chamada para OpenAI falhar com algo como:

```text
Connection error
certificate verify failed
Connection reset by peer
```

isso normalmente indica problema de TLS/certificado no container, e nao erro no PostgreSQL.

Esse cenario e comum em redes corporativas com proxy, firewall ou inspecao SSL.

### O que verificar

1. Confirme se o `.env` contem uma chave valida:

```env
OPENAI_API_KEY=sk-...
USE_MOCK_OPENAI=false
```

2. Recrie os containers apos alterar o `.env`:

```bash
docker compose down
docker compose up --build
```

3. Teste a conectividade de dentro do container:

```bash
docker compose run --rm app sh -lc 'wget -qO- https://api.openai.com/v1/models'
```

Se aparecer erro de certificado, o container nao confia na cadeia TLS usada pela sua rede.

### Solucoes praticas

- Para seguir desenvolvendo agora:

```env
USE_MOCK_OPENAI=true
```

- Para usar OpenAI real em rede corporativa:
  - adicionar o certificado raiz corporativo no container
  - ou trocar a imagem base para uma variante Debian e configurar os certificados do ambiente

### Logs uteis

```bash
docker compose logs -f app
```

```bash
docker compose run --rm app sh
```

## Banco local com Docker

```bash
docker compose up -d
```

## Rodando o projeto sem Docker para o Node

```bash
npm install
npm run start:dev
```

## Teste da extracao

`POST /api/frequency/extract`

Exemplo de body:

```json
{
  "phoneNumber": "5511999999999",
  "message": "No culto de 01/02/2026 na Igreja Anglicana Casa tivemos 14 pessoas no total, 3 criancas no GPS, 0 vips, 1 carro no estacionamento e nenhuma observacao."
}
```

Se quiser testar sem OpenAI real no comeco, use:

```bash
USE_MOCK_OPENAI=true
```

Resposta esperada:

```json
{
  "extractionId": "uuid",
  "confirmationMessage": "📅 Data: 01/02/2026\n⛪ Igreja: Igreja Anglicana Casa\n...",
  "data": {
    "date": "2026-02-01",
    "churchName": "Igreja Anglicana Casa",
    "attendanceTotal": 14,
    "gpsChildren": 3,
    "vips": 0,
    "parkingVehicles": 1,
    "observations": "Nenhuma",
    "confidence": "high"
  }
}
```

## Confirmacao do envio

`POST /api/frequency/confirm`

```json
{
  "extractionId": "uuid-gerado-no-passo-anterior",
  "confirmed": true
}
```

Se `FREQUENCY_API_URL` nao estiver configurada, a confirmacao funciona em modo simulado e salva o registro como `mock_submitted`.

## Proximos passos recomendados

- Adicionar modulo do webhook do WhatsApp
- Criar controle por semana e por domingo
- Adicionar job de lembrete na segunda-feira
- Implementar autenticacao da sua API externa
- Adicionar testes automatizados
