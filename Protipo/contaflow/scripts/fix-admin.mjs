import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'vista_admin.html');
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('__DEL3__');
const logout = s.indexOf('function logout()', start >= 0 ? start : 0);
if (start >= 0 && logout > start) {
  s = s.slice(0, start) + s.slice(logout);
  fs.writeFileSync(p, s, 'utf8');
  console.log('Fixed admin, lines:', s.split(/\r?\n/).length);
} else {
  console.log('No marker found', start, logout);
}
