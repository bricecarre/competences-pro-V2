/* V2.67 — Intégrer au bilan annuel les évaluations réelles des activités PFMP.
   Affichage seulement : ne crée aucune note scolaire et ne modifie aucune donnée. */
(function(){
'use strict';
const formatGrade=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2})+' / 20';
const validGrade=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=20;
const isConfirmed=e=>e.validation_status==='confirmed';
function permitted(studentId){
 if(typeof data==='undefined'||typeof session==='undefined')return false;
 const st=data.students?.find(x=>String(x.id)===String(studentId));
 if(!st)return false;
 if(session?.role==='student')return String(session.user)===String(studentId);
 if(session?.role==='admin')return true;
 if(session?.role!=='teacher')return false;
 const teacher=data.teachers?.find(t=>String(t.id)===String(session.user));
 const cls=data.classes?.find(c=>String(c.id)===String(st.classId));
 return !!teacher&&!!cls&&(cls.teachers||[]).some(id=>String(id)===String(teacher.id));
}
function stagesForYear(studentId){
 if(typeof studentTrainingYear!=='function'||typeof studentPfmpCandidatesByYear!=='function')return [];
 const year=studentTrainingYear(studentId);
 const stages=studentPfmpCandidatesByYear(studentId,year)||[];
 return [...new Map(stages.map(p=>[String(p.id),p])).values()]
  .filter(p=>String(p.id)&&Number(p.trainingYear||year)===Number(year));
}
function buildReport(root,studentId,sections){
 root.innerHTML='';
 root.setAttribute('data-cp-annual-pfmp-v267','loaded');
 const heading=document.createElement('h2');
 heading.textContent='PFMP — bilan annuel des activités et compétences';
 root.appendChild(heading);
 const note=document.createElement('p');note.className='muted small';
 note.textContent='Synthèse des activités de l’année de formation en cours. Les compétences ci-dessous proviennent uniquement des activités validées par le professeur.';
 root.appendChild(note);
 if(!sections.length){
  const empty=document.createElement('p');empty.className='muted small';
  empty.textContent='Aucune PFMP enregistrée pour cette année de formation.';
  root.appendChild(empty);return;
 }
 const catalog=typeof studentReferentialData==='function'?studentReferentialData(studentId):null;
 let allActivities=0,allValidated=0;
 const global=new Map();
 for(const section of sections){
  const {stage,entries,assessments}=section;
  allActivities+=entries.length;
  const validated=entries.filter(isConfirmed);
  allValidated+=validated.length;
  const verified=new Set(validated.map(e=>String(e.id)));
  const activityById=new Map(entries.map(e=>[String(e.id),e]));
  const group=new Map();
  for(const a of assessments){
   if(!verified.has(String(a.activity_id)))continue;
   const code=String(a.competency_code||'').trim();
   if(!code||!catalog?.comps?.includes(code))continue;
   if(!group.has(code))group.set(code,[]);
   group.get(code).push(a);
   if(!global.has(code))global.set(code,[]);
   global.get(code).push({...a,stageLabel:stage.label||'PFMP',activityText:activityById.get(String(a.activity_id))?.activity_text||''});
  }
  const card=document.createElement('section');
  card.className='cp-annual-pfmp-stage';
  card.style.cssText='padding:12px;margin:10px 0;border:1px solid var(--line,#aaa5);border-radius:9px';
  const title=document.createElement('h3');title.style.margin='0 0 7px';
  title.textContent=String(stage.label||'PFMP');
  card.appendChild(title);
  const sub=document.createElement('p');sub.className='muted small';
  sub.textContent=entries.length+' activité(s) saisie(s) · '+validated.length+' validée(s) · '+group.size+' compétence(s) évaluée(s)';
  card.appendChild(sub);
  for(const [code,records] of [...group.entries()].sort(([a],[b])=>a.localeCompare(b,'fr'))){
   const line=document.createElement('div');line.className='cp-annual-pfmp-competency';
   line.style.cssText='padding:7px 0;border-top:1px solid var(--line,#aaa4)';
   const title=document.createElement('strong');
   title.textContent=code+' — '+String(catalog?.labels?.[code]||code);
   line.appendChild(title);
   const detail=document.createElement('div');detail.className='muted small';
   detail.textContent=records.length+' activité(s) · niveau(x) : '+[...new Set(records.map(r=>String(r.mastery_level||'Non évaluée')))].join(', ');
   line.appendChild(detail);
   const grades=records.map(r=>r.grade).filter(validGrade).map(Number);
   if(grades.length){
    const mean=grades.reduce((a,b)=>a+b,0)/grades.length;
    const grade=document.createElement('div');grade.className='muted small';
    grade.textContent='Moyenne des notes attribuées aux activités : '+formatGrade(mean)+' ('+grades.length+' note(s))';
    line.appendChild(grade);
   }
   card.appendChild(line);
  }
  if(!group.size){
   const empty=document.createElement('p');empty.className='muted small';
   empty.textContent=entries.length?'Aucune compétence validée dans ce stage pour le moment.':'Aucune activité saisie dans ce stage.';
   card.appendChild(empty);
  }
  root.appendChild(card);
 }
 const total=document.createElement('div');total.className='cp-annual-pfmp-total';
 total.style.cssText='padding:10px;margin-top:12px;border-top:2px solid var(--line,#aaa6)';
 const labels=[...global.keys()].sort((a,b)=>a.localeCompare(b,'fr'));
 total.innerHTML='<strong>Récapitulatif annuel : '+allValidated+' / '+allActivities+
   ' activité(s) validée(s) · '+labels.length+' compétence(s) distincte(s) évaluée(s)</strong>';
 if(labels.length){
  const detail=document.createElement('p');detail.className='muted small';
  detail.textContent='Compétences : '+labels.join(' · ');
  total.appendChild(detail);
 }
 const footer=document.createElement('p');footer.className='muted small';
 footer.textContent='Ce récapitulatif n’ajoute aucune note aux moyennes scolaires : il reprend seulement les évaluations PFMP par activité.';
 total.appendChild(footer);root.appendChild(total);
}
let pending=new Set();
async function loadInto(root,studentId){
 if(!root.isConnected||!permitted(studentId))return;
 if(typeof window.cpCloudListPfmpActivities!=='function'||typeof window.cpCloudListPfmpActivityAssessments!=='function'){
  root.textContent='Le service de suivi des activités PFMP est indisponible.';
  root.setAttribute('data-cp-annual-pfmp-v267','error');return;
 }
 root.setAttribute('data-cp-annual-pfmp-v267','loading');
 root.textContent='Chargement du bilan des activités en entreprise…';
 try{
  const stages=stagesForYear(studentId);
  const sections=await Promise.all(stages.map(async stage=>{
   const [entries,assessments]=await Promise.all([
    window.cpCloudListPfmpActivities(studentId,String(stage.id)),
    window.cpCloudListPfmpActivityAssessments(studentId,String(stage.id))
   ]);
   return {stage,entries,assessments};
  }));
  if(!root.isConnected||!permitted(studentId)||String(root.dataset.studentId)!==String(studentId))return;
  buildReport(root,studentId,sections);
 }catch(error){
  if(!root.isConnected)return;
  root.setAttribute('data-cp-annual-pfmp-v267','error');
  root.textContent='Impossible de charger le bilan PFMP : '+String(error?.message||error);
 }
}
function mount(){
 document.querySelectorAll('[data-cp-annual-pfmp-report]').forEach(root=>{
  const studentId=root.getAttribute('data-student-id')||String(typeof session!=='undefined'?session?.user||'':'');
  if(!studentId||!permitted(studentId))return;
  if(root.getAttribute('data-cp-annual-pfmp-v267'))return;
  root.dataset.studentId=studentId;
  loadInto(root,studentId);
 });
}
window.cpRefreshAnnualPfmpReport=(studentId)=>{
 document.querySelectorAll('[data-cp-annual-pfmp-report]').forEach(root=>{
  if(String(root.dataset.studentId)===String(studentId)){
   root.removeAttribute('data-cp-annual-pfmp-v267');
   loadInto(root,studentId);
  }
 });
};
const observer=new MutationObserver(mount);
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();