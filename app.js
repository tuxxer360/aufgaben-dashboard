const STORAGE_KEY = "daniel-task-dashboard-v1";
const $ = id => document.getElementById(id);

const seed = {
  tasks: [
    {id:1,title:"Versicherung bezahlen",area:"Finanzen",priority:"P1",status:"open",due:"",hours:.25,owner:"Daniel",note:"730 € sofort zahlen und Beleg ablegen",createdAt:"2026-08-14"},
    {id:2,title:"Tally-Account absichern",area:"Business / POP ART KIDS",priority:"P1",status:"open",due:"",hours:.5,owner:"Darina",note:"Passwort ändern und 2FA aktivieren",createdAt:"2026-08-14"},
    {id:3,title:"Auto-Unfall / HUK weiterverfolgen",area:"Auto & Versicherung",priority:"P1",status:"open",due:"",hours:1,owner:"Daniel",note:"Bearbeitungsstand, Haftung, Gutachten und Wertminderung klären",createdAt:"2026-08-14"},
    {id:4,title:"Wasserschaden – Fachfirma nachhalten",area:"Wohnung & Mietrecht",priority:"P1",status:"open",due:"",hours:.5,owner:"Daniel",note:"Termin prüfen, sonst nachfassen",createdAt:"2026-08-14"},
    {id:5,title:"Abfluss Dusche melden",area:"Wohnung & Mietrecht",priority:"P1",status:"open",due:"",hours:.5,owner:"Daniel",note:"Eigene Mängelmeldung erstellen",createdAt:"2026-08-14"},
    {id:6,title:"Workshop-Angebotsmatrix finalisieren",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:2,owner:"Gemeinsam",note:"Kinder, Familien, Erwachsene, Senioren, Unternehmen",createdAt:"2026-08-14"},
    {id:7,title:"POP ART KIDS One-Pager finalisieren",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:2,owner:"Gemeinsam",note:"Schnell versendbares Vertriebsdokument",createdAt:"2026-08-14"},
    {id:8,title:"MINISO-Termin vorbereiten",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:2,owner:"Gemeinsam",note:"Ablauf, Teilnehmerzahl, Material, Preis und Nutzen vorbereiten",createdAt:"2026-08-14"},
    {id:9,title:"Förder-/Stiftungsstrategie erstellen",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:2.5,owner:"Gemeinsam",note:"Projekt, Budget, Wirkung und passende Förderer bündeln",createdAt:"2026-08-14"},
    {id:10,title:"Förderer- und Stiftungsliste aufbauen",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:2,owner:"Daniel",note:"Mindestens 15 passende Förderer erfassen",createdAt:"2026-08-14"},
    {id:11,title:"Senioreneinrichtungen – Angebotsstruktur finalisieren",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:2,owner:"Gemeinsam",note:"60–120 Min., Material, Demenz-Eignung, Preis, Nutzen",createdAt:"2026-08-14"},
    {id:12,title:"Senioreneinrichtungen – Zielliste Hamburg",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:1.5,owner:"Daniel",note:"20 Einrichtungen mit Ansprechpartner und Kontaktweg",createdAt:"2026-08-14"},
    {id:13,title:"Businessplan Textfassung",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:4,owner:"Gemeinsam",note:"USP, Zielgruppen, Markt, Vertrieb, SWOT und Maßnahmen",createdAt:"2026-08-14"},
    {id:14,title:"Businessplan Finanzteil",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:3,owner:"Daniel",note:"Umsatz, Kosten, Gewinn, Liquidität und Szenarien",createdAt:"2026-08-14"},
    {id:15,title:"Hochzeitsunterkunft buchen",area:"Hochzeit",priority:"P2",status:"open",due:"",hours:1.5,owner:"Gemeinsam",note:"Budget ca. 800 €, stornierbar bevorzugt",createdAt:"2026-08-14"},
    {id:16,title:"Trauringe bezahlen / Abholung festmachen",area:"Hochzeit",priority:"P2",status:"open",due:"",hours:.5,owner:"Daniel",note:"Restzahlung ca. 800 €",createdAt:"2026-08-14"},
    {id:17,title:"Rechnungen / Lexoffice aktualisieren",area:"Business / POP ART KIDS",priority:"P2",status:"open",due:"",hours:1,owner:"Darina",note:"Einnahmen, Ausgaben und Belege zuordnen",createdAt:"2026-08-14"}
  ],
  payments: [
    {id:101,title:"Versicherung",amount:730,due:"",priority:"P1",status:"open",note:"sofort"},
    {id:102,title:"Stromnachzahlung",amount:231,due:"2026-09-01",priority:"P2",status:"open",note:"Terminüberweisung"},
    {id:103,title:"Trauringe",amount:800,due:"",priority:"P2",status:"open",note:"Restzahlung"},
    {id:104,title:"Hochzeitsunterkunft",amount:800,due:"",priority:"P2",status:"open",note:"Budget"}
  ],
  history: []
};

function cloneSeed(){ return JSON.parse(JSON.stringify(seed)); }
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return cloneSeed();
    const data = JSON.parse(raw);
    return {tasks:data.tasks||[], payments:data.payments||[], history:data.history||[]};
  } catch { return cloneSeed(); }
}
let state = loadState();

function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
function euro(n){ return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n)||0); }
function fmtDate(s){ return s ? new Date(s+"T12:00:00").toLocaleDateString("de-DE") : "ohne Termin"; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function esc(v=""){ return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

window.completeTask = id => {
  const t = state.tasks.find(x=>x.id===id); if(!t) return;
  t.status="done"; t.completedAt=new Date().toISOString();
  state.history.unshift({id:Date.now(),type:"task",title:t.title,area:t.area,completedAt:t.completedAt});
  persist();
};
window.deleteTask = id => { if(confirm("Aufgabe wirklich löschen?")){ state.tasks=state.tasks.filter(x=>x.id!==id); persist(); } };
window.markPayment = id => {
  const p=state.payments.find(x=>x.id===id); if(!p) return;
  p.status="paid"; p.paidAt=new Date().toISOString();
  state.history.unshift({id:Date.now(),type:"payment",title:`Zahlung erledigt: ${p.title}`,area:"Finanzen",completedAt:p.paidAt});
  persist();
};
window.deletePayment = id => { if(confirm("Zahlung wirklich löschen?")){ state.payments=state.payments.filter(x=>x.id!==id); persist(); } };

window.openEdit = id => {
  const t=state.tasks.find(x=>x.id===id); if(!t) return;
  $("editId").value=id; $("editTitle").value=t.title; $("editPriority").value=t.priority; $("editDue").value=t.due||""; $("editNote").value=t.note||"";
  $("editDialog").showModal();
};

function render(){
  const openTasks=state.tasks.filter(t=>t.status!=="done");
  const doneTasks=state.tasks.filter(t=>t.status==="done");
  const urgent=openTasks.filter(t=>t.priority==="P1");
  const openPayments=state.payments.filter(p=>p.status!=="paid");
  const total=openPayments.reduce((s,p)=>s+Number(p.amount||0),0);
  const denominator=state.tasks.length+state.payments.length;
  const doneAll=doneTasks.length+state.payments.filter(p=>p.status==="paid").length;
  const progress=denominator?Math.round(doneAll/denominator*100):0;

  $("openCount").textContent=openTasks.length;
  $("urgentCount").textContent=urgent.length;
  $("paymentTotal").textContent=euro(total);
  $("doneCount").textContent=doneAll;
  $("progressPercent").textContent=progress+"%";
  $("progressBar").style.width=progress+"%";
  $("openHint").textContent=openTasks.length>20?"Viele Punkte – heute nur die wichtigsten.":"Überschaubar. Weiter so.";
  $("paymentHint").textContent=openPayments.length?`${openPayments.length} offene Zahlung(en)`:"Alles bezahlt.";
  $("streakHint").textContent=state.history.length?`${state.history.length} Erfolge im Verlauf`:"Der erste Haken zählt.";

  const bizDone=doneTasks.filter(t=>t.area==="Business / POP ART KIDS").length;
  const urgentMoney=openPayments.filter(p=>p.priority==="P1").length;
  if(urgentMoney){
    $("motivationTitle").textContent="Erst die kritischen Zahlungen, dann der Rest.";
    $("motivationText").textContent="Wenn Geld oder Fristen dranhängen, zuerst Sicherheit schaffen. Danach Business-Fokus.";
  } else if(bizDone<3){
    $("motivationTitle").textContent="POP ART KIDS braucht heute einen sichtbaren Fortschritt.";
    $("motivationText").textContent="Ein Angebot, ein Lead, ein Follow-up oder eine Seite Businessplan – Hauptsache messbar fertig.";
  } else {
    $("motivationTitle").textContent="Du baust gerade Substanz auf.";
    $("motivationText").textContent="Nicht alles gleichzeitig. Jede abgeschlossene Aufgabe macht die nächste Woche leichter.";
  }
  renderFilters(); renderTasks(); renderPayments(); renderHistory(); renderWeekPlan();
}

function renderFilters(){
  const select=$("filterArea"), current=select.value||"all";
  const areas=[...new Set(state.tasks.map(t=>t.area))].sort();
  select.innerHTML='<option value="all">Alle Bereiche</option>'+areas.map(a=>`<option ${a===current?"selected":""}>${esc(a)}</option>`).join("");
}

function renderTasks(){
  const area=$("filterArea").value, pr=$("filterPriority").value, owner=$("filterOwner").value;
  let list=state.tasks.filter(t=>t.status!=="done");
  if(area!=="all") list=list.filter(t=>t.area===area);
  if(pr!=="all") list=list.filter(t=>t.priority===pr);
  if(owner!=="all") list=list.filter(t=>t.owner===owner);
  const order={P1:1,P2:2,P3:3,P4:4};
  list.sort((a,b)=>(order[a.priority]-order[b.priority])||((a.due||"9999").localeCompare(b.due||"9999")));
  $("taskList").innerHTML=list.length?list.map(t=>`
    <div class="item">
      <input class="item-check" type="checkbox" aria-label="Erledigen" onchange="completeTask(${t.id})" />
      <div><div class="item-title">${esc(t.title)}</div><div class="item-meta">
        <span class="badge ${t.priority.toLowerCase()}">${t.priority}</span><span class="badge">${esc(t.area)}</span><span class="badge">${esc(t.owner||"")}</span>
        ${t.hours?`<span class="badge">${t.hours} h</span>`:""}<span class="badge">${fmtDate(t.due)}</span>
      </div>${t.note?`<div class="item-note">${esc(t.note)}</div>`:""}</div>
      <div class="item-actions"><button class="icon-btn" title="Bearbeiten" onclick="openEdit(${t.id})">✎</button><button class="icon-btn" title="Löschen" onclick="deleteTask(${t.id})">🗑</button></div>
    </div>`).join(""):'<div class="empty">Keine offenen Aufgaben in diesem Filter.</div>';
}

function renderPayments(){
  const order={P1:1,P2:2,P3:3};
  const list=state.payments.filter(p=>p.status!=="paid").sort((a,b)=>(order[a.priority]-order[b.priority])||((a.due||"9999").localeCompare(b.due||"9999")));
  $("paymentList").innerHTML=list.length?list.map(p=>`
    <div class="payment-row"><div class="payment-top"><div><strong>${esc(p.title)}</strong><div class="item-meta"><span class="badge ${p.priority.toLowerCase()}">${p.priority}</span><span class="badge">${fmtDate(p.due)}</span></div></div><div class="amount">${euro(p.amount)}</div></div>
    ${p.note?`<div class="item-note">${esc(p.note)}</div>`:""}<div class="item-actions" style="margin-top:10px"><button class="btn primary" onclick="markPayment(${p.id})">Als bezahlt markieren</button><button class="btn ghost" onclick="deletePayment(${p.id})">Löschen</button></div></div>`).join(""):'<div class="empty">Keine offenen Zahlungen.</div>';
}

function renderHistory(){
  const rows=[...state.history].sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt)).slice(0,30);
  $("historyList").innerHTML=rows.length?rows.map(h=>`<div class="history-item"><strong>${esc(h.title)}</strong><div class="history-date">${new Date(h.completedAt).toLocaleString("de-DE")} · ${esc(h.area||"")}</div></div>`).join(""):'<div class="empty">Noch keine erledigten Aufgaben. Der erste Haken startet deinen Verlauf.</div>';
}

function renderWeekPlan(){
  const active=state.tasks.filter(t=>t.status!=="done");
  const p1=active.filter(t=>t.priority==="P1").slice(0,4);
  const biz=active.filter(t=>t.area==="Business / POP ART KIDS"&&t.priority!=="P1").slice(0,6);
  const admin=active.filter(t=>["Finanzen","Hochzeit","Wohnung & Mietrecht","Auto & Versicherung"].includes(t.area)&&t.priority!=="P1").slice(0,5);
  const cards=[["Abende Mo–Do",[...p1.slice(0,2),...biz.slice(0,2)]],["Freitag",[...admin.slice(0,2),...biz.slice(2,4)]],["Samstag Deep Work",biz.slice(4,6).length?biz.slice(4,6):biz.slice(0,2)]];
  $("weekPlan").innerHTML=cards.map(([title,items])=>`<div class="week-card"><h3>${title}</h3>${items.length?`<ul>${items.map(t=>`<li>${esc(t.title)}${t.hours?` · ${t.hours} h`:""}</li>`).join("")}</ul>`:"<p>Aktuell frei.</p>"}</div>`).join("");
}

$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.tasks.push({id:Date.now(),title:$("taskTitle").value.trim(),area:$("taskArea").value,priority:$("taskPriority").value,status:"open",due:$("taskDue").value,hours:Number($("taskHours").value||0),owner:$("taskOwner").value,note:$("taskNote").value.trim(),createdAt:todayISO()});
  e.target.reset(); $("taskPriority").value="P2"; persist();
});
$("paymentForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.payments.push({id:Date.now(),title:$("paymentTitle").value.trim(),amount:Number($("paymentAmount").value),due:$("paymentDue").value,priority:$("paymentPriority").value,status:"open",note:$("paymentNote").value.trim()});
  e.target.reset(); $("paymentPriority").value="P2"; persist();
});
["filterArea","filterPriority","filterOwner"].forEach(id=>$(id).addEventListener("change",renderTasks));

$("editForm").addEventListener("submit",e=>{
  e.preventDefault();
  const t=state.tasks.find(x=>x.id===Number($("editId").value)); if(!t) return;
  t.title=$("editTitle").value.trim(); t.priority=$("editPriority").value; t.due=$("editDue").value; t.note=$("editNote").value.trim();
  $("editDialog").close(); persist();
});
$("cancelEdit").addEventListener("click",()=>$("editDialog").close());

$("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`aufgaben-backup-${todayISO()}.json`; a.click(); URL.revokeObjectURL(a.href);
});
$("importInput").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file) return;
  try { const data=JSON.parse(await file.text()); if(!Array.isArray(data.tasks)||!Array.isArray(data.payments)) throw new Error(); state={tasks:data.tasks,payments:data.payments,history:data.history||[]}; persist(); alert("Backup erfolgreich importiert."); }
  catch { alert("Das Backup konnte nicht gelesen werden."); }
  e.target.value="";
});

render();
