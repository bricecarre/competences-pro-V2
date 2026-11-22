/* V2.57 — Consultation et réactivation sans suppression des données élèves. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const studentName=st=>[st.first||st.firstName,st.last||st.lastName].filter(Boolean).join(' ')||st.name||'(Nom non renseigné)';
function allowedClasses(){
 if(typeof session==='undefined'||typeof data==='undefined'||!Array.isArray(data.classes))return [];
 if(session?.role==='admin'){
  const academy=typeof selectedAcademy!=='undefined'?selectedAcademy:null;
  const set=academy&&typeof academyClassIds==='function'?new Set(academyClassIds()):null;
  return data.classes.filter(c=>!set||set.has(c.id));
 }
 if(session?.role!=='teacher')return [];
 const t=data.teachers?.find(t=>String(t.id)===String(session.user));
 return t?data.classes.filter(c=>Array.isArray(c.teachers)&&c.teachers.some(id=>String(id)===String(t.id))):[];
}
function renderArchives(root){
 const cls=allowedClasses(),ids=new Set(cls.map(c=>String(c.id)));
 const archived=(data.students||[]).filter(st=>st.archived&&ids.has(String(st.classId)))
   .sort((a,b)=>studentName(a).localeCompare(studentName(b),'fr'));
 root.textContent='';
 if(!archived.length){
  root.innerHTML='<p class="muted small">Aucune fiche archivée dans les classes qui vous sont attribuées.</p>';
  return;
 }
 const count=document.createElement('p');count.className='muted small';count.textContent=archived.length+' fiche(s) archivées. Réactiver conserve l’identifiant et les évaluations existantes.';
 root.appendChild(count);
 for(const st of archived){
  const c=cls.find(c=>String(c.id)===String(st.classId));
  const results=(data.results||[]).filter(r=>String(r.student)===String(st.id)).length;
  const pfmp=(data.pfmpResults||[]).filter(r=>String(r.student)===String(st.id)).length;
  const row=document.createElement('article');row.className='card';row.style.cssText='margin:9px 0;padding:12px';
  row.innerHTML='<strong>'+esc(studentName(st))+'</strong>'
   +'<div class="muted small">Classe : '+esc(c?.name||'Non renseignée')+' · Naissance : '+esc(st.birthDate||'Non renseignée')+'</div>'
   +'<div class="muted small">Évaluations enregistrées : '+results+' · Résultats PFMP : '+pfmp+'</div>'
   +'<div class="muted small">Historique : '+esc((st.history||[]).join(' • ')||'Non renseigné')+'</div>'
   +'<button class="btn primary cp-archive-restore" type="button">Désarchiver la fiche complète</button>';
  row.querySelector('button').onclick=()=>{
   if(!['teacher','admin'].includes(session?.role))return;
   const can=allowedClasses().some(c=>String(c.id)===String(st.classId));
   const live=data.students.find(x=>String(x.id)===String(st.id));
   if(!can||!live?.archived){alert('La fiche ou son accès a changé. Recharge la page.');return;}
   if(!confirm('Réactiver '+studentName(live)+' ? La date de naissance, les informations personnelles, le parcours et toutes les évaluations liées au dossier seront conservés.'))return;
   live.archived=false;
   delete live.archivedAt;
   save();
   render();
  };
  root.appendChild(row);
 }
}
function install(){
 const summary=document.getElementById('studentFilterSummary');
 if(!summary||document.getElementById('cp-v257-archives'))return;
 if(typeof session==='undefined'||!['teacher','admin'].includes(session?.role))return;
 const box=document.createElement('details');box.id='cp-v257-archives';box.className='card';box.style.cssText='margin:12px 0;padding:12px';
 box.innerHTML='<summary style="cursor:pointer;font-weight:700">📁 Archives des élèves — voir et désarchiver une fiche complète</summary><div id="cp-v257-archive-list"></div>';
 summary.parentNode.insertBefore(box,summary);
 box.addEventListener('toggle',()=>{if(box.open)renderArchives(box.querySelector('#cp-v257-archive-list'));});
}
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();