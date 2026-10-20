const C=window.CFG,sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={classes:[],students:[],pays:[],set:{},open:{},openU:{},view:"home",exp:[],expErr:false,ey:String(new Date().getFullYear()),em:String(new Date().getMonth()+1).padStart(2,"0"),eo:{},ec:"",flt:'all',me:null};let ASK=null;const A={};
const ym=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const today=()=>{const d=new Date();return ym()+'-'+String(d.getDate()).padStart(2,'0')};
const toast=(m,bad)=>{const t=$('#toast');t.textContent=m;t.className=bad?'bad show':'show';setTimeout(()=>t.className='',3500)};
const M=h=>{$('#modal').innerHTML='<div class="box">'+h+'</div>';$('#modal').hidden=false};
const closeM=()=>{$('#modal').hidden=true};
const F=(id,l,v,t)=>`<label>${l}<input id="${id}" type="${t||'text'}" value="${esc(v==null?'':v)}"></label>`;
const mail=u=>u.trim().toLowerCase()+'@qualitycenter.app';
// ---- الحسابات
const feeOf=s=>Number(s.fee!=null?s.fee:(S.set.total_fee||S.set.monthly_fee||0));
const mp=s=>S.pays.filter(p=>p.student_id===s.id&&p.paid_on.startsWith(ym()));
const allp=s=>S.pays.filter(p=>p.student_id===s.id);
const sum=L=>L.reduce((a,p)=>a+Number(p.amount),0);
const paidM=s=>sum(mp(s)),paidA=s=>sum(allp(s));
const remain=s=>Math.max(feeOf(s)-paidA(s),0);
const unpaid=s=>(C.UNPAID_MODE==='remaining'&&feeOf(s)>0)?remain(s)>0:paidM(s)===0;
const status=s=>{const p=paidA(s),f=feeOf(s);return p===0?['لم يدفع','r']:f===0?['تم الدفع','g']:p<f?['دفع جزءاً','y']:['مدفوع كامل','g']};
const money=n=>Number(n).toLocaleString('en');
const cn=s=>(S.classes.find(c=>c.id===s.class_id)||{}).name||'';
const wa=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d=C.DEFAULT_COUNTRY_CODE+d.slice(1);else if(d.length<=9)d=C.DEFAULT_COUNTRY_CODE+d;return d};
const IC={ph:'<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',wa:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.2-4.6A8 8 0 1 1 21 12z"/><path d="M9 9.5c.5 2.5 2.5 4.5 5 5l1-1.5-2-1-.8.8c-.8-.4-1.5-1.1-1.9-1.9l.8-.8-1-2z"/></svg>',ed:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/></svg>',dl:'<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>'};
const acts=s=>`<div class="act">${s.phone?`<a class="ib" href="tel:${esc(s.phone)}" title="اتصال">${IC.ph}</a><a class="ib wa" href="https://wa.me/${wa(s.phone)}" target="_blank" rel="noopener" title="واتساب">${IC.wa}</a>`:''}<button class="ib" data-a="edit" data-id="${s.id}" title="تعديل">${IC.ed}</button></div>`;
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
 S.view='home';await load()}
async function load(){const R=await Promise.all([sb.from('classes').select('*').order('sort'),sb.from('students').select('*').order('name'),sb.from('payments').select('*').order('paid_on',{ascending:false}),sb.from('settings').select('*')]);
 const e=R.map(r=>r.error).find(Boolean);if(e)return toast('خطأ في تحميل البيانات: '+e.message,1);
 S.classes=R[0].data;S.students=R[1].data;S.pays=R[2].data;S.set=Object.fromEntries(R[3].data.map(r=>[r.key,r.value]));const X=await sb.from('expenses').select('*').order('spent_on',{ascending:false});S.expErr=!!X.error;S.exp=X.error?[]:X.data;refresh()}
// ---- التنقل: الرئيسية / الطلاب / المصروفات
const STU_HTML=`<div class="tools"><input id="q" placeholder="ابحث عن طالب..." oninput="render()"><div class="chips"><button class="chip" data-a="flt" data-k="all">الكل</button><button class="chip" data-a="flt" data-k="unp">لم يدفعوا هذا الشهر</button></div></div><div id="list"></div>`;
const MN=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function refresh(){const v=S.view;$('#bar').hidden=false;$('#homeb').hidden=v==='home';$('#addb').hidden=v!=='students';$('#admb').hidden=!S.me||S.me.role!=='admin';
 if(v==='students'){if(!$('#list'))$('#main').innerHTML=STU_HTML;render()}else if(v==='exp')expView();else homeView()}
function go(v){S.view=v;$('#main').innerHTML='';refresh()}
A.go=d=>go(d.v);A.home=()=>go('home');
function homeView(){const m=ym(),tm=S.exp.filter(e=>e.spent_on.startsWith(m)).reduce((a,e)=>a+Number(e.amount),0);
 $('#main').innerHTML=`<div class="tiles"><button class="tile" data-a="go" data-v="students"><span class="ti">🎓</span>الطلاب<small>${S.students.length} طالب</small></button><button class="tile" data-a="go" data-v="exp"><span class="ti">🧾</span>المصروفات<small>هذا الشهر: ${money(tm)}</small></button></div>`}
const lst=k=>{try{const a=JSON.parse(S.set[k]||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
const expFilt=()=>S.exp.filter(e=>e.spent_on.slice(0,4)===S.ey&&(S.em==='00'||e.spent_on.slice(5,7)===S.em)&&(!S.ec||e.category===S.ec));
function expView(){if(S.expErr){$('#main').innerHTML='<div class="card"><div class="det"><p>جدول المصروفات غير مُنشأ بعد. شغّل ملف step3-expenses.sql في Supabase (SQL Editor) ثم حدّث الصفحة.</p></div></div>';return}
 if(S.ec&&!lst('exp_reasons').includes(S.ec))S.ec='';
 const years=[...new Set([String(new Date().getFullYear()),S.ey,...S.exp.map(e=>e.spent_on.slice(0,4))])].sort().reverse();
 $('#main').innerHTML=`<div class="tools"><div class="fl"><select id="ey">${years.map(y=>`<option ${y===S.ey?'selected':''}>${y}</option>`).join('')}</select><select id="em"><option value="00">كل الأشهر</option>${MN.map((n,i)=>{const v=String(i+1).padStart(2,'0');return `<option value="${v}" ${v===S.em?'selected':''}>${n}</option>`}).join('')}</select></div><select id="ec"><option value="">كل الأسباب</option>${lst('exp_reasons').map(c=>`<option ${c===S.ec?'selected':''}>${esc(c)}</option>`).join('')}</select><div class="bt"><button class="pri" data-a="newE">➕ إضافة مصروف</button><button data-a="lists">📋 الأسماء والأسباب</button></div></div><div id="elist"></div>`;
 $('#ey').onchange=e=>{S.ey=e.target.value;expList()};$('#em').onchange=e=>{S.em=e.target.value;expList()};$('#ec').onchange=e=>{S.ec=e.target.value;expList()};expList()}
function expList(){const L=expFilt(),G={};
 L.forEach(e=>{const k=e.spent_on.slice(0,7);(G[k]=G[k]||[]).push(e)});
 const tot=L.reduce((a,e)=>a+Number(e.amount),0);
 let h=`<div class="sumbar"><span>إجمالي المصروفات (${L.length})</span><b>${money(tot)}</b></div>`;
 h+=Object.keys(G).map(k=>{const op=(k in S.eo)?S.eo[k]:S.em!=='00',T=G[k].reduce((a,e)=>a+Number(e.amount),0);
  return `<section class="cls"><div class="ch"><button class="ct" data-a="togE" data-k="${k}">${op?'▾':'▸'} 📅 ${MN[+k.slice(5)-1]} ${k.slice(0,4)} <b>${money(T)}</b></button></div>${op?G[k].map(e=>`<div class="row"><div class="av">🧾</div><div class="nm"><div class="n">${esc(e.name)}</div><div class="sub">${e.category?`<span class="b cat">${esc(e.category)}</span>`:''}<span>${e.spent_on}</span></div></div><div class="amt">${money(e.amount)}</div><button class="ib" data-a="editE" data-id="${e.id}" title="تعديل">${IC.ed}</button></div>`).join(''):''}</section>`}).join('')||'<p class="empty">لا توجد مصروفات في هذه الفترة</p>';
 if(L.length)h+='<button class="pri" style="width:100%;margin:6px 0 24px" data-a="dlE">⬇️ تحميل الجدول (PDF / Word)</button>';
 $('#elist').innerHTML=h}
A.togE=d=>{const op=(d.k in S.eo)?S.eo[d.k]:S.em!=='00';S.eo[d.k]=!op;expList()};
const opt=(a,v)=>'<option value="">اختر...</option>'+(v&&!a.includes(v)?[v,...a]:a).map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
function expForm(e){e=e||{};const nn=lst('exp_names'),rr=lst('exp_reasons');M(`<h3>${e.id?'تعديل مصروف':'مصروف جديد'}</h3>${(!nn.length||!rr.length)?'<p class="note">أضف الأسماء والأسباب أولاً من زر «الأسماء والأسباب» في الأعلى.</p>':''}<label>الاسم<select id="x_n">${opt(nn,e.name)}</select></label><label>سبب المصروف<select id="x_c">${opt(rr,e.category)}</select></label>${F('x_a','المبلغ',e.amount,'number')}${F('x_d','التاريخ',e.spent_on||today(),'date')}<div class="bt"><button class="pri" data-a="saveE" data-id="${e.id||''}">💾 حفظ</button><button data-a="x">إلغاء</button></div>${e.id?`<button class="dn" data-a="delE" data-id="${e.id}">🗑 حذف المصروف</button>`:''}`)}
A.newE=()=>expForm();A.editE=d=>expForm(S.exp.find(x=>x.id==d.id));
A.saveE=d=>{const r={name:$('#x_n').value,category:$('#x_c').value,amount:+$('#x_a').value,spent_on:$('#x_d').value};if(!r.name||!r.category||!(r.amount>0)||!r.spent_on)return toast('اختر الاسم والسبب واكتب المبلغ والتاريخ',1);
 S.ey=r.spent_on.slice(0,4);S.em=r.spent_on.slice(5,7);S.eo[r.spent_on.slice(0,7)]=true;
 return db(d.id?sb.from('expenses').update(r).eq('id',d.id):sb.from('expenses').insert(r),'تم حفظ المصروف ✅')};
A.delE=d=>{if(confirm('حذف هذا المصروف؟'))db(sb.from('expenses').delete().eq('id',d.id),'تم الحذف')};
function listsM(){const blk=(k,t,ph,id)=>`<h4>${t}</h4>${lst(k).map((n,i)=>`<div class="py"><span>${esc(n)}</span><button data-a="delL" data-k="${k}" data-i="${i}">✖</button></div>`).join('')||'<p class="note">لا يوجد شيء بعد</p>'}<div class="addl"><input id="${id}" placeholder="${ph}"><button class="pri" data-a="addL" data-k="${k}" data-f="${id}">➕ إضافة</button></div>`;
 M(`<h3>الأسماء والأسباب</h3>${blk('exp_names','الأسماء','اسم جديد','l_n')}${blk('exp_reasons','الأسباب','سبب جديد','l_r')}<button style="width:100%;margin-top:14px" data-a="x">إغلاق</button>`)}
async function saveL(k,a){const{data,error}=await sb.from('settings').upsert({key:k,value:JSON.stringify(a)}).select();if(error||!data||!data.length)return toast('⚠️ لم يُحفظ! '+(error?error.message:''),1);await load();listsM();toast('تم الحفظ ✅')}
A.lists=listsM;
A.addL=d=>{const v=$('#'+d.f).value.trim();if(!v)return;const a=lst(d.k);if(a.includes(v))return toast('موجود مسبقاً',1);saveL(d.k,[...a,v])};
A.delL=d=>{const a=lst(d.k);if(!confirm('حذف «'+a[d.i]+'» من القائمة؟ (المصروفات المسجلة لا تتأثر)'))return;a.splice(+d.i,1);saveL(d.k,a)};
// ---- العرض
const row=s=>{const st=status(s);return `<div class="row"><div class="av">${esc([...s.name.trim()][0]||'؟')}</div><div class="nm" data-a="prof" data-id="${s.id}"><div class="n">${esc(s.name)}${s.has_sibling?'<span class="sib">لديه أخ</span>':''}</div><div class="sub"><span class="b ${st[1]}">${st[0]}</span><span>هذا الشهر <b>${money(paidM(s))}</b></span><span>المتبقي <b>${money(remain(s))}</b></span></div></div>${acts(s)}</div>`};
const kv=(a,b)=>`<div class="kv"><span>${a}</span><b>${b}</b></div>`;
const card=s=>{const o=S.openU[s.id];return `<div class="card"><div class="ch2" data-a="tu" data-id="${s.id}"><span>${o?'▾':'▸'} ${esc(s.name)}</span><span class="b r">المتبقي ${money(remain(s))}</span></div>${o?`<div class="det">${kv('الصف',esc(cn(s)))}${kv('ولي الأمر',esc(s.guardian_name||'-'))}${kv('الجوال',esc(s.phone||'-'))}${kv('الرسوم الإجمالية',money(feeOf(s)))}${kv('إجمالي المدفوع',money(paidA(s)))}${kv('مدفوع هذا الشهر',money(paidM(s)))}${kv('المتبقي',money(remain(s)))}<div class="dact">${acts(s)}<button class="pri" data-a="prof" data-id="${s.id}">📋 ملف الطالب</button></div></div>`:''}</div>`};
A.tu=d=>{S.openU[d.id]=!S.openU[d.id];render()};
function render(){if(!$('#list'))return;$('#title').textContent=S.set.title||'مركز جودة التعليم';
 document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.k===S.flt));
 const q=($('#q').value||'').trim(),m=s=>!q||s.name.includes(q);let h='';
 if(S.flt==='unp'){const L=S.students.filter(s=>unpaid(s)&&m(s));h=`<button class="pri" style="width:100%;margin-bottom:12px" data-a="dl" data-t="unpaid">⬇️ تحميل هذه القائمة (PDF / Word)</button><p class="note">${L.length} طالب — اضغط على الاسم لعرض البيانات</p>`+(L.map(card).join('')||'<p class="empty">الجميع دفع هذا الشهر ✅</p>')}
 else h=S.classes.map(c=>{const L=S.students.filter(s=>s.class_id===c.id&&m(s)&&(S.flt!=='sib'||s.has_sibling)),op=S.open[c.id]||q;
  return `<section class="cls"><div class="ch"><button class="ct" data-a="tog" data-id="${c.id}">${op?'▾':'▸'} 📁 ${esc(c.name)} <b>${L.length}</b></button><button class="ib" data-a="ren" data-id="${c.id}" title="تعديل الاسم">${IC.ed}</button><button class="ib" data-a="dl" data-t="class" data-id="${c.id}" title="تحميل">${IC.dl}</button></div>${op?(L.map(row).join('')||'<p class="empty">لا يوجد طلاب</p>'):''}</section>`}).join('');
 $('#list').innerHTML=h}
// ---- الحفظ الحقيقي (يتأكد أن السطر رجع من قاعدة البيانات)
async function db(q,ok){const{data,error}=await q.select();if(error||!data||!data.length){toast('⚠️ لم يُحفظ! '+(error?error.message:'تحقق من الصلاحيات'),1);return false}closeM();await load();toast(ok||'تم الحفظ في قاعدة البيانات ✅');return true}
A.flt=d=>{S.flt=d.k;render()};A.tog=d=>{S.open[d.id]=!S.open[d.id];render()};A.x=closeM;
A.add=()=>M(`<h3>إضافة وتعديل</h3><button class="pri" style="width:100%;margin-bottom:8px" data-a="newS">➕ طالب جديد</button><button style="width:100%;margin-bottom:8px" data-a="newC">📁 إضافة صف/خانة جديدة</button><button style="width:100%;margin-bottom:8px" data-a="ttl">📝 تعديل عنوان الموقع</button><button style="width:100%;margin-bottom:8px" data-a="fee">💰 تحديد الرسوم الإجمالية الثابتة</button><button style="width:100%" data-a="x">إغلاق</button>`);
function ask(t,v,fn){M(`<h3>${t}</h3><input id="ask" value="${esc(v)}"><div class="bt"><button class="pri" data-a="askOk">حفظ</button><button data-a="x">إلغاء</button></div>`);ASK=fn}
A.askOk=async()=>{const v=$('#ask').value.trim();if(v)await ASK(v)};
A.newC=()=>ask('اسم الصف الجديد','',v=>db(sb.from('classes').insert({name:v,sort:Math.max(0,...S.classes.map(c=>c.sort))+1}),'تمت إضافة الصف ✅'));
A.ren=d=>{const c=S.classes.find(x=>x.id==d.id);ask('تعديل اسم الصف',c.name,v=>db(sb.from('classes').update({name:v}).eq('id',c.id)))};
A.ttl=()=>ask('عنوان الموقع',S.set.title||'',v=>db(sb.from('settings').upsert({key:'title',value:v})));
A.fee=()=>ask('الرسوم الإجمالية (رقم)',S.set.total_fee||S.set.monthly_fee||'0',v=>isNaN(+v)?toast('اكتب رقماً',1):db(sb.from('settings').upsert({key:'total_fee',value:String(+v)})));
function stuForm(s){s=s||{};M(`<h3>${s.id?'تعديل طالب':'طالب جديد'}</h3>${F('f_n','اسم الطالب',s.name)}<label>الصف<select id="f_c">${S.classes.map(c=>`<option value="${c.id}" ${c.id===s.class_id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>${F('f_g','اسم ولي الأمر',s.guardian_name)}${F('f_p','جوال ولي الأمر (مع رمز الدولة لغير السعودية)',s.phone,'tel')}<label class="ck"><input id="f_s" type="checkbox" ${s.has_sibling?'checked':''}> لديه أخ</label>${F('f_f','الرسوم الإجمالية لهذا الطالب (فارغ = الرسوم العامة)',s.fee,'number')}<div class="bt"><button class="pri" data-a="saveS" data-id="${s.id||''}">💾 حفظ</button><button data-a="x">إلغاء</button></div>${s.id?`<button class="dn" data-a="delS" data-id="${s.id}">🗑 حذف الطالب</button>`:''}`)}
A.newS=()=>stuForm();A.edit=d=>stuForm(S.students.find(x=>x.id==d.id));
A.saveS=d=>{const r={name:$('#f_n').value.trim(),class_id:+$('#f_c').value,guardian_name:$('#f_g').value.trim(),phone:$('#f_p').value.trim(),has_sibling:$('#f_s').checked,fee:$('#f_f').value===''?null:+$('#f_f').value};
 if(!r.name||!r.class_id)return toast('اكتب اسم الطالب واختر الصف',1);
 return db(d.id?sb.from('students').update(r).eq('id',d.id):sb.from('students').insert(r))};
A.delS=d=>{if(confirm('سيُحذف الطالب وكل مدفوعاته نهائياً. متأكد؟'))db(sb.from('students').delete().eq('id',d.id),'تم الحذف')};
function prof(id){const s=S.students.find(x=>x.id==id);if(!s)return;const P=S.pays.filter(p=>p.student_id==id),st=status(s);
 M(`<h3>${esc(s.name)} <span class="b ${st[1]}">${st[0]}</span></h3><div class="pg"><div class="pl">الصف: ${esc(cn(s))}</div><div class="pl">ولي الأمر: ${esc(s.guardian_name||'-')}</div><div class="pl">الجوال: ${esc(s.phone||'-')}</div><div class="pl">لديه أخ: ${s.has_sibling?'نعم':'لا'}</div></div><div class="pg fin"><div class="pl">الرسوم الإجمالية: <b>${money(feeOf(s))}</b></div><div class="pl">إجمالي المدفوع: <b>${money(paidA(s))}</b></div><div class="pl">مدفوع هذا الشهر: <b>${money(paidM(s))}</b></div><div class="pl">المتبقي: <b>${money(remain(s))}</b></div></div>${acts(s)}<h4>المدفوعات</h4>${P.map(p=>`<div class="py"><span>${p.paid_on}</span><b>${p.amount}</b><button data-a="delP" data-id="${p.id}" data-s="${id}">✖</button></div>`).join('')||'<p class="empty">لا توجد مدفوعات</p>'}<h4>تسجيل دفعة</h4>${F('p_a','المبلغ','','number')}${F('p_d','تاريخ الإيداع',today(),'date')}<div class="bt"><button class="pri" data-a="addP" data-id="${id}">➕ تسجيل</button><button data-a="dl" data-t="student" data-id="${id}">⬇️ تحميل</button><button data-a="x">إغلاق</button></div>`)}
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
// ---- التحميل (PDF / Word)
const dstr=s=>allp(s).slice().sort((a,b)=>a.paid_on<b.paid_on?-1:1).map(p=>p.paid_on+' : '+money(p.amount)).join('\n');
const COLS=[['name','الاسم',s=>s.name,4],['cls','الصف',cn,2],['g','ولي الأمر',s=>s.guardian_name||'',3],['ph','رقم التواصل',s=>s.phone||'',3],['fee','الرسوم الإجمالية',feeOf,2,1],['paid','إجمالي المدفوع',paidA,2,1],['rem','المتبقي',remain,2,1],['pm','مدفوع هذا الشهر',paidM,2,1],['log','سجل جميع الدفعات',dstr,5]];
const ECOLS=[['name','الاسم',e=>e.name,4],['cat','السبب',e=>e.category||'',3],['date','التاريخ',e=>e.spent_on,3],['amt','المبلغ',e=>e.amount,2,1]];
const dlModal=(cols,act,def,d)=>M(`<h3>تحميل الجدول</h3><h4>١) اختر الخانات التي تريدها في الجدول</h4><div class="cols">${cols.map(c=>`<label><input type="checkbox" class="dk" value="${c[0]}" ${def.includes(c[0])?'checked':''}><span>${c[1]}</span></label>`).join('')}</div><h4>٢) اضغط على صيغة الملف لبدء التنزيل</h4><div class="bt"><button class="pri" data-a="${act}" data-f="pdf" data-t="${d.t||''}" data-id="${d.id||''}">📄 تنزيل PDF</button><button class="gold" data-a="${act}" data-f="docx" data-t="${d.t||''}" data-id="${d.id||''}">📝 تنزيل Word</button></div><button style="width:100%;margin-top:8px" data-a="x">إلغاء</button>`);
A.dl=d=>dlModal(COLS,'doDl',['name','ph','fee','paid','rem','log'],d);
A.dlE=d=>dlModal(ECOLS,'doDlE',['name','cat','date','amt'],d);
const save=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click()};
const isLand=(head,cols)=>head.length>6||cols.some(c=>c[0]==='log');
async function mkDocx(title,t,head,body,foot,cols,fn){const D=docx,land=isLand(head,cols),TW=land?15600:10600,w=[1.2,...cols.map(c=>c[3])],tot=w.reduce((a,b)=>a+b),W=w.map(x=>Math.round(x/tot*TW));
 const cell=(x,i,o)=>new D.TableCell({width:{size:W[i],type:D.WidthType.DXA},shading:o.f?{type:D.ShadingType.CLEAR,fill:o.f,color:'auto'}:undefined,verticalAlign:D.VerticalAlign.CENTER,margins:{top:70,bottom:70,left:90,right:90},children:String(x).split('\n').map(l=>new D.Paragraph({bidirectional:true,alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:l,bold:!!o.b,color:o.c,rightToLeft:true,font:'Arial',size:20})]}))});
 const R=(a,o)=>new D.TableRow({cantSplit:true,tableHeader:!!o.h,children:a.map((x,i)=>cell(x,i,o))});
 const tb=new D.Table({visuallyRightToLeft:true,layout:D.TableLayoutType.FIXED,columnWidths:W,width:{size:TW,type:D.WidthType.DXA},rows:[R(head,{h:1,b:1,f:'14506B',c:'FFFFFF'}),...body.map((r,i)=>R(r,{f:i%2?'F2F7FB':undefined})),R(foot,{b:1,f:'DDEBF7'})]});
 const P=(x,sz,b)=>new D.Paragraph({bidirectional:true,alignment:D.AlignmentType.CENTER,spacing:{after:120},children:[new D.TextRun({text:x,bold:!!b,rightToLeft:true,font:'Arial',size:sz})]});
 const ft=new D.Footer({children:[new D.Paragraph({alignment:D.AlignmentType.CENTER,children:[new D.TextRun({children:['صفحة ',D.PageNumber.CURRENT,' من ',D.PageNumber.TOTAL_PAGES],font:'Arial',size:18})]})]});
 const doc=new D.Document({sections:[{properties:{page:{size:{orientation:land?D.PageOrientation.LANDSCAPE:D.PageOrientation.PORTRAIT},margin:{top:600,bottom:700,left:600,right:600}}},footers:{default:ft},children:[P(title,34,1),P(t+'  —  '+today(),22),tb]}]});
 save(await D.Packer.toBlob(doc),fn+'.docx')}
// PDF: كل ورقة A4 مستقلة، بدون قصّ للصفوف، برقم الصفحة في الأسفل
async function mkPdf(title,t,head,body,foot,cols,fn){if(!window.html2canvas||!(window.jspdf&&window.jspdf.jsPDF))throw new Error('مكتبة PDF لم تُحمَّل، تحقق من الإنترنت');
 const land=isLand(head,cols),PW=land?1123:794,PH=land?794:1123,PAD=34,FOOT=36;
 const w=[1.2,...cols.map(c=>c[3])],tot=w.reduce((a,b)=>a+b);
 const cg='<colgroup>'+w.map(x=>`<col style="width:${(x/tot*100).toFixed(2)}%">`).join('')+'</colgroup>';
 const cell=(x,i)=>{const c=i?cols[i-1]:null,v=String(x);return c&&c[0]==='log'?v.split('\n').filter(Boolean).map(p=>`<span class="pm">${esc(p)}</span>`).join(''):esc(v).replace(/\n/g,'<br>')};
 const tr=(a,cls,th)=>`<tr class="${cls||''}">${a.map((x,i)=>th?`<th>${esc(x)}</th>`:`<td>${cell(x,i)}</td>`).join('')}</tr>`;
 const top=`<div class="hd"><h2>${esc(title)}</h2><p>${esc(t)} — ${today()}</p></div>`;
 const tbl=rows=>`<table>${cg}<thead>${tr(head,'',1)}</thead><tbody>${rows}</tbody></table>`;
 const ov=document.createElement('div');ov.className='pdfov';ov.textContent='جاري تجهيز الملف...';document.body.appendChild(ov);
 const ms=document.createElement('div');ms.className='pdfp';ms.style.cssText=`width:${PW}px;height:auto;padding:${PAD}px;left:-99999px;visibility:hidden;z-index:-1`;
 ms.innerHTML=top+tbl(body.map((r,i)=>tr(r,i%2?'z':'')).join('')+tr(foot,'t'));document.body.appendChild(ms);
 try{if(document.fonts&&document.fonts.ready)await document.fonts.ready;
  const hs=[...ms.querySelectorAll('tbody tr')].map(r=>r.getBoundingClientRect().height+0.5),fh=hs.pop(),thH=ms.querySelector('thead tr').getBoundingClientRect().height,hdH=ms.querySelector('.hd').offsetHeight;
  const avail=PH-2*PAD-FOOT-thH-4,pages=[];let cur=[],used=hdH;
  hs.forEach((h,i)=>{if(cur.length&&used+h>avail){pages.push(cur);cur=[];used=0}cur.push(i);used+=h});
  if(used+fh>avail){if(cur.length>1){const l=cur.pop();pages.push(cur);cur=[l]}else{pages.push(cur);cur=[]}}
  pages.push(cur);
  const pdf=new window.jspdf.jsPDF({orientation:land?'landscape':'portrait',unit:'mm',format:'a4',compress:true});
  for(let n=0;n<pages.length;n++){const last=n===pages.length-1,el=document.createElement('div');el.className='pdfp';el.style.cssText=`width:${PW}px;height:${PH}px;padding:${PAD}px`;
   el.innerHTML=(n===0?top:'')+tbl(pages[n].map(i=>tr(body[i],i%2?'z':'')).join('')+(last?tr(foot,'t'):''))+`<div class="pf">${esc(title)} — صفحة ${n+1} من ${pages.length}</div>`;
   document.body.appendChild(el);
   const cv=await html2canvas(el,{scale:2,backgroundColor:'#ffffff',scrollX:0,scrollY:0,windowWidth:PW,windowHeight:PH});el.remove();
   if(n)pdf.addPage('a4',land?'landscape':'portrait');pdf.addImage(cv.toDataURL('image/jpeg',0.95),'JPEG',0,0,land?297:210,land?210:297)}
  pdf.save(fn+'.pdf')}finally{ms.remove();ov.remove()}}
async function runExport(fmt,t,L,cols){const head=['م',...cols.map(c=>c[1])],body=L.map((s,i)=>[i+1,...cols.map(c=>c[4]?money(c[2](s)):c[2](s))]),foot=['الإجمالي',...cols.map(c=>c[4]?money(L.reduce((a,s)=>a+Number(c[2](s)),0)):'')];
 const title=S.set.title||'مركز جودة التعليم',fn=(S.view==='exp'?'expenses-':'students-')+today();
 try{toast('جاري تجهيز الملف...');if(fmt==='docx')await mkDocx(title,t,head,body,foot,cols,fn);else await mkPdf(title,t,head,body,foot,cols,fn);closeM()}
 catch(e){toast('تعذر إنشاء الملف: '+e.message,1)}}
const picked=()=>[...document.querySelectorAll('.dk:checked')].map(x=>x.value);
A.doDl=d=>{const k=picked();if(!k.length)return toast('اختر خانة واحدة على الأقل',1);let L,t;
 if(d.t==='class'){L=S.students.filter(s=>s.class_id==d.id);t='الصف: '+S.classes.find(c=>c.id==d.id).name}else if(d.t==='student'){L=S.students.filter(s=>s.id==d.id);t='الطالب: '+L[0].name}else{L=S.students.filter(unpaid);t='لم يدفعوا هذا الشهر'}
 if(!L.length)return toast('لا يوجد طلاب في هذه القائمة',1);runExport(d.f==='docx'?'docx':'pdf',t,L,COLS.filter(c=>k.includes(c[0])))};
A.doDlE=d=>{const k=picked();if(!k.length)return toast('اختر خانة واحدة على الأقل',1);const L=expFilt().slice().sort((a,b)=>a.spent_on<b.spent_on?-1:1);if(!L.length)return toast('لا توجد مصروفات',1);
 runExport(d.f==='docx'?'docx':'pdf','المصروفات: '+S.ey+' — '+(S.em==='00'?'كل الأشهر':MN[+S.em-1])+(S.ec?' — '+S.ec:''),L,ECOLS.filter(c=>k.includes(c[0])))};
// ---- الأحداث
document.addEventListener('click',e=>{if(e.target.id==='modal')return closeM();const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='p')A.login()});
boot();
