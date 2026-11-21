/* Compétences Pro V2.51 — Validation pédagogique du carnet PFMP */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studentMode=()=>typeof session!=='undefined'&&session?.role==='student';
const teacherMode=()=>typeof session!=='undefined'&&session?.role!=='student'&&!!session?.role;
const message=(zone,value)=>{const out=zone.querySelector('.cp-v251-message');if(out)out.textContent=value;};
const renderCard=(entry,student)=>'<article class="card cp-v251-card" data-cp-id="'+esc(entry.id)+'" style="padding:12px;margin:8px 0">'
 +'<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>'+esc(entry.activity_date)+'</strong><span style="font-size:12px">'+(entry.validation_status==='confirmed'?'🔒 Validée par le professeur':'⏳ En attente de validation')+'</span></div>'
 +'<p style="white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0">'+esc(entry.activity_text)+'</p>'
 +(Array.isArray(entry.competency_codes)&&entry.competency_codes.length?'<div class="muted small">Compétences : '+esc(entry.competency_codes.join(' · '))+'</div>':'')
 +(entry.tutor_comment?'<div class="muted small">Commentaire : '+esc(entry.tutor_comment)+'</div>':'')
 +(student&&entry.validation_status!=='confirmed'?'<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn cp-v251-edit">✏️ Modifier</button><button type="button" class="btn cp-v251-delete">🗑️ Supprimer</button></div>':'')
 +'</article>';
async function load(studentId,pfmpId){
 if(typeof window.cpCloudListPfmpActivities!=='function')return [];
 return await window.cpCloudListPfmpActivities(studentId,pfmpId);
}
function studentList(list,entries,studentId,pfmpId){
 list.innerHTML='<div class="cp-v251-list">'+(entries.length?entries.map(e=>renderCard(e,true)).join(''):'<p class="muted small">Aucune activité saisie pour cette période.</p>')+'</div>';
 for(const e of entries){
  if(e.validation_status==='confirmed')continue;
  const card=[...list.querySelectorAll('.cp-v251-card')].find(n=>n.dataset.cpId===e.id);
  if(!card)continue;
  const wrapper=list.closest('.cp-diary-entry-v250');
  const info=wrapper?.querySelector('.cp-diary-info-v250');
  card.querySelector('.cp-v251-delete').onclick=async()=>{
   if(!studentMode()||session.user!==studentId)return;
   if(!confirm('Supprimer définitivement cette activité ?'))return;
   try{await window.cpCloudDeletePfmpActivity(e.id);await refreshStudentList(list,studentId,pfmpId);if(info)info.textContent='Activité supprimée.'}
   catch(err){if(info)info.textContent='Suppression refusée : '+err.message;}
  };
  card.querySelector('.cp-v251-edit').onclick=()=>{
   if(!studentMode()||session.user!==studentId)return;
   const original=card.innerHTML;
   card.innerHTML='<label>Date <input type="date" class="cp-v251-date" value="'+esc(e.activity_date)+'"></label>'
    +'<label style="display:block;margin-top:9px">Activité <textarea rows="4" maxlength="5000" class="cp-v251-text" style="width:100%">'+esc(e.activity_text)+'</textarea></label>'
    +'<button type="button" class="btn primary cp-v251-save">Enregistrer</button> <button type="button" class="btn cp-v251-cancel">Annuler</button>'
    +'<p class="muted small cp-v251-error"></p>';
   card.querySelector('.cp-v251-cancel').onclick=()=>{card.innerHTML=original;studentList(list,entries,studentId,pfmpId)};
   card.querySelector('.cp-v251-save').onclick=async()=>{
    if(!studentMode()||session.user!==studentId)return;
    const btn=card.querySelector('.cp-v251-save');btn.disabled=true;
    try{
     await window.cpCloudUpdatePfmpActivity(e.id,card.querySelector('.cp-v251-date').value,card.querySelector('.cp-v251-text').value);
     await refreshStudentList(list,studentId,pfmpId);
     if(info)info.textContent='Activité mise à jour.';
    }catch(err){card.querySelector('.cp-v251-error').textContent=err.message;btn.disabled=false}
   };
  };
 }
}
async function refreshStudentList(list,studentId,pfmpId){
 const entries=await load(studentId,pfmpId);
 studentList(list,entries,studentId,pfmpId);
}
function competencies(studentId){
 try{
  if(typeof studentReferentialData!=='function')return [];
  const ref=studentReferentialData(studentId);const result=[];const used=new Set();
  for(const comp of ref?.comps||[]){
   const sub=ref?.sub?.[comp]||[];
   if(sub.length){
    for(const entry of sub){
     const code=String(Array.isArray(entry)?entry[0]:entry?.code||'');
     const label=String(Array.isArray(entry)?entry[1]||'':entry?.label||'');
     if(!code||used.has(code))continue;
     used.add(code);result.push({code,label:label||code,group:String(comp)});
    }
   }else if(comp&&!used.has(String(comp))){
    used.add(String(comp));result.push({code:String(comp),label:String(comp),group:String(comp)});
   }
  }
  return result;
 }catch(_){return [];}
}
async function renderTeacher(studentId,pfmpId,zoneId){
 const zone=document.getElementById(zoneId);
 if(!zone||!teacherMode())return;
 zone.innerHTML='<p class="muted small">Chargement des activités PFMP…</p>';
 try{
  const entries=await load(studentId,pfmpId),catalog=competencies(studentId);
  zone.innerHTML='<h3>Activités déclarées par l’élève</h3>'
   +'<p class="muted small">'+entries.length+' activité(s), '+entries.filter(e=>e.validation_status==='confirmed').length+' validée(s) par le professeur.</p>'
   +'<div class="cp-v251-teacher-list"></div><p role="status" class="cp-v251-message muted small"></p>';
  const list=zone.querySelector('.cp-v251-teacher-list');
  for(const e of entries){
   const card=document.createElement('article');card.className='card';
   card.style.cssText='padding:12px;margin:10px 0';
   const selected=new Set(Array.isArray(e.competency_codes)?e.competency_codes:[]);
   card.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+esc(e.activity_date)+'</b><span>'+(e.validation_status==='confirmed'?'🔒 Validée':'⏳ À valider')+'</span></div>'
    +'<p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(e.activity_text)+'</p>'
    +'<details '+(e.validation_status!=='confirmed'?'open':'')+'><summary style="cursor:pointer;font-weight:bold">Compétences mobilisées ('+selected.size+')</summary>'
    +'<div class="cp-v251-competencies" style="display:grid;gap:6px;max-height:280px;overflow:auto;margin:10px 0">'
    +(catalog.length?catalog.map(c=>'<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" value="'+esc(c.code)+'" '+(selected.has(c.code)?'checked':'')+'><span><b>'+esc(c.code)+'</b> — '+esc(c.label)+'</span></label>').join(''):'<p class="muted small">Référentiel introuvable : validation indisponible.</p>')
    +'</div></details>'
    +'<button type="button" class="btn primary cp-v251-validate" '+(!catalog.length?'disabled':'')+'>'+(e.validation_status==='confirmed'?'Mettre à jour les compétences':'✓ Valider cette activité')+'</button> '
    +(e.validation_status==='confirmed'?'<button type="button" class="btn cp-v251-unlock">Retirer la validation</button>':'');
   list.appendChild(card);
   const selectedCodes=()=>[...card.querySelectorAll('.cp-v251-competencies input:checked')].map(input=>input.value);
   card.querySelector('.cp-v251-validate').onclick=async()=>{
    if(!teacherMode())return;
    const codes=selectedCodes();
    if(!codes.length){message(zone,'Sélectionne au moins une compétence avant de valider.');return;}
    try{await window.cpCloudReviewPfmpActivity(e.id,codes,true);await renderTeacher(studentId,pfmpId,zoneId)}
    catch(err){message(zone,'Validation refusée : '+err.message)}
   };
   const unlock=card.querySelector('.cp-v251-unlock');
   if(unlock)unlock.onclick=async()=>{
    if(!teacherMode()||!confirm('Retirer la validation ? L’élève pourra à nouveau modifier cette activité.'))return;
    try{await window.cpCloudReviewPfmpActivity(e.id,selectedCodes(),false);await renderTeacher(studentId,pfmpId,zoneId)}
    catch(err){message(zone,'Opération refusée : '+err.message)}
   };
  }
 }catch(err){zone.textContent='Impossible de charger les activités : '+err.message;}
}
function install(){
 document.title='Compétences Pro V2.51 — Activités PFMP';
 if(typeof window.cpPfmpTeacherDiary==='function'&&!window.cpPfmpTeacherDiary.__v251){
  const fn=function(studentId,pfmpId,zoneId){return renderTeacher(studentId,pfmpId,zoneId)};
  fn.__v251=true;window.cpPfmpTeacherDiary=fn;
 }
 if(teacherMode()&&typeof activeAppraisalContext!=='undefined'&&activeAppraisalContext?.studentId&&activeAppraisalContext?.pfmpId){
  const teacherZone=document.getElementById('cp-pfmp-teacher-journal-v250');
  if(teacherZone&&!teacherZone.querySelector('.cp-v251-teacher-list')&&teacherZone.dataset.cpV251Loading!=='yes'){
   teacherZone.dataset.cpV251Loading='yes';
   renderTeacher(activeAppraisalContext.studentId,activeAppraisalContext.pfmpId,teacherZone.id)
    .finally(()=>{delete teacherZone.dataset.cpV251Loading});
  }
 }
 for(const wrapper of document.querySelectorAll('.cp-diary-entry-v250')){
  const list=wrapper.querySelector('.cp-diary-list-v250'),pfmpId=wrapper.dataset.pfmpId;
  if(!list||!pfmpId||!studentMode()||!session.user)continue;
  if(list.querySelector('.cp-v251-list'))continue;
  if(list.dataset.cpV251Loading==='yes')continue;
  list.dataset.cpV251Loading='yes';
  refreshStudentList(list,session.user,pfmpId).catch(err=>{
   list.textContent='Activités indisponibles : '+err.message;
  }).finally(()=>{delete list.dataset.cpV251Loading});
 }
}
const observer=new MutationObserver(()=>{install()});
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
