/**
 * Zidkenu — Puente módulo tareas ↔ API PHP (JSON)
 * Usuarios: solo zidkenu_usuarios (login.html). Sin cf_usuarios.
 */
(function () {
  const API_URL = 'api/zidkenu_tareas.php';
  const STORE_KEYS = ['empresas', 'tareas_pred', 'asignaciones', 'tareas_asignadas', 'historial', 'comentarios'];

  const cache = {
    empresas: [],
    tareas_pred: [],
    asignaciones: [],
    tareas_asignadas: [],
    historial: [],
    comentarios: [],
  };

  let saveTimer = null;
  let saveInFlight = false;
  let pendingSave = false;

  const ROL_MAP = {
    administrador: 'admin',
    directivo: 'directivo',
    supervisor: 'supervisor',
    contador: 'contador',
    usuario: 'contador',
  };

  function mapZkUser(zk) {
    if (!zk) return null;
    return {
      id: String(zk.id),
      nombre: zk.nombre,
      correo: zk.correo,
      rol: ROL_MAP[zk.rol] || zk.rol,
      zk_rol: zk.rol,
    };
  }

  function readZkUsuarios() {
    try {
      const raw = localStorage.getItem('zidkenu_usuarios');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return [];
  }

  async function apiGet() {
    const res = await fetch(API_URL + '?action=snapshot', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || json.status !== 'success') {
      throw new Error(json.message || 'Error al cargar datos del servidor');
    }
    return json.data;
  }

  async function apiSave(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_snapshot', data }),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'success') {
      throw new Error(json.message || 'Error al guardar en el servidor');
    }
    return json;
  }

  function hasServerData(data) {
    return STORE_KEYS.some(k => Array.isArray(data[k]) && data[k].length > 0);
  }

  function loadFromLocalLegacy() {
    const out = {};
    STORE_KEYS.forEach(k => {
      try {
        out[k] = JSON.parse(localStorage.getItem('cf_' + k) || '[]');
      } catch {
        out[k] = [];
      }
    });
    return out;
  }

  function applyToCache(data) {
    STORE_KEYS.forEach(k => {
      cache[k] = Array.isArray(data[k]) ? data[k] : [];
    });
  }

  function snapshotFromCache() {
    const snap = {};
    STORE_KEYS.forEach(k => { snap[k] = cache[k]; });
    return snap;
  }

  function scheduleSave() {
    pendingSave = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 400);
  }

  async function flushSave() {
    if (saveInFlight) {
      pendingSave = true;
      return;
    }
    pendingSave = false;
    saveInFlight = true;
    try {
      await apiSave(snapshotFromCache());
    } catch (e) {
      console.error('[Zidkenu Tareas API]', e);
      window.dispatchEvent(new CustomEvent('zk-tareas-save-error', { detail: e.message }));
    } finally {
      saveInFlight = false;
      if (pendingSave) flushSave();
    }
  }

  async function bootstrap() {
    if (location.protocol === 'file:') {
      console.warn('[Zidkenu Tareas API] Abre el proyecto con PHP (http://localhost/...) para sincronizar con el equipo.');
      applyToCache(loadFromLocalLegacy());
      return;
    }

    let data = await apiGet();
    if (!hasServerData(data)) {
      const legacy = loadFromLocalLegacy();
      if (hasServerData(legacy)) {
        await apiSave(legacy);
        data = legacy;
      }
    }
    applyToCache(data);
    if (typeof DB._migrateTareasPred === 'function') DB._migrateTareasPred();
  }

  const origGet = DB._get.bind(DB);
  const origSet = DB._set.bind(DB);

  DB._get = function (key) {
    if (STORE_KEYS.includes(key)) return cache[key] ? cache[key].slice() : [];
    return origGet(key);
  };

  DB._set = function (key, val) {
    if (STORE_KEYS.includes(key)) {
      cache[key] = val;
      if (location.protocol !== 'file:') scheduleSave();
      else origSet(key, val);
      return;
    }
    origSet(key, val);
  };

  DB.getUsuarios = function () {
    return readZkUsuarios()
      .filter(u => u.activo !== false)
      .map(mapZkUser)
      .filter(Boolean);
  };

  DB.getUsuario = function (id) {
    return DB.getUsuarios().find(u => String(u.id) === String(id)) || null;
  };

  DB.getUsuarioByNombre = function (nombre) {
    const n = (nombre || '').toLowerCase();
    return DB.getUsuarios().find(u => u.nombre.toLowerCase() === n) || null;
  };

  DB.syncFromZidkenuSession = function () {
    const raw = sessionStorage.getItem('zidkenu_user');
    if (!raw) return null;
    let zk;
    try { zk = JSON.parse(raw); } catch { return null; }
    const u = mapZkUser(zk);
    if (u) {
      DB.setSession(u);
      return u;
    }
    return null;
  };

  DB.requireSession = function (rolesPermitidos) {
    let u = DB.getSession();
    if (!u) u = DB.syncFromZidkenuSession();
    if (!u) return null;
    if (rolesPermitidos && !rolesPermitidos.includes(u.rol)) return null;
    return u;
  };

  DB.flushToServer = flushSave;
  DB.reloadFromServer = async function () {
    const data = await apiGet();
    applyToCache(data);
    if (typeof DB._migrateTareasPred === 'function') DB._migrateTareasPred();
  };

  DB.ready = bootstrap();
})();
