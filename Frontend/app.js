const API = '/todo_app/api';

// ── AUTH ──────────────────────────────────────────

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

// ── INIT DASHBOARD ────────────────────────────────

window.addEventListener('load', () => {
    if (document.getElementById('lista-tasks')) {
        const utente = JSON.parse(localStorage.getItem('utente'));
        if (!utente) { window.location.href = 'index.html'; return; }
        document.getElementById('nome-utente').textContent = utente.nome.toUpperCase();
        const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('data-oggi').textContent = oggi.toUpperCase();
        caricaTasks();
        caricaCategorie();
        caricaCondivise();
    }
});

// ── TASK ──────────────────────────────────────────

async function caricaTasks() {
    const res = await fetch(`${API}/tasks/get.php`);
    const tasks = await res.json();
    const lista = document.getElementById('lista-tasks');
    lista.innerHTML = '';

    if (tasks.length === 0) {
        lista.innerHTML = '<div class="empty-state">NESSUNA TASK — Aggiungine una sopra</div>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.completato == 1 ? 'completato' : ''}`;
        card.innerHTML = `
            <label class="custom-check-wrap task-check-wrap">
                <input type="checkbox" class="task-check" value="${task.id}">
                <span class="custom-check"></span>
            </label>
            <input type="checkbox" class="task-checkbox" ${task.completato == 1 ? 'checked' : ''} onchange="toggleCompleta(${task.id})" title="Segna come completata">
            <div class="task-body">
                <div class="task-title">${task.titolo}</div>
                <div class="task-meta">
                    <span class="badge badge-${task.priorita}">${task.priorita}</span>
                    ${task.scadenza ? `<span class="task-date">${formatData(task.scadenza)}</span>` : ''}
                    ${task.descrizione ? `<span class="task-date">${task.descrizione}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon" onclick='apriModale(${JSON.stringify(task)})' title="Modifica">✎</button>
                 <button class="btn-icon btn-icon-danger" onclick="eliminaTask(${task.id})" title="Elimina">✕</button>
            </div>
        `;
        lista.appendChild(card);
    });
}

function formatData(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
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
        document.getElementById('task-errore').textContent = '';
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
    if (!confirm('Eliminare questa task?')) return;
    await fetch(`${API}/tasks/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    caricaTasks();
}

// ── BULK ──────────────────────────────────────────

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

// ── CATEGORIE ─────────────────────────────────────

async function caricaCategorie() {
    const res = await fetch(`${API}/categories/get.php`);
    const categorie = await res.json();
    const lista = document.getElementById('lista-categorie');
    const select = document.getElementById('task-categoria');
    lista.innerHTML = '';
    select.innerHTML = '<option value="">Nessuna</option>';

    if (categorie.length === 0) {
        lista.innerHTML = '<div class="empty-state">NESSUNA CATEGORIA</div>';
    }

    categorie.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'categoria-item';
        div.innerHTML = `
            <span class="colore-dot" style="background:${cat.colore}"></span>
            <span class="categoria-nome">${cat.nome}</span>
            <button class="btn-icon btn-icon-danger" onclick="eliminaCategoria(${cat.id})">✕</button>
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

// ── CONDIVISE ─────────────────────────────────────

async function caricaCondivise() {
    const res = await fetch(`${API}/shared/get_shared.php`);
    const tasks = await res.json();
    const lista = document.getElementById('lista-condivise');
    lista.innerHTML = '';

    if (tasks.length === 0) {
        lista.innerHTML = '<div class="empty-state">NESSUNA TASK CONDIVISA</div>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.completato == 1 ? 'completato' : ''}`;
        card.innerHTML = `
            <div class="task-body">
                <div class="task-title">${task.titolo}</div>
                <div class="task-meta">
                    <span class="badge badge-${task.priorita}">${task.priorita}</span>
                    ${task.scadenza ? `<span class="task-date">${formatData(task.scadenza)}</span>` : ''}
                    <span class="task-shared-by">da ${task.condiviso_da}</span>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}
// ── MODIFICA ──────────────────────────────────────

function apriModale(task) {
    document.getElementById('mod-id').value = task.id;
    document.getElementById('mod-titolo').value = task.titolo;
    document.getElementById('mod-descrizione').value = task.descrizione || '';
    document.getElementById('mod-priorita').value = task.priorita;
    document.getElementById('mod-scadenza').value = task.scadenza || '';
    document.getElementById('mod-categoria').value = task.category_id || '';

    // Copia le opzioni categorie nel select del modale
    const src = document.getElementById('task-categoria');
    const dst = document.getElementById('mod-categoria');
    dst.innerHTML = src.innerHTML;
    dst.value = task.category_id || '';

    document.getElementById('modale-modifica').classList.remove('nascosto');
}

function chiudiModale() {
    document.getElementById('modale-modifica').classList.add('nascosto');
}

async function salvaModifica() {
    const id = document.getElementById('mod-id').value;
    const titolo = document.getElementById('mod-titolo').value;
    const descrizione = document.getElementById('mod-descrizione').value;
    const priorita = document.getElementById('mod-priorita').value;
    const scadenza = document.getElementById('mod-scadenza').value;
    const category_id = document.getElementById('mod-categoria').value || null;

    const res = await fetch(`${API}/tasks/update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, titolo, descrizione, priorita, scadenza, category_id })
    });

    if (res.ok) {
        chiudiModale();
        caricaTasks();
    }
}

// Chiudi modale cliccando fuori
document.addEventListener('click', e => {
    const modale = document.getElementById('modale-modifica');
    if (modale && e.target === modale) chiudiModale();
});
// ── IMPORT LISTA ──────────────────────────────────

async function importaLista() {
    const testo = document.getElementById('import-testo').value;
    const priorita = document.getElementById('import-priorita').value;
    const risultato = document.getElementById('import-risultato');

    const righe = testo
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);

    if (righe.length === 0) {
        risultato.textContent = 'Nessuna riga trovata.';
        return;
    }

    risultato.textContent = `Importando ${righe.length} task…`;

    let ok = 0;
    for (const titolo of righe) {
        const res = await fetch(`${API}/tasks/create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titolo, priorita, descrizione: '', scadenza: null, category_id: null })
        });
        if (res.ok) ok++;
    }

    document.getElementById('import-testo').value = '';
    risultato.textContent = `✓ ${ok} task importate su ${righe.length}.`;
    caricaTasks();
}