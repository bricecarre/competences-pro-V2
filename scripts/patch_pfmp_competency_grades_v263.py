from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
marker='data-cp-pfmp-grade-v263'
if marker in s:
 print('V2.63 already applied');sys.exit(0)
a=s.index('function evaluatePfmp(')
b=s.find('\nfunction ',a+15)
if b<0:b=len(s)
block=s[a:b]
old="@@{r?.assessorName?"
new="""        @@{assessorType==='teacher'?'<label class="field" style="display:block;margin-top:7px">Note de la compétence /20 (facultative)<input type="number" class="cp-pfmp-grade-v263" data-comp="'+esc(comp)+'" min="0" max="20" step="0.5" inputmode="decimal" value="'+(r?.grade!==null&&r?.grade!==undefined?esc(String(r.grade)):'')+'" placeholder="Non notée" style="max-width:150px;display:block;padding:7px"></label>':''}
        @@{r?.assessorName?"""
old=old.replace('@@{','$'+'{');new=new.replace('@@{','$'+'{')
print('CP_GRADE_DIAG',len(block),'grade-anchor-count',block.count(old),'grade-title-index',block.find('pfmp-comp-row'),'assessor-index',block.find('r?.assessorName?'))
assert block.count(old)==1,'Grade insertion point not found'
block=block.replace(old,new,1)
old="const x={pfmpId:p.id,pfmpTrainingYear:selectedYear,studentId,comp,status,assessorType,assessorName,teacherId:assessorType==='teacher'?session.user:null,date:new Date().toISOString().slice(0,10)};"
new="const x={...old,pfmpId:p.id,pfmpTrainingYear:selectedYear,studentId,comp,status,assessorType,assessorName,teacherId:assessorType==='teacher'?session.user:null,date:new Date().toISOString().slice(0,10)};"
assert block.count(old)==1,'Status save anchor missing'
block=block.replace(old,new,1)
# Insérer avant la fermeture de draw(), sans dépendre du point-virgule ou de l'indentation.
point=block.find("const x={...old,pfmpId:p.id,pfmpTrainingYear:selectedYear")
assert point>=0,'Enregistrement statut PFMP absent'
closing=block.find('\n  };',point)
print('CP_GRADE_END_DIAG',point,closing,repr(block[point:point+1050]))
assert 0<closing-point<1200,'Fin du rendu PFMP introuvable'
insertion="""
    // data-cp-pfmp-grade-v263 : note facultative /20 distincte du niveau de maîtrise.
    document.querySelectorAll('.cp-pfmp-grade-v263').forEach(input=>input.onchange=()=>{
      if(session?.role!=='teacher'||assessorType!=='teacher')return;
      const raw=input.value.trim().replace(',','.');
      const grade=raw===''?null:Number(raw);
      if(grade!==null&&(!Number.isFinite(grade)||grade<0||grade>20)){
        alert('La note doit être comprise entre 0 et 20.');draw();return;
      }
      const comp=input.dataset.comp;
      const old=pfmpEvalResult(p.id,studentId,comp,'teacher');
      if(!old&&grade===null)return;
      const assessorName=document.getElementById('pfmpAssessorName').value.trim()||name(data.teachers.find(t=>t.id===session.user));
      const x={...old,pfmpId:p.id,pfmpTrainingYear:selectedYear,studentId,comp,
        status:old?.status||'Non évalué',grade,assessorType:'teacher',assessorName,teacherId:session.user,date:new Date().toISOString().slice(0,10)};
      data.pfmpResults=old?data.pfmpResults.map(r=>r===old?x:r):[...data.pfmpResults,x];
      save();draw();
    });
"""
block=block[:closing]+insertion+block[closing:]
s=s[:a]+block+s[b:]
p.write_text(s,encoding='utf-8')
print('V2.63 optional grades out of 20 by PFMP competency')
