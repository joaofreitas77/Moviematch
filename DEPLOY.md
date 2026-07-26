# Publicação gratuita do CineLog

Este roteiro publica o frontend na Vercel, o backend no Render, o PostgreSQL no Neon e os e-mails de suporte pelo Resend. Não envie arquivos `.env`, backups do banco ou chaves de API ao GitHub.

## 1. Enviar o projeto ao GitHub

Na raiz do projeto, confira os arquivos alterados, crie um commit e envie a branch para o GitHub. Antes do envio, confirme que `.env` e qualquer arquivo `.dump`, `.backup` ou `.sql` não aparecem entre os arquivos preparados.

## 2. Criar um backup do PostgreSQL atual

Com o PostgreSQL instalado e a partir da raiz do projeto, execute:

```powershell
pg_dump -Fc -h localhost -U postgres -d moviematch -f moviematch-backup.dump
```

Adapte host, usuário e nome do banco se forem diferentes no seu `.env`. Guarde `moviematch-backup.dump` fora do repositório e confirme que o arquivo não está vazio.

## 3. Criar e restaurar o banco no Neon

1. Crie uma conta em <https://neon.com/> e um projeto PostgreSQL gratuito.
2. Escolha a região mais próxima disponível.
3. Em **Connect**, copie a connection string direta (não pooled) com SSL.
4. Restaure o backup no banco novo:

```powershell
pg_restore --no-owner --no-privileges -d "COLE_A_URL_DIRETA_DO_NEON" moviematch-backup.dump
```

5. No SQL Editor do Neon, confirme os dados:

```sql
SELECT COUNT(*) AS usuarios FROM auth_user;
SELECT COUNT(*) AS filmes FROM movies_movie;
SELECT COUNT(*) AS avaliacoes FROM reviews_review;
SELECT COUNT(*) AS favoritos FROM favorites_favorite;
```

No momento da preparação, o banco local tinha 4 usuários, 22 filmes, 7 avaliações e 8 favoritos. Se novos dados forem criados antes da publicação, use as contagens mais recentes como referência.

## 4. Configurar os e-mails no Resend

1. Crie a conta em <https://resend.com/> usando `jpgf.profissional@gmail.com`.
2. Abra **API Keys**, crie uma chave somente para envio e copie-a.
3. Como o destinatário é o mesmo e-mail da conta Resend, pode-se iniciar com `CineLog <onboarding@resend.dev>` sem domínio próprio.
4. Guarde a chave para informar no Render como `RESEND_API_KEY`.

## 5. Publicar o backend no Render

1. Acesse <https://render.com/>, conecte o GitHub e escolha **New > Blueprint**.
2. Selecione o repositório do CineLog. O Render reconhecerá o arquivo `render.yaml`.
3. Preencha as variáveis solicitadas:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | URL direta do banco Neon |
| `FRONTEND_URL` | URL que será usada na Vercel, por exemplo `https://seu-cinelog.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | A mesma URL da Vercel, sem barra no final |
| `CSRF_TRUSTED_ORIGINS` | A mesma URL da Vercel, sem barra no final |
| `OMDB_API_KEY` | Chave da OMDb |
| `TMDB_API_KEY` | Chave da TMDB |
| `RESEND_API_KEY` | Chave criada no Resend |

4. Confirme a criação do serviço gratuito. O Render instalará as dependências, coletará arquivos estáticos, aplicará as migrações e iniciará o Gunicorn.
5. Copie a URL final, semelhante a `https://cinelog-api.onrender.com`.
6. Confirme a saúde do backend abrindo `https://SUA-API.onrender.com/api/v1/health/`. A resposta esperada é `{"status":"ok"}`.

## 6. Publicar o frontend na Vercel

1. Acesse <https://vercel.com/>, conecte o GitHub e importe o mesmo repositório.
2. Em **Root Directory**, selecione `frontend`.
3. Confirme o framework **Vite**, comando de build `npm run build` e pasta de saída `dist`.
4. Adicione a variável:

| Variável | Valor |
| --- | --- |
| `VITE_API_URL` | `https://SUA-API.onrender.com/api/v1` |

5. Clique em **Deploy** e copie a URL publicada.
6. Caso a URL seja diferente da prevista no Render, atualize `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` no Render e reinicie o serviço.

## 7. Checklist depois da publicação

- Abrir a home e atualizar uma rota interna para confirmar o roteamento da Vercel.
- Entrar com um usuário comum pelo login normal.
- Entrar com o administrador pelo login administrativo.
- Conferir filmes, favoritos e avaliações existentes.
- Importar um filme que não esteja no catálogo padrão.
- Abrir um trailer.
- Enviar uma solicitação de suporte e conferir o e-mail administrativo.
- Conferir o painel administrativo e o campo de último acesso.

## Limitação esperada do plano gratuito

O backend gratuito do Render entra em repouso após um período sem acessos. O primeiro carregamento depois disso pode levar aproximadamente um minuto. Os dados não são perdidos porque permanecem no Neon, e não no disco temporário do Render.
