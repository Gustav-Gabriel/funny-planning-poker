# Funny Planning Poker

Planning poker em tempo real — monolito Next.js + Socket.io, sem banco de dados, sem IA e sem Jira.

## Desenvolvimento local

```bash
npm install
cp .env.example .env
# Edite .env: KLIPY_API_KEY e/ou GIPHY_API_KEY (GIFs no avatar)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `KLIPY_API_KEY` | Busca de GIFs (Klipy); opcional se Giphy estiver configurado |
| `GIPHY_API_KEY` | Busca de GIFs (Giphy beta gratuita); opcional se Klipy estiver configurado |
| `PORT` | Porta HTTP (Render/Railway costumam injetar) |

Configure pelo menos uma das chaves de GIF. Com as duas, a busca chama ambas em paralelo.

## O que tem

- Criar / entrar em sala com código
- Baralho Fibonacci ou tamanhos (T-shirt)
- Avatares emoji ou GIF (Klipy e/ou Giphy)
- História da rodada em texto livre (anfitrião)
- Votos secretos, revelar e nova rodada
- Camada social: reações na mesa, comentários, burst no reveal
- Layout **modo mesa** (desktop e mobile)

## Deploy

Precisa de **um processo Node.js contínuo** com WebSockets (Render, Railway, etc.).

1. Build: `npm install && npm run build`
2. Start: `npm start`
3. Env: `KLIPY_API_KEY` e/ou `GIPHY_API_KEY` (e `PORT` se a plataforma não injetar)

> `tsx`, `typescript` e `@types/*` ficam em `dependencies` de propósito para builds com `NODE_ENV=production` no install.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npm test` | Testes (Vitest) |
