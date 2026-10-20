const C=window.CFG,sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={classes:[],students:[],pays:[],set:{},open:{},openU:{},flt:'all',me:null};let ASK=null;const A={};
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
const acts=s=>`<div class="act">${s.phone?`<a class="ib" href="tel:${esc(s.phone)}">📞</a><a class="ib" href="https://wa.me/${wa(s.phone)}" target="_blank" rel="noopener">💬</a>`:''}<button class="ib" data-a="edit" data-id="${s.id}">✏️</button></div>`;
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
const sub=s=>{const st=status(s);return `<div class="sub"><span class="b ${st[1]}">${st[0]}</span><span>مدفوع هذا الشهر: <b>${money(paidM(s))}</b></span><span>المتبقي: <b>${money(remain(s))}</b></span></div>`};
const row=s=>`<div class="row"><div class="nm" data-a="prof" data-id="${s.id}"><div class="n">${esc(s.name)}${s.has_sibling?' 👫':''}</div>${sub(s)}</div>${acts(s)}</div>`;
const kv=(a,b)=>`<div class="kv"><span>${a}</span><b>${b}</b></div>`;
const card=s=>{const o=S.openU[s.id];return `<div class="card"><div class="ch2" data-a="tu" data-id="${s.id}"><span>${o?'▾':'▸'} ${esc(s.name)}</span><span class="b r">المتبقي ${money(remain(s))}</span></div>${o?`<div class="det">${kv('الصف',esc(cn(s)))}${kv('ولي الأمر',esc(s.guardian_name||'-'))}${kv('الجوال',esc(s.phone||'-'))}${kv('الرسوم الإجمالية',money(feeOf(s)))}${kv('إجمالي المدفوع',money(paidA(s)))}${kv('مدفوع هذا الشهر',money(paidM(s)))}${kv('المتبقي',money(remain(s)))}<div class="dact">${acts(s)}<button class="pri" data-a="prof" data-id="${s.id}">📋 ملف الطالب</button></div></div>`:''}</div>`};
A.tu=d=>{S.openU[d.id]=!S.openU[d.id];render()};
function render(){if(!$('#list'))return;$('#title').textContent=S.set.title||'مركز جودة التعليم';
 document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.k===S.flt));
 const q=($('#q').value||'').trim(),m=s=>!q||s.name.includes(q);let h='';
 if(S.flt==='unp'){const L=S.students.filter(s=>unpaid(s)&&m(s));h=`<button class="pri" style="width:100%;margin-bottom:12px" data-a="dl" data-t="unpaid">⬇️ تحميل هذه القائمة (PDF / Word)</button><p class="note">${L.length} طالب — اضغط على الاسم لعرض البيانات</p>`+(L.map(card).join('')||'<p class="empty">الجميع دفع هذا الشهر ✅</p>')}
 else h=S.classes.map(c=>{const L=S.students.filter(s=>s.class_id===c.id&&m(s)&&(S.flt!=='sib'||s.has_sibling)),op=S.open[c.id]||q;
  return `<section class="cls"><div class="ch"><button class="ct" data-a="tog" data-id="${c.id}">${op?'▾':'▸'} 📁 ${esc(c.name)} <b>${L.length}</b></button><button class="ib" data-a="ren" data-id="${c.id}">✏️</button><button class="ib" data-a="dl" data-t="class" data-id="${c.id}">⬇️</button></div>${op?(L.map(row).join('')||'<p class="empty">لا يوجد طلاب</p>'):''}</section>`}).join('');
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
 M(`<h3>${esc(s.name)} <span class="b ${st[1]}">${st[0]}</span></h3>الصف: ${esc(cn(s))}<br>ولي الأمر: ${esc(s.guardian_name||'-')}<br>الجوال: ${esc(s.phone||'-')}<br>لديه أخ: ${s.has_sibling?'✔️ نعم':'لا'}<br>الرسوم الإجمالية: ${money(feeOf(s))}<br>إجمالي المدفوع: ${money(paidA(s))}<br>مدفوع هذا الشهر: ${money(paidM(s))}<br>المتبقي: <b>${money(remain(s))}</b>${acts(s)}<h4>المدفوعات</h4>${P.map(p=>`<div class="py"><span>${p.paid_on}</span><b>${p.amount}</b><button data-a="delP" data-id="${p.id}" data-s="${id}">✖</button></div>`).join('')||'<p class="empty">لا توجد مدفوعات</p>'}<h4>تسجيل دفعة</h4>${F('p_a','المبلغ','','number')}${F('p_d','تاريخ الإيداع',today(),'date')}<div class="bt"><button class="pri" data-a="addP" data-id="${id}">➕ تسجيل</button><button data-a="dl" data-t="student" data-id="${id}">⬇️ تحميل</button><button data-a="x">إغلاق</button></div>`)}
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
A.dl=d=>M(`<h3>تحميل الجدول</h3><p>الصيغة:</p><label class="ck"><input type="radio" name="fmt" value="pdf" checked> PDF</label><label class="ck"><input type="radio" name="fmt" value="docx"> Word (DOCX)</label><p>الخانات:</p>${COLS.map(c=>`<label class="ck"><input type="checkbox" class="dk" value="${c[0]}" ${['name','ph','fee','paid','rem','log'].includes(c[0])?'checked':''}> ${c[1]}</label>`).join('')}<div class="bt"><button class="pri" data-a="doDl" data-t="${d.t}" data-id="${d.id||''}">⬇️ تنزيل</button><button data-a="x">إلغاء</button></div>`);
const save=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click()};
async function mkDocx(title,t,head,body,foot,cols,fn){const D=docx,w=[1.3,...cols.map(c=>c[3])],tot=w.reduce((a,b)=>a+b),W=w.map(x=>Math.round(x/tot*15600));
 const cell=(x,i,o)=>new D.TableCell({width:{size:W[i],type:D.WidthType.DXA},shading:o.f?{type:D.ShadingType.CLEAR,fill:o.f,color:'auto'}:undefined,verticalAlign:D.VerticalAlign.CENTER,margins:{top:70,bottom:70,left:90,right:90},children:String(x).split('\n').map(l=>new D.Paragraph({bidirectional:true,alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:l,bold:!!o.b,color:o.c,rightToLeft:true,font:'Arial',size:20})]}))});
 const R=(a,o)=>new D.TableRow({cantSplit:true,tableHeader:!!o.h,children:a.map((x,i)=>cell(x,i,o))});
 const tb=new D.Table({visuallyRightToLeft:true,layout:D.TableLayoutType.FIXED,columnWidths:W,width:{size:15600,type:D.WidthType.DXA},rows:[R(head,{h:1,b:1,f:'14506B',c:'FFFFFF'}),...body.map((r,i)=>R(r,{f:i%2?'F2F7FB':undefined})),R(foot,{b:1,f:'DDEBF7'})]});
 const P=(x,sz,b)=>new D.Paragraph({bidirectional:true,alignment:D.AlignmentType.CENTER,spacing:{after:120},children:[new D.TextRun({text:x,bold:!!b,rightToLeft:true,font:'Arial',size:sz})]});
 const doc=new D.Document({sections:[{properties:{page:{size:{orientation:D.PageOrientation.LANDSCAPE},margin:{top:600,bottom:600,left:600,right:600}}},children:[P(title,34,1),P(t+'  —  '+today(),22),tb]}]});
 save(await D.Packer.toBlob(doc),fn+'.docx')}
async function mkPdf(title,t,head,body,foot,cols,fn){if(!window.html2pdf)throw new Error('مكتبة PDF لم تُحمَّل، تحقق من الإنترنت');
 const w=[1.3,...cols.map(c=>c[3])],tot=w.reduce((a,b)=>a+b);
 const td=(x,i,st)=>`<td style="border:1px solid #9aa;padding:7px 6px;text-align:center;vertical-align:middle;width:${(w[i]/tot*100).toFixed(1)}%;${st||''}">${esc(x).replace(/\n/g,'<br>')}</td>`;
 const tr=(a,st)=>`<tr style="page-break-inside:avoid">${a.map((x,i)=>td(x,i,st)).join('')}</tr>`;
 const el=document.createElement('div');el.style.cssText='position:absolute;left:-99999px;top:0;width:1080px;background:#fff;color:#000;direction:rtl;font-family:Tahoma,Arial,sans-serif;font-size:13px;padding:8px';
 el.innerHTML=`<h2 style="text-align:center;margin:0 0 6px">${esc(title)}</h2><p style="text-align:center;margin:0 0 12px">${esc(t)} — ${today()}</p><table style="width:100%;border-collapse:collapse;table-layout:fixed;direction:rtl"><thead>${tr(head,'background:#14506b;color:#fff;font-weight:bold')}</thead><tbody>${body.map((r,i)=>tr(r,i%2?'background:#f2f7fb':'')).join('')}${tr(foot,'background:#ddebf7;font-weight:bold')}</tbody></table>`;
 document.body.appendChild(el);
 try{await html2pdf().set({margin:8,filename:fn+'.pdf',image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},pagebreak:{mode:['css','legacy']}}).from(el).save()}finally{el.remove()}}
A.doDl=async d=>{const k=[...document.querySelectorAll('.dk:checked')].map(x=>x.value);if(!k.length)return toast('اختر خانة واحدة على الأقل',1);
 const fmt=(document.querySelector('[name=fmt]:checked')||{}).value||'pdf';let L,t;
 if(d.t==='class'){L=S.students.filter(s=>s.class_id==d.id);t='الصف: '+S.classes.find(c=>c.id==d.id).name}else if(d.t==='student'){L=S.students.filter(s=>s.id==d.id);t='الطالب: '+L[0].name}else{L=S.students.filter(unpaid);t='لم يدفعوا هذا الشهر'}
 if(!L.length)return toast('لا يوجد طلاب في هذه القائمة',1);
 const cols=COLS.filter(c=>k.includes(c[0])),head=['م',...cols.map(c=>c[1])];
 const body=L.map((s,i)=>[i+1,...cols.map(c=>c[4]?money(c[2](s)):c[2](s))]);
 const foot=['الإجمالي',...cols.map(c=>c[4]?money(L.reduce((a,s)=>a+Number(c[2](s)),0)):'')];
 const title=S.set.title||'مركز جودة التعليم',fn='students-'+today();
 try{toast('جاري تجهيز الملف...');if(fmt==='docx')await mkDocx(title,t,head,body,foot,cols,fn);else await mkPdf(title,t,head,body,foot,cols,fn);closeM()}
 catch(e){toast('تعذر إنشاء الملف: '+e.message,1)}};
// ---- الأحداث
document.addEventListener('click',e=>{if(e.target.id==='modal')return closeM();const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='p')A.login()});
boot();
