/* V2.65 — Évaluation pédagogique de chaque activité PFMP, sans compte tuteur. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const roleOK=()=>typeof session!=='undefined'&&['teacher','admin'].includes(session?.role);
function canSeeStudent(studentId){
 if(!roleOK()||typeof data==='undefined')return false;
 const student=data.students?.find(s=>String(s.id)===String(studentId));
 const cls=data.classes?.find(c=>String(c.id)===String(student?.classId));
 if(!cls)return false;
 if(session.role==='admin')return true;
 const teacher=data.teachers?.find(t=>String(t.id)===String(session.user));
 return !!teacher&&(cls.teachers||[]).some(id=>String(id)===String(teacher.id));
}
const dateFr=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return String(value||'');
 const [y,m,d]=value.split('-');return d+'/'+m+'/'+y;
};
function catalogFor(studentId){
 const ref=typeof studentReferentialData==='function'?studentReferentialData(studentId):null;
 return (ref?.comps||[]).map(code=>({code:String(code),label:String(ref?.labels?.[code]||code)}));
}
function levels(){
 try{
  if(typeof STATUS!=='undefined'&&Array.isArray(STATUS)){
   const values=STATUS.map(String).filter(s=>s&&s!=='Non évalué');
   if(values.length)return values;
  }
 }catch(_){}
 return ['Non acquis','En cours d’acquisition','Acquis','Maîtrisé'];
}
async function show(studentId,pfmpId,zoneId){
 const zone=document.getElementById(zoneId);
 if(!zone||!roleOK()||!canSeeStudent(studentId))return;
 if(typeof window.cpCloudListPfmpActivities!=='function'||typeof window.cpCloudListPfmpActivityAssessments!=='function'){
  zone.textContent='Service d’évaluation des activités indisponible.';return;
 }
 zone.textContent='Chargement des activités et évaluations…';
 try{
  const [entries,assessments]=await Promise.all([
   window.cpCloudListPfmpActivities(studentId,pfmpId),
   window.cpCloudListPfmpActivityAssessments(studentId,pfmpId)
  ]);
  if(!zone.isConnected)return;
  const catalog=catalogFor(studentId);
  const byId=new Map(assessments.reduce((groups,a)=>{
   const key=String(a.activity_id);
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(a);
   return groups;
  },new Map()));
  zone.innerHTML='<h3>Activités réalisées en entreprise</h3>'
   +'<p class="muted small">Pour chaque activité, associez les compétences du référentiel, évaluez-les, puis validez l’activité. Le tuteur sera traité ultérieurement.</p>'
   +'<p class="muted small cp-v265-summary"></p><div class="cp-v265-activity-list"></div>';
  const summary=zone.querySelector('.cp-v265-summary');
  summary.textContent=entries.length+' activité(s), '+entries.filter(e=>e.validation_status==='confirmed').length+' validée(s) par le professeur.';
  const root=zone.querySelector('.cp-v265-activity-list');
  if(!entries.length){root.textContent='Aucune activité renseignée par cet élève pour cette PFMP.';return;}
  for(const entry of entries){
   const saved=byId.get(String(entry.id))||[];
   const card=document.createElement('section');card.className='card cp-v265-activity';
   card.style.cssText='padding:14px;margin:12px 0;';
   const heading=document.createElement('div');
   heading.style.cssText='display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:start;';
   heading.innerHTML='<strong>'+esc(dateFr(entry.activity_date))
    +(entry.activity_end_date&&entry.activity_end_date!==entry.activity_date?' au '+esc(dateFr(entry.activity_end_date)):'')
    +'</strong><span class="cp-v265-state">'+(entry.validation_status==='confirmed'?'Validée par le professeur':'À évaluer')+'</span>';
   card.appendChild(heading);
   const desc=document.createElement('p');
   desc.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin:9px 0;';
   desc.textContent=entry.activity_text||'';card.appendChild(desc);
   const skillHeading=document.createElement('strong');skillHeading.textContent='Compétences évaluées';card.appendChild(skillHeading);
   const rows=document.createElement('div');rows.className='cp-v265-rows';rows.style.cssText='margin:8px 0;display:grid;gap:8px;';
   card.appendChild(rows);
   const notice=document.createElement('p');notice.className='muted small cp-v265-notice';notice.setAttribute('role','status');
   if(!catalog.length){
    notice.textContent='Référentiel introuvable : évaluation indisponible.';
    card.appendChild(notice);root.appendChild(card);continue;
   }
   const availableLevels=levels();
   function addRow(code='',mastery='',grade=null){
    const row=document.createElement('div');row.className='cp-v265-row';
    row.style.cssText='display:grid;grid-template-columns:minmax(160px,2fr) minmax(125px,1fr) minmax(90px,.65fr) auto;gap:8px;align-items:end;';
    const makeField=(labelText,control)=>{
     const label=document.createElement('label');label.style.cssText='font-size:12px;';
     label.textContent=labelText;control.style.cssText='width:100%;padding:8px;display:block;margin-top:5px;';
     label.appendChild(control);row.appendChild(label);
    };
    const codeSelect=document.createElement('select');codeSelect.className='cp-v265-code';
    const blank=document.createElement('option');blank.value='';blank.textContent='Choisir une compétence';codeSelect.appendChild(blank);
    for(const c of catalog){
     const option=document.createElement('option');option.value=c.code;option.textContent=c.code+' — '+c.label;
     if(code===c.code)option.selected=true;
     codeSelect.appendChild(option);
    }
    makeField('Compétence',codeSelect);
    const masterySelect=document.createElement('select');masterySelect.className='cp-v265-mastery';
    const empty=document.createElement('option');empty.value='';empty.textContent='Choisir un niveau';masterySelect.appendChild(empty);
    for(const level of availableLevels){
     const option=document.createElement('option');option.value=level;option.textContent=level;
     if(mastery===level)option.selected=true;
     masterySelect.appendChild(option);
    }
    makeField('Niveau de maîtrise',masterySelect);
    const gradeInput=document.createElement('input');gradeInput.type='number';gradeInput.min='0';gradeInput.max='20';gradeInput.step='0.5';
    gradeInput.inputMode='decimal';gradeInput.placeholder='Facultatif';gradeInput.className='cp-v265-grade';
    if(grade!==null&&grade!==undefined)gradeInput.value=String(grade);
    makeField('Note /20',gradeInput);
    const remove=document.createElement('button');remove.className='btn cp-v265-remove';remove.type='button';
    remove.textContent='Retirer';remove.style.marginBottom='1px';
    remove.onclick=()=>row.remove();
    row.appendChild(remove);rows.appendChild(row);
    return row;
   }
   for(const a of saved)addRow(a.competency_code,a.mastery_level,a.grade);
   const add=document.createElement('button');add.type='button';add.className='btn cp-v265-add';add.textContent='+ Ajouter une compétence';
   add.onclick=()=>addRow();
   card.appendChild(add);
   const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;';
   const saveDraft=document.createElement('button');saveDraft.type='button';saveDraft.className='btn cp-v265-save';
   saveDraft.textContent='Enregistrer sans valider';
   const confirm=document.createElement('button');confirm.type='button';confirm.className='btn primary cp-v265-confirm';
   confirm.textContent=entry.validation_status==='confirmed'?'Mettre à jour la validation':'✓ Valider cette activité';
   actions.append(saveDraft,confirm);
   if(entry.validation_status==='confirmed'){
    const unlock=document.createElement('button');unlock.type='button';unlock.className='btn cp-v265-unlock';
    unlock.textContent='Retirer la validation';actions.appendChild(unlock);
    unlock.onclick=()=>persist(false);
    saveDraft.hidden=true;
   }
   card.appendChild(actions);card.appendChild(notice);
   function readRows(){
    const list=[...rows.querySelectorAll('.cp-v265-row')].map(row=>({
     code:row.querySelector('.cp-v265-code').value,
     mastery:row.querySelector('.cp-v265-mastery').value,
     grade:row.querySelector('.cp-v265-grade').value.trim()
    }));
    if(list.some(r=>!r.code||!r.mastery))throw Error('Choisis une compétence et un niveau de maîtrise pour chaque ligne.');
    if(new Set(list.map(r=>r.code)).size!==list.length)throw Error('Une même compétence ne peut apparaître deux fois.');
    if(list.some(r=>r.grade!==''&&(!Number.isFinite(Number(r.grade))||Number(r.grade)<0||Number(r.grade)>20)))
     throw Error('Chaque note doit être comprise entre 0 et 20.');
    return list;
   }
   async function persist(confirmed){
    if(!canSeeStudent(studentId)){notice.textContent='Accès à cette classe refusé.';return;}
    let values;
    try{
     values=readRows();
     if(confirmed&&!values.length)throw Error('Ajoute et évalue au moins une compétence avant validation.');
    }catch(e){notice.textContent=e.message;return;}
    const buttons=[...actions.querySelectorAll('button')];
    buttons.forEach(b=>b.disabled=true);
    notice.textContent='Enregistrement en cours…';
    try{
     await window.cpCloudReviewPfmpActivity(studentId,pfmpId,entry.id,values,confirmed);
     await show(studentId,pfmpId,zoneId);
    }catch(err){notice.textContent='Enregistrement refusé : '+String(err?.message||err);
     buttons.forEach(b=>b.disabled=false);}
   }
   saveDraft.onclick=()=>persist(false);
   confirm.onclick=()=>persist(true);
   root.appendChild(card);
  }
 }catch(err){
  zone.textContent='Impossible de charger les activités PFMP : '+String(err?.message||err);
 }
}
window.cpPfmpTeacherActivityReview=show;
})();
