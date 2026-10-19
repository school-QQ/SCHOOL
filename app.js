const C=window.CFG,sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={classes:[],students:[],pays:[],set:{},open:{},flt:'all',me:null};let ASK=null;const A={};
const ym=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const today=()=>{const d=new Date();return ym()+'-'+String(d.getDate()).padStart(2,'0')};
const toast=(m,bad)=>{const t=$('#toast');t.textContent=m;t.className=bad?'bad show':'show';setTimeout(()=>t.className='',3500)};
const M=h=>{$('#modal').innerHTML='<div class="box">'+h+'</div>';$('#modal').hidden=false};
const closeM=()=>{$('#modal').hidden=true};
const F=(id,l,v,t)=>`<label>${l}<input id="${id}" type="${t||'text'}" value="${esc(v==null?'':v)}"></label>`;
const mail=u=>u.trim().toLowerCase()+'@qualitycenter.app';
// ---- الحسابات
const feeOf=s=>Number(s.fee!=null?s.fee:(S.set.monthly_fee||0));
const mp=s=>S.pays.filter(p=>p.student_id===s.id&&p.paid_on.startsWith(ym()));
const paidM=s=>mp(s).reduce((a,p)=>a+Number(p.amount),0);
const remain=s=>Math.max(feeOf(s)-paidM(s),0);
const unpaid=s=>(C.UNPAID_MODE==='remaining'&&feeOf(s)>0)?remain(s)>0:paidM(s)===0;
const status=s=>{const p=paidM(s),f=feeOf(s);return p===0?['لم يدفع','r']:(f>0&&p<f)?['دفع جزءاً','y']:['مدفوع','g']};
const cn=s=>(S.classes.find(c=>c.id===s.class_id)||{}).name||'';
const wa=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d=C.DEFAULT_COUNTRY_CODE+d.slice(1);else if(d.length<=9)d=C.DEFAULT_COUNTRY_CODE+d;return d};
const acts=s=>`<div class="act">${s.phone?`<a href="tel:${esc(s.phone)}">📞</a><a href="https://wa.me/${wa(s.phone)}" target="_blank" rel="noopener">💬</a>`:''}<button data-a="edit" data-id="${s.id}">✏️</button></div>`;
// ---- الدخول
function loginView(msg){$('#bar').hidden=true;$('#main').innerHTML=`<div class="login"><h3>تسجيل الدخول</h3>${F('u','اسم المستخدم')}${F('p','كلمة السر','','password')}<p class="err" id="le">${msg||''}</p><button class="pri" style="width:100%" data-a="login">دخول</button></div>`}
function passView(){$('#bar').hidden=true;$('#main').innerHTML=`<div class="login"><h3>تغيير كلمة السر</h3><p class="note">هذا أول دخول لك، اختر كلمة سر جديدة.</p>${F('np','كلمة السر الجديدة','','password')}${F('np2','أعد كتابتها','','password')}<p class="err" id="pe"></p><button class="pri" style="width:100%" data-a="chp">حفظ</button></div>`}
A.login=async()=>{const{error}=await sb.auth.signInWithPassword({email:mail($('#u').value),password:$('#p').value});if(error)return $('#le').textContent='اسم المستخدم أو كلمة السر غير صحيحة';boot()};
A.chp=async()=>{const a=$('#np').value;if(a.length<6)return $('#pe').textContent='6 أحرف على الأقل';if(a!==$('#np2').value)return $('#pe').textContent='الكلمتان غير متطابقتين';
 const{error}=await sb.auth.updateUser({password:a});if(error)return $('#pe').textContent=error.message;
 const r=await sb.rpc('clear_must_change');if(r.error)return $('#pe').textContent=r.error.message;boot()};
A.out=async()=>{await sb.auth.signOut();boot()};
async function boot(){const{data:{session}}=await sb.auth.getSession();if(!session)return loginView();
 const{data:p,error}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
 if(error||!p){await sb.auth.signOut();return loginView('هذا الحساب غير مفعّل في النظام')}
 S.me=p;if(p.must_change)return passView();
 $('#bar').hidden=false;$('#admb').hidden=p.role!=='admin';
 $('#main').innerHTML=`<div class="tools"><input id="q" placeholder="🔍 بحث عن طالب" oninput="render()"><button class="chip" data-a="flt" data-k="all">الكل</button><button class="chip" data-a="flt" data-k="sib">لديه أخ</button><button class="chip" data-a="flt" data-k="unp">لم يدفعوا هذا الشهر</button></div><div id="list"></div>`;
 await load()}
async function load(){const R=await Promise.all([sb.from('classes').select('*').order('sort'),sb.from('students').select('*').order('name'),sb.from('payments').select('*').order('paid_on',{ascending:false}),sb.from('settings').select('*')]);
 const e=R.map(r=>r.error).find(Boolean);if(e)return toast('خطأ في تحميل البيانات: '+e.message,1);
 S.classes=R[0].data;S.students=R[1].data;S.pays=R[2].data;S.set=Object.fromEntries(R[3].data.map(r=>[r.key,r.value]));render()}
// ---- العرض
const row=s=>{const st=status(s);return `<div class="row"><div class="nm" data-a="prof" data-id="${s.id}">${esc(s.name)}${s.has_sibling?' 👫':''}<br><span class="b ${st[1]}">${st[0]}</span></div>${acts(s)}</div>`};
const card=s=>`<div class="card"><h3 data-a="prof" data-id="${s.id}">${esc(s.name)}</h3>الصف: ${esc(cn(s))}<br>ولي الأمر: ${esc(s.guardian_name||'-')}<br>الجوال: ${esc(s.phone||'-')}<br>الرسوم: ${feeOf(s)} | المدفوع: ${paidM(s)} | المتبقي: <b>${remain(s)}</b>${acts(s)}</div>`;
function render(){if(!$('#list'))return;$('#title').textContent=S.set.title||'مركز جودة التعليم';
 document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.k===S.flt));
 const q=($('#q').value||'').trim(),m=s=>!q||s.name.includes(q);let h='';
 if(S.flt==='unp'){const L=S.students.filter(s=>unpaid(s)&&m(s));h=`<button class="pri" style="width:100%;margin-bottom:10px" data-a="dl" data-t="unpaid">⬇️ تحميل هذه القائمة (Word)</button>`+(L.map(card).join('')||'<p class="empty">الجميع دفع هذا الشهر ✅</p>')}
 else h=S.classes.map(c=>{const L=S.students.filter(s=>s.class_id===c.id&&m(s)&&(S.flt!=='sib'||s.has_sibling)),op=S.open[c.id]||q;
  return `<section class="cls"><div class="ch"><button class="ct" data-a="tog" data-id="${c.id}">${op?'▾':'▸'} 📁 ${esc(c.name)} <b>${L.length}</b></button><button data-a="ren" data-id="${c.id}">✏️</button><button data-a="dl" data-t="class" data-id="${c.id}">⬇️</button></div>${op?(L.map(row).join('')||'<p class="empty">لا يوجد طلاب</p>'):''}</section>`}).join('');
 $('#list').innerHTML=h}
// ---- الحفظ الحقيقي (يتأكد أن السطر رجع من قاعدة البيانات)
async function db(q,ok){const{data,error}=await q.select();if(error||!data||!data.length){toast('⚠️ لم يُحفظ! '+(error?error.message:'تحقق من الصلاحيات'),1);return false}closeM();await load();toast(ok||'تم الحفظ في قاعدة البيانات ✅');return true}
A.flt=d=>{S.flt=d.k;render()};A.tog=d=>{S.open[d.id]=!S.open[d.id];render()};A.x=closeM;
A.add=()=>M(`<h3>إضافة وتعديل</h3><button class="pri" style="width:100%;margin-bottom:8px" data-a="newS">➕ طالب جديد</button><button style="width:100%;margin-bottom:8px" data-a="newC">📁 إضافة صف/خانة جديدة</button><button style="width:100%;margin-bottom:8px" data-a="ttl">📝 تعديل عنوان الموقع</button><button style="width:100%;margin-bottom:8px" data-a="fee">💰 تحديد الرسوم الشهرية الثابتة</button><button style="width:100%" data-a="x">إغلاق</button>`);
function ask(t,v,fn){M(`<h3>${t}</h3><input id="ask" value="${esc(v)}"><div class="bt"><button class="pri" data-a="askOk">حفظ</button><button data-a="x">إلغاء</button></div>`);ASK=fn}
A.askOk=async()=>{const v=$('#ask').value.trim();if(v)await ASK(v)};
A.newC=()=>ask('اسم الصف الجديد','',v=>db(sb.from('classes').insert({name:v,sort:Math.max(0,...S.classes.map(c=>c.sort))+1}),'تمت إضافة الصف ✅'));
A.ren=d=>{const c=S.classes.find(x=>x.id==d.id);ask('تعديل اسم الصف',c.name,v=>db(sb.from('classes').update({name:v}).eq('id',c.id)))};
A.ttl=()=>ask('عنوان الموقع',S.set.title||'',v=>db(sb.from('settings').upsert({key:'title',value:v})));
A.fee=()=>ask('الرسوم الشهرية (رقم)',S.set.monthly_fee||'0',v=>isNaN(+v)?toast('اكتب رقماً',1):db(sb.from('settings').upsert({key:'monthly_fee',value:String(+v)})));
function stuForm(s){s=s||{};M(`<h3>${s.id?'تعديل طالب':'طالب جديد'}</h3>${F('f_n','اسم الطالب',s.name)}<label>الصف<select id="f_c">${S.classes.map(c=>`<option value="${c.id}" ${c.id===s.class_id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>${F('f_g','اسم ولي الأمر',s.guardian_name)}${F('f_p','جوال ولي الأمر (مع رمز الدولة لغير السعودية)',s.phone,'tel')}<label class="ck"><input id="f_s" type="checkbox" ${s.has_sibling?'checked':''}> لديه أخ</label>${F('f_f','رسوم هذا الطالب (فارغ = الرسوم العامة)',s.fee,'number')}<div class="bt"><button class="pri" data-a="saveS" data-id="${s.id||''}">💾 حفظ</button><button data-a="x">إلغاء</button></div>${s.id?`<button class="dn" data-a="delS" data-id="${s.id}">🗑 حذف الطالب</button>`:''}`)}
A.newS=()=>stuForm();A.edit=d=>stuForm(S.students.find(x=>x.id==d.id));
A.saveS=d=>{const r={name:$('#f_n').value.trim(),class_id:+$('#f_c').value,guardian_name:$('#f_g').value.trim(),phone:$('#f_p').value.trim(),has_sibling:$('#f_s').checked,fee:$('#f_f').value===''?null:+$('#f_f').value};
 if(!r.name||!r.class_id)return toast('اكتب اسم الطالب واختر الصف',1);
 return db(d.id?sb.from('students').update(r).eq('id',d.id):sb.from('students').insert(r))};
A.delS=d=>{if(confirm('سيُحذف الطالب وكل مدفوعاته نهائياً. متأكد؟'))db(sb.from('students').delete().eq('id',d.id),'تم الحذف')};
function prof(id){const s=S.students.find(x=>x.id==id);if(!s)return;const P=S.pays.filter(p=>p.student_id==id),st=status(s);
 M(`<h3>${esc(s.name)} <span class="b ${st[1]}">${st[0]}</span></h3>الصف: ${esc(cn(s))}<br>ولي الأمر: ${esc(s.guardian_name||'-')}<br>الجوال: ${esc(s.phone||'-')}<br>لديه أخ: ${s.has_sibling?'✔️ نعم':'لا'}<br>الرسوم: ${feeOf(s)} | مدفوع هذا الشهر: ${paidM(s)} | المتبقي: <b>${remain(s)}</b>${acts(s)}<h4>المدفوعات</h4>${P.map(p=>`<div class="py"><span>${p.paid_on}</span><b>${p.amount}</b><button data-a="delP" data-id="${p.id}" data-s="${id}">✖</button></div>`).join('')||'<p class="empty">لا توجد مدفوعات</p>'}<h4>تسجيل دفعة</h4>${F('p_a','المبلغ','','number')}${F('p_d','تاريخ الإيداع',today(),'date')}<div class="bt"><button class="pri" data-a="addP" data-id="${id}">➕ تسجيل</button><button data-a="dl" data-t="student" data-id="${id}">⬇️ تحميل</button><button data-a="x">إغلاق</button></div>`)}
A.prof=d=>prof(d.id);
A.addP=async d=>{const a=+$('#p_a').value,dt=$('#p_d').value;if(!(a>0)||!dt)return toast('اكتب المبلغ والتاريخ',1);
 const{data,error}=await sb.from('payments').insert({student_id:+d.id,amount:a,paid_on:dt}).select();
 if(error||!data.length)return toast('⚠️ لم يُحفظ! '+(error?error.message:''),1);await load();prof(d.id);toast('تم تسجيل الدفعة ✅')};
A.delP=async d=>{if(!confirm('حذف هذه الدفعة؟'))return;const{error}=await sb.from('payments').delete().eq('id',d.id);if(error)return toast(error.message,1);await load();prof(d.s)};
// ---- المدير
A.adm=async()=>{const{data}=await sb.from('profiles').select('username,role').order('username');
 M(`<h3>لوحة تحكم المدير</h3><h4>الحسابات</h4>${(data||[]).map(p=>`<div class="py"><span>${esc(p.username)}</span><b>${p.role==='admin'?'مدير':'موظف'}</b></div>`).join('')}<h4>إضافة حساب جديد</h4>${F('n_u','اسم المستخدم (إنجليزي)')}${F('n_p','كلمة سر مؤقتة (6 أحرف فأكثر)')}<p class="note">سيُطلب منه تغييرها فور أول دخول.</p><div class="bt"><button class="pri" data-a="mk">إنشاء الحساب</button><button data-a="x">إغلاق</button></div>`)};
A.mk=async()=>{const{data:{session}}=await sb.auth.getSession();
 const r=await fetch('/api/create-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({username:$('#n_u').value.trim(),password:$('#n_p').value})});
 const j=await r.json().catch(()=>({}));if(!r.ok)return toast(j.error||'فشل إنشاء الحساب',1);toast('تم إنشاء الحساب ✅');A.adm()};
// ---- التحميل Word
const COLS=[['name','الاسم',s=>s.name],['cls','الصف',cn],['g','ولي الأمر',s=>s.guardian_name||''],['ph','رقم التواصل',s=>s.phone||''],['paid','المدفوع هذا الشهر',paidM],['rem','المتبقي',remain],['dt','تواريخ الدفع',s=>mp(s).map(p=>p.paid_on+' ('+p.amount+')').join('، ')]];
A.dl=d=>M(`<h3>تحميل جدول (Word)</h3><p>اختر الخانات المطلوبة:</p>${COLS.map(c=>`<label class="ck"><input type="checkbox" class="dk" value="${c[0]}" ${['name','ph','paid'].includes(c[0])?'checked':''}> ${c[1]}</label>`).join('')}<div class="bt"><button class="pri" data-a="doDl" data-t="${d.t}" data-id="${d.id||''}">⬇️ تنزيل</button><button data-a="x">إلغاء</button></div>`);
A.doDl=async d=>{const k=[...document.querySelectorAll('.dk:checked')].map(x=>x.value);if(!k.length)return toast('اختر خانة واحدة على الأقل',1);
 let L,t;if(d.t==='class'){L=S.students.filter(s=>s.class_id==d.id);t='الصف: '+S.classes.find(c=>c.id==d.id).name}else if(d.t==='student'){L=S.students.filter(s=>s.id==d.id);t='الطالب: '+L[0].name}else{L=S.students.filter(unpaid);t='لم يدفعوا هذا الشهر'}
 try{const D=docx,cols=COLS.filter(c=>k.includes(c[0]));
  const cell=(x,b,f)=>new D.TableCell({shading:f?{fill:'DDEBF7'}:undefined,children:[new D.Paragraph({bidirectional:true,children:[new D.TextRun({text:String(x),bold:b,rightToLeft:true,font:'Arial',size:22})]})]});
  const tb=new D.Table({visuallyRightToLeft:true,width:{size:100,type:D.WidthType.PERCENTAGE},rows:[new D.TableRow({tableHeader:true,children:cols.map(c=>cell(c[1],true,true))}),...L.map(s=>new D.TableRow({children:cols.map(c=>cell(c[2](s),false))}))]});
  const P=(x,b)=>new D.Paragraph({bidirectional:true,spacing:{after:150},children:[new D.TextRun({text:x,bold:b,rightToLeft:true,font:'Arial',size:b?30:22})]});
  const doc=new D.Document({sections:[{children:[P(S.set.title||'مركز جودة التعليم',true),P(t+' — '+today()),tb]}]});
  const blob=await D.Packer.toBlob(doc),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='جدول-'+today()+'.docx';a.click();closeM()}
 catch(e){toast('تعذر إنشاء الملف: '+e.message,1)}};
// ---- الأحداث
document.addEventListener('click',e=>{if(e.target.id==='modal')return closeM();const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='p')A.login()});
boot();
