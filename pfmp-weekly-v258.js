/* Compétences PRO V2.58 — Carnet PFMP hebdomadaire.
   Une case vide par jour ouvré de chaque semaine de stage.
   Les entrées couvrant plusieurs jours restent un seul enregistrement Supabase. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weekday=['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
const parseDate=iso=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return null;
 const date=new Date(iso+'T12:00:00Z');
 return Number.isNaN(date.valueOf())||date.toISOString().slice(0,10)!==iso?null:date;
};
const iso=date=>date.toISOString().slice(0,10);
const plusDays=(date,n)=>new Date(date.getTime()+86400000*n);
const monday=date=>plusDays(date,-((date.getUTCDay()+6)%7));
const formatDate=value=>{
 const d=parseDate(value);
 return d?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(d):value||'';
};
const status=e=>e.validation_status==='confirmed'?'Validée par le professeur':e.validation_status==='correction_requested'?'Correction demandée':'En attente du professeur';
// V2.62 : reprendre uniquement les évaluations PFMP déjà enregistrées par le professeur.
// Le logiciel conserve des niveaux de maîtrise ; aucune note numérique n'est fabriquée.
function teacherAssessments(studentId,pfmpId,entry){
 const box=document.createElement('div');
 box.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid var(--line,#9996);font-size:12px;';
 const title=document.createElement('strong');
 title.textContent='Évaluation du professeur — cette activité';
 box.appendChild(title);
 const assessments=Array.isArray(entry.__activityAssessments)?entry.__activityAssessments:[];
 if(!assessments.length){
  const empty=document.createElement('div');empty.className='muted small';
  empty.textContent='Aucune compétence évaluée pour cette activité.';
  box.appendChild(empty);return box;
 }
 const ref=typeof studentReferentialData==='function'?studentReferentialData(studentId):null;
 assessments.forEach(r=>{
  const line=document.createElement('div');line.style.cssText='margin-top:5px;overflow-wrap:anywhere;';
  const code=String(r.competency_code);
  const grade=r.grade===null||r.grade===undefined?'':' · Note : '+Number(r.grade).toLocaleString('fr-FR',{maximumFractionDigits:2})+'/20';
  line.textContent=code+(ref?.labels?.[code]?' — '+ref.labels[code]:'')
   +' : '+String(r.mastery_level||'Non évaluée')+grade;
  box.appendChild(line);
 });
 return box;
}
const studentContext=()=>typeof session!=='undefined'&&session?.role==='student'&&
 typeof studentApplicablePfmps==='function'&&typeof window.cpCloudListPfmpActivities==='function';
function weeksFor(pfmp){
 const start=parseDate(pfmp?.startDate);
 let end=parseDate(pfmp?.endDate);
 if(!start)return [];
 if(!end&&Number.isInteger(Number(pfmp?.durationWeeks))&&Number(pfmp.durationWeeks)>0)
   end=plusDays(start,7*Number(pfmp.durationWeeks)-1);
 if(!end||end<start)return [];
 const blocks=[];
 for(let w=monday(start),index=0;w<=end&&index<55;w=plusDays(w,7),index++){
  const dates=weekday.map((_,day)=>iso(plusDays(w,day)));
  const inside=dates.map(date=>date>=iso(start)&&date<=iso(end));
  if(inside.some(Boolean))blocks.push({number:index+1,dates,inside});
 }
 return blocks;
}
function currentPfmps(studentId){
 try{return studentApplicablePfmps(studentId)||[];}
 catch(_){return [];}
}
// V2.61 : l'ancien formulaire est composé de champs directement dans le conteneur,
 // et non dans .cp-diary-form-v250 ; masquer aussi leurs libellés.
function hideLegacyForm(wrapper){
 const classes=['.cp-diary-date-v250','.cp-diary-end-date-v257','.cp-diary-text-v250'];
 for(const selector of classes){
  const field=wrapper.querySelector(selector);
  if(!field)continue;
  field.hidden=true;
  field.style.display='none';
  const label=field.previousElementSibling;
  if(label&&label.tagName==='LABEL'){label.hidden=true;label.style.display='none';}
 }
 for(const selector of ['.cp-diary-save-v250','.cp-diary-add-v250','.cp-diary-form-v250','.cp-diary-info-v250']){
  const element=wrapper.querySelector(selector);
  if(element){element.hidden=true;element.style.display='none';}
 }
 for(const item of wrapper.children){
  if(item.matches('p.muted.small')&&!item.classList.contains('cp-weekly-message-v258')){
   item.hidden=true;item.style.display='none';
  }
 }
}
function renderOne(wrapper,entryPfmp){
 const old=wrapper.querySelector('.cp-weekly-v258');
 if(old)old.remove();
 const box=document.createElement('section');box.className='cp-weekly-v258';
 box.style.cssText='margin:12px 0;display:block;';
 wrapper.insertBefore(box,wrapper.querySelector('.cp-diary-list-v250'));
 hideLegacyForm(wrapper);
 const originalList=wrapper.querySelector('.cp-diary-list-v250');
 if(originalList&&!wrapper.querySelector('.cp-weekly-old-details-v258')){
  const parent=originalList.parentNode;
  const detail=document.createElement('details');detail.className='cp-weekly-old-details-v258';
  detail.style.cssText='margin-top:12px';
  const summary=document.createElement('summary');
  summary.textContent='Consulter les activités sous forme de liste (et les modifier si autorisé)';
  summary.style.cssText='cursor:pointer;font-weight:600';
  detail.appendChild(summary);
  parent.insertBefore(detail,originalList);
  detail.appendChild(originalList);
  // Conserver la possibilité de modifier une ancienne activité, en bas du carnet.
  wrapper.appendChild(detail);
 }
 const weeks=weeksFor(entryPfmp);
 if(!weeks.length){
  box.textContent='Dates de début et de fin de la PFMP indisponibles. Configure d’abord la période de stage.';
  return;
 }
 const start=weeks[0].dates.find(d=>d>=entryPfmp.startDate);
 const end=entryPfmp.endDate||weeks[weeks.length-1].dates[4];
 box.innerHTML='<div class="muted small" style="margin:0 0 10px">Une case par semaine pour renseigner tes activités de PFMP.</div>'
  +'<div class="cp-weekly-calendar-v258" role="region" aria-label="Carnet hebdomadaire des activités PFMP"></div>'
  +'<div class="cp-weekly-editor-v258" hidden style="padding:12px;margin:12px 0;border:1px solid var(--line,#aaa);border-radius:9px">'
  +'<strong>Activité de stage</strong>'
  +'<div style="display:none">'
  +'<input class="cp-weekly-start-v258" type="date">'
  +'<input class="cp-weekly-end-v258" type="date"></div>'
  +'<label style="display:block">Activité réalisée<textarea class="cp-weekly-text-v258" rows="4" maxlength="5000" placeholder="Décris ce que tu as réalisé…" style="display:block;width:100%;min-height:90px;padding:9px;margin-top:6px"></textarea></label>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn primary cp-weekly-save-v258">Enregistrer</button><button type="button" class="btn cp-weekly-cancel-v258">Annuler</button></div>'
  +'<p class="muted small cp-weekly-message-v258" role="status"></p>'
  +'</div>';
 const cal=box.querySelector('.cp-weekly-calendar-v258');
 const editor=box.querySelector('.cp-weekly-editor-v258');
 const from=box.querySelector('.cp-weekly-start-v258');
 const to=box.querySelector('.cp-weekly-end-v258');
 const note=box.querySelector('.cp-weekly-text-v258');
 const msg=box.querySelector('.cp-weekly-message-v258');
 const save=box.querySelector('.cp-weekly-save-v258');
 let editingId=null;
 from.min=start;from.max=end;to.min=start;to.max=end;
 const openEditor=(fromDate,toDate,existing=null)=>{
  editingId=existing?.id||null;
  editor.hidden=false;
  from.value=existing?.activity_date||fromDate;
  to.value=existing?.activity_end_date||existing?.activity_date||toDate;
  note.value=existing?.activity_text||'';
  save.textContent=editingId?'Enregistrer les modifications':'Enregistrer l’activité';
  msg.textContent='';
  editor.scrollIntoView({block:'nearest',behavior:'smooth'});
  note.focus();
 };
 box.querySelector('.cp-weekly-cancel-v258').onclick=()=>{editor.hidden=true;editingId=null;msg.textContent=''};
 save.onclick=async()=>{
  const a=from.value,b=to.value,text=note.value.trim();
  if(!parseDate(a)||!parseDate(b)||a<start||b>end||b<a){
   msg.textContent='Sélectionne une période valide comprise dans les dates de cette PFMP.';return;
  }
  if(!text){msg.textContent='Décris au moins une activité.';return}
  if(session?.role!=='student')return;
  save.disabled=true;msg.textContent='Enregistrement de l’activité…';
  try{
   if(editingId)await window.cpCloudUpdatePfmpActivity(editingId,a,text,b);
   else await window.cpCloudAddPfmpActivity(session.user,String(entryPfmp.id),a,text,b);
   editor.hidden=true;editingId=null;
   await refresh();
   if(typeof cpPfmpActivityListHtml==='function'&&originalList){
    const entries=await window.cpCloudListPfmpActivities(session.user,String(entryPfmp.id));
    originalList.innerHTML=cpPfmpActivityListHtml(entries);
   }
  }catch(err){msg.textContent='Échec de l’enregistrement : '+String(err?.message||err)}
  finally{save.disabled=false}
 };
 async function refresh(){
  cal.innerHTML='<p class="muted small">Chargement des activités…</p>';
  let entries;
  try{
   const [activities,assessments]=await Promise.all([
    window.cpCloudListPfmpActivities(session.user,String(entryPfmp.id)),
    window.cpCloudListPfmpActivityAssessments(session.user,String(entryPfmp.id))
   ]);
   const byActivity=new Map();
   for(const a of assessments){
    const key=String(a.activity_id);
    if(!byActivity.has(key))byActivity.set(key,[]);
    byActivity.get(key).push(a);
   }
   entries=activities.map(e=>({...e,__activityAssessments:byActivity.get(String(e.id))||[]}));
  }catch(e){cal.textContent='Activités ou évaluations indisponibles : '+String(e?.message||e);return}
  if(!box.isConnected)return;
  cal.innerHTML='';
  weeks.forEach((week,index)=>{
   const first=week.dates.find((date,i)=>week.inside[i]);
   const last=week.dates.slice().reverse().find((date,i)=>week.inside[4-i]);
   if(!first||!last)return;
   const weekBox=document.createElement('section');
   weekBox.className='cp-week-v258 cp-week-v264';
   weekBox.style.cssText='margin:12px 0;border:1px solid var(--line,#aaa5);border-radius:10px;padding:12px;';
   const heading=document.createElement('div');
   heading.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:10px;';
   const title=document.createElement('strong');
   title.textContent='Semaine '+(index+1)+' · du '+formatDate(first)+' au '+formatDate(last);
   heading.appendChild(title);
   const add=document.createElement('button');add.type='button';
   add.className='btn cp-week-v258-add';
   add.textContent='+ Activité';
   add.setAttribute('aria-label','Ajouter une activité pour la semaine '+(index+1));
   add.onclick=()=>openEditor(first,last);
   heading.appendChild(add);
   weekBox.appendChild(heading);
   const activities=entries.filter(e=>
     String(e.activity_date||'')<=last&&String(e.activity_end_date||e.activity_date||'')>=first
   );
   if(!activities.length){
    const empty=document.createElement('div');empty.className='muted small cp-week-v264-empty';
    empty.textContent='Aucune activité renseignée pour cette semaine.';
    empty.style.cssText='padding:16px 10px;border:1px dashed var(--line,#aaa6);border-radius:8px;';
    weekBox.appendChild(empty);
   }
   activities.forEach(e=>{
    const card=document.createElement('article');
    card.className='cp-week-v264-activity';
    card.style.cssText='padding:11px;margin:9px 0;border-radius:8px;background:rgba(74,145,191,.13);overflow-wrap:anywhere;';
    const content=document.createElement('div');
    content.style.whiteSpace='pre-wrap';
    content.textContent=String(e.activity_text||'');
    card.appendChild(content);
    const validation=document.createElement('div');
    validation.style.cssText='margin-top:8px;font-weight:650;font-size:12px;';
    validation.textContent='Validation du professeur : '+status(e);
    card.appendChild(validation);
    if(e.tutor_comment){
     const comment=document.createElement('div');comment.style.marginTop='5px';
     comment.textContent='Commentaire : '+String(e.tutor_comment);
     card.appendChild(comment);
    }
    card.appendChild(teacherAssessments(session.user,String(entryPfmp.id),e));
    if(e.validation_status!=='confirmed'){
     const actions=document.createElement('div');
     actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;';
     const edit=document.createElement('button');
     edit.type='button';edit.className='btn cp-week-v262-edit';edit.textContent='✏️ Modifier';
     edit.onclick=()=>openEditor(first,last,e);
     const remove=document.createElement('button');
     remove.type='button';remove.className='btn cp-week-v262-remove';remove.textContent='Supprimer';
     remove.onclick=async()=>{
      if(session?.role!=='student'||String(session.user)!==String(e.student_id))return;
      if(!window.confirm('Retirer cette activité du carnet ?'))return;
      remove.disabled=true;
      try{
       await window.cpCloudDeletePfmpActivity(e.id);
       if(editingId===e.id){editingId=null;editor.hidden=true;}
       await refresh();
      }catch(err){
       window.alert('Impossible de retirer cette activité : '+String(err?.message||err));
       remove.disabled=false;
      }
     };
     actions.append(edit,remove);card.appendChild(actions);
    }else{
     const locked=document.createElement('div');
     locked.className='muted small';locked.textContent='Activité validée : modification verrouillée.';
     locked.style.marginTop='7px';card.appendChild(locked);
    }
    weekBox.appendChild(card);
   });
   cal.appendChild(weekBox);
  });
 }
 refresh();
}
function install(){
 if(!studentContext())return;
 const pfmps=currentPfmps(session.user);
 const byId=new Map(pfmps.map(p=>[String(p.id),p]));
 document.querySelectorAll('.cp-diary-entry-v250').forEach(wrapper=>{
  hideLegacyForm(wrapper);
  if(wrapper.querySelector('.cp-weekly-v258'))return;
  const pfmp=byId.get(String(wrapper.dataset.pfmpId));
  if(pfmp)renderOne(wrapper,pfmp);
 });
}
const observer=new MutationObserver(install);
observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();