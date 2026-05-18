import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');

for (const f of ['vista_admin.html', 'vista_supervisor.html', 'vista_directivo.html']) {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, 'utf8');
  const tag = '</html>';
  const idx = s.indexOf(tag);
  if (idx >= 0) {
    s = s.slice(0, idx + tag.length);
    // vista_admin: garbage was inside <script> — restore footer if missing
    if (!s.includes('function logout()')) {
      const ins = "\nfunction logout(){ DB.clearSession(); window.location.href='login.html'; }\n</script>\n</body>\n</html>";
      const si = s.lastIndexOf('function goToDetalle');
      if (si >= 0) {
        const close = s.indexOf('}', s.indexOf('detalle_tarea.html', si));
        if (close >= 0) {
          s = s.slice(0, close + 1) + ins;
        }
      }
    }
    fs.writeFileSync(p, s, 'utf8');
    console.log('OK', f, s.split(/\r?\n/).length, 'lines');
  }
}
