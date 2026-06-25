const API = '/todo_app/api';

// ========================
// AUTENTICAZIONE
// ========================

function mostraLogin() {
    document.getElementById('form-login').classList.remove('nascosto');
    document.getElementById('form-registrazione').classList.add('nascosto');
}

function mostraRegistrazione() {
    document.getElementById('form-registrazione').classList.remove('nascosto');
    document.getElementById('form-login').classList.add('nascosto');
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('utente', JSON.stringify(data.utente));
        window.location.href = 'dashboard.html';
    } else {
        document.getElementById('login-errore').textContent = data.errore;
    }
}

async function registrati() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const res = await fetch(`${API}/auth/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password })
    });

    const data = await res.json();
    if (res.ok) {
        alert('Registrazione completata! Ora accedi.');
        mostraLogin();
    } else {
        document.getElementById('reg-errore').textContent = data.errore;
    }
}

async function logout() {
    await fetch(`${API}/auth/logout.php`, { method: 'POST' });
    localStorage.removeItem('utente');
    window.location.href = 'index.html';
}

// ========================
// INIZIALIZZAZIONE DASHBOARD
// ========================

window.addEventListener('load', () => {
    if (document.getElementById('lista-tasks')) {
        const utente = JSON.parse(localStorage.getItem('utente'));
        if (!utente) {
            window.location.href = 'index.html';
            return;
        }
        document.getElementById('nome-utente').textContent = utente.nome;
        caricaTasks();
        caricaCategorie();
        caricaCondivise();
    }
});

// ========================
// TASK
// ========================

async function caricaTasks() {
    const res = await fetch(`${API}/tasks/get.php`);
    const tasks = await res.json();
    const lista = document.getElementById('lista-tasks');
    lista.innerHTML = '';

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completato == 1 ? 'completato' : ''}`;
        div.innerHTML = `
            <input type="checkbox" class="task-check" value="${task.id}">
            <div class="task-titolo">${task.titolo}</div>
            <span class="task-info priorita-${task.priorita}">${task.priorita}</span>
            ${task.scadenza ? `<span class="task-info">${task.scadenza}</span>` : ''}
            <button onclick="toggleCompleta(${task.id})" class="btn-secondary">✓</button>
            <button onclick="eliminaTask(${task.id})" class="btn-danger">✕</button>
        `;
        lista.appendChild(div);
    });
}

async function creaTask() {
    const titolo = document.getElementById('task-titolo').value;
    const descrizione = document.getElementById('task-descrizione').value;
    const priorita = document.getElementById('task-priorita').value;
    const scadenza = document.getElementById('task-scadenza').value;
    const category_id = document.getElementById('task-categoria').value || null;

    const res = await fetch(`${API}/tasks/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo, descrizione, priorita, scadenza, category_id })
    });

    const data = await res.json();
    if (res.ok) {
        document.getElementById('task-titolo').value = '';
        document.getElementById('task-descrizione').value = '';
        caricaTasks();
    } else {
        document.getElementById('task-errore').textContent = data.errore;
    }
}

async function toggleCompleta(id) {
    await fetch(`${API}/tasks/complete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    caricaTasks();
}

async function eliminaTask(id) {
    if (!confirm('Sicuro di voler eliminare questa task?')) return;
    await fetch(`${API}/tasks/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    caricaTasks();
}

// ========================
// OPERAZIONI IN BLOCCO
// ========================

function selezionaTutto() {
    const checked = document.getElementById('seleziona-tutto').checked;
    document.querySelectorAll('.task-check').forEach(cb => cb.checked = checked);
}

function getIdSelezionati() {
    return [...document.querySelectorAll('.task-check:checked')].map(cb => parseInt(cb.value));
}

async function eliminaSelezionate() {
    const ids = getIdSelezionati();
    if (ids.length === 0) { alert('Seleziona almeno una task'); return; }
    if (!confirm(`Eliminare ${ids.length} task?`)) return;

    await fetch(`${API}/tasks/delete_multiple.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    caricaTasks();
}

async function completaSelezionate() {
    const ids = getIdSelezionati();
    if (ids.length === 0) { alert('Seleziona almeno una task'); return; }

    await fetch(`${API}/tasks/complete_multiple.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    caricaTasks();
}

// ========================
// CATEGORIE
// ========================

async function caricaCategorie() {
    const res = await fetch(`${API}/categories/get.php`);
    const categorie = await res.json();

    const lista = document.getElementById('lista-categorie');
    const select = document.getElementById('task-categoria');
    lista.innerHTML = '';
    select.innerHTML = '<option value="">Nessuna categoria</option>';

    categorie.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'categoria-item';
        div.innerHTML = `
            <span class="colore-dot" style="background:${cat.colore}"></span>
            <span>${cat.nome}</span>
            <button onclick="eliminaCategoria(${cat.id})" class="btn-danger">✕</button>
        `;
        lista.appendChild(div);

        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        select.appendChild(option);
    });
}

async function creaCategoria() {
    const nome = document.getElementById('cat-nome').value;
    const colore = document.getElementById('cat-colore').value;

    const res = await fetch(`${API}/categories/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, colore })
    });

    if (res.ok) {
        document.getElementById('cat-nome').value = '';
        caricaCategorie();
    }
}

async function eliminaCategoria(id) {
    if (!confirm('Eliminare questa categoria?')) return;
    await fetch(`${API}/categories/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    caricaCategorie();
}

// ========================
// TASK CONDIVISE
// ========================

async function caricaCondivise() {
    const res = await fetch(`${API}/shared/get_shared.php`);
    const tasks = await res.json();
    const lista = document.getElementById('lista-condivise');
    lista.innerHTML = '';

    if (tasks.length === 0) {
        lista.innerHTML = '<p class="task-info">Nessuna task condivisa con te.</p>';
        return;
    }

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completato == 1 ? 'completato' : ''}`;
        div.innerHTML = `
            <div class="task-titolo">${task.titolo}</div>
            <span class="task-info priorita-${task.priorita}">${task.priorita}</span>
            <span class="task-info">da ${task.condiviso_da}</span>
        `;
        lista.appendChild(div);
    });
}