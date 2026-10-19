// دالة خادم (Vercel) — تنشئ حساباً جديداً، للمدير فقط. المفتاح السري يُخزَّن في إعدادات Vercel وليس في الكود.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'طريقة غير مسموحة' });
  const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) return res.status(500).json({ error: 'إعدادات Vercel ناقصة (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' });
  const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
  const tok = (req.headers.authorization || '').replace('Bearer ', '');
  const me = await fetch(U + '/auth/v1/user', { headers: { apikey: K, Authorization: 'Bearer ' + tok } }).then(r => r.json()).catch(() => ({}));
  if (!me.id) return res.status(401).json({ error: 'غير مسجّل الدخول' });
  const pr = await fetch(`${U}/rest/v1/profiles?id=eq.${me.id}&select=role`, { headers: H }).then(r => r.json()).catch(() => []);
  if (!pr[0] || pr[0].role !== 'admin') return res.status(403).json({ error: 'هذه الميزة للمدير فقط' });
  const { username, password } = req.body || {};
  if (!/^[A-Za-z0-9_.-]{1,30}$/.test(username || '')) return res.status(400).json({ error: 'اسم المستخدم: حروف إنجليزية وأرقام فقط' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'كلمة السر 6 أحرف على الأقل' });
  const email = username.toLowerCase() + '@qualitycenter.app';
  const cu = await fetch(U + '/auth/v1/admin/users', { method: 'POST', headers: H, body: JSON.stringify({ email, password, email_confirm: true }) });
  const u = await cu.json();
  if (!cu.ok) return res.status(400).json({ error: u.msg || u.message || 'فشل إنشاء الحساب (ربما الاسم مستخدم)' });
  const ip = await fetch(U + '/rest/v1/profiles', { method: 'POST', headers: H, body: JSON.stringify({ id: u.id, username, role: 'staff', must_change: true }) });
  if (!ip.ok) { await fetch(`${U}/auth/v1/admin/users/${u.id}`, { method: 'DELETE', headers: H }); return res.status(500).json({ error: 'فشل حفظ الحساب' }); }
  res.json({ ok: true });
};
