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
// V2.66 — le bilan est une synthèse des évaluations enregistrées par activité,
// jamais une seconde évaluation indépendante de la PFMP.
function stageSummary(entries,assessments,catalog){
 const root=document.createElement('section');
 root.className='cp-v266-stage-summary';
 root.style.cssText='padding:14px;margin:15px 0;border:1px solid var(--line,#9996);border-radius:10px;';
 const title=document.createElement('h3');title.textContent='Bilan global des compétences travaillées en entreprise';root.appendChild(title);
 const description=document.createElement('p');description.className='muted small';
 description.textContent='Synthèse automatique des activités évaluées par le professeur. Les activités en attente de validation sont distinguées des activités validées.';
 root.appendChild(description);
 const confirmed=new Set(entries.filter(e=>e.validation_status==='confirmed').map(e=>String(e.id)));
 const pending=entries.filter(e=>e.validation_status!=='confirmed').length;
 const summary=document.createElement('p');summary.className='cp-v266-stage-count';
 summary.textContent=entries.length+' activité(s) saisie(s) · '+confirmed.size+' validée(s) · '+pending+' en attente.';
 root.appendChild(summary);
 const grouped=new Map();
 for(const result of assessments){
  if(!confirmed.has(String(result.activity_id)))continue;
  const code=String(result.competency_code);
  if(!grouped.has(code))grouped.set(code,[]);
  grouped.get(code).push(result);
 }
 const subtitle=document.createElement('p');
 subtitle.textContent=grouped.size+' compétence(s) différente(s) évaluée(s) dans les activités validées.';
 root.appendChild(subtitle);
 const list=document.createElement('div');list.className='cp-v266-competency-list';list.style.cssText='display:grid;gap:9px;';
 const labels=new Map(catalog.map(c=>[c.code,c.label]));
 if(!grouped.size){
  const empty=document.createElement('p');empty.className='muted small';
  empty.textContent='Aucune compétence encore évaluée dans une activité validée.';
  list.appendChild(empty);
 }
 for(const [code,records] of [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b,'fr'))){
  const line=document.createElement('div');line.className='cp-v266-competency';
  line.style.cssText='padding:10px;border:1px solid var(--line,#9995);border-radius:8px;';
  const label=document.createElement('strong');
  label.textContent=code+' — '+(labels.get(code)||code);line.appendChild(label);
  const levels=[...new Set(records.map(r=>String(r.mastery_level||'Non évaluée')))];
  const detail=document.createElement('div');detail.className='muted small';
  detail.textContent='Évaluée dans '+records.length+' activité(s) · Niveau'+(levels.length===1?'':'x')+' : '+levels.join(', ');
  line.appendChild(detail);
  const grades=records.map(r=>r.grade).filter(g=>g!==null&&g!==undefined&&Number.isFinite(Number(g))).map(Number);
  if(grades.length){
   const g=document.createElement('div');g.className='muted small';
   const mean=grades.reduce((a,b)=>a+b,0)/grades.length;
   g.textContent='Moyenne des notes saisies : '+mean.toLocaleString('fr-FR',{maximumFractionDigits:2})+'/20 ('+grades.length+' note(s))';
   line.appendChild(g);
  }
  list.appendChild(line);
 }
 root.appendChild(list);
 const annotation=document.createElement('p');annotation.className='muted small';
 annotation.textContent='Ce bilan n’attribue pas une nouvelle note de stage et ne modifie aucune évaluation : il réunit celles des activités validées.';
 annotation.style.marginTop='10px';root.appendChild(annotation);
 return root;
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
  zone.innerHTML='<h3>Carnet des activités de la PFMP</h3>'
   +'<p class="muted small">Chaque saisie de l’élève apparaît séparément. Ouvrez une activité pour lui associer des compétences et l’évaluer.</p>'
   +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button type="button" class="btn cp-v266-refresh">Actualiser les activités</button><button type="button" class="btn cp-v266-go-summary">Voir le bilan global des compétences</button></div>'
   +'<p class="muted small cp-v265-summary"></p><div class="cp-v265-activity-list"></div><div class="cp-v266-summary-anchor"></div>';
  zone.querySelector('.cp-v266-refresh').onclick=()=>show(studentId,pfmpId,zoneId);
  zone.querySelector('.cp-v266-go-summary').onclick=()=>zone.querySelector('.cp-v266-stage-summary')?.scrollIntoView({block:'start',behavior:'smooth'});
  zone.querySelector('.cp-v266-summary-anchor').appendChild(stageSummary(entries,assessments,catalog));
  const summary=zone.querySelector('.cp-v265-summary');
  summary.textContent=entries.length+' activité(s), '+entries.filter(e=>e.validation_status==='confirmed').length+' validée(s) par le professeur.';
  const root=zone.querySelector('.cp-v265-activity-list');
  if(!entries.length){root.textContent='Aucune activité renseignée par cet élève dans cette PFMP. Vérifiez la période de stage sélectionnée.';return;}
  for(const entry of entries){
   const saved=byId.get(String(entry.id))||[];
   const card=document.createElement('section');card.className='card cp-v265-activity';
   card.style.cssText='padding:14px;margin:12px 0;';
   const heading=document.createElement('div');
   heading.style.cssText='display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:start;';
   heading.innerHTML='<strong>Activité '+String(entries.indexOf(entry)+1)+' · '+esc(dateFr(entry.activity_date))
    +(entry.activity_end_date&&entry.activity_end_date!==entry.activity_date?' au '+esc(dateFr(entry.activity_end_date)):'')
    +'</strong><span class="cp-v265-state">'+(entry.validation_status==='confirmed'?'Validée par le professeur':'À évaluer')+'</span>';
   card.appendChild(heading);
   const desc=document.createElement('p');
   desc.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin:9px 0;';
   desc.textContent=entry.activity_text||'';card.appendChild(desc);
   const skillHeading=document.createElement('strong');skillHeading.textContent='Évaluation de cette activité';card.appendChild(skillHeading);
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
