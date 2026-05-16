// ============================================================
// ZIDKENU TASKFLOW — Datos y utilidades compartidas
// Guardar como: zidkenu_data.js
// ============================================================

const DEMO_USER = { email: 'admin@zidkenu.com', nombre: 'Alfredo García', rol: 'ADMIN' };

// ── Módulo externo: asignar / reasignar empresa ─────────────────────────────
// Cuando te pasen la ruta del otro módulo, pégala aquí (ej: '../asignacion/asignar_empresa.html')
// Se enviará automáticamente ?id= con el ID de la empresa al hacer clic en el botón.
const URL_MODULO_ASIGNAR_EMPRESA = '';

function urlAsignarEmpresa(empresaId) {
  if (!URL_MODULO_ASIGNAR_EMPRESA) return null;
  const sep = URL_MODULO_ASIGNAR_EMPRESA.includes('?') ? '&' : '?';
  return `${URL_MODULO_ASIGNAR_EMPRESA}${sep}id=${empresaId}`;
}

function irAsignarEmpresa(empresaId) {
  const url = urlAsignarEmpresa(empresaId);
  if (!url) {
    toast('Módulo de asignación aún no configurado', 'info');
    return;
  }
  window.location.href = url;
}

function zkGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function zkSet(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}
function zkDel(key) {
  try { localStorage.removeItem(key); } catch {}
}

// Verificar sesión (en archivo local entra directo sin login)
function checkSession() {
  let user = JSON.parse(zkGet('zk_user') || 'null');
  if (!user && location.protocol === 'file:') {
    user = DEMO_USER;
    zkSet('zk_user', JSON.stringify(user));
  }
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

// Logout
function doLogout() {
  zkDel('zk_user');
  window.location.href = 'login.html';
}

// Renderizar topbar con usuario
function renderTopbar(user) {
  document.getElementById('topName').textContent = user.nombre;
  document.getElementById('topAv').textContent   = user.nombre.charAt(0);
  document.getElementById('topRol').textContent  = user.rol.replace(/_/g, ' ');
}

// Cuentas demo
const CUENTAS = [
  { email: 'admin@zidkenu.com',   pass: 'admin123', nombre: 'Alfredo García', rol: 'ADMIN' },
  { email: 'diego@zidkenu.com',   pass: 'admin123', nombre: 'Diego Ramos',    rol: 'DIRECTOR_TI' },
  { email: 'josue@zidkenu.com',   pass: 'admin123', nombre: 'Josue Mendoza',  rol: 'CONTADOR_SUPERVISOR' },
  { email: 'rodrigo@zidkenu.com', pass: 'admin123', nombre: 'Rodrigo Flores', rol: 'CONTADOR' },
];

// Datos demo de empresas (guardadas en sessionStorage)
const DEMO_EMPRESAS = [
  { id: 1, razon: 'Textilería San Marcos S.A.C.',  ruc: '20601234567', tipo: 'JURIDICA', origen: 'OTRO_CONTADOR', regimen: 'MYPE',    uit: '1', contador: 'Rodrigo Flores',  estado: 'ACTIVO',     repNom: 'Carlos San Marcos', repDni: '12345678', repCargo: 'Gerente General', repTel: '999 111 222', repEmail: 'carlos@sanmarcos.com', secNom: 'Patricia Vela Ríos', secDni: '11223344', secCargo: 'Representante legal ante SUNAT', secTel: '988 222 333', secEmail: 'patricia@sanmarcos.com', obs: 'Cliente desde 2024' },
  { id: 2, razon: 'Restaurante El Sabor E.I.R.L.', ruc: '20709876543', tipo: 'JURIDICA', origen: 'NUEVO',         regimen: null,      uit: '0', contador: 'María Torres',    estado: 'ACTIVO',     repNom: 'Ana Sabor Ríos',    repDni: '87654321', repCargo: 'Administradora',  repTel: '988 333 444', repEmail: 'ana@elsabor.com',       obs: '' },
  { id: 3, razon: 'Juan Pérez Quispe',              ruc: '10345678901', tipo: 'NATURAL',  origen: 'OTRO_CONTADOR', regimen: 'RUS',     uit: '0', contador: 'Rodrigo Flores',  estado: 'INACTIVO',   repNom: 'Juan Pérez Quispe', repDni: '34567890', repCargo: 'Titular',         repTel: '977 555 666', repEmail: 'juan@gmail.com',        obs: 'Pendiente regularización' },
  { id: 4, razon: 'Inversiones Andinas S.A.',       ruc: '20811112222', tipo: 'JURIDICA', origen: 'OTRO_CONTADOR', regimen: 'GENERAL', uit: '0', contador: 'Josue Mendoza',   estado: 'ACTIVO',     repNom: 'Marco Andino',      repDni: '55566677', repCargo: 'Presidente',      repTel: '944 777 888', repEmail: 'marco@inversiones.pe',  obs: '' },
  { id: 5, razon: 'Comercial Miraflores E.I.R.L.',  ruc: '20933334444', tipo: 'JURIDICA', origen: 'OTRO_CONTADOR', regimen: 'RER',     uit: '0', contador: 'María Torres',    estado: 'SUSPENDIDO', repNom: 'Luisa García',      repDni: '66677788', repCargo: 'Gerente',         repTel: '933 999 000', repEmail: 'luisa@miraflores.com',  obs: 'Deuda SUNAT pendiente' },
];

// GET empresas desde localStorage
function getEmpresas() {
  const raw = zkGet('zk_empresas');
  if (!raw) {
    zkSet('zk_empresas', JSON.stringify(DEMO_EMPRESAS));
    return DEMO_EMPRESAS.map(e => ({ ...e }));
  }
  return JSON.parse(raw);
}

// SAVE empresas
function saveEmpresas(lista) {
  zkSet('zk_empresas', JSON.stringify(lista));
}

// Siguiente ID
function nextId() {
  const lista = getEmpresas();
  return lista.length ? Math.max(...lista.map(e => e.id)) + 1 : 1;
}

// Badges helpers
const BADGE_EST = { ACTIVO: 'b-activo', INACTIVO: 'b-inactivo', SUSPENDIDO: 'b-suspendido' };
const BADGE_REG = { RUS: 'b-rus', RER: 'b-rer', MYPE: 'b-mype', GENERAL: 'b-general' };

// Toast global
function toast(msg, type = 'ok') {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toastWrap'; wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const d = document.createElement('div');
  d.className = `toast t-${type}`;
  d.textContent = msg;
  wrap.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}

// Info tributaria
const INFO_TRIB = {
  NUEVO:         '📌 Empresa nueva: se tramitará testimonio de constitución, inscripción de RUC, aportes SUNAT y documentación notarial.',
  RUS:           '📋 RUS: requiere Ficha RUC, Clave SOL y reportes de declaraciones.',
  RER_NATURAL:   '📋 RER Persona Natural: Clave SOL, Registro de Compras y Ventas, Constancia de declaraciones. Si tiene deuda, adjuntar documentación adicional.',
  RER_JURIDICA:  '📋 RER Persona Jurídica: igual que natural + Testimonio, Aportes e inscripción SUNARP.',
  MYPE_NATURAL:  '📋 MYPE Persona Natural: docs RER + Libro Diario Simplificado (≤300 UIT) o Libro Diario + Libro Mayor (>300 UIT).',
  MYPE_JURIDICA: '📋 MYPE Persona Jurídica: igual que natural + Testimonio, Aportes y documentación notarial completa.',
  GENERAL:       '📋 Régimen General (normalmente Personas Jurídicas): mismos requerimientos que MYPE con documentación notarial completa.',
};

// Sidebar activo
function setNavActive(page) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
}
