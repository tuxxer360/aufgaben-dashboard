const cfg = window.APP_CONFIG;
const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const HID = cfg.householdId;
const $ = id => document.getElementById(id);
let session = null;
let membership = null;
let tasks = [];
let settings = null;

const statusLabel = {open:'Offen',progress:'In Arbeit',waiting:'Warten',done:'Erledigt'};
const orderPriority = {P1:1,P2:2,P3:3,P4:4};
const orderStatus = {open:1,progress:2,waiting:3,done:4};
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const euro = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const fmtDate = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString('de-DE') : 'ohne Termin';
const setHidden = (id, hidden) => $(id).classList.toggle('hidden', hidden);
const message = (txt, error=false) => { $('authMessage').textContent=txt||''; $('authMessage').classList.toggle('error-text',!!error); };

async function init(){
  for(let h=0;h<24;h++) $('reminderHour').insertAdjacentHTML('beforeend',`<option value="${h}">${String(h).padStart(2,'0')}:00</option>`);
  bindEvents();
  const {data:{session:s}} = await sb.auth.getSession();
  await handleSession(s);
  sb.auth.onAuthStateChange(async (_event,s2)=>{ if(s2?.user?.id!==session?.user?.id || !s2) await handleSession(s2); });
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

async function handleSession(s){
  session=s;
  if(!s){
    membership=null; tasks=[];
    setHidden('authView',false); setHidden('pendingView',true); setHidden('appView',true);
    return;
  }
  const {data:m,error} = await sb.from('household_members').select('household_id,user_id,role').eq('household_id',HID).eq('user_id',s.user.id).maybeSingle();
  if(error) console.error(error);
  membership=m;
  if(!m){
    await ensureAccessRequest();
    setHidden('authView',true); setHidden('pendingView',false); setHidden('appView',true);
    return;
  }
  setHidden('authView',true); setHidden('pendingView',true); setHidden('appView',false);
  $('currentUser').textContent=`${s.user.email || 'Apple ID'} · ${m.role==='admin'?'Admin':'Mitglied'}`;
  setHidden('adminNavBtn',m.role!=='admin');
  await Promise.all([loadTasks(),loadSettings()]);
}

async function ensureAccessRequest(){
  const {data:req} = await sb.from('access_requests').select('id').eq('household_id',HID).eq('user_id',session.user.id).maybeSingle();
  if(!req) await sb.from('access_requests').insert({household_id:HID,user_id:session.user.id,email:session.user.email,status:'pending'});
}

async function loginApple(){
  message('');
  const {error}=await sb.auth.signInWithOAuth({provider:'apple',options:{redirectTo:cfg.appUrl}});
  if(error) message(`Apple-Anmeldung noch nicht verfügbar: ${error.message}`,true);
}
async function loginEmail(e){
  e.preventDefault(); message('');
  const email=$('authEmail').value.trim(), password=$('authPassword').value;
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error) message(error.message,true);
}
async function signupEmail(){
  message('');
  const email=$('authEmail').value.trim(), password=$('authPassword').value;
  if(!email || password.length<8){ message('Bitte E-Mail und ein Passwort mit mindestens 8 Zeichen eingeben.',true); return; }
  const {error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:cfg.appUrl}});
  message(error?error.message:'Registrierung erstellt. Falls Supabase eine Bestätigung verlangt, bitte den Link in der E-Mail öffnen.',!!error);
}

async function loadTasks(){
  const {data,error}=await sb.from('tasks').select('*').eq('household_id',HID).order('legacy_id',{ascending:true,nullsFirst:false});
  if(error){ console.error(error); return; }
  tasks=data||[]; renderTasks();
}
async function loadSettings(){
  const {data}=await sb.from('app_settings').select('*').eq('household_id',HID).maybeSingle();
  settings=data;
  if(data){ $('emailReminders').checked=data.email_reminders; $('reminderEmail').value=data.reminder_email||''; $('reminderHour').value=String(data.reminder_hour??8); }
}

function renderTasks(){
  const open=tasks.filter(t=>t.status!=='done');
  $('openCount').textContent=open.length;
  $('urgentCount').textContent=open.filter(t=>t.priority==='P1').length;
  $('paymentTotal').textContent=euro(open.reduce((s,t)=>s+Number(t.amount||0),0));
  $('doneCount').textContent=tasks.filter(t=>t.status==='done').length;
  renderFilterOptions();
  let list=[...tasks];
  const q=$('searchInput').value.trim().toLowerCase();
  const area=$('filterArea').value, pr=$('filterPriority').value, st=$('filterStatus').value, owner=$('filterOwner').value;
  if(q) list=list.filter(t=>[t.title,t.area,t.owner,t.next_step,t.note,t.horizon].some(v=>String(v||'').toLowerCase().includes(q)));
  if(area!=='all') list=list.filter(t=>t.area===area);
  if(pr!=='all') list=list.filter(t=>t.priority===pr);
  if(st!=='all') list=list.filter(t=>t.status===st);
  if(owner!=='all') list=list.filter(t=>t.owner===owner);
  const sort=$('sortBy').value;
  list.sort((a,b)=>{
    if(sort==='priority') return (orderPriority[a.priority]-orderPriority[b.priority]) || String(a.due||'9999').localeCompare(String(b.due||'9999'));
    if(sort==='due') return String(a.due||'9999').localeCompare(String(b.due||'9999')) || (orderPriority[a.priority]-orderPriority[b.priority]);
    if(sort==='status') return (orderStatus[a.status]-orderStatus[b.status]) || (orderPriority[a.priority]-orderPriority[b.priority]);
    if(sort==='amount') return Number(b.amount||0)-Number(a.amount||0);
    return String(a[sort]||'').localeCompare(String(b[sort]||''),'de');
  });
  $('resultCount').textContent=`${list.length} von ${tasks.length}`;
  $('taskList').innerHTML=list.length?list.map(taskHtml).join(''):'<div class="empty">Keine Aufgaben in diesem Filter.</div>';
}

function renderFilterOptions(){
  const areaCurrent=$('filterArea').value||'all', ownerCurrent=$('filterOwner').value||'all';
  const areas=[...new Set(tasks.map(t=>t.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
  const owners=[...new Set(tasks.map(t=>t.owner).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
  $('filterArea').innerHTML='<option value="all">Alle Bereiche</option>'+areas.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');
  $('filterOwner').innerHTML='<option value="all">Alle Verantwortlichen</option>'+owners.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');
  if(areas.includes(areaCurrent)) $('filterArea').value=areaCurrent;
  if(owners.includes(ownerCurrent)) $('filterOwner').value=ownerCurrent;
}

function taskHtml(t){
  return `<article class="item ${t.status==='done'?'done-item':''}">
    <div class="task-main">
      <div class="task-title-row"><strong class="item-title">${esc(t.title)}</strong>${t.amount!==null&&t.amount!==undefined?`<span class="amount">${euro(t.amount)}</span>`:''}</div>
      <div class="item-meta"><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span><span class="badge status-${t.status}">${statusLabel[t.status]||t.status}</span><span class="badge">${esc(t.area)}</span>${t.owner?`<span class="badge">${esc(t.owner)}</span>`:''}<span class="badge">${fmtDate(t.due)}</span>${t.reminder_enabled&&t.due?'<span class="badge">✉ Erinnerung</span>':''}</div>
      ${t.next_step?`<div class="next-step"><b>Nächster Schritt:</b> ${esc(t.next_step)}</div>`:''}
      ${t.note?`<div class="item-note">${esc(t.note)}</div>`:''}
    </div>
    <div class="item-actions"><select class="inline-status" data-id="${t.id}"><option value="open" ${t.status==='open'?'selected':''}>Offen</option><option value="progress" ${t.status==='progress'?'selected':''}>In Arbeit</option><option value="waiting" ${t.status==='waiting'?'selected':''}>Warten</option><option value="done" ${t.status==='done'?'selected':''}>Erledigt</option></select><button class="icon-btn edit-task" data-id="${t.id}" title="Bearbeiten">✎</button></div>
  </article>`;
}

function openTaskDialog(id=null){
  const t=id?tasks.find(x=>x.id===Number(id)):null;
  $('dialogTitle').textContent=t?'Aufgabe bearbeiten':'Neue Aufgabe';
  $('taskId').value=t?.id||''; $('taskTitle').value=t?.title||''; $('taskArea').value=t?.area||''; $('taskPriority').value=t?.priority||'P3'; $('taskStatus').value=t?.status||'open';
  $('taskDue').value=t?.due||''; $('taskAmount').value=t?.amount??''; $('taskOwner').value=t?.owner||''; $('taskHours').value=t?.hours??''; $('taskHorizon').value=t?.horizon||''; $('taskPlanWeek').value=t?.plan_week||''; $('taskWorkBlock').value=t?.work_block||''; $('taskReminder').checked=t?.reminder_enabled??true; $('taskNextStep').value=t?.next_step||''; $('taskNote').value=t?.note||'';
  setHidden('deleteTaskBtn',!t); $('taskDialog').showModal();
}

async function saveTask(e){
  e.preventDefault();
  const id=Number($('taskId').value)||null;
  const payload={household_id:HID,title:$('taskTitle').value.trim(),area:$('taskArea').value.trim()||'Sonstiges',priority:$('taskPriority').value,status:$('taskStatus').value,due:$('taskDue').value||null,amount:$('taskAmount').value===''?null:Number($('taskAmount').value),owner:$('taskOwner').value.trim()||null,hours:$('taskHours').value===''?null:Number($('taskHours').value),horizon:$('taskHorizon').value.trim()||null,plan_week:$('taskPlanWeek').value.trim()||null,work_block:$('taskWorkBlock').value.trim()||null,reminder_enabled:$('taskReminder').checked,next_step:$('taskNextStep').value.trim()||null,note:$('taskNote').value.trim()||null,updated_by:session.user.id};
  let error;
  if(id) ({error}=await sb.from('tasks').update(payload).eq('id',id).eq('household_id',HID));
  else { payload.created_by=session.user.id; ({error}=await sb.from('tasks').insert(payload)); }
  if(error){ alert(error.message); return; }
  await logAction(id?'update':'create','task',String(id||''),{title:payload.title});
  $('taskDialog').close(); await loadTasks();
}
async function deleteTask(){
  const id=Number($('taskId').value); if(!id||!confirm('Aufgabe wirklich löschen?')) return;
  const t=tasks.find(x=>x.id===id); const {error}=await sb.from('tasks').delete().eq('id',id).eq('household_id',HID);
  if(error){alert(error.message);return;} await logAction('delete','task',String(id),{title:t?.title}); $('taskDialog').close(); await loadTasks();
}
async function inlineStatus(id,status){
  const {error}=await sb.from('tasks').update({status,updated_by:session.user.id}).eq('id',Number(id)).eq('household_id',HID);
  if(error){alert(error.message);return;} await logAction('status','task',String(id),{status}); await loadTasks();
}
async function logAction(action,entityType,entityId,details){
  await sb.from('audit_log').insert({household_id:HID,user_id:session.user.id,action,entity_type:entityType,entity_id:entityId,details});
}

async function showAdmin(){
  if(membership?.role!=='admin') return;
  setHidden('tasksSection',true); setHidden('adminSection',false); setHidden('adminNavBtn',true); setHidden('tasksNavBtn',false);
  await Promise.all([loadAccessRequests(),loadMembers(),loadSettings()]);
}
function showTasks(){ setHidden('tasksSection',false); setHidden('adminSection',true); setHidden('adminNavBtn',membership?.role!=='admin'); setHidden('tasksNavBtn',true); renderTasks(); }

async function loadAccessRequests(){
  const {data,error}=await sb.from('access_requests').select('*').eq('household_id',HID).eq('status','pending').order('requested_at',{ascending:true});
  if(error){ $('requestList').innerHTML=`<div class="empty">${esc(error.message)}</div>`; return; }
  $('requestList').innerHTML=data?.length?data.map(r=>`<div class="admin-row"><div><strong>${esc(r.email||r.user_id)}</strong><div class="fineprint">${new Date(r.requested_at).toLocaleString('de-DE')}</div></div><div class="item-actions"><button class="btn primary approve-request" data-id="${r.id}" data-user="${r.user_id}">Freigeben</button><button class="btn ghost reject-request" data-id="${r.id}">Ablehnen</button></div></div>`).join(''):'<div class="empty">Keine offenen Anfragen.</div>';
}
async function approveRequest(id,userId){
  const {error:e1}=await sb.from('household_members').insert({household_id:HID,user_id:userId,role:'member'}); if(e1){alert(e1.message);return;}
  await sb.from('access_requests').update({status:'approved',decided_at:new Date().toISOString()}).eq('id',id); await loadAccessRequests(); await loadMembers();
}
async function rejectRequest(id){ await sb.from('access_requests').update({status:'rejected',decided_at:new Date().toISOString()}).eq('id',id); await loadAccessRequests(); }
async function loadMembers(){
  const {data:members,error}=await sb.from('household_members').select('*').eq('household_id',HID).order('created_at'); if(error){return;}
  const ids=(members||[]).map(m=>m.user_id); let profiles=[]; if(ids.length){ const res=await sb.from('profiles').select('id,email,display_name').in('id',ids); profiles=res.data||[]; }
  const byId=Object.fromEntries(profiles.map(p=>[p.id,p]));
  $('memberList').innerHTML=(members||[]).map(m=>{const p=byId[m.user_id]||{}; const self=m.user_id===session.user.id; return `<div class="admin-row"><div><strong>${esc(p.display_name||p.email||m.user_id)}</strong><div class="fineprint">${esc(p.email||'')}</div></div><div class="item-actions"><select class="member-role" data-user="${m.user_id}" ${self?'disabled':''}><option value="member" ${m.role==='member'?'selected':''}>Mitglied</option><option value="admin" ${m.role==='admin'?'selected':''}>Admin</option></select>${self?'':`<button class="icon-btn remove-member" data-user="${m.user_id}" title="Entfernen">🗑</button>`}</div></div>`;}).join('');
}
async function changeMemberRole(userId,role){ const {error}=await sb.from('household_members').update({role}).eq('household_id',HID).eq('user_id',userId); if(error) alert(error.message); await loadMembers(); }
async function removeMember(userId){ if(!confirm('Mitglied wirklich entfernen?')) return; const {error}=await sb.from('household_members').delete().eq('household_id',HID).eq('user_id',userId); if(error) alert(error.message); await loadMembers(); }
async function invite(e){
  e.preventDefault(); const email=$('inviteEmail').value.trim().toLowerCase(), role=$('inviteRole').value;
  const {error}=await sb.from('invitations').upsert({household_id:HID,email,role,status:'pending',invited_by:session.user.id},{onConflict:'household_id,email'}); if(error){alert(error.message);return;} $('inviteEmail').value=''; alert('Einladung ist vorgemerkt. Die Person kann sich jetzt registrieren oder mit Apple anmelden, sofern die gleiche E-Mail übermittelt wird.');
}
async function saveSettings(e){
  e.preventDefault(); const payload={email_reminders:$('emailReminders').checked,reminder_email:$('reminderEmail').value.trim(),reminder_hour:Number($('reminderHour').value),timezone:'Europe/Berlin',updated_at:new Date().toISOString()};
  const {error}=await sb.from('app_settings').update(payload).eq('household_id',HID); if(error){alert(error.message);return;} settings={...settings,...payload}; $('reminderStatus').textContent='Einstellungen gespeichert.';
}
function exportTasks(){
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),tasks},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`aufgaben-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}

function bindEvents(){
  $('appleLoginBtn').addEventListener('click',loginApple); $('emailAuthForm').addEventListener('submit',loginEmail); $('signupBtn').addEventListener('click',signupEmail);
  $('logoutBtn').addEventListener('click',()=>sb.auth.signOut()); $('pendingLogoutBtn').addEventListener('click',()=>sb.auth.signOut());
  ['searchInput','filterArea','filterPriority','filterStatus','filterOwner','sortBy'].forEach(id=>$(id).addEventListener(id==='searchInput'?'input':'change',renderTasks));
  $('newTaskBtn').addEventListener('click',()=>openTaskDialog()); $('taskForm').addEventListener('submit',saveTask); $('closeDialogBtn').addEventListener('click',()=>$('taskDialog').close()); $('cancelTaskBtn').addEventListener('click',()=>$('taskDialog').close()); $('deleteTaskBtn').addEventListener('click',deleteTask);
  $('taskList').addEventListener('click',e=>{const b=e.target.closest('.edit-task'); if(b) openTaskDialog(b.dataset.id);});
  $('taskList').addEventListener('change',e=>{if(e.target.matches('.inline-status')) inlineStatus(e.target.dataset.id,e.target.value);});
  $('adminNavBtn').addEventListener('click',showAdmin); $('tasksNavBtn').addEventListener('click',showTasks);
  $('requestList').addEventListener('click',e=>{const a=e.target.closest('.approve-request'); if(a) approveRequest(a.dataset.id,a.dataset.user); const r=e.target.closest('.reject-request'); if(r) rejectRequest(r.dataset.id);});
  $('memberList').addEventListener('change',e=>{if(e.target.matches('.member-role')) changeMemberRole(e.target.dataset.user,e.target.value);});
  $('memberList').addEventListener('click',e=>{const b=e.target.closest('.remove-member'); if(b) removeMember(b.dataset.user);});
  $('inviteForm').addEventListener('submit',invite); $('settingsForm').addEventListener('submit',saveSettings); $('exportBtn').addEventListener('click',exportTasks);
}

init().catch(err=>{console.error(err); message(err.message||String(err),true);});
