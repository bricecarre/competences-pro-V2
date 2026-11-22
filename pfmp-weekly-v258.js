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
const status=e=>e.validation_status==='confirmed'?'Validée par le tuteur':e.validation_status==='correction_requested'?'Correction demandée':'En attente de validation du tuteur';
// V2.62 : reprendre uniquement les évaluations PFMP déjà enregistrées par le professeur.
// Le logiciel conserve des niveaux de maîtrise ; aucune note numérique n'est fabriquée.
function teacherAssessments(studentId,pfmpId,entry){
 try{
  const ref=typeof studentReferentialData==='function'?studentReferentialData(studentId):null;
  const results=(typeof data!=='undefined'&&Array.isArray(data.pfmpResults)?data.pfmpResults:[])
   .filter(r=>String(r.studentId)===String(studentId)&&String(r.pfmpId)===String(pfmpId)&&r.assessorType==='teacher'
      &&r.status&&r.status!=='Non évalué');
  const byCode=new Map(results.map(r=>[String(r.comp||''),r]));
  const selected=Array.isArray(entry.competency_codes)?entry.competency_codes.map(String).filter(Boolean):[];
  const codes=selected.length?selected:[...byCode.keys()].filter(Boolean);
  const zone=document.createElement('div');
  zone.style.cssText='margin-top:7px;padding-top:7px;border-top:1px solid var(--line,#9996);font-size:11px;';
  const heading=document.createElement('div');
  heading.style.cssText='font-weight:700;margin-bottom:4px;';
  heading.textContent=selected.length?'Évaluation du professeur — compétences de l’activité':'Évaluation du professeur — PFMP';
  zone.appendChild(heading);
  if(!selected.length&&codes.length){
   const hint=document.createElement('div');hint.className='muted small';
   hint.textContent='Ces niveaux concernent la PFMP entière : les compétences ne sont pas encore liées à cette activité.';
   zone.appendChild(hint);
  }
  if(!codes.length){
   const pending=document.createElement('div');pending.className='muted small';
   pending.textContent='Aucune compétence évaluée pour le moment.';
   zone.appendChild(pending);
   return zone;
  }
  for(const code of codes){
   const result=byCode.get(code);
   const item=document.createElement('div');
   item.style.cssText='margin-top:4px;overflow-wrap:anywhere;';
   const grade=result?.grade??result?.note;
   const gradeLabel=grade!==undefined&&grade!==null&&String(grade)!==''?' · Note : '+String(grade)+'/20':'';
   item.textContent=code+(ref?.labels?.[code]?' — '+ref.labels[code]:'')+' : '+(result?.status||'Non évaluée')+gradeLabel;
   zone.appendChild(item);
  }
  return zone;
 }catch(_){const n=document.createElement('div');n.textContent='Évaluations PFMP momentanément indisponibles.';return n}
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
 box.innerHTML='<div class="muted small" style="margin:0 0 10px">Semaine par semaine, clique sur une case vide pour décrire une activité. Une même activité peut couvrir plusieurs jours.</div>'
  +'<div class="cp-weekly-calendar-v258" role="region" aria-label="Carnet hebdomadaire des activités PFMP"></div>'
  +'<div class="cp-weekly-editor-v258" hidden style="padding:12px;margin:12px 0;border:1px solid var(--line,#aaa);border-radius:9px">'
  +'<strong>Activité de stage</strong>'
  +'<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0">'
  +'<label>Début <input class="cp-weekly-start-v258" type="date" style="display:block;padding:8px;max-width:190px"></label>'
  +'<label>Fin <input class="cp-weekly-end-v258" type="date" style="display:block;padding:8px;max-width:190px"></label></div>'
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
 const openEditor=(date,existing=null)=>{
  editingId=existing?.id||null;
  editor.hidden=false;
  from.value=existing?.activity_date||date;
  to.value=existing?.activity_end_date||existing?.activity_date||date;
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
  try{entries=await window.cpCloudListPfmpActivities(session.user,String(entryPfmp.id));}
  catch(e){cal.textContent='Activités indisponibles : '+String(e?.message||e);return}
  if(!box.isConnected)return;
  cal.innerHTML='';
  weeks.forEach((week,index)=>{
   const weekBox=document.createElement('div');weekBox.className='cp-week-v258';
   weekBox.style.cssText='margin:12px 0;border:1px solid var(--line,#aaa5);border-radius:10px;padding:10px;';
   const first=week.dates.find((d,i)=>week.inside[i]);
   const last=week.dates.slice().reverse().find((d,i)=>week.inside[4-i]);
   const heading=document.createElement('div');
   heading.style.cssText='font-weight:700;margin-bottom:8px;';
   heading.textContent='Semaine '+(index+1)+' · du '+formatDate(first)+' au '+formatDate(last);
   weekBox.appendChild(heading);
   const scroll=document.createElement('div');scroll.style.cssText='overflow-x:auto;';
   const grid=document.createElement('div');
   grid.className='cp-week-v258-grid';
   grid.style.cssText='display:grid;grid-template-columns:repeat(5,minmax(130px,1fr));gap:7px;min-width:690px;';
   for(let d=0;d<5;d++){
    const day=week.dates[d],valid=week.inside[d];
    const cell=document.createElement('div');
    cell.className='cp-week-v258-cell';
    cell.style.cssText='min-height:105px;border:1px '+(valid?'dashed':'solid')+' var(--line,#aaa8);border-radius:8px;padding:8px;background:'+(valid?'transparent':'rgba(120,120,120,.08)');
    const label=document.createElement('div');label.style.cssText='font-weight:700;font-size:12px;margin-bottom:7px';
    label.textContent=weekday[d]+' '+formatDate(day);cell.appendChild(label);
    if(valid){
     const daily=entries.filter(e=>String(e.activity_date||'')<=day&&String(e.activity_end_date||e.activity_date||'')>=day);
     daily.forEach(e=>{
      const card=document.createElement('div');
      card.style.cssText='font-size:12px;padding:6px;margin-bottom:6px;border-radius:6px;background:rgba(74,145,191,.13);overflow-wrap:anywhere;';
      const range=e.activity_end_date&&e.activity_end_date!==e.activity_date
       ?'Du '+formatDate(e.activity_date)+' au '+formatDate(e.activity_end_date)+' · ':'';
      const content=document.createElement('div');
      content.textContent=range+String(e.activity_text||'');
      card.appendChild(content);
      const validation=document.createElement('div');
      validation.style.cssText='margin-top:6px;font-weight:700;';
      validation.textContent='Validation du tuteur : '+status(e);
      card.appendChild(validation);
      if(e.tutor_comment){
       const comment=document.createElement('div');
       comment.style.cssText='margin-top:4px;';
       comment.textContent='Commentaire : '+String(e.tutor_comment);
       card.appendChild(comment);
      }
      card.appendChild(teacherAssessments(session.user,String(entryPfmp.id),e));
      if(e.validation_status!=='confirmed'){
       const actions=document.createElement('div');
       actions.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;';
       const edit=document.createElement('button');edit.type='button';edit.className='btn cp-week-v262-edit';
       edit.style.cssText='font-size:11px;padding:5px 7px;';edit.textContent='✏️ Modifier';
       edit.onclick=()=>openEditor(e.activity_date,e);
       const remove=document.createElement('button');remove.type='button';remove.className='btn cp-week-v262-remove';
       remove.style.cssText='font-size:11px;padding:5px 7px;';remove.textContent='Supprimer';
       remove.onclick=async()=>{
        if(session?.role!=='student'||session?.user!==e.student_id)return;
        if(!window.confirm('Retirer cette activité du carnet ? Elle disparaîtra de tous les jours concernés.'))return;
        remove.disabled=true;
        try{
         await window.cpCloudDeletePfmpActivity(e.id);
         if(editingId===e.id){editingId=null;editor.hidden=true;}
         await refresh();
        }catch(err){window.alert('Impossible de retirer l’activité : '+String(err?.message||err));remove.disabled=false;}
       };
       actions.append(edit,remove);card.appendChild(actions);
      }else{
       const locked=document.createElement('div');
       locked.className='muted small';locked.style.cssText='margin-top:5px;';
       locked.textContent='Activité validée : modification verrouillée.';
       card.appendChild(locked);
      }
      cell.appendChild(card);
     });
     const button=document.createElement('button');
     button.type='button';button.className='btn cp-week-v258-add';
     button.style.cssText='width:100%;text-align:center;min-height:32px;font-size:12px';
     button.textContent='+ Activité';
     button.setAttribute('aria-label','Ajouter une activité le '+weekday[d]+' '+formatDate(day));
     button.onclick=()=>openEditor(day);
     cell.appendChild(button);
    }else{
     const empty=document.createElement('span');
     empty.className='muted small';empty.textContent='Hors période';
     cell.appendChild(empty);
    }
    grid.appendChild(cell);
   }
   scroll.appendChild(grid);weekBox.appendChild(scroll);cal.appendChild(weekBox);
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