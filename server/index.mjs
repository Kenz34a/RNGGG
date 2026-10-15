import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateConfig(v) {
  if (!v || typeof v.announcement !== 'string' || v.announcement.length > 500 || !Number.isFinite(v.luckBonus) || v.luckBonus < 0 || v.luckBonus > 5 || !Number.isSafeInteger(v.eventEndsAt) || v.eventEndsAt < 0 || v.eventEndsAt > 8640000000000000 || !Array.isArray(v.overrides) || v.overrides.length > 2000) throw Error('Cấu hình không hợp lệ');
  const seen = new Set();
  const overrides = v.overrides.map(o => {
    if (!o || !['auras','worlds','recipes','bosses'].includes(o.category) || typeof o.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(o.id) || typeof o.name !== 'string' || !o.name.trim() || o.name.length > 100 || typeof o.description !== 'string' || o.description.length > 1000 || seen.has(`${o.category}/${o.id}`)) throw Error('Nội dung không hợp lệ');
    seen.add(`${o.category}/${o.id}`); return { category: o.category, id: o.id, name: o.name.trim(), description: o.description };
  });
  return { announcement: v.announcement, luckBonus: v.luckBonus, eventEndsAt: v.eventEndsAt, overrides };
}
export async function createApp({ password = process.env.ASTRA_ADMIN_PASSWORD || '', dataDir = process.env.ASTRA_DATA_DIR || '.local/server', secure = process.env.NODE_ENV === 'production', origin = process.env.ASTRA_PUBLIC_ORIGIN } = {}) {
  if (secure && (!origin || !/^https:\/\/[^/]+$/.test(origin))) throw Error('Production requires ASTRA_PUBLIC_ORIGIN as an HTTPS origin without a trailing slash');
  const file = resolve(dataDir, 'config.json');
  let config = { announcement: '', luckBonus: 0, eventEndsAt: 0, overrides: [] }, revision = 0;
  try { const saved = JSON.parse(await readFile(file, 'utf8')); config = validateConfig(saved.config); revision = saved.revision || 0; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const salt = randomBytes(32), hash = scryptSync(password, salt, 64), enabled = password.length >= 16;
  const sessions = new Map(), attempts = new Map(); let saving = false;
  const sweep = setInterval(() => { const now = Date.now(); for (const [k,v] of sessions) if (v.expires < now) sessions.delete(k); for (const [k,v] of attempts) if (v.until < now) attempts.delete(k); }, 60000); sweep.unref();
  const server = http.createServer(async (req,res) => {
    const send = (status, value, headers = {}) => { res.writeHead(status, { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers }); res.end(JSON.stringify(value)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        if (req.method === 'GET' && url.pathname === '/api/config') return send(200, config);
        if (!enabled) return send(503, { error:'Admin chưa được cấu hình. Đặt ASTRA_ADMIN_PASSWORD ít nhất 16 ký tự trên máy chủ rồi khởi động lại.' });
        if (!['GET','POST','PUT'].includes(req.method)) return send(405, { error:'Phương thức không hỗ trợ' });
        if (req.method !== 'GET') {
          const expected = origin || `http://${req.headers.host}`;
          if (req.headers.origin !== expected || !req.headers['content-type']?.startsWith('application/json')) return send(403, { error:'Nguồn yêu cầu không hợp lệ' });
        }
        const body = async () => { let data = ''; for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data) > 1024 * 1024) throw Error('Yêu cầu quá lớn'); } return JSON.parse(data || '{}'); };
        if (req.method === 'POST' && url.pathname === '/api/admin/login') {
          const key = req.socket.remoteAddress, now = Date.now(), a = attempts.get(key);
          if (a && a.until > now && a.count >= 5) return send(429, { error:'Thử lại sau 15 phút' });
          const input = await body();
          if (typeof input.password !== 'string' || input.password.length > 1024) return send(400, { error:'Mật khẩu không hợp lệ' });
          const valid = timingSafeEqual(scryptSync(input.password, salt, 64), hash);
          if (!valid) { attempts.set(key, { count: a && a.until > now ? a.count + 1 : 1, until: now + 900000 }); return send(401, { error:'Sai mật khẩu' }); }
          attempts.delete(key);
          if (sessions.size >= 100) return send(429, { error:'Quá nhiều phiên đăng nhập' });
          const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
          sessions.set(token, { csrf, expires: now + 8 * 3600000 });
          return send(200, { csrf }, { 'Set-Cookie':`astra_admin=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=28800${secure ? '; Secure' : ''}` });
        }
        const token = req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('astra_admin='))?.slice(12), session = sessions.get(token);
        if (!session || session.expires < Date.now()) return send(401, { error:'Vui lòng đăng nhập' });
        if (req.method === 'GET' && url.pathname === '/api/admin/session') return send(200, { csrf:session.csrf, config, revision });
        if (req.headers['x-csrf-token'] !== session.csrf) return send(403, { error:'Phiên xác thực không hợp lệ' });
        if (req.method === 'POST' && url.pathname === '/api/admin/logout') { sessions.delete(token); return send(200, { ok:true }, { 'Set-Cookie':`astra_admin=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0${secure ? '; Secure' : ''}` }); }
        if (req.method === 'PUT' && url.pathname === '/api/admin/config') {
          const input = await body(), next = validateConfig(input.config);
          if (saving || input.revision !== revision) return send(409, { error:'Cấu hình đã thay đổi. Tải lại trang trước khi lưu.' });
          saving = true;
          try { await mkdir(dataDir, {recursive:true, mode:0o700}); await writeFile(`${file}.tmp`, JSON.stringify({ config:next, revision:revision + 1 }), {mode:0o600}); await rename(`${file}.tmp`, file); config = next; revision++; } finally { saving = false; }
          return send(200, { config, revision });
        }
        return send(404, {error:'Không tìm thấy'});
      }
      if (!['GET','HEAD'].includes(req.method)) return send(405, {error:'Phương thức không hỗ trợ'});
      const root = resolve('dist'), path = resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!path.startsWith(root + '/') && path !== root) return send(403, {error:'Không hợp lệ'});
      let content, target = path;
      try { content = await readFile(target); } catch { if (extname(url.pathname)) return send(404, {error:'Không tìm thấy'}); target = resolve(root,'index.html'); content = await readFile(target); }
      const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.png':'image/png'};
      res.writeHead(200, { 'Content-Type':mime[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'same-origin', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (e) { send(e instanceof SyntaxError || /hợp lệ|quá lớn/.test(e.message) ? 400 : 500, {error: e instanceof SyntaxError ? 'JSON không hợp lệ' : /hợp lệ|quá lớn/.test(e.message) ? e.message : 'Không thể xử lý yêu cầu'}); }
  });
  server.on('close',()=>clearInterval(sweep)); return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { const server = await createApp(); server.listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('ASTRA server ready')); }
