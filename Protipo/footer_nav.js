/* Footer global: Dashboard desplegable + Feedback → encuesta_v2.html */
(function () {
  const FEEDBACK_URL = 'encuesta_v2.html';

  function toggleDashMenu() {
    const menu = document.getElementById('dashMenu');
    const chevron = document.getElementById('dashChevron');
    if (!menu) return;
    const open = menu.style.display === 'block';
    menu.style.display = open ? 'none' : 'block';
    if (chevron) chevron.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
  }

  function irDashboard(event, url) {
    if (event) event.preventDefault();
    window.location.href = url || 'dashboard.html';
  }

  function goFeedback() {
    window.location.href = FEEDBACK_URL;
  }

  window.toggleDashMenu = toggleDashMenu;
  window.irDashboard = irDashboard;
  window.goFeedback = goFeedback;

  function wireExistingFooter() {
    const fb = document.getElementById('btnFeedback');
    if (fb) {
      fb.onclick = goFeedback;
      fb.removeAttribute('onclick');
      fb.addEventListener('click', goFeedback);
    }
    document.querySelectorAll('.btn-feedback').forEach(btn => {
      btn.onclick = goFeedback;
    });
    document.addEventListener('click', function (e) {
      const toggle = document.getElementById('btnDashToggle');
      const menu = document.getElementById('dashMenu');
      if (!menu || !toggle) return;
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
        const chevron = document.getElementById('dashChevron');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  function injectFooter() {
    if (document.getElementById('footerBar')) {
      wireExistingFooter();
      return;
    }
    document.body.classList.add('has-app-footer');
    const spacer = document.createElement('div');
    spacer.style.height = '52px';
    spacer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spacer);

    const bar = document.createElement('div');
    bar.id = 'footerBar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:300',
      'height:52px', 'background:#0a2041',
      'border-top:1px solid rgba(1,173,243,.18)',
      'display:flex', 'align-items:center', 'justify-content:space-between',
      'padding:0 24px', 'box-shadow:0 -2px 16px rgba(10,32,65,.25)',
    ].join(';');

    bar.innerHTML = `
      <div style="position:relative">
        <button type="button" id="btnDashToggle" style="
          display:inline-flex;align-items:center;gap:8px;
          padding:8px 16px;border-radius:8px;border:1.5px solid rgba(1,173,243,.35);
          background:rgba(1,173,243,.1);color:#01adf3;
          font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.3px;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Dashboard
          <svg id="dashChevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition:transform .2s"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <div id="dashMenu" style="
          display:none;position:absolute;bottom:calc(100% + 8px);left:0;
          background:#0a2041;border:1.5px solid rgba(1,173,243,.25);
          border-radius:10px;min-width:210px;
          box-shadow:0 -8px 24px rgba(10,32,65,.4);overflow:hidden;z-index:400;
        ">
          <div style="padding:8px 14px 6px;font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,.08)">
            Ir a módulo
          </div>
          <a href="dashboard.html" style="
            display:flex;align-items:center;gap:10px;padding:11px 16px;
            color:rgba(255,255,255,.85);font-size:13px;text-decoration:none;
            border-bottom:1px solid rgba(255,255,255,.06);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Inicio / Dashboard
            <span style="margin-left:auto;font-size:10px;background:rgba(1,173,243,.2);color:#01adf3;padding:2px 7px;border-radius:10px;font-weight:700">INICIO</span>
          </a>
          <div style="padding:8px 16px 10px;font-size:11px;color:rgba(255,255,255,.3);display:flex;align-items:center;gap:6px">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
            Sesión activa — sin re-login
          </div>
        </div>
      </div>
      <button type="button" id="btnFeedback" style="
        display:inline-flex;align-items:center;gap:8px;
        padding:8px 16px;border-radius:8px;border:1.5px solid rgba(255,255,255,.15);
        background:transparent;color:rgba(255,255,255,.6);
        font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.3px;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        Feedback
      </button>`;

    bar.querySelector('#btnDashToggle').addEventListener('click', toggleDashMenu);
    bar.querySelector('a[href="dashboard.html"]').addEventListener('click', e => irDashboard(e, 'dashboard.html'));
    document.body.appendChild(bar);
    wireExistingFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }
})();
