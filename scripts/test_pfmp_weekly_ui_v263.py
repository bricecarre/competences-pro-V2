"""Smoke-test du carnet PFMP avec un profil élève simulé, sans toucher aux élèves réels."""
from pathlib import Path
import subprocess
from html import escape
js=Path('site/pfmp-weekly-v258.js').resolve()
assert js.is_file()
html=Path('/tmp/cp-pfmp-weekly-ui-test.html')
html.write_text("""<!doctype html><html lang="fr"><meta charset="utf-8"><body>
<div class="cp-diary-entry-v250" data-pfmp-id="p1">
  <p class="muted small">Ancien formulaire</p>
  <label>Date de début</label><input class="cp-diary-date-v250" type="date">
  <label>Date de fin</label><input class="cp-diary-end-date-v257" type="date">
  <label>Activités réalisées</label><textarea class="cp-diary-text-v250"></textarea>
  <button class="cp-diary-save-v250">Ancien enregistrement</button>
  <p class="cp-diary-info-v250 muted small"></p>
  <div class="cp-diary-list-v250"></div>
</div>
<script>
window.session={role:'student',user:'student-test'};
window.data={pfmpResults:[{pfmpId:'p1',studentId:'student-test',assessorType:'teacher',comp:'C1',grade:14,status:'Acquis'}]};
window.studentApplicablePfmps=()=>[{id:'p1',startDate:'2026-11-23',endDate:'2026-11-27'}];
window.studentReferentialData=()=>({labels:{C1:'Préparer une réalisation'}});
let entries=[{id:'e1',student_id:'student-test',pfmp_id:'p1',activity_date:'2026-11-24',activity_end_date:'2026-11-25',activity_text:'Soudage',validation_status:'pending',competency_codes:['C1']}];
window.cpCloudListPfmpActivities=async()=>entries;
window.cpCloudAddPfmpActivity=async()=>{};
window.cpCloudUpdatePfmpActivity=async(id,start,text,end)=>{
 entries=entries.map(e=>e.id===id?{...e,activity_date:start,activity_end_date:end,activity_text:text}:e);
};
window.cpCloudDeletePfmpActivity=async id=>{entries=entries.filter(e=>e.id!==id);};
window.confirm=()=>true;
window.cpPfmpActivityListHtml=()=>'<p>Anciennes activités</p>';
</script>
<script src="SRC"></script>
<script>
function assert(ok,msg){if(!ok)throw Error(msg);}
function finish(success,message){
 const el=document.createElement('pre');el.textContent=success?'CP_WEEKLY_UI_PASS':'CP_WEEKLY_UI_FAIL '+message;document.body.appendChild(el);
}
setTimeout(async()=>{
 try{
  assert(document.querySelectorAll('.cp-week-v258-cell').length===5,'5 days missing');
  assert(document.querySelector('.cp-diary-date-v250').hidden,'Old form still visible');
  assert(document.querySelectorAll('.cp-week-v262-edit').length===2,'Multiday activity missing');
  assert(document.body.textContent.includes('14/20'),'Teacher grade missing');
  assert(document.body.textContent.includes('Validation du tuteur : En attente'),'Tutor validation missing');
  document.querySelector('.cp-week-v262-edit').click();
  const field=document.querySelector('.cp-weekly-text-v258');
  assert(field.value==='Soudage','Edit not initialized');
  field.value='Assemblage';
  document.querySelector('.cp-weekly-save-v258').click();
  setTimeout(async()=>{
   try{
    assert(entries[0].activity_text==='Assemblage','Update failed');
    document.querySelector('.cp-week-v262-remove').click();
    setTimeout(()=>{
     try{
      assert(entries.length===0,'Remove failed');
      assert(document.querySelectorAll('.cp-week-v262-edit').length===0,'Calendar not updated');
      finish(true,'');
     }catch(e){finish(false,String(e))}
    },100);
   }catch(e){finish(false,String(e))}
  },100);
 }catch(e){finish(false,String(e))}
},250);
</script>
</body></html>""".replace('SRC',escape(js.as_uri(),quote=True)),encoding='utf-8')
result=subprocess.run(
 ['google-chrome','--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--virtual-time-budget=6000','--dump-dom',html.as_uri()],
 capture_output=True,text=True,timeout=35
)
if result.returncode!=0 or 'CP_WEEKLY_UI_PASS' not in result.stdout:
 print('Test UI échec, code',result.returncode)
 print(result.stdout[-1500:])
 print(result.stderr[-1300:])
 raise SystemExit(1)
print('OK : 5 jours, masquage ancien formulaire, note professeur, validation tuteur, modification et retrait vérifiés')
