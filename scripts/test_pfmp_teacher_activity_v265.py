"""V2.65 integration smoke test: enseignant, une activité, une compétence, note, validation."""
from pathlib import Path
import subprocess
from html import escape
src=Path('site/pfmp-teacher-activity-v265.js').resolve()
html=Path('/tmp/cp-pfmp-teacher-v265.html')
html.write_text("""<!doctype html><html lang="fr"><meta charset="utf-8"><body>
<div id="zone"></div>
<script>
window.session={role:'teacher',user:'t1'};
window.data={
 students:[{id:'s1',classId:'c1'}],classes:[{id:'c1',teachers:['t1']}],
 teachers:[{id:'t1'}],pfmps:[{id:'p1'}]
};
window.STATUS=['Non évalué','Non acquis','En cours d’acquisition','Acquis','Maîtrisé'];
window.studentReferentialData=()=>({comps:['C1','C2'],labels:{C1:'Préparation',C2:'Fabrication'}});
let entry={id:'ac1',student_id:'s1',pfmp_id:'p1',activity_date:'2026-11-23',
 activity_end_date:'2026-11-27',activity_text:'Découpe de tôles',validation_status:'pending'};
let assessments=[],calls=[];
window.cpCloudListPfmpActivities=async()=>[entry];
window.cpCloudListPfmpActivityAssessments=async()=>assessments;
window.cpCloudReviewPfmpActivity=async(studentId,pfmpId,activityId,reviews,confirmed)=>{
 calls.push({studentId,pfmpId,activityId,reviews,confirmed});
 entry.validation_status=confirmed?'confirmed':'pending';
 assessments=reviews.map(r=>({activity_id:activityId,competency_code:r.code,mastery_level:r.mastery,grade:Number(r.grade)}));
};
window.__testState=()=>({entry,assessments,calls});
</script>
<script src="SRC"></script>
<script>
function result(ok,message){
 const x=document.createElement('pre');
 x.textContent=ok?'CP_TEACHER_UI_PASS':'CP_TEACHER_UI_FAIL '+message;
 document.body.appendChild(x);
}
window.cpPfmpTeacherActivityReview('s1','p1','zone').then(()=>{
 try{
  if(document.querySelectorAll('.cp-v265-activity').length!==1)throw Error('Une activité attendue');
  document.querySelector('.cp-v265-add').click();
  const row=document.querySelector('.cp-v265-row');
  row.querySelector('.cp-v265-code').value='C1';
  row.querySelector('.cp-v265-mastery').value='Acquis';
  row.querySelector('.cp-v265-grade').value='15';
  document.querySelector('.cp-v265-confirm').click();
  setTimeout(()=>{
   try{
    const saved=window.__testState();
    if(saved.calls.length!==1)throw Error('Une seule validation attendue');
    const call=saved.calls[0];
    if(!call.confirmed||call.activityId!=='ac1'||call.studentId!=='s1'||call.pfmpId!=='p1')throw Error('Mauvais rattachement');
    if(call.reviews[0].code!=='C1'||call.reviews[0].mastery!=='Acquis'||call.reviews[0].grade!=='15')throw Error('Compétence ou note incorrecte');
    if(document.querySelector('.cp-v265-state')?.textContent!=='Validée par le professeur')throw Error('Confirmation non affichée');
    if(!document.querySelector('.cp-v265-unlock'))throw Error('Retrait de validation absent');
    result(true,'');
   }catch(e){result(false,String(e))}
  },180);
 }catch(e){result(false,String(e))}
});
</script></body></html>""".replace('SRC',escape(src.as_uri(),quote=True)),encoding='utf-8')
run=subprocess.run(['google-chrome','--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--virtual-time-budget=4500','--dump-dom',html.as_uri()],capture_output=True,text=True,timeout=35)
if run.returncode or 'CP_TEACHER_UI_PASS' not in run.stdout:
 print(run.stdout[-2100:]);print(run.stderr[-1000:])
 raise SystemExit('Test enseignant PFMP échoué')
print('OK : activité, sélection compétence, niveau, note /20 et validation professeur vérifiés')
