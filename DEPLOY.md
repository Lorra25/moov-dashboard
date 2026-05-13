# Como publicar na Vercel

## 1. Subir para o GitHub
1. Acesse github.com e crie um repositório novo chamado `moov-dashboard`
2. Na pasta `moov-dashboard`, execute:
   ```
   git init
   git add .
   git commit -m "primeiro deploy"
   git remote add origin https://github.com/SEU_USUARIO/moov-dashboard.git
   git push -u origin main
   ```

## 2. Conectar na Vercel
1. Acesse vercel.com e faça login com sua conta GitHub
2. Clique em "Add New Project"
3. Escolha o repositório `moov-dashboard`
4. Clique em "Deploy" (Next.js já é detectado automaticamente)

## 3. Configurar as variáveis de ambiente
No painel do projeto na Vercel, vá em **Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `GOOGLE_CREDENTIALS_JSON` | Cole o JSON completo da sua service account do Google |
| `SPREADSHEET_ID` | O ID da sua planilha (parte da URL do Google Sheets) |
| `FLASK_URL` | URL do seu backend no Railway (ex: https://moov-agente.railway.app) |

Após adicionar as variáveis, vá em **Deployments** e clique em **Redeploy**.

## 4. Pronto!
O dashboard estará disponível em `https://moov-dashboard.vercel.app`
e se atualiza automaticamente a cada 30 segundos.
