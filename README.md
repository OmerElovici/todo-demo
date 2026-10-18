# Simple Todo App

A tiny full-stack todo app with two Docker containers: an Nginx UI and a Node/Express API. The API stores todos in SQLite, persisted in a Docker volume.

## Run with Docker

Requires Docker with Compose.

```bash
docker compose up --build -d
```

Open <http://localhost:8081>. The API is also available directly at <http://localhost:3000/api/todos>. SQLite data is stored in the `todo-data` volume and survives container restarts.

View informative API logs with:

```bash
docker compose logs -f backend
```

Stop the app with `docker compose down`. To also erase the saved todos, run `docker compose down -v`.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open <http://localhost:3000>. The database file is created automatically in `data/todos.db`.

## Features and API

- Add, complete, and delete todos
- Input validation and useful error messages
- Logs for startup, HTTP requests, and todo changes
- `GET /api/todos` - list todos
- `POST /api/todos` - add `{ "title": "..." }`
- `PATCH /api/todos/:id` - set `{ "completed": true }`
- `DELETE /api/todos/:id` - remove a todo
- `GET /api/health` - container health check
