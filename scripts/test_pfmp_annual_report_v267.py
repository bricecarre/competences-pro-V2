"""Smoke test du bilan annuel avec deux PFMP, compétences validées et activités non validées."""
from pathlib import Path
import subprocess
from html import escape
src=Path('site/pfmp-annual-report-v267.js').resolve()
page=Path('/tmp/cp-annual-pfmp-v267.html')
page.write_text("""<!doctype html><html lang="fr"><meta charset="utf-8"><body>
<section class="card" id="report" data-cp-annual-pfmp-report="teacher" data-student-id="s1"></section>
<script>
window.session={role:'teacher',user:'t1'};
window.data={students:[{id:'s1',classId:'c1'}],classes:[{id:'c1',teachers:['t1']}],teachers:[{id:'t1'}]};
window.studentTrainingYear=()=>2;
window.studentPfmpCandidatesByYear=(studentId,year)=>year===2?
 [{id:'p1',label:'PFMP 1',trainingYear:2},{id:'p2',label:'PFMP 2',trainingYear:2}]:
 [{id:'p0',label:'PFMP précédente',trainingYear:1}];
window.studentReferentialData=()=>({comps:['C1','C2'],labels:{C1:'Préparation',C2:'Fabrication'}});
const entries={
 p1:[
  {id:'a1',validation_status:'confirmed',activity_text:'Traçage'},
  {id:'a2',validation_status:'pending',activity_text:'Soudage non validé'}],
 p2:[
  {id:'a3',validation_status:'confirmed',activity_text:'Fabrication'},
  {id:'a4',validation_status:'confirmed',activity_text:'Assemblage'}]
};
const grades={
 p1:[
  {activity_id:'a1',competency_code:'C1',mastery_level:'Acquis',grade:12},
  {activity_id:'a2',competency_code:'C2',mastery_level:'Maîtrisé',grade:20}],
 p2:[
  {activity_id:'a3',competency_code:'C1',mastery_level:'Acquis',grade:16},
  {activity_id:'a4',competency_code:'C2',mastery_level:'Acquis',grade:14}]
};
const calls=[];
window.cpCloudListPfmpActivities=async(id,pfmp)=>{calls.push('act:'+pfmp);return entries[pfmp]||[]};
window.cpCloudListPfmpActivityAssessments=async(id,pfmp)=>{calls.push('eval:'+pfmp);return grades[pfmp]||[]};
window.testData={entries,grades,calls};
</script>
<script src="SRC"></script>
<script>
function complete(ok,msg){
 const node=document.createElement('pre');node.textContent=ok?'CP_ANNUAL_REPORT_PASS':'CP_ANNUAL_REPORT_FAIL '+msg;
 document.body.appendChild(node);
}
setTimeout(()=>{
 try{
  const root=document.getElementById('report');
  if(root.dataset.cpAnnualPfmpV267!=='loaded')throw Error('Bilan non chargé');
  const text=root.textContent;
  if(root.querySelectorAll('.cp-annual-pfmp-stage').length!==2)throw Error('Deux PFMP requises');
  if(!text.includes('3 / 4 activité(s) validée(s)'))throw Error('Total annuel incorrect');
  if(root.querySelectorAll('.cp-annual-pfmp-competency').length!==3)throw Error('Détails stages manquants');
  if(!text.includes('14 / 20'))throw Error('Moyenne C1 incorrecte');
  if(text.includes('20 / 20'))throw Error('Note d’activité non validée prise en compte');
  if(testData.calls.some(x=>x.includes('p0')))throw Error('PFMP précédente intégrée à tort');
  if(!text.includes('n’ajoute aucune note aux moyennes scolaires'))throw Error('Avertissement moyenne scolaire absent');
  complete(true,'');
 }catch(e){complete(false,String(e))}
},350);
</script></body></html>""".replace('SRC',escape(src.as_uri(),quote=True)),encoding='utf-8')
run=subprocess.run(['google-chrome','--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--virtual-time-budget=5500','--dump-dom',page.as_uri()],capture_output=True,text=True,timeout=35)
if run.returncode!=0 or 'CP_ANNUAL_REPORT_PASS' not in run.stdout:
 print(run.stdout[-2300:]);print(run.stderr[-1500:])
 raise SystemExit('Bilan annuel PFMP : scénario navigateur non validé')
print('OK : deux PFMP actuelles, compétence C1 répétée, activités non validées exclues, aucun doublon dans les moyennes scolaires')
