/* Shell Zidkenu — sidebar, topbar y sesión (módulo tareas) */
(function () {
  const homeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  const taskIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2  2 0 012 2m-6 9l2 2 4-4"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  const buildingIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
  const usersIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>';
  const chartIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>';
  const assignIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
  const settingsIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';

  const rolLabels = {
    usuario: 'Usuario',
    contador: 'Contador',
    supervisor: 'Supervisor',
    directivo: 'Directivo',
    administrador: 'Administrador',
  };

  const rolStyle = {
    usuario: { gradient: 'linear-gradient(135deg,#01ADF3,#5cc8f5)', badgeBg: 'rgba(1,173,243,.18)', badgeColor: '#01ADF3' },
    contador: { gradient: 'linear-gradient(135deg,#059669,#01ADF3)', badgeBg: 'rgba(5,150,105,.15)', badgeColor: '#059669' },
    supervisor: { gradient: 'linear-gradient(135deg,#013657,#01ADF3)', badgeBg: 'rgba(1,173,243,.15)', badgeColor: '#01ADF3' },
    directivo: { gradient: 'linear-gradient(135deg,#01ADF3,#5cc8f5)', badgeBg: 'rgba(255,255,255,.15)', badgeColor: '#fff' },
    administrador: { gradient: 'linear-gradient(135deg,#01ADF3,#5cc8f5)', badgeBg: 'rgba(255,255,255,.15)', badgeColor: '#fff' },
  };

  /** Navegación por rol — alineada al dashboard (sin cruces admin → validación). */
  function navForRole(rol) {
    const base = [
      { label: 'Dashboard', icon: homeIcon, href: 'dashboard.html', page: 'dashboard' },
    ];
    const maps = {
      usuario: [
        { section: 'Mis módulos' },
        { label: 'Mis Tareas', icon: taskIcon, href: 'mis_tareas.html', page: 'mis_tareas' },
      ],
      contador: [
        { section: 'Mis módulos' },
        { label: 'Mis Tareas', icon: taskIcon, href: 'mis_tareas.html', page: 'mis_tareas' },
      ],
      supervisor: [
        { section: 'Módulos' },
        { label: 'Vista General Tareas', icon: taskIcon, href: 'vista_admin.html', page: 'vista_admin' },
        { label: 'Tareas en Validación', icon: checkIcon, href: 'vista_supervisor.html', page: 'vista_supervisor' },
      ],
      directivo: [
        { section: 'Módulos' },
        { label: 'Módulo de Empresas', icon: buildingIcon, href: 'listado_empresa.html', page: 'empresas' },
        { label: 'Vista General Tareas', icon: taskIcon, href: 'vista_admin.html', page: 'vista_admin' },
        { label: 'Tareas en Validación', icon: checkIcon, href: 'vista_directivo.html', page: 'vista_directivo' },
        { label: 'Estadísticas', icon: chartIcon, href: 'dashboard_bi.html', page: 'bi' },
      ],
      administrador: [
        { section: 'Tareas' },
        { label: 'Vista General Tareas', icon: taskIcon, href: 'vista_admin.html', page: 'vista_admin' },
        { section: 'Empresas y usuarios' },
        { label: 'Módulo de Empresas', icon: buildingIcon, href: 'listado_empresa.html', page: 'empresas' },
        { label: 'Asignar Tareas', icon: assignIcon, href: 'asignar_tareas.html', page: 'asignar_tareas' },
        { label: 'Tareas Predeterminadas', icon: settingsIcon, href: 'tareas_pred.html', page: 'tareas_pred' },
        { label: 'Gestión de Usuarios', icon: usersIcon, href: 'admin_usuarios.html', page: 'usuarios' },
        { section: 'Analítica' },
        { label: 'Estadísticas', icon: chartIcon, href: 'dashboard_bi.html', page: 'bi' },
      ],
    };
    return base.concat(maps[rol] || maps.contador);
  }

  function getZkUser() {
    const raw = sessionStorage.getItem('zidkenu_user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function setDate() {
    const el = document.getElementById('currentDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('es-PE', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function buildSidebar(user, activePage) {
    const style = rolStyle[user.rol] || rolStyle.contador;
    const initials = user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const av = document.getElementById('sidebarAvatar');
    if (av) {
      av.textContent = initials;
      av.style.background = style.gradient;
    }
    const nameEl = document.getElementById('sidebarName');
    if (nameEl) nameEl.textContent = user.nombre;
    const rb = document.getElementById('sidebarRoleBadge');
    if (rb) {
      rb.textContent = rolLabels[user.rol] || user.rol;
      rb.style.background = style.badgeBg;
      rb.style.color = style.badgeColor;
    }
    const navEl = document.getElementById('sidebarNav');
    if (!navEl) return;
    const items = navForRole(user.rol);
    navEl.innerHTML = items.map(item => {
      if (item.section) return '<div class="nav-section-label">' + item.section + '</div>';
      const active = item.page === activePage ? ' active' : '';
      return '<a class="nav-item' + active + '" href="' + item.href + '">' + item.icon + item.label + '</a>';
    }).join('');
  }

  function applyTopbar(cfg, user) {
    const t = document.getElementById('zkPageTitle');
    const s = document.getElementById('zkPageSubtitle');
    if (t) t.textContent = cfg.pageTitle || document.title;
    if (s) {
      s.textContent = cfg.pageSubtitle ||
        `Sesión activa · ${rolLabels[user.rol] || user.rol}`;
    }
    const extra = document.getElementById('zkTopbarExtra');
    if (extra && cfg.topbarExtra) extra.innerHTML = cfg.topbarExtra;
  }

  function logout() {
    if (confirm('¿Cerrar sesión?')) {
      sessionStorage.removeItem('zidkenu_user');
      if (typeof DB !== 'undefined') DB.clearSession();
      window.location.href = 'login.html';
    }
  }

  function init() {
    const cfg = window.ZK_PAGE || {};
    const user = getZkUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    if (typeof DB !== 'undefined' && DB.syncFromZidkenuSession) {
      DB.syncFromZidkenuSession();
    }
    buildSidebar(user, cfg.activePage || '');
    applyTopbar(cfg, user);
    setDate();
    return user;
  }

  window.ZK = { init, logout, getZkUser, buildSidebar };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('zk-tareas')) init();
  });
})();
