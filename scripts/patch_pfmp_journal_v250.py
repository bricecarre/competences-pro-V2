from pathlib import Path
import sys,re
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-pfmp-activity-journal-v250'
if marker in s:
 s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.50 — Carnet PFMP</title>',s,count=1)
 p.write_text(s,encoding='utf-8');print('V2.50 already patched');sys.exit(0)
a=s.index('function studentMobileContent(')
b=s.index('\nfunction bindStudentMobileCards(',a)
block=s[a:b]
# ancien brouillon retiré
# Insert diary UI beneath summary cards without replacing the existing PFMP evaluation view.
needle="</button>`}).join(''):'<div class=\"student-mobile-empty\">Aucune PFMP configurée.</div>'}</section></div>`"
assert needle in block,'PFMP student cards not found'
block=block.replace(needle,"</button>`}).join(''):'<div class=\"student-mobile-empty\">Aucune PFMP configurée.</div>'}<div id=\"cp-pfmp-journal-v250\" data-pfmp-activity-journal-v250=\"student\"></div></section></div>`",1)
s=s[:a]+block+s[b:]
# Bind student diary on the existing mobile PFMP page, which is also used on desktop.
needle=""" shell(studentMobileContent(student.id,mode));
 bindStudentMobileCards(student.id)"""
assert needle in s, 'studentMobilePage not found'
s=s.replace(needle,""" shell(studentMobileContent(student.id,mode));
 bindStudentMobileCards(student.id);
 if(mode==='pfmp')cpPfmpStudentDiary(student.id)""",1)
# Student sees collapsible diaries. Dates/text are escaped; writing uses Supabase, no local data.
insert = """function cpPfmpStatusText(status){
 return status==='confirmed'?'Confirmée par le tuteur':status==='correction_requested'?'Correction demandée':'En attente de confirmation du tuteur';
}
function cpPfmpActivityListHtml(entries){
 if(!entries.length)return '<p class="muted small">Aucune activité saisie pour cette période.</p>';
 return '<div style="display:grid;gap:9px;margin-top:10px">'+entries.map(e=>
 '<div class="card" style="padding:11px">'
 +'<b>'+esc(e.activity_date||'')+'</b> · <span class="muted small">'+esc(cpPfmpStatusText(e.validation_status))+'</span>'
 +'<div style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:5px">'+esc(e.activity_text||'')+'</div>'
 +(e.tutor_comment?'<div class="muted small">Retour du tuteur : '+esc(e.tutor_comment)+'</div>':'')
 +'</div>').join('')+'</div>';
}
async function cpPfmpStudentDiary(studentId){
 const zone=document.getElementById('cp-pfmp-journal-v250');
 if(!zone)return;
 const pfmps=studentApplicablePfmps(studentId);
 if(!pfmps.length)return;
 zone.innerHTML='<p class="muted small">Chargement du carnet PFMP…</p>';
 const fragments=[];
 for(const pfmp of pfmps){
  const id=String(pfmp.id);
  fragments.push('<details class="card" style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">✍️ Carnet d’activités — '+esc(pfmp.label||'PFMP')+'</summary>'
   +'<div class="cp-diary-entry-v250" data-pfmp-id="'+esc(id)+'" style="margin-top:12px">'
   +'<p class="muted small">Mes activités, enregistrées dans l’ordre chronologique. Chaque nouvelle activité attend la confirmation du tuteur.</p>'
   +'<div class="cp-diary-list-v250">Chargement…</div>'
   +'<div class="cp-diary-form-v250" hidden style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px">'
   +'<label style="display:block;margin-bottom:5px">Date de l’activité</label><input class="cp-diary-date-v250" type="date" value="'+new Date().toISOString().slice(0,10)+'" style="display:block;width:100%;max-width:220px;padding:8px">'
   +'<label style="display:block;margin:10px 0 5px">Activité réalisée</label><textarea class="cp-diary-text-v250" rows="4" maxlength="5000" placeholder="Décris ce que tu as fait aujourd’hui…" style="width:100%;min-height:90px;padding:9px"></textarea>'
   +'<button type="button" class="btn primary cp-diary-save-v250">Enregistrer cette activité</button>'
   +'<button type="button" class="btn cp-diary-cancel-v250">Annuler</button></div>'
   +'<p role="status" class="muted small cp-diary-info-v250"></p>'
   +'<button type="button" class="btn primary cp-diary-add-v250">+ Ajouter une activité</button>'
   +'</div></details>');
 }
 zone.innerHTML=fragments.join('');
 for(const wrapper of zone.querySelectorAll('.cp-diary-entry-v250')){
  const pfmpId=wrapper.dataset.pfmpId;
  const list=wrapper.querySelector('.cp-diary-list-v250');
  const info=wrapper.querySelector('.cp-diary-info-v250');
  const refresh=async()=>{
   const entries=await window.cpCloudListPfmpActivities(studentId,pfmpId);
   list.innerHTML=cpPfmpActivityListHtml(entries);
  };
  try{await refresh()}catch(err){list.textContent='Impossible de récupérer les activités : '+err.message}
  const form=wrapper.querySelector('.cp-diary-form-v250');
  const add=wrapper.querySelector('.cp-diary-add-v250');
  add.onclick=()=>{
   form.hidden=false;add.hidden=true;
   wrapper.querySelector('.cp-diary-text-v250').focus();
  };
  wrapper.querySelector('.cp-diary-cancel-v250').onclick=()=>{
   form.hidden=true;add.hidden=false;info.textContent='';
  };
  wrapper.querySelector('.cp-diary-save-v250').onclick=async()=>{
   if(session?.role!=='student'||session.user!==studentId)return;
   const date=wrapper.querySelector('.cp-diary-date-v250').value;
   const field=wrapper.querySelector('.cp-diary-text-v250');
   const message=field.value.trim(),btn=wrapper.querySelector('.cp-diary-save-v250');
   if(!date||!message){info.textContent='Renseigne une date et une activité.';return}
   btn.disabled=true;info.textContent='Enregistrement dans Supabase…';
   try{
    await window.cpCloudAddPfmpActivity(studentId,pfmpId,date,message);
    field.value='';
    await refresh();
    form.hidden=true;add.hidden=false;
    info.textContent='Activité ajoutée. Elle est maintenant en attente de confirmation du tuteur.';
   }catch(err){info.textContent='Activité non enregistrée : '+err.message}
   finally{btn.disabled=false}
  };
 }
}
async function cpPfmpTeacherDiary(studentId,pfmpId,zoneId){
 const zone=document.getElementById(zoneId);
 if(!zone)return;
 zone.textContent='Chargement des activités saisies par l’élève…';
 try{
  const entries=await window.cpCloudListPfmpActivities(studentId,pfmpId);
  zone.innerHTML='<h3>Activités décrites par l’élève</h3>'
   +(entries.length?'<p class="muted small">'+entries.length+' activité(s) saisie(s) · '
    +entries.filter(e=>e.validation_status==='confirmed').length+' confirmée(s) par le tuteur</p>':'')
   +cpPfmpActivityListHtml(entries);
 }catch(err){zone.textContent='Impossible de lire le carnet : '+err.message}
}

"""
a=s.index('function studentMobilePage(')
s=s[:a]+insert+s[a:]
# When teacher selects another pupil or refreshes evaluation, update the corresponding diary.
a=s.index('function evaluatePfmp(')
b=s.index('\nfunction pfmpPage(',a)
block=s[a:b]
needle='<div id="pfmpEvalZone"></div>'
assert needle in block,'PFMP teacher evaluation zone not found'
block=block.replace(needle,'<div class="card" id="cp-pfmp-teacher-journal-v250" style="margin-top:12px" data-pfmp-activity-journal-v250="teacher"></div><div id="pfmpEvalZone"></div>',1)
needle="   activeAppraisalContext={pfmpId:p.id,studentId,assessorType};"
assert needle in block
block=block.replace(needle,needle+"\n   cpPfmpTeacherDiary(studentId,p.id,'cp-pfmp-teacher-journal-v250');",1)
s=s[:a]+block+s[b:]
# The existing read-only modal also displays the full diary.
a=s.index('function pfmpEvaluationStudentDetail(')
b=s.index('\nfunction pfmpEvaluationOverview(',a)
block=s[a:b]
needle=" </div>`)\n}"
assert needle in block,'readonly PFMP modal ending not found'
block=block.replace(needle," </div><div class=\"card\" id=\"cp-pfmp-student-evaluation-diary-v250\" style=\"margin-top:12px\"></div>`);\n cpPfmpTeacherDiary(s.id,p.id,'cp-pfmp-student-evaluation-diary-v250');\n}",1)
s=s[:a]+block+s[b:]
s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.50 — Carnet PFMP</title>',s,count=1)
p.write_text(s,encoding='utf-8')
print('V2.50 : carnets PFMP déroulants, saisie élève et consultation professeur')
