const API = '/todo_app/api';

// ── INDICATORE DI CARICAMENTO ─────────────────────
// Mostra un overlay con spinner ogni volta che è in corso una richiesta
// al server, così l'utente capisce che il sito sta lavorando e non è bloccato
// (utile perché le richieste, passando per un DB remoto, possono essere lente).

let richiesteAttive = 0;

function creaLoadingOverlay() {
    if (document.getElementById('loading-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay nascosto';
    overlay.innerHTML = `
        <div class="loading-box">
            <span class="loading-spinner"></span>
            <span class="loading-text">Sto lavorando, attendi…</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

function mostraCaricamento() {
    richiesteAttive++;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('nascosto');
}

function nascondiCaricamento() {
    richiesteAttive = Math.max(0, richiesteAttive - 1);
    if (richiesteAttive === 0) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('nascosto');
    }
}

async function apiFetch(url, options) {
    mostraCaricamento();
    try {
        return await fetch(url, options);
    } finally {
        nascondiCaricamento();
    }
}

document.addEventListener('DOMContentLoaded', creaLoadingOverlay);

// ── AUTH ──────────────────────────────────────────

function mostraLogin() {
    document.getElementById('form-login').classList.remove('nascosto');
    document.getElementById('form-registrazione').classList.add('nascosto');
}

function mostraRegistrazione() {
    document.getElementById('form-registrazione').classList.remove('nascosto');
    document.getElementById('form-login').classList.add('nascosto');
}

function salutoOrario() {
    const ora = new Date().getHours();
    if (ora >= 6 && ora < 12) return 'Buongiorno';
    if (ora >= 12 && ora < 18) return 'Buon pomeriggio';
    if (ora >= 18 && ora < 22) return 'Buonasera';
    return 'Che ci fai sveglio a quest\'ora';
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const res = await apiFetch(`${API}/auth/login.php`, {
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
    const res = await apiFetch(`${API}/auth/register.php`, {
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
    await apiFetch(`${API}/auth/logout.php`, { method: 'POST' });
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
        document.querySelector('.dashboard-title').textContent = salutoOrario() + ', ' + utente.nome + '!';
        document.getElementById('data-oggi').textContent = oggi.toUpperCase();
        caricaTasks();
        caricaCategorie();
        caricaCondivise();
    }
});

// ── TASK ──────────────────────────────────────────

async function caricaTasks() {
    const res = await apiFetch(`${API}/tasks/get.php`);
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
                <button class="btn-icon" onclick="condividiSingola(${task.id})" title="Condividi">📤</button>
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

    const res = await apiFetch(`${API}/tasks/create.php`, {
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
    await apiFetch(`${API}/tasks/complete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    caricaTasks();
}

async function eliminaTask(id) {
    if (!confirm('Eliminare questa task?')) return;
    await apiFetch(`${API}/tasks/delete.php`, {
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

    const res = await apiFetch(`${API}/tasks/update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, titolo, descrizione, priorita, scadenza, category_id })
    });
    if (res.ok) {
        chiudiModale();
        caricaTasks();
    }
}

async function condividiSingola(task_id) {
    const email = prompt("Inserisci l'email dell'utente con cui condividere:");
    if (!email) return;

    const res = await apiFetch(`${API}/shared/share.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: parseInt(task_id), email: email.trim() })
    });

    const data = await res.json();
    if (res.ok) {
        alert('✓ Task condivisa con successo');
    } else {
        alert('✕ ' + data.errore);
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
    await apiFetch(`${API}/tasks/delete_multiple.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    caricaTasks();
}

async function completaSelezionate() {
    const ids = getIdSelezionati();
    if (ids.length === 0) { alert('Seleziona almeno una task'); return; }
    await apiFetch(`${API}/tasks/complete_multiple.php`, {
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

    const res = await apiFetch(`${API}/shared/share_multiple.php`, {
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

// ── FILTRI ────────────────────────────────────────

function toggleFiltri() {
    document.getElementById('filtri-panel').classList.toggle('nascosto');
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
        const res = await apiFetch(`${API}/tasks/create.php`, {
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
    const res = await apiFetch(`${API}/categories/get.php`);
    const categorie = await res.json();
    const lista = document.getElementById('lista-categorie');
    const select = document.getElementById('task-categoria');
    lista.innerHTML = '';
    select.innerHTML = '<option value="">Nessuna</option>';
    const selectFiltro = document.getElementById('filtro-categoria');
    if (selectFiltro) selectFiltro.innerHTML = '<option value="tutte">Tutte</option>';

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

    if (selectFiltro) {
        const optFiltro = document.createElement('option');
        optFiltro.value = cat.id;
        optFiltro.textContent = cat.nome;
        selectFiltro.appendChild(optFiltro);
    }
});
    caricaTasks();
}

async function creaCategoria() {
    const nome = document.getElementById('cat-nome').value.trim();
    const colore = document.getElementById('cat-colore').value;
    if (!nome) return;
    const res = await apiFetch(`${API}/categories/create.php`, {
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
    await apiFetch(`${API}/categories/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    caricaCategorie();
}

// ── CONDIVISE ─────────────────────────────────────

async function caricaCondivise() {
    const res = await apiFetch(`${API}/shared/get_shared.php`);
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
    const res = await apiFetch(`${API}/shared/remove.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    const data = await res.json();
    if (!res.ok) {
        alert('✕ ' + (data.errore || 'Errore durante l\'eliminazione'));
    }
    caricaCondivise();
}

async function importaCondivisa(taskId) {
    const res = await apiFetch(`${API}/shared/import.php`, {
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
        const res = await apiFetch(`${API}/shared/import.php`, {
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
let tasksCache = [];

async function caricaTasks() {
    const res = await apiFetch(`${API}/tasks/get.php`);
    tasksCache = await res.json();
    applicaFiltri();
}

function applicaFiltri() {
    let tasks = [...tasksCache];

    const stato = document.getElementById('filtro-stato')?.value || 'tutte';
    const priorita = document.getElementById('filtro-priorita')?.value || 'tutte';
    const categoria = document.getElementById('filtro-categoria')?.value || 'tutte';
    const scadenzaFiltro = document.getElementById('filtro-scadenza')?.value || 'tutte';
    const ordine = document.getElementById('filtro-ordine')?.value || 'data-desc';

    // Filtro stato
    if (stato === 'completate') tasks = tasks.filter(t => t.completato == 1);
    if (stato === 'in-corso') tasks = tasks.filter(t => t.completato == 0);

    // Filtro priorità
    if (priorita !== 'tutte') tasks = tasks.filter(t => t.priorita === priorita);

    // Filtro categoria
    if (categoria !== 'tutte') tasks = tasks.filter(t => String(t.category_id) === categoria);

    // Filtro scadenza
    const oggi = new Date(); oggi.setHours(0,0,0,0);
    const traSetteGiorni = new Date(oggi); traSetteGiorni.setDate(oggi.getDate() + 7);

    if (scadenzaFiltro === 'oggi') {
        tasks = tasks.filter(t => t.scadenza && new Date(t.scadenza).toDateString() === oggi.toDateString());
    }
    if (scadenzaFiltro === 'settimana') {
        tasks = tasks.filter(t => t.scadenza && new Date(t.scadenza) >= oggi && new Date(t.scadenza) <= traSetteGiorni);
    }
    if (scadenzaFiltro === 'scadute') {
        tasks = tasks.filter(t => t.scadenza && new Date(t.scadenza) < oggi && t.completato == 0);
    }

    // Ordinamento
    const ordinePriorita = { alta: 3, media: 2, bassa: 1 };
    if (ordine === 'data-desc') tasks.sort((a,b) => new Date(b.creato_il) - new Date(a.creato_il));
    if (ordine === 'data-asc') tasks.sort((a,b) => new Date(a.creato_il) - new Date(b.creato_il));
    if (ordine === 'priorita-desc') tasks.sort((a,b) => ordinePriorita[b.priorita] - ordinePriorita[a.priorita]);
    if (ordine === 'priorita-asc') tasks.sort((a,b) => ordinePriorita[a.priorita] - ordinePriorita[b.priorita]);
    if (ordine === 'scadenza-asc') tasks.sort((a,b) => {
        if (!a.scadenza) return 1;
        if (!b.scadenza) return -1;
        return new Date(a.scadenza) - new Date(b.scadenza);
    });

    renderTasks(tasks);
}

function resetFiltri() {
    document.getElementById('filtro-stato').value = 'tutte';
    document.getElementById('filtro-priorita').value = 'tutte';
    document.getElementById('filtro-categoria').value = 'tutte';
    document.getElementById('filtro-scadenza').value = 'tutte';
    document.getElementById('filtro-ordine').value = 'data-desc';
    applicaFiltri();
}

function renderTasks(tasks) {
    const lista = document.getElementById('lista-tasks');
    lista.innerHTML = '';

    if (tasks.length === 0) {
        lista.innerHTML = '<div class="empty-state">NESSUNA TASK TROVATA — Prova a modificare i filtri</div>';
        return;
    }

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
                <button class="btn-icon" onclick="condividiSingola(${task.id})" title="Condividi">📤</button>
                <button class="btn-icon btn-icon-danger" onclick="eliminaTask(${task.id})" title="Elimina">✕</button>
            </div>
        `;
        lista.appendChild(card);
    });
}