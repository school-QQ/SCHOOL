-- الخطوة 2: بعد إنشاء مستخدم المدير من Authentication > Users (a@qualitycenter.app) شغّل هذا
insert into profiles(id,username,role,must_change) select id,'A','admin',false from auth.users where email='a@qualitycenter.app';
