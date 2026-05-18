/* ═══════════════════════════════════════════════════
   ContaFlow — Capa de Base de Datos (localStorage)
   Simula una BD relacional con IDs únicos y relaciones
═══════════════════════════════════════════════════ */

const DB = {

  /* ── utilidades ── */
  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },
  _ts() { return new Date().toISOString(); },
  _get(key)      { return JSON.parse(localStorage.getItem('cf_' + key) || '[]'); },
  _set(key, val) { localStorage.setItem('cf_' + key, JSON.stringify(val)); },

  /* ════════════════════════════════
     USUARIOS
  ════════════════════════════════ */
  getUsuarios()  { return this._get('usuarios'); },
  getUsuario(id) { return this.getUsuarios().find(u => u.id === id) || null; },
  getUsuarioByNombre(nombre) {
    return this.getUsuarios().find(u =>
      u.nombre.toLowerCase() === nombre.toLowerCase()
    ) || null;
  },

  login(nombre, password) {
    const u = this.getUsuarioByNombre(nombre);
    if (!u) return null;
    if (u.password !== password) return null;
    return u;
  },

  /* ════════════════════════════════
     SESION ACTIVA
  ════════════════════════════════ */
  setSession(usuario) {
    localStorage.setItem('cf_session', JSON.stringify(usuario));
  },
  getSession() {
    return JSON.parse(localStorage.getItem('cf_session') || 'null');
  },
  clearSession() {
    localStorage.removeItem('cf_session');
  },
  requireSession(rolesPermitidos) {
    const u = this.getSession();
    if (!u) { window.location.href = 'login.html'; return null; }
    if (rolesPermitidos && !rolesPermitidos.includes(u.rol)) {
      window.location.href = 'login.html'; return null;
    }
    return u;
  },

  /* ════════════════════════════════
     EMPRESAS (catálogo externo)
  ════════════════════════════════ */
  getEmpresas()  { return this._get('empresas'); },
  getEmpresa(id) { return this.getEmpresas().find(e => e.id === id) || null; },

  /* ════════════════════════════════
     TAREAS PREDETERMINADAS (CRUD)
  ════════════════════════════════ */
  getTareasPred()        { return this._get('tareas_pred'); },
  getTareaPred(id)       { return this.getTareasPred().find(p => p.id === id) || null; },
  getTareasPredByTipo(t) { return this.getTareasPred().filter(p => p.tipo === t && p.activa); },

  addTareaPred(data) {
    const lista = this.getTareasPred();
    const nueva = { id: this._uid(), activa: true, ...data, creadaEn: this._ts() };
    lista.push(nueva);
    this._set('tareas_pred', lista);
    return nueva;
  },
  updateTareaPred(id, data) {
    const lista = this.getTareasPred().map(t => t.id === id ? { ...t, ...data } : t);
    this._set('tareas_pred', lista);
  },
  deleteTareaPred(id) {
    // soft delete
    this.updateTareaPred(id, { activa: false });
  },

  /* ════════════════════════════════
     ASIGNACIONES (empresa → contador)
  ════════════════════════════════ */
  getAsignaciones()         { return this._get('asignaciones'); },
  getAsignacion(id)         { return this.getAsignaciones().find(a => a.id === id) || null; },
  getAsignacionByEmpresa(empresaId) {
    return this.getAsignaciones().find(a => a.empresa_id === empresaId && a.activa) || null;
  },

  crearAsignacion(data) {
    // cerrar asignación anterior si existe
    const anterior = this.getAsignacionByEmpresa(data.empresa_id);
    if (anterior) {
      this._actualizarAsignacion(anterior.id, { activa: false, cerradaEn: this._ts() });
    }
    const lista = this.getAsignaciones();
    const nueva = {
      id: this._uid(), activa: true,
      fecha_asignacion: this._ts(),
      ...data
    };
    lista.push(nueva);
    this._set('asignaciones', lista);
    return nueva;
  },
  _actualizarAsignacion(id, data) {
    const lista = this.getAsignaciones().map(a => a.id === id ? { ...a, ...data } : a);
    this._set('asignaciones', lista);
  },

  /* ════════════════════════════════
     TAREAS ASIGNADAS
  ════════════════════════════════ */
  getTareasAsignadas()    { return this._get('tareas_asignadas'); },
  getTareaAsignada(id)    { return this.getTareasAsignadas().find(t => t.id === id) || null; },

  getTareasByAsignacion(asignacionId) {
    return this.getTareasAsignadas().filter(t => t.asignacion_id === asignacionId);
  },
  getTareasByEmpresa(empresaId) {
    return this.getTareasAsignadas().filter(t => t.empresa_id === empresaId && !t.eliminada);
  },
  getTareasByContador(contadorId) {
    return this.getTareasAsignadas().filter(t => t.contador_id === contadorId && !t.eliminada);
  },
  getTareasEnValidacion() {
    return this.getTareasAsignadas().filter(t => t.estado === 'en_validacion' && !t.eliminada);
  },

  crearTareaAsignada(data) {
    const lista = this.getTareasAsignadas();
    const nueva = {
      id: this._uid(),
      estado: 'asignado',
      fecha_asignacion: this._ts(),
      fecha_inicio: null,
      fecha_validacion_solicitada: null,
      fecha_completado: null,
      prioridad_observacion: null,
      eliminada: false,
      ...data
    };
    lista.push(nueva);
    this._set('tareas_asignadas', lista);
    // registrar historial
    this._addHistorial({ tarea_id: nueva.id, contador_id: nueva.contador_id, fecha_desde: this._ts(), fecha_hasta: null });
    return nueva;
  },

  updateTareaAsignada(id, data) {
    const lista = this.getTareasAsignadas().map(t => t.id === id ? { ...t, ...data } : t);
    this._set('tareas_asignadas', lista);
  },

  iniciarTarea(id) {
    this.updateTareaAsignada(id, { estado: 'en_proceso', fecha_inicio: this._ts() });
  },
  solicitarValidacion(id) {
    this.updateTareaAsignada(id, { estado: 'en_validacion', fecha_validacion_solicitada: this._ts() });
  },
  validarTarea(id) {
    this.updateTareaAsignada(id, { estado: 'completado', fecha_completado: this._ts(), prioridad_observacion: null });
  },
  rechazarTarea(id, prioridad, comentarioTexto, supervisorId) {
    this.updateTareaAsignada(id, { estado: 'en_proceso', prioridad_observacion: prioridad });
    this.addComentario({
      tarea_id: id, autor_id: supervisorId,
      rol_autor: 'supervisor', tipo: prioridad === 'alta' ? 'observacion_alta' : 'observacion_media',
      texto: comentarioTexto
    });
  },
  eliminarTarea(id) {
    this.updateTareaAsignada(id, { eliminada: true });
  },

  // Reasignación de contador en tareas pendientes
  reasignarContadorEnTareas(empresaId, nuevoContadorId) {
    const tareas = this.getTareasByEmpresa(empresaId).filter(
      t => t.estado !== 'completado' && !t.eliminada
    );
    tareas.forEach(t => {
      // cerrar historial anterior
      const hist = this._get('historial').map(h => {
        if (h.tarea_id === t.id && !h.fecha_hasta)
          return { ...h, fecha_hasta: this._ts() };
        return h;
      });
      this._set('historial', hist);
      // abrir nuevo historial
      this._addHistorial({ tarea_id: t.id, contador_id: nuevoContadorId, fecha_desde: this._ts(), fecha_hasta: null });
      // actualizar tarea
      this.updateTareaAsignada(t.id, { contador_id: nuevoContadorId });
    });
  },

  /* ════════════════════════════════
     HISTORIAL DE CONTADOR
  ════════════════════════════════ */
  _addHistorial(data) {
    const lista = this._get('historial');
    lista.push({ id: this._uid(), ...data });
    this._set('historial', lista);
  },
  getHistorialByTarea(tareaId) {
    return this._get('historial').filter(h => h.tarea_id === tareaId);
  },

  /* ════════════════════════════════
     COMENTARIOS / DOCUMENTOS
  ════════════════════════════════ */
  getComentarios()             { return this._get('comentarios'); },
  getComentariosByTarea(tareaId) {
    return this.getComentarios().filter(c => c.tarea_id === tareaId);
  },
  addComentario(data) {
    const lista = this.getComentarios();
    const nuevo = { id: this._uid(), fecha: this._ts(), archivo_nombre: null, ...data };
    lista.push(nuevo);
    this._set('comentarios', lista);
    return nuevo;
  },

  /* ════════════════════════════════
     ESTADO VISUAL DE TAREA
  ════════════════════════════════ */
  getEstadoVisual(tarea) {
    if (!tarea) return 'asignado';
    if (tarea.estado === 'completado') return 'completado';
    if (tarea.estado === 'en_validacion') return 'en_validacion';
    // check vencimiento
    if (tarea.fecha_limite) {
      const now = new Date(); now.setHours(0,0,0,0);
      const lim = new Date(tarea.fecha_limite + 'T00:00:00');
      if (lim < now) return 'vencido';
      if ((lim - now) / 86400000 <= 7 && tarea.estado === 'en_proceso') return 'por_vencer';
    }
    return tarea.estado; // asignado | en_proceso
  },

  /* ════════════════════════════════
     SEED / INIT
  ════════════════════════════════ */
  init() {
    if (localStorage.getItem('cf_initialized')) return;

    // Usuarios
    this._set('usuarios', [
      { id: 'u1', nombre: 'Admin1',     rol: 'admin',      password: '1234' },
      { id: 'u2', nombre: 'Admin2',     rol: 'admin',      password: '1234' },
      { id: 'u3', nombre: 'Directivo1', rol: 'directivo',  password: '1234' },
      { id: 'u4', nombre: 'Supervisor1',rol: 'supervisor', password: '1234' },
      { id: 'u5', nombre: 'Contador1',  rol: 'contador',   password: '123'  },
      { id: 'u6', nombre: 'Contador2',  rol: 'contador',   password: '123'  },
      { id: 'u7', nombre: 'Contador3',  rol: 'contador',   password: '123'  },
    ]);

    // Empresas (catálogo externo)
    this._set('empresas', [
      { id: 'e1', nombre: 'Empresa ABC S.A.C.',          complejidad: 'Alta'  },
      { id: 'e2', nombre: 'Logística Del Sur E.I.R.L.',  complejidad: 'Media' },
      { id: 'e3', nombre: 'Turismo Andino SAC',           complejidad: 'Baja'  },
      { id: 'e4', nombre: 'Constructora Horizonte S.A.',  complejidad: 'Alta'  },
      { id: 'e5', nombre: 'Distribuidora Inti E.I.R.L.',  complejidad: 'Media' },
      { id: 'e6', nombre: 'Servicios Generales Wari SAC', complejidad: 'Baja'  },
      { id: 'e7', nombre: 'Minera Los Andes S.A.C.',      complejidad: 'Alta'  },
      { id: 'e8', nombre: 'Hostal Qorianka',              complejidad: 'Baja'  },
    ]);

    // Tareas predeterminadas
    this._set('tareas_pred', [
      { id:'tp1', nombre:'Declaración Anual de Renta',   tipo:'anual',   activa:true, descripcion:'Declaración anual del Impuesto a la Renta de tercera categoría ante SUNAT.', creadaEn: this._ts() },
      { id:'tp2', nombre:'Estados Financieros Anuales',  tipo:'anual',   activa:true, descripcion:'Elaboración y presentación de estados financieros del ejercicio fiscal.', creadaEn: this._ts() },
      { id:'tp3', nombre:'Cierre Contable Anual',        tipo:'anual',   activa:true, descripcion:'Cierre del ejercicio: asientos de regularización, depreciación y cierre de cuentas de resultado.', creadaEn: this._ts() },
      { id:'tp4', nombre:'Balance General Anual',        tipo:'anual',   activa:true, descripcion:'Elaboración del balance general y anexos al cierre del ejercicio.', creadaEn: this._ts() },
      { id:'tp5', nombre:'Declaración de Dividendos',    tipo:'anual',   activa:true, descripcion:'Declaración y registro de distribución de dividendos y retenciones asociadas.', creadaEn: this._ts() },
      { id:'tp6', nombre:'Auditoría Interna Anual',      tipo:'anual',   activa:true, descripcion:'Revisión y documentación de controles internos y hallazgos del ejercicio.', creadaEn: this._ts() },
      { id:'tp7', nombre:'PDT 621 — IGV/Renta',          tipo:'mensual', activa:true, descripcion:'Declaración mensual del PDT 621 (IGV y renta) mediante el portal SUNAT.', creadaEn: this._ts() },
      { id:'tp8', nombre:'PLAME — Planilla Mensual',     tipo:'mensual', activa:true, descripcion:'Declaración mensual de planilla electrónica PLAME ante SUNAT.', creadaEn: this._ts() },
      { id:'tp9', nombre:'Registro de Compras',          tipo:'mensual', activa:true, descripcion:'Registro y validación del libro de compras del periodo.', creadaEn: this._ts() },
      { id:'tp10',nombre:'Registro de Ventas',           tipo:'mensual', activa:true, descripcion:'Registro y validación del libro de ventas del periodo.', creadaEn: this._ts() },
      { id:'tp11',nombre:'Conciliación Bancaria',        tipo:'mensual', activa:true, descripcion:'Conciliación de saldos bancarios con la contabilidad del mes.', creadaEn: this._ts() },
      { id:'tp12',nombre:'Liquidación de IGV',           tipo:'mensual', activa:true, descripcion:'Cálculo y liquidación del IGV del periodo tributario.', creadaEn: this._ts() },
    ]);

    // Estructuras vacías
    this._set('asignaciones',    []);
    this._set('tareas_asignadas',[]);
    this._set('historial',       []);
    this._set('comentarios',     []);

    localStorage.setItem('cf_initialized', '1');
    this._migrateTareasPred();
  },

  _migrateTareasPred() {
    const defaults = {
      tp1: 'Declaración anual del Impuesto a la Renta de tercera categoría ante SUNAT.',
      tp2: 'Elaboración y presentación de estados financieros del ejercicio fiscal.',
      tp3: 'Cierre del ejercicio: asientos de regularización, depreciación y cierre de cuentas de resultado.',
      tp4: 'Elaboración del balance general y anexos al cierre del ejercicio.',
      tp5: 'Declaración y registro de distribución de dividendos y retenciones asociadas.',
      tp6: 'Revisión y documentación de controles internos y hallazgos del ejercicio.',
      tp7: 'Declaración mensual del PDT 621 (IGV y renta) mediante el portal SUNAT.',
      tp8: 'Declaración mensual de planilla electrónica PLAME ante SUNAT.',
      tp9: 'Registro y validación del libro de compras del periodo.',
      tp10: 'Registro y validación del libro de ventas del periodo.',
      tp11: 'Conciliación de saldos bancarios con la contabilidad del mes.',
      tp12: 'Cálculo y liquidación del IGV del periodo tributario.',
    };
    const lista = this.getTareasPred().map(p => {
      const descripcion = (p.descripcion != null && String(p.descripcion).trim())
        ? p.descripcion
        : (defaults[p.id] || '');
      return { ...p, descripcion };
    });
    this._set('tareas_pred', lista);
  },

  /* reset completo (para desarrollo) */
  reset() {
    ['usuarios','empresas','tareas_pred','asignaciones',
     'tareas_asignadas','historial','comentarios'].forEach(k => localStorage.removeItem('cf_' + k));
    localStorage.removeItem('cf_initialized');
    localStorage.removeItem('cf_session');
    this.init();
  }
};

// Auto-inicializar
DB.init();
if (localStorage.getItem('cf_initialized')) DB._migrateTareasPred();