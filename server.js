const express = require('express');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'todos.db');
fs.mkdirSync(dataDir, { recursive: true });
app.use(express.json());
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => console.info(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`));
  next();
});

function saveDatabase(db) {
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}
function todos(db) {
  return db.exec('SELECT id, title, completed, created_at AS createdAt FROM todos ORDER BY id DESC')[0]?.values.map(([id, title, completed, createdAt]) => ({ id, title, completed: Boolean(completed), createdAt })) || [];
}

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.existsSync(dbPath) ? new Uint8Array(fs.readFileSync(dbPath)) : undefined);
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  saveDatabase(db);
  console.info(`[startup] SQLite ready at ${dbPath}`);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.get('/api/todos', (req, res) => {
    const rows = todos(db);
    console.info(`[todos] listed ${rows.length} item(s)`);
    res.json(rows);
  });

  app.post('/api/todos', (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Todo title is required.' });
    if (title.length > 200) return res.status(400).json({ error: 'Todo title must be 200 characters or fewer.' });
    db.run('INSERT INTO todos (title) VALUES (?)', [title]);
    const todo = todos(db)[0];
    saveDatabase(db);
    console.info(`[todos] created id=${todo.id} title=${JSON.stringify(todo.title)}`);
    res.status(201).json(todo);
  });

  app.patch('/api/todos/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1 || typeof req.body.completed !== 'boolean') {
      return res.status(400).json({ error: 'Provide a valid todo id and a boolean completed value.' });
    }
    db.run('UPDATE todos SET completed = ? WHERE id = ?', [req.body.completed ? 1 : 0, id]);
    if (!db.getRowsModified()) return res.status(404).json({ error: 'Todo not found.' });
    saveDatabase(db);
    const todo = todos(db).find(row => row.id === id);
    console.info(`[todos] updated id=${id} completed=${req.body.completed}`);
    res.json(todo);
  });

  app.delete('/api/todos/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Provide a valid todo id.' });
    db.run('DELETE FROM todos WHERE id = ?', [id]);
    if (!db.getRowsModified()) return res.status(404).json({ error: 'Todo not found.' });
    saveDatabase(db);
    console.info(`[todos] deleted id=${id}`);
    res.status(204).end();
  });

  app.listen(port, () => console.info(`[startup] Todo app listening at http://localhost:${port}`));
}).catch(error => {
  console.error('[startup] Failed to initialize SQLite:', error);
  process.exit(1);
});
