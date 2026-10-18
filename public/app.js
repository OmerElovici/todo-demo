const list = document.querySelector('#list');
const form = document.querySelector('#form');
const input = document.querySelector('#title');
const errorBox = document.querySelector('#error');

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}
function showError(message = '') { errorBox.textContent = message; }
function render(todos) {
  list.replaceChildren();
  if (!todos.length) {
    const empty = document.createElement('li'); empty.className = 'message'; empty.textContent = 'Nothing here yet. Add your first todo above.'; list.append(empty); return;
  }
  for (const todo of todos) {
    const row = document.createElement('li'); row.className = `item${todo.completed ? ' done' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = Boolean(todo.completed); checkbox.setAttribute('aria-label', `Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => changeTodo(todo.id, checkbox.checked));
    const title = document.createElement('span'); title.className = 'title'; title.textContent = todo.title;
    const remove = document.createElement('button'); remove.className = 'delete'; remove.textContent = 'Delete'; remove.setAttribute('aria-label', `Delete ${todo.title}`); remove.addEventListener('click', () => deleteTodo(todo.id));
    row.append(checkbox, title, remove); list.append(row);
  }
}
async function loadTodos() { try { render(await request('/api/todos')); } catch (error) { showError(error.message); } }
async function changeTodo(id, completed) { showError(); try { await request(`/api/todos/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({completed}) }); await loadTodos(); } catch (error) { showError(error.message); } }
async function deleteTodo(id) { showError(); try { await request(`/api/todos/${id}`, { method: 'DELETE' }); await loadTodos(); } catch (error) { showError(error.message); } }
form.addEventListener('submit', async event => {
  event.preventDefault(); const title = input.value.trim(); if (!title) return;
  showError(); try { await request('/api/todos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({title}) }); input.value = ''; input.focus(); await loadTodos(); } catch (error) { showError(error.message); }
});
loadTodos();
