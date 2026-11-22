/* V2.55 — Rapprochement contrôlé du véritable effectif de 1TCI1.
   Les 21 noms sont stockés en privé dans Supabase et jamais dans les sources GitHub. */
(function(){
'use strict';
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canon=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
let roster=null,loading=false;
function context(){
 try{
  if(!window.cpCloudReady||!session||!['teacher','admin'].includes(session.role))return null;
  if(typeof data==='undefined'||!Array.isArray(data.students)||!Array.isArray(data.classes))return null;
  const teacher=session.role==='teacher'?data.teachers.find(t=>t.id===session.user):null;
  const schoolId=teacher?.schoolId||((data.schools||[]).length===1?data.schools[0].id:null);
  const matches=data.classes.filter(c=>canon(c.name)==='1tci1'&&(!schoolId||c.schoolId===schoolId));
  return matches.length===1?{cls:matches[0],school:data.schools.find(s=>s.id===matches[0].schoolId)}:null;
 }catch(_){return null}
}
function compare(c){
 const all=data.students||[];
 const matches=[],missing=[],ambiguous=[],misplaced=[];
 for(const entry of roster||[]){
  const family=canon(entry.last);
  const aliases=family==='sagouard'?['sangouard','sangourad']:family==='sangouard'?['sagouard']:[];
  const choices=all.filter(st=>st.schoolId===c.cls.schoolId&&
    ([family,...aliases].includes(canon(st.last||st.lastName||''))));
  if(choices.length>1){ambiguous.push(entry);continue}
  if(!choices.length){missing.push(entry);continue}
  const st=choices[0];
  if(st.classId===c.cls.id&&!st.archived)matches.push({entry,st});
  else misplaced.push({entry,st});
 }
 return {matches,missing,ambiguous,misplaced};
}
function renderResults(zone,c){
 const result=compare(c);
 const format=items=>items.map(x=>escapeHtml(x.last||x.entry.last)).join(' · ')||'Aucun';
 zone.innerHTML='<div style="margin-top:12px;border:1px solid var(--line,#7775);padding:14px;border-radius:9px">'
  +'<b>Liste 1TCI1 — rapprochement avec la liste de référence 2026-2027</b>'
  +'<p class="muted small">Élèves déjà présents : <b>'+result.matches.length+'</b> · À réaffecter ou réactiver : <b>'+result.misplaced.length+'</b> · Fiches absentes : <b>'+result.missing.length+'</b> · Homonymes à vérifier : <b>'+result.ambiguous.length+'</b></p>'
  +(result.missing.length?'<p><b>Fiches absentes :</b> '+format(result.missing)+'</p>':'')
  +(result.misplaced.length?'<p><b>Fiches présentes ailleurs ou archivées :</b> '+format(result.misplaced)+'</p>':'')
  +(result.ambiguous.length?'<p><b>À vérifier manuellement :</b> '+format(result.ambiguous)+'</p>':'')
  +'<p class="muted small">Les notes et évaluations déjà enregistrées sont conservées. La liste de référence ne contient pas les anciennes évaluations ni les prénoms de tous les élèves.</p>'
  +((result.missing.length||result.misplaced.length)?'<button type="button" class="btn primary" id="cp-v255-restore">Réintégrer les élèves manquants dans 1TCI1</button>':'<b>Effectif de la liste de référence retrouvé.</b>')
  +'</div>';
 const action=zone.querySelector('#cp-v255-restore');
 if(action)action.onclick=()=>{
  const fresh=context();if(!fresh||fresh.cls.id!==c.cls.id)return;
  const check=compare(fresh);
  const changes=check.missing.length+check.misplaced.length;
  if(!changes)return renderResults(zone,fresh);
  if(!confirm('Réintégrer '+changes+' fiche(s) en 1TCI1 ? Les résultats et historiques existants seront conservés. Les fiches réellement absentes seront recréées sans notes inventées.'))return;
  // Les correspondances ambiguës ne sont jamais changées automatiquement.
  for(const {entry,st} of check.misplaced){
   st.classId=fresh.cls.id;
   st.schoolId=fresh.cls.schoolId;
   st.archived=false;
  }
  for(const entry of check.missing){
   data.students.push({
    id:'st-roster-'+crypto.randomUUID(),
    first:entry.first||'',
    last:entry.last,
    classId:fresh.cls.id,
    schoolId:fresh.cls.schoolId,
    archived:false,
    history:[String(fresh.school?.year||data.school?.year||'2026-2027')+' · '+String(fresh.school?.name||'Lycée Eugène Montel')+' · '+fresh.cls.name],
    group:entry.group,
    photo:null,
    recoverySource:'cp_roster_recovery/1TCI1'
   });
  }
  save();
  roster=null;
  render();
 };
}
async function showRoster(btn,zone,c){
 if(loading)return;
 loading=true;btn.disabled=true;btn.textContent='Vérification de la liste privée…';
 try{
  if(!roster){
   const source=await window.cpCloudGetClassRoster('1TCI1');
   roster=source.roster;
  }
  if(!document.contains(zone))return;
  renderResults(zone,c);
 }catch(e){
  if(document.contains(zone))zone.textContent='Liste indisponible : '+String(e?.message||e);
 }finally{loading=false;if(document.contains(btn)){btn.disabled=false;btn.textContent='Comparer avec la liste 1TCI1 (2026-2027)'}}
}
function install(){
 const heading=document.getElementById('studentFilterSummary');
 if(!heading||document.getElementById('cp-v255-roster-box'))return;
 const c=context();if(!c||typeof window.cpCloudGetClassRoster!=='function')return;
 const wrapper=document.createElement('div');
 wrapper.id='cp-v255-roster-box';
 wrapper.className='card';
 wrapper.style.cssText='margin:12px 0;padding:12px;border-left:4px solid #5593b2';
 wrapper.innerHTML='<div><b>Effectif 1TCI1 — récupération de la liste de classe</b>'
  +'<p class="muted small">Comparer les fiches avec la liste 2026-2027 enregistrée de manière privée.</p></div>'
  +'<button type="button" class="btn" id="cp-v255-check">Comparer avec la liste 1TCI1 (2026-2027)</button>'
  +'<div id="cp-v255-results" role="status"></div>';
 heading.parentNode.insertBefore(wrapper,heading);
 wrapper.querySelector('#cp-v255-check').onclick=()=>showRoster(wrapper.querySelector('#cp-v255-check'),wrapper.querySelector('#cp-v255-results'),c);
}
new MutationObserver(install).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();