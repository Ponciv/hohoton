// ==========================================
// 1. ГЛОБАЛЬНЫЙ СПИСОК НАВЫКОВ
// ==========================================
const ALL_SKILLS = [
    "React", "Vue", "Angular", "JavaScript", "TypeScript", "HTML", "CSS", "SASS",
    "Node.js", "Python", "Java", "C++", "C#", "Go", "PHP", "Ruby", "SQL",
    "Figma", "Photoshop", "Illustrator", "UI/UX", "Прототипирование",
    "Arduino", "Raspberry Pi", "IoT", "3D-моделирование", "Blender",
    "Git", "Docker", "Linux", "Unity", "Unreal Engine", "Swift", "Kotlin"
];

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ==========================================
// 2. МИНИ-БАЗА ДАННЫХ
// ==========================================
const DB = {
    get: (key) => JSON.parse(localStorage.getItem('hub_' + key)) || [],
    set: (key, data) => localStorage.setItem('hub_' + key, JSON.stringify(data)),
    
    init: () => {
        if (!localStorage.getItem('hub_users')) {
            DB.set('users', [
                { id: 1, email: 'author@test.com', password: '123', name: 'Иван (Автор)', bio: 'Fullstack-разработчик', skills: [0, 8] },
                { id: 2, email: 'cand1@test.com', password: '123', name: 'Анна (Кандидат)', bio: 'Фронтендер', skills: [0, 6] },
                { id: 3, email: 'cand2@test.com', password: '123', name: 'Пётр (Кандидат)', bio: 'Дизайнер', skills: [18, 5] },
                { id: 4, email: 'stranger@test.com', password: '123', name: 'Олег (Посторонний)', bio: '', skills: [] }
            ]);
            DB.set('projects', [
                { 
                    id: 1, authorId: 1, title: 'Умная теплица', desc: 'Автоматизация полива растений.', category: 'IoT', status: 'OPEN', createdAt: new Date().toISOString(),
                    vacancies: [
                        { id: 1, role: 'Frontend', skills: [0, 6], seats: 1, taken: 0 },
                        { id: 2, role: 'Инженер', skills: [22], seats: 2, taken: 0 }
                    ],
                    team: [{ userId: 1, role: 'Автор' }]
                },
                { 
                    id: 2, authorId: 3, title: 'Сайт кофейни', desc: 'Лендинг для локальной кофейни.', category: 'Web', status: 'CLOSED', createdAt: new Date(Date.now() - 86400000).toISOString(),
                    vacancies: [{ id: 3, role: 'Верстальщик', skills: [5, 6], seats: 1, taken: 1 }],
                    team: [{ userId: 3, role: 'Автор' }, { userId: 2, role: 'Верстальщик' }]
                }
            ]);
            DB.set('applications', [
                { id: 1, userId: 2, projectId: 2, vacancyId: 3, message: 'Сверстаю быстро!', skills: [5, 6], status: 'ACCEPTED', createdAt: new Date().toISOString() },
                { id: 2, userId: 3, projectId: 1, vacancyId: 2, message: 'Могу паять.', skills: [22], status: 'PENDING', createdAt: new Date().toISOString() }
            ]);
        }
    }
};

DB.init();
let currentUser = JSON.parse(localStorage.getItem('hub_currentUser')) || null;

let searchQuery = '';
let filterCategory = 'ALL';
let filterSkill = 'ALL';
let sortBy = 'new';
let currentTab = 'catalog';

// ==========================================
// 3. ИНТЕРФЕЙС
// ==========================================
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function getSkillName(id) { return ALL_SKILLS[id] || 'Неизвестно'; }

function renderTags(skillIds) {
    if (!skillIds || skillIds.length === 0) return '<span style="font-size:12px;color:#999;">Навыки не указаны</span>';
    return skillIds.map(id => `<span class="tag">${escapeHtml(getSkillName(id))}</span>`).join('');
}

// Переключение вкладок
function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('main > section').forEach(sec => sec.style.display = 'none');
    
    // Находим кнопку по тексту (костыль, но работает)
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    if (tabId === 'catalog') tabs[0].classList.add('active');
    if (tabId === 'my-projects') tabs[1].classList.add('active');
    if (tabId === 'my-apps') tabs[2].classList.add('active');

    document.getElementById(`tab-${tabId}`).style.display = 'block';

    if (tabId === 'catalog') renderProjects();
    if (tabId === 'my-projects') renderMyProjects();
    if (tabId === 'my-apps') renderMyApps();
}

// Просмотр чужого профиля
function viewUserProfile(userId) {
    const user = DB.get('users').find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('view-profile-name').textContent = user.name;
    document.getElementById('view-profile-email').textContent = user.email;
    document.getElementById('view-profile-bio').textContent = user.bio || 'Пользователь пока ничего не рассказал о себе.';
    
    const skillsContainer = document.getElementById('view-profile-skills');
    if (user.skills && user.skills.length > 0) {
        skillsContainer.innerHTML = user.skills.map(id => `<span class="tag">${escapeHtml(getSkillName(id))}</span>`).join('');
    } else {
        skillsContainer.innerHTML = '<span style="color:#999; font-size:14px;">Навыки не указаны</span>';
    }
    
    openModal('viewProfileModal');
}

// Дропдаун навыков
function createSkillsDropdown(containerId, initialSelected = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="skills-input-wrapper" onclick="this.querySelector('input').focus()">
            <div class="selected-tags" id="${containerId}-tags"></div>
            <input type="text" id="${containerId}-input" placeholder="Поиск навыка...">
        </div>
        <div class="skills-options" id="${containerId}-options"></div>
    `;

    const selectedTags = document.getElementById(`${containerId}-tags`);
    const input = document.getElementById(`${containerId}-input`);
    const options = document.getElementById(`${containerId}-options`);
    
    container.dataset.selected = JSON.stringify(initialSelected);

    function renderSelected() {
        const selected = JSON.parse(container.dataset.selected);
        selectedTags.innerHTML = selected.map(id => `
            <div class="selected-tag">${escapeHtml(getSkillName(id))} 
                <span onclick="event.stopPropagation(); removeSkill('${containerId}', ${id})">&times;</span>
            </div>
        `).join('');
    }

    function renderOptions(filter = '') {
        const selected = JSON.parse(container.dataset.selected);
        const filtered = ALL_SKILLS.map((name, index) => ({ name, index }))
            .filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) && !selected.includes(s.index));

        let html = filtered.map(s => `<div class="skills-option" onclick="addSkill('${containerId}', ${s.index})">${escapeHtml(s.name)}</div>`).join('');
        if (filter && !ALL_SKILLS.some(s => s.toLowerCase() === filter.toLowerCase())) {
            html += `<div class="skills-option add-new" onclick="addCustomSkill('${containerId}', '${escapeHtml(filter)}')">+ Добавить "${escapeHtml(filter)}"</div>`;
        }
        options.innerHTML = html || '<div class="skills-option" style="color:#999">Ничего не найдено</div>';
    }

    input.addEventListener('input', (e) => { renderOptions(e.target.value); options.classList.add('open'); });
    input.addEventListener('focus', () => { renderOptions(input.value); options.classList.add('open'); });
    document.addEventListener('click', (e) => { if (!container.contains(e.target)) options.classList.remove('open'); });

    window.addSkill = (id, skillId) => {
        const sel = JSON.parse(container.dataset.selected);
        if (!sel.includes(skillId)) {
            sel.push(skillId);
            container.dataset.selected = JSON.stringify(sel);
            renderSelected();
            renderOptions(input.value);
            input.value = '';
            input.focus();
        }
    };
    window.removeSkill = (id, skillId) => {
        let sel = JSON.parse(container.dataset.selected);
        sel = sel.filter(s => s !== skillId);
        container.dataset.selected = JSON.stringify(sel);
        renderSelected();
        renderOptions(input.value);
    };
    window.addCustomSkill = (id, skillName) => {
        if (!ALL_SKILLS.includes(skillName)) ALL_SKILLS.push(skillName);
        window.addSkill(id, ALL_SKILLS.indexOf(skillName));
    };

    renderSelected();
}

// Панель фильтров
function renderCatalogFilters() {
    const categories = ['ALL', 'Web', 'IoT', 'Mobile', 'GameDev', 'Дизайн', 'Другое'];
    const skillOptions = ALL_SKILLS.map((s, i) => `<option value="${i}" ${parseInt(filterSkill) === i ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');

    return `
        <div class="catalog-controls">
            <input type="text" placeholder="Поиск..." value="${escapeHtml(searchQuery)}" oninput="searchQuery=this.value; renderProjects()">
            <select onchange="filterCategory=this.value; renderProjects()">
                ${categories.map(c => `<option value="${c}" ${filterCategory === c ? 'selected' : ''}>${c === 'ALL' ? 'Все категории' : c}</option>`).join('')}
            </select>
            <select onchange="filterSkill=this.value; renderProjects()">
                <option value="ALL">Все навыки</option>
                ${skillOptions}
            </select>
            <select onchange="sortBy=this.value; renderProjects()">
                <option value="new" ${sortBy === 'new' ? 'selected' : ''}>Сначала новые</option>
                <option value="old" ${sortBy === 'old' ? 'selected' : ''}>Сначала старые</option>
            </select>
            <button class="btn btn-outline btn-sm" onclick="resetFilters()">Сбросить</button>
        </div>
    `;
}

function resetFilters() {
    searchQuery = ''; filterCategory = 'ALL'; filterSkill = 'ALL'; sortBy = 'new';
    renderProjects();
}

// Карточка проекта (вынесена для переиспользования)
function renderProjectCard(p) {
    const isAuthor = currentUser && currentUser.id === p.authorId;
    const author = DB.get('users').find(u => u.id === p.authorId);
    
    const team = p.team || [];
    const roleCounts = {};
    team.forEach(m => roleCounts[m.role] = (roleCounts[m.role] || 0) + 1);
    
    // Делаем имена в команде кликабельными
    const teamHtml = Object.keys(roleCounts).map(role => {
        const usersInRole = team.filter(m => m.role === role).map(m => {
            const u = DB.get('users').find(x => x.id === m.userId);
            return u ? `<span class="team-member-link" onclick="viewUserProfile(${u.id})" style="cursor:pointer; text-decoration:underline;">${escapeHtml(u.name)}</span>` : 'Неизвестен';
        }).join(', ');
        return `<div class="team-item">${roleCounts[role]} × ${escapeHtml(role)}: ${usersInRole}</div>`;
    }).join('');

    const vacanciesHtml = p.vacancies.map(v => {
        const isFull = v.taken >= v.seats;
        let btn = '';
        
        if (currentUser && !isAuthor && p.status === 'OPEN' && !isFull) {
            const hasApp = DB.get('applications').some(a => a.userId === currentUser.id && a.projectId === p.id && a.status === 'PENDING');
            btn = hasApp 
                ? '<span style="color: var(--color-rust); font-size: 12px; font-weight: bold;">Заявка отправлена</span>'
                : `<button class="btn btn-primary btn-sm" onclick="openApplyModal(${p.id}, ${v.id}, '${escapeHtml(p.title)}')">Подать</button>`;
        } else if (isFull) {
            btn = '<span style="color: var(--color-text-light); font-size: 12px; font-weight: bold;">Мест нет</span>';
        } else if (isAuthor) {
            btn = '<span style="color: var(--color-text-light); font-size: 12px;">Ваш проект</span>';
        } else if (p.status === 'CLOSED') {
            btn = '<span style="color: var(--color-rust); font-size: 12px; font-weight: bold;">Набор закрыт</span>';
        }

        return `
            <div class="vacancy">
                <div class="vacancy-header">
                    <div>
                        <div class="vacancy-info">${escapeHtml(v.role)}</div>
                        <div class="vacancy-seats">Мест: ${v.taken}/${v.seats}</div>
                    </div>
                    ${btn}
                </div>
                <div class="vacancy-skills">${renderTags(v.skills)}</div>
            </div>
        `;
    }).join('');

    let projectControls = '';
    if (isAuthor) {
        projectControls = `
            <div style="margin-bottom: 15px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-outline btn-sm" onclick="openEditModal(${p.id})">Редактировать</button>
                <button class="btn btn-danger btn-sm" onclick="handleDeleteProject(${p.id})">Удалить</button>
                <button class="btn btn-outline btn-sm" onclick="toggleProjectStatus(${p.id})">
                    ${p.status === 'OPEN' ? 'Закрыть набор' : 'Открыть набор'}
                </button>
            </div>
        `;
    }

    let authorBlock = '';
    if (isAuthor) {
        const allApps = DB.get('applications').filter(a => a.projectId === p.id);
        if (allApps.length > 0) {
            authorBlock = `<div class="applications-block" id="apps-block-${p.id}">
                <h4>Заявки на проект (${allApps.length})</h4>
                <div class="app-filters">
                    <button class="filter-btn active" onclick="filterApps(${p.id}, 'ALL', this)">Все</button>
                    <button class="filter-btn" onclick="filterApps(${p.id}, 'PENDING', this)">Ожидают</button>
                    <button class="filter-btn" onclick="filterApps(${p.id}, 'ACCEPTED', this)">Приняты</button>
                    <button class="filter-btn" onclick="filterApps(${p.id}, 'REJECTED', this)">Отклонены</button>
                </div>
                <div id="apps-list-${p.id}"></div>
            </div>`;
        }
    }

    return `
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                <h3>${escapeHtml(p.title)}</h3>
                <span style="font-size:12px; background:var(--color-chrome); padding:2px 8px; border-radius:4px; color:var(--color-graphite);">${escapeHtml(p.category || 'Другое')}</span>
            </div>
            <div class="author">
                Автор: ${author ? escapeHtml(author.name) : 'Неизвестен'} 
                <span style="display:flex; align-items:center; margin-left: 10px;">
                    <span class="status-dot ${p.status === 'OPEN' ? 'open' : 'closed'}"></span>
                    ${p.status === 'OPEN' ? 'Набор открыт' : 'Набор закрыт'}
                </span>
            </div>
            <div class="desc">${escapeHtml(p.desc)}</div>
            
            ${projectControls}
            
            ${team.length > 0 ? `
            <div class="team-composition">
                <h4>Текущий состав:</h4>
                <div class="team-list">${teamHtml}</div>
            </div>` : ''}
            
            <div style="margin-top: 15px;">${vacanciesHtml}</div>
            ${authorBlock}
        </div>
    `;
}

// Отрисовка каталога
function renderProjects() {
    const grid = document.getElementById('projects-grid');
    let projects = DB.get('projects');

    projects = projects.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = filterCategory === 'ALL' || p.category === filterCategory;
        const matchSkill = filterSkill === 'ALL' || p.vacancies.some(v => v.skills.includes(parseInt(filterSkill)));
        return matchSearch && matchCategory && matchSkill;
    });

    projects.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortBy === 'new' ? dateB - dateA : dateA - dateB;
    });

    if (projects.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px;">
            <p style="color:#666;">Проекты не найдены.</p>
            <button class="btn btn-outline" onclick="resetFilters()">Сбросить фильтры</button>
        </div>`;
        return;
    }

    grid.innerHTML = projects.map(p => renderProjectCard(p)).join('');

    projects.forEach(p => {
        if (currentUser && currentUser.id === p.authorId) {
            filterApps(p.id, 'ALL');
        }
    });
}

// Отрисовка "Мои проекты"
function renderMyProjects() {
    if (!currentUser) return;
    const grid = document.getElementById('my-projects-grid');
    const search = document.getElementById('my-projects-search').value.toLowerCase();
    const statusFilter = document.getElementById('my-projects-status').value;

    let projects = DB.get('projects').filter(p => p.authorId === currentUser.id);

    if (search) {
        projects = projects.filter(p => p.title.toLowerCase().includes(search) || p.desc.toLowerCase().includes(search));
    }
    if (statusFilter !== 'ALL') {
        projects = projects.filter(p => p.status === statusFilter);
    }

    if (projects.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#666;">У вас пока нет проектов, соответствующих фильтрам.</div>';
        return;
    }

    grid.innerHTML = projects.map(p => renderProjectCard(p)).join('');
    
    projects.forEach(p => filterApps(p.id, 'ALL'));
}

// Фильтрация заявок
function filterApps(projectId, status, btnElement) {
    if (btnElement) {
        const parent = btnElement.parentElement;
        parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const container = document.getElementById(`apps-list-${projectId}`);
    if (!container) return;

    const project = DB.get('projects').find(p => p.id === projectId);
    let apps = DB.get('applications').filter(a => a.projectId === projectId);
    if (status !== 'ALL') apps = apps.filter(a => a.status === status);

    if (apps.length === 0) {
        container.innerHTML = '<p style="font-size:13px; color:#999;">Нет заявок с таким статусом.</p>';
        return;
    }

    container.innerHTML = apps.map(a => {
        const candidate = DB.get('users').find(u => u.id === a.userId);
        const vac = project.vacancies.find(v => v.id === a.vacancyId);
        const canAccept = vac && vac.taken < vac.seats && a.status === 'PENDING';
        
        let actionHtml = '';
        if (a.status === 'PENDING') {
            actionHtml = `<div class="app-actions">
                <button class="btn btn-success btn-sm" onclick="handleAccept(${a.id})" ${canAccept ? '' : 'disabled style="opacity:0.5"'}>Принять</button>
                <button class="btn btn-danger btn-sm" onclick="handleReject(${a.id})">Отклонить</button>
            </div>`;
        } else if (a.status === 'ACCEPTED') {
            actionHtml = `<div style="font-size:12px;color:var(--success);font-weight:bold;margin-top:8px;">Кандидат принят</div>`;
        } else if (a.status === 'REJECTED') {
            actionHtml = `<div style="font-size:12px;color:var(--danger);font-weight:bold;margin-top:8px;">Отклонен</div>`;
        }

        // Делаем имя кандидата кликабельным для просмотра профиля
        const candidateName = candidate 
            ? `<span style="cursor:pointer; text-decoration:underline; color:var(--primary);" onclick="viewUserProfile(${candidate.id})">${escapeHtml(candidate.name)}</span>` 
            : 'Неизвестный';

        return `
            <div class="app-item">
                <div class="app-user">${candidateName}</div>
                <div class="app-role">На роль: ${vac ? escapeHtml(vac.role) : '—'}</div>
                <div class="app-msg">"${escapeHtml(a.message)}"</div>
                <div class="app-skills">${renderTags(a.skills)}</div>
                ${actionHtml}
            </div>
        `;
    }).join('');
}

// Мои заявки
function renderMyApps() {
    const list = document.getElementById('my-apps-list');
    if (!currentUser) return;

    const apps = DB.get('applications').filter(a => a.userId === currentUser.id);
    
    if (apps.length === 0) {
        list.innerHTML = '<p>Вы еще не подавали заявки.</p>';
        return;
    }

    list.innerHTML = apps.map(a => {
        const project = DB.get('projects').find(p => p.id === a.projectId);
        let statusText = 'На рассмотрении';
        let color = 'var(--warning)';
        if (a.status === 'ACCEPTED') { statusText = 'Принята'; color = 'var(--success)'; }
        if (a.status === 'REJECTED') { statusText = 'Отклонена'; color = 'var(--danger)'; }
        if (a.status === 'WITHDRAWN') { statusText = 'Отозвана'; color = 'var(--color-text-light)'; }

        const withdrawBtn = a.status === 'PENDING' 
            ? `<button class="btn btn-danger btn-sm" style="margin-top:10px;" onclick="withdrawApplication(${a.id})">Отозвать</button>` 
            : '';

        return `
            <div class="card" style="margin-bottom: 10px; padding: 15px;">
                <p><b>${project ? escapeHtml(project.title) : 'Проект удален'}</b></p>
                <p>Статус: <span style="color: ${color}; font-weight: bold;">${statusText}</span></p>
                ${withdrawBtn}
            </div>
        `;
    }).join('');
}

// Главный рендер
function render() {
    const authStatus = document.getElementById('auth-status');
    const createBtn = document.getElementById('create-project-btn');
    const mainTabs = document.getElementById('main-tabs');

    if (currentUser) {
        authStatus.innerHTML = `
            <span style="font-weight: 600; cursor: pointer; padding: 5px 10px; border-radius: 6px; background: rgba(255,255,255,0.1);" onclick="openProfile()" title="Открыть профиль">${escapeHtml(currentUser.name)}</span>
            <button class="btn btn-outline btn-sm" style="color: #fff; border-color: var(--color-chrome);" onclick="logout()">Выйти</button>
        `;
        createBtn.style.display = 'block';
        mainTabs.style.display = 'block';
    } else {
        authStatus.innerHTML = `
            <button class="btn btn-outline btn-sm" style="color: #fff; border-color: var(--color-chrome);" onclick="openModal('registerModal')">Регистрация</button>
            <button class="btn btn-primary btn-sm" onclick="openModal('loginModal')">Вход</button>
        `;
        createBtn.style.display = 'none';
        mainTabs.style.display = 'none';
    }

    let controls = document.getElementById('catalog-controls-container');
    if (controls) controls.innerHTML = renderCatalogFilters();

    switchTab(currentTab);
}

// ==========================================
// 4. ДЕЙСТВИЯ
// ==========================================

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const user = DB.get('users').find(u => u.email === email && u.password === pass);
    if (user) {
        currentUser = user;
        localStorage.setItem('hub_currentUser', JSON.stringify(user));
        closeModal('loginModal');
        render();
    } else alert('Неверный email или пароль');
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;

    const users = DB.get('users');
    if (users.some(u => u.email === email)) { alert('Email занят!'); return; }

    const newUser = { id: Date.now(), name: escapeHtml(name), email, password: pass, bio: '', skills: [] };
    users.push(newUser);
    DB.set('users', users);
    currentUser = newUser;
    localStorage.setItem('hub_currentUser', JSON.stringify(newUser));
    closeModal('registerModal');
    document.getElementById('registerForm').reset();
    render();
});

function logout() {
    currentUser = null;
    localStorage.removeItem('hub_currentUser');
    currentTab = 'catalog';
    render();
}

function openProfile() {
    if (!currentUser) return;
    document.getElementById('prof-name').value = currentUser.name || '';
    document.getElementById('prof-email').value = currentUser.email || '';
    document.getElementById('prof-bio').value = currentUser.bio || '';
    document.getElementById('prof-password').value = '';
    createSkillsDropdown('profile-skills-container', currentUser.skills || []);
    openModal('profileModal');
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('prof-name').value.trim();
    const newBio = document.getElementById('prof-bio').value.trim();
    const newPass = document.getElementById('prof-password').value;
    const selectedSkills = JSON.parse(document.getElementById('profile-skills-container').dataset.selected || '[]');

    if (!newName) { alert('Имя не может быть пустым'); return; }

    const users = DB.get('users');
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) return;

    users[idx].name = escapeHtml(newName);
    users[idx].bio = escapeHtml(newBio);
    users[idx].skills = selectedSkills;
    if (newPass) users[idx].password = newPass;

    DB.set('users', users);
    currentUser = users[idx];
    localStorage.setItem('hub_currentUser', JSON.stringify(currentUser));
    closeModal('profileModal');
    render();
});

document.getElementById('createProjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('proj-title').value.trim();
    const desc = document.getElementById('proj-desc').value.trim();
    const role = document.getElementById('proj-role').value.trim();
    const seats = parseInt(document.getElementById('proj-seats').value);
    const category = document.getElementById('proj-category').value;
    const selectedSkills = JSON.parse(document.getElementById('project-skills-container').dataset.selected || '[]');

    if (!title || !desc || !role) { alert('Заполните все поля!'); return; }
    if (isNaN(seats) || seats <= 0) { alert('Количество мест > 0!'); return; }

    const projects = DB.get('projects');
    projects.push({
        id: Date.now(), authorId: currentUser.id, title: escapeHtml(title), desc: escapeHtml(desc), category, status: 'OPEN', createdAt: new Date().toISOString(),
        vacancies: [{ id: Date.now() + 1, role: escapeHtml(role), skills: selectedSkills, seats, taken: 0 }],
        team: [{ userId: currentUser.id, role: 'Автор' }]
    });
    DB.set('projects', projects);
    closeModal('createProjectModal');
    document.getElementById('createProjectForm').reset();
    document.getElementById('project-skills-container').innerHTML = '';
    render();
});

function openEditModal(projectId) {
    const project = DB.get('projects').find(p => p.id === projectId);
    if (!project || project.authorId !== currentUser.id) return;

    document.getElementById('edit-project-id').value = project.id;
    document.getElementById('edit-title').value = project.title;
    document.getElementById('edit-desc').value = project.desc;
    document.getElementById('edit-category').value = project.category || 'Другое';

    renderEditVacancies(project);
    openModal('editProjectModal');
}

function renderEditVacancies(project) {
    const container = document.getElementById('edit-vacancies-list');
    container.innerHTML = project.vacancies.map((v, index) => `
        <div class="edit-vacancy-item" data-index="${index}">
            <div class="edit-vacancy-grid">
                <div class="form-group">
                    <label>Роль</label>
                    <input type="text" class="edit-vac-role" value="${escapeHtml(v.role)}" required>
                </div>
                <div class="form-group">
                    <label>Мест</label>
                    <input type="number" class="edit-vac-seats" min="1" value="${v.seats}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Навыки</label>
                <input type="text" class="edit-vac-skills" value="${v.skills.map(id => getSkillName(id)).join(', ')}" placeholder="Через запятую">
            </div>
            <button type="button" class="remove-vacancy-btn" onclick="removeVacancyFromEdit(${index})">Удалить вакансию</button>
        </div>
    `).join('');
}

function addVacancyToEdit() {
    const container = document.getElementById('edit-vacancies-list');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'edit-vacancy-item';
    div.dataset.index = index;
    div.innerHTML = `
        <div class="edit-vacancy-grid">
            <div class="form-group">
                <label>Роль</label>
                <input type="text" class="edit-vac-role" placeholder="Например: Дизайнер" required>
            </div>
            <div class="form-group">
                <label>Мест</label>
                <input type="number" class="edit-vac-seats" min="1" value="1" required>
            </div>
        </div>
        <div class="form-group">
            <label>Навыки</label>
            <input type="text" class="edit-vac-skills" placeholder="Через запятую">
        </div>
        <button type="button" class="remove-vacancy-btn" onclick="removeVacancyFromEdit(${index})">Удалить вакансию</button>
    `;
    container.appendChild(div);
}

function removeVacancyFromEdit(index) {
    const container = document.getElementById('edit-vacancies-list');
    const items = container.querySelectorAll('.edit-vacancy-item');
    if (items.length <= 1) { alert('Должна остаться хотя бы одна вакансия!'); return; }
    const project = DB.get('projects').find(p => p.id === parseInt(document.getElementById('edit-project-id').value));
    const vac = project.vacancies[index];
    if (vac) {
        const hasMembers = DB.get('applications').some(a => a.vacancyId === vac.id && a.status === 'ACCEPTED');
        if (hasMembers) { alert('Нельзя удалить вакансию, на которую уже приняты участники!'); return; }
    }
    if (items[index]) items[index].remove();
}

document.getElementById('editProjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const projectId = parseInt(document.getElementById('edit-project-id').value);
    const projects = DB.get('projects');
    const project = projects.find(p => p.id === projectId);
    if (!project || project.authorId !== currentUser.id) return;

    const title = document.getElementById('edit-title').value.trim();
    const desc = document.getElementById('edit-desc').value.trim();
    const category = document.getElementById('edit-category').value;
    if (!title || !desc) { alert('Заполните поля!'); return; }

    const vacancyItems = document.querySelectorAll('#edit-vacancies-list .edit-vacancy-item');
    const newVacancies = [];
    let hasError = false;

    vacancyItems.forEach((item) => {
        const role = item.querySelector('.edit-vac-role').value.trim();
        const seats = parseInt(item.querySelector('.edit-vac-seats').value);
        const skillsStr = item.querySelector('.edit-vac-skills').value;
        if (!role || isNaN(seats) || seats <= 0) { hasError = true; return; }

        const skillNames = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
        const skillIds = [];
        skillNames.forEach(name => {
            let idx = ALL_SKILLS.findIndex(s => s.toLowerCase() === name.toLowerCase());
            if (idx === -1) { ALL_SKILLS.push(name); idx = ALL_SKILLS.length - 1; }
            skillIds.push(idx);
        });

        const index = parseInt(item.dataset.index);
        const oldVac = project.vacancies[index];
        
        if (oldVac) {
            const acceptedCount = DB.get('applications').filter(a => a.vacancyId === oldVac.id && a.status === 'ACCEPTED').length;
            if (seats < acceptedCount) {
                alert(`Нельзя уменьшить количество мест для "${role}" ниже числа принятых (${acceptedCount})!`);
                hasError = true; return;
            }
            newVacancies.push({ id: oldVac.id, role: escapeHtml(role), skills: skillIds, seats: seats, taken: oldVac.taken });
        } else {
            newVacancies.push({ id: Date.now() + Math.random(), role: escapeHtml(role), skills: skillIds, seats: seats, taken: 0 });
        }
    });

    if (hasError || newVacancies.length === 0) { if (!hasError) alert('Нужна хотя бы одна вакансия!'); return; }

    project.title = escapeHtml(title);
    project.desc = escapeHtml(desc);
    project.category = category;
    project.vacancies = newVacancies;

    if (project.vacancies.every(v => v.taken >= v.seats)) project.status = 'CLOSED';

    DB.set('projects', projects);
    closeModal('editProjectModal');
    render();
});

function handleDeleteProject(projectId) {
    if (!confirm('Вы уверены, что хотите удалить проект? Все заявки будут удалены. Это действие необратимо.')) return;
    const projects = DB.get('projects');
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1 || projects[projectIndex].authorId !== currentUser.id) return;

    projects.splice(projectIndex, 1);
    DB.set('projects', projects);
    DB.set('applications', DB.get('applications').filter(a => a.projectId !== projectId));
    render();
}

function openApplyModal(projectId, vacancyId, projectName) {
    if (!currentUser) { alert('Войдите!'); return; }
    const project = DB.get('projects').find(p => p.id === projectId);
    if (project.authorId === currentUser.id) { alert('Нельзя в свой проект!'); return; }
    if (project.status === 'CLOSED') { alert('Набор закрыт!'); return; }

    document.getElementById('apply-project-id').value = projectId;
    document.getElementById('apply-vacancy-id').value = vacancyId;
    document.getElementById('apply-project-name').innerText = projectName;
    document.getElementById('apply-message').value = '';
    createSkillsDropdown('apply-skills-container', currentUser.skills || []);
    openModal('applyModal');
}

document.getElementById('applyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const projectId = parseInt(document.getElementById('apply-project-id').value);
    const vacancyId = parseInt(document.getElementById('apply-vacancy-id').value);
    const message = document.getElementById('apply-message').value.trim();
    const skills = JSON.parse(document.getElementById('apply-skills-container').dataset.selected || '[]');
    if (!message) { alert('Сообщение не может быть пустым!'); return; }

    const apps = DB.get('applications');
    if (apps.some(a => a.userId === currentUser.id && a.projectId === projectId && a.status === 'PENDING')) {
        alert('У вас уже есть активная заявка!'); return;
    }

    apps.push({ id: Date.now(), userId: currentUser.id, projectId, vacancyId, message: escapeHtml(message), skills, status: 'PENDING', createdAt: new Date().toISOString() });
    DB.set('applications', apps);
    closeModal('applyModal');
    document.getElementById('applyForm').reset();
    alert('Заявка отправлена!');
    render();
});

function withdrawApplication(appId) {
    if (!confirm('Отозвать заявку?')) return;
    const apps = DB.get('applications');
    const app = apps.find(a => a.id === appId);
    if (app && app.userId === currentUser.id && app.status === 'PENDING') {
        app.status = 'WITHDRAWN';
        DB.set('applications', apps);
        render();
    }
}

function handleAccept(appId) {
    const apps = DB.get('applications');
    const app = apps.find(a => a.id === appId);
    if (!app || app.status !== 'PENDING') return;

    const projects = DB.get('projects');
    const project = projects.find(p => p.id === app.projectId);
    const vacancy = project.vacancies.find(v => v.id === app.vacancyId);
    if (vacancy.taken >= vacancy.seats) { alert('Мест нет!'); return; }

    app.status = 'ACCEPTED';
    vacancy.taken += 1;

    if (!project.team) project.team = [];
    if (!project.team.some(m => m.userId === app.userId)) {
        project.team.push({ userId: app.userId, role: vacancy.role });
    }

    if (project.vacancies.every(v => v.taken >= v.seats)) project.status = 'CLOSED';

    DB.set('applications', apps);
    DB.set('projects', projects);
    render();
}

function handleReject(appId) {
    const apps = DB.get('applications');
    const app = apps.find(a => a.id === appId);
    if (!app || app.status !== 'PENDING') return;
    app.status = 'REJECTED';
    DB.set('applications', apps);
    render();
}

function toggleProjectStatus(projectId) {
    const projects = DB.get('projects');
    const project = projects.find(p => p.id === projectId);
    if (!project || project.authorId !== currentUser.id) return;

    if (project.status === 'OPEN') {
        project.status = 'CLOSED';
    } else {
        const allFull = project.vacancies.every(v => v.taken >= v.seats);
        if (allFull) { alert('Все места заняты, нельзя открыть!'); return; }
        project.status = 'OPEN';
    }
    DB.set('projects', projects);
    render();
}

// Запуск
render();