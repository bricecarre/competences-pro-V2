from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-stage-summary-v266'
if marker in s:
 print('V2.66 overall PFMP summary already installed');sys.exit(0)
# Conserver les anciennes notes et appréciations, mais retirer leur grille parallèle.
old='<div id="pfmpEvalZone"></div>'
new='<div id="pfmpEvalZone" style="display:none" data-cp-stage-summary-v266="historical-evaluations-preserved"></div>'
assert s.count(old)==1,'Global editable evaluation grid not found'
s=s.replace(old,new,1)
old='<h2>Évaluer une PFMP</h2>'
new='<h2>Carnet d’activités et bilan de PFMP</h2>'
assert s.count(old)==1,'PFMP heading not found'
s=s.replace(old,new,1)
old='}Modifiez l’évaluation du professeur référent ou du tuteur entreprise.</div>'
new='}Associez une évaluation à chaque activité. Le bilan général récapitule automatiquement les compétences évaluées.</div>'
assert s.count(old)==1,'Old PFMP explanation not found'
s=s.replace(old,new,1)
old='<div class="pfmp-assessor-tabs">'
new='<div class="pfmp-assessor-tabs" style="display:none">'
assert s.count(old)==1,'Tutor tabs not found'
s=s.replace(old,new,1)
# L'ancienne vue "Visualiser" n'affiche plus une seconde notation globale.
old='function pfmpEvaluationStudentDetail(pfmpId,studentId){'
assert s.count(old)==1,'Detail function missing'
new="""function pfmpEvaluationStudentDetail(pfmpId,studentId){
 // data-cp-stage-summary-v266 : une seule source pédagogique, le carnet.
 const activityPfmp=(data.pfmps||[]).find(x=>x.id===pfmpId);
 const activityStudent=data.students.find(x=>x.id===studentId);
 if(!activityPfmp||!activityStudent)return alert('Dossier PFMP introuvable.');
 modal('<div class="titlebar"><div><h2>'+esc(activityPfmp.label||'PFMP')+' · '+esc(name(activityStudent))+
   '</h2><div class="muted">Activités réalisées et bilan des compétences évaluées</div></div>'+
   '<button class="btn close">Fermer</button></div>'+
   '<div class="card" id="cp-pfmp-student-evaluation-diary-v250" style="margin-top:12px"></div>');
 cpPfmpTeacherDiary(activityStudent.id,activityPfmp.id,'cp-pfmp-student-evaluation-diary-v250');
 return;
"""
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('V2.66 : ancien formulaire de notation globale masqué, bilan issu des activités')
