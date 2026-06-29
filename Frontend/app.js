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

// ── INIT ──────────────────────────────────────────

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

    // Mappa categorie per nome e colore
    const selectCat = document.getElementById('task-categoria');
    const catMap = {};
    const catColoreMap = {};
    [...selectCat.options].forEach(o => {
        if (o.value) {
            catMap[o.value] = o.textContent;
            catColoreMap[o.value] = o.dataset.colore;
        }
    });

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.completato == 1 ? 'completato' : ''}`;
            if (task.category_id && catColoreMap[task.category_id]) {
                const colore = catColoreMap[task.category_id];
                card.style.borderLeft = `4px solid ${colore}`;
                card.style.backgroundColor = `${colore}18`;
                }
        const catNome = task.category_id && catMap[task.category_id] ? catMap[task.category_id] : '';
        card.innerHTML = `
            <label class="custom-check-wrap">
                <input type="checkbox" class="task-check" value="${task.id}">
                <span class="custom-check"></span>
            </label>
            <input type="checkbox" class="task-checkbox" ${task.completato == 1 ? 'checked' : ''} onchange="toggleCompleta(${task.id})" title="Segna come completata">
            <div class="task-body">
                <div class="task-title">${task.titolo}</div>
                <div class="task-meta">
                    <span class="badge badge-${task.priorita}">${task.priorita}</span>
                    ${task.scadenza ? `<span class="task-date">${formatData(task.scadenza)}</span>` : ''}
                    ${catNome ? `<span class="task-cat" style="color: ${catColoreMap[task.category_id]}; font-weight: 400;">▸ ${catNome}</span>` : ''}
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
    const titolo = document.getElementById('task-titolo').value.trim();
    const descrizione = document.getElementById('task-descrizione').value;
    const priorita = document.getElementById('task-priorita').value;
    const scadenza = document.getElementById('task-scadenza').value;
    const category_id = document.getElementById('task-categoria').value || null;

    if (!titolo) {
        document.getElementById('task-errore').textContent = 'Il titolo è obbligatorio';
        return;
    }

    const res = await fetch(`${API}/tasks/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo, descrizione, priorita, scadenza, category_id })
    });
    const data = await res.json();
    if (res.ok) {
        document.getElementById('task-titolo').value = '';
        document.getElementById('task-descrizione').value = '';
        document.getElementById('task-scadenza').value = '';
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

// ── MODIFICA ──────────────────────────────────────

function apriModale(task) {
    document.getElementById('mod-id').value = task.id;
    document.getElementById('mod-titolo').value = task.titolo;
    document.getElementById('mod-descrizione').value = task.descrizione || '';
    document.getElementById('mod-priorita').value = task.priorita;
    document.getElementById('mod-scadenza').value = task.scadenza || '';
    document.getElementById('mod-share-email').value = '';
    document.getElementById('share-msg').textContent = '';

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

async function condividiTask() {
    const task_id = parseInt(document.getElementById('mod-id').value);
    const email = document.getElementById('mod-share-email').value.trim();
    const msg = document.getElementById('share-msg');

    if (!email) { msg.textContent = 'Inserisci un\'email'; msg.className = 'msg-error'; return; }

    const res = await fetch(`${API}/shared/share.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id, email })
    });
    const data = await res.json();
    if (res.ok) {
        msg.textContent = '✓ Task condivisa con successo';
        msg.className = 'msg-success';
        document.getElementById('mod-share-email').value = '';
    } else {
        msg.textContent = data.errore;
        msg.className = 'msg-error';
    }
}

document.addEventListener('click', e => {
    const modale = document.getElementById('modale-modifica');
    if (modale && e.target === modale) chiudiModale();
});

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

async function condividiSelezionate() {
    const ids = getIdSelezionati();
    if (ids.length === 0) { alert('Seleziona almeno una task'); return; }
    const email = prompt('Inserisci l\'email dell\'utente con cui condividere:');
    if (!email) return;

    const res = await fetch(`${API}/shared/share_multiple.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, email })
    });
    const data = await res.json();
    if (res.ok) {
        alert('✓ ' + data.messaggio);
    } else {
        alert('✕ ' + data.errore);
    }
    caricaTasks();
}

// ── IMPORT LISTA ──────────────────────────────────

async function importaLista() {
    const testo = document.getElementById('import-testo').value;
    const priorita = document.getElementById('import-priorita').value;
    const risultato = document.getElementById('import-risultato');

    const righe = testo.split('\n').map(r => r.trim()).filter(r => r.length > 0);

    if (righe.length === 0) { risultato.textContent = 'Nessuna riga trovata.'; return; }

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
        option.dataset.colore = cat.colore;
        select.appendChild(option);
    });

    caricaTasks();
}

async function creaCategoria() {
    const nome = document.getElementById('cat-nome').value.trim();
    const colore = document.getElementById('cat-colore').value;
    if (!nome) return;
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

    if (!Array.isArray(tasks)) {
        lista.innerHTML = `<div class="empty-state">Errore: ${tasks.errore || 'risposta inattesa'}</div>`;
        return;
    }

    if (tasks.length === 0) {
        lista.innerHTML = '<div class="empty-state">NESSUNA TASK CONDIVISA</div>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.completato == 1 ? 'completato' : ''}`;
        card.innerHTML = `
            <label class="custom-check-wrap">
                <input type="checkbox" class="condivisa-check" value="${task.id}">
                <span class="custom-check"></span>
            </label>
            <div class="task-body">
                <div class="task-title">${task.titolo}</div>
                <div class="task-meta">
                    <span class="badge badge-${task.priorita}">${task.priorita}</span>
                    ${task.scadenza ? `<span class="task-date">${formatData(task.scadenza)}</span>` : ''}
                    <span class="task-shared-by">da ${task.condiviso_da}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon" onclick="importaCondivisa(${task.id})" title="Importa nelle mie task">⬇</button>
                <button class="btn-icon btn-icon-danger" onclick="eliminaCondivisa(${task.id})" title="Elimina">✕</button>
            </div>
        `;
        lista.appendChild(card);
    });
}

function selezionaTuttoCondivise() {
    const checked = document.getElementById('seleziona-tutto-condivise').checked;
    document.querySelectorAll('.condivisa-check').forEach(cb => cb.checked = checked);
}

function getIdCondiviseSelezionate() {
    return [...document.querySelectorAll('.condivisa-check:checked')].map(cb => parseInt(cb.value));
}

async function eliminaCondivisa(taskId) {
    if (!confirm('Eliminare questa task condivisa?')) return;
    await eliminaCondiviseIds([taskId]);
}

async function eliminaCondiviseSelezionate() {
    const ids = getIdCondiviseSelezionate();
    if (ids.length === 0) { alert('Seleziona almeno una task'); return; }
    if (!confirm(`Eliminare ${ids.length} task condivise?`)) return;
    await eliminaCondiviseIds(ids);
}

async function eliminaCondiviseIds(ids) {
    // Elimina una per una (riusa l'endpoint delete esistente o chiama in loop)
    for (const id of ids) {
        await fetch(`${API}/tasks/delete.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    }
    caricaCondivise();
}

async function importaCondivisa(taskId) {
    const res = await fetch(`${API}/shared/import.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
    });
    const data = await res.json();
    if (res.ok) {
        alert('✓ ' + data.messaggio);
        caricaTasks();
    } else {
        alert('✕ ' + data.errore);
    }
}

async function importaCondiviseSelezionate() {
    const ids = getIdCondiviseSelezionate();
    if (ids.length === 0) { alert('Seleziona almeno una task'); return; }
    let ok = 0;
    for (const id of ids) {
        const res = await fetch(`${API}/shared/import.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: id })
        });
        if (res.ok) ok++;
    }
    alert(`✓ ${ok} task importate su ${ids.length}.`);
    caricaTasks();
    caricaCondivise();
}