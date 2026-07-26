# MovieMatch

<p align="center">
  <img src="frontend/src/assets/banner1.png" alt="Banner do MovieMatch" width="850" />
</p>

O **MovieMatch** é uma plataforma full stack para descobrir, organizar e avaliar filmes. Usuários podem criar uma conta, explorar o catálogo, pesquisar por título ou gênero, salvar favoritos, publicar avaliações e montar uma coleção pessoal importando dados reais de filmes. Administradores também contam com uma área para acompanhar métricas e gerenciar usuários.

## Funcionalidades

- Cadastro e login com autenticação JWT e renovação automática da sessão;
- Catálogo responsivo com busca, filtros por gênero e rankings por nota;
- Página de detalhes com sinopse, elenco, direção, avaliações e trailer;
- Favoritos individuais por usuário;
- Avaliação de filmes com nota e comentário;
- Coleção pessoal com importação de filmes pela API OMDb;
- Busca automática de trailers no YouTube por meio da API TMDb;
- Privacidade para filmes adicionados pelo usuário;
- Exclusão lógica de favoritos e avaliações;
- Painel administrativo com métricas e ativação/desativação de usuários;
- Documentação interativa da API com Swagger.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Front-end | React 19, React Router, Vite 8 e CSS |
| Back-end | Python, Django 6 e Django REST Framework |
| Autenticação | Simple JWT |
| Banco de dados | PostgreSQL |
| APIs externas | OMDb e TMDb |
| Documentação | OpenAPI e Swagger UI (drf-spectacular) |

## Estrutura do projeto

```text
Moviematch/
├── accounts/         # Cadastro, perfil e administração de usuários
├── config/           # Configurações e rotas principais do Django
├── core/             # Modelos-base e exclusão lógica
├── favorites/        # Favoritos dos usuários
├── frontend/         # Aplicação React/Vite
├── movies/           # Catálogo, importação OMDb e trailers TMDb
├── recomendations/   # Módulo reservado para recomendações
├── reviews/          # Notas e comentários
├── manage.py
└── requirements.txt
```

## Como executar localmente

### Pré-requisitos

- Python 3.12 ou superior;
- Node.js 20.19 ou superior;
- PostgreSQL em execução;
- Chaves de API da [OMDb](https://www.omdbapi.com/apikey.aspx) e da [TMDb](https://developer.themoviedb.org/docs/getting-started).

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd Moviematch
```

### 2. Configure o back-end

Crie e ative um ambiente virtual:

```bash
python -m venv venv
```

No Windows:

```powershell
venv\Scripts\Activate.ps1
```

No Linux ou macOS:

```bash
source venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Crie um arquivo `.env` na raiz do projeto:

```env
SECRET_KEY=troque-por-uma-chave-segura
DEBUG=True

DB_NAME=moviematch
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432

OMDB_API_KEY=sua_chave_omdb
OMDB_BASE_URL=https://www.omdbapi.com/
TMDB_API_KEY=sua_chave_tmdb
```

Crie o banco informado no `.env`, aplique as migrações e inicie a API:

```bash
python manage.py migrate
python manage.py runserver
```

A API ficará disponível em `http://127.0.0.1:8000/api/v1/`.

### 3. Configure o front-end

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse a aplicação pelo endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Usuário administrador

Para acessar o painel administrativo da aplicação e o Django Admin, crie um superusuário:

```bash
python manage.py createsuperuser
```

- Painel do MovieMatch: `http://localhost:5173/admin`
- Django Admin: `http://127.0.0.1:8000/admin/`

## Principais endpoints

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/api/v1/accounts/register/` | Cadastra um usuário |
| `POST` | `/api/v1/token/` | Gera tokens de acesso e renovação |
| `POST` | `/api/v1/token/refresh/` | Renova o token de acesso |
| `GET` | `/api/v1/accounts/me/` | Retorna o usuário autenticado |
| `GET` | `/api/v1/movies/` | Lista filmes disponíveis |
| `GET` | `/api/v1/movies/{id}/` | Exibe os detalhes de um filme |
| `POST` | `/api/v1/movies/import/` | Importa um filme da OMDb |
| `GET/POST` | `/api/v1/favorites/` | Lista ou adiciona favoritos |
| `GET/POST` | `/api/v1/reviews/` | Lista ou publica avaliações |
| `GET` | `/api/v1/accounts/admin/stats/` | Retorna métricas administrativas |

A documentação completa e interativa está disponível após iniciar o back-end:

- Swagger UI: `http://127.0.0.1:8000/api/v1/docs/`
- Schema OpenAPI: `http://127.0.0.1:8000/api/v1/schema/`

## Testes e qualidade

Execute os testes do back-end na raiz do projeto:

```bash
python manage.py test
```

No diretório `frontend`, verifique o código e gere a versão de produção:

```bash
npm run lint
npm run build
```

## Segurança

O arquivo `.env` contém credenciais e já está ignorado pelo Git. Nunca publique esse arquivo nem chaves reais de API. Em produção, desative o modo de depuração, configure os hosts permitidos e restrinja as origens CORS.

---

Projeto desenvolvido para praticar a construção de uma aplicação full stack com React e Django REST Framework.
