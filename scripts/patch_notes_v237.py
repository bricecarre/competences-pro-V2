from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
def one(a,b):
    global s
    if s.count(a)!=1:
        raise RuntimeError('Motif introuvable ou ambigu : '+a[:90])
    s=s.replace(a,b,1)

one(" ['pfmp','PFMP']\n];"," ['pfmp','PFMP'],\n ['notes','Notes']\n];")
one(" if(section==='pfmp')return pfmpPage(schoolIds);"," if(section==='pfmp')return pfmpPage(schoolIds);\n if(section==='notes')return teacherNotesPage(allowed);")
one("   .filter(code=>String(code).includes('.')))]","   .filter(code=>String(code||'').trim().length>0))]")

notes=r'''// V2.37 : tableau récapitulatif des notes (lecture seule).
let teacherNotesSelectedClass=null;
function teacherNotesPage(allowedClassIds){
 const classes=data.classes.filter(c=>!c.archived&&allowedClassIds.includes(c.id))
   .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'fr'));
 if(!classes.length){shell(title('Notes','Tableau récapitulatif par classe')+'<div class="card">Aucune classe affectée à ce professeur.</div>');return}
 if(!classes.some(c=>c.id===teacherNotesSelectedClass))teacherNotesSelectedClass=classes[0].id;
 const chosen=classes.find(c=>c.id===teacherNotesSelectedClass);
 const refKey=classReferentialKey(chosen);
 const pupils=data.students.filter(st=>!st.archived&&st.classId===chosen.id)
   .sort((a,b)=>String(a.last||'').localeCompare(String(b.last||''),'fr')||String(a.first||'').localeCompare(String(b.first||''),'fr'));
 const pupilIds=new Set(pupils.map(st=>st.id));
 const resultIds=new Set((data.results||[]).filter(r=>pupilIds.has(r.student)).map(r=>r.eval));
 const manualIds=new Set((data.evalGrades||[]).filter(g=>pupilIds.has(g.studentId)).map(g=>g.evalId));
 const assessments=data.evals.filter(ev=>
   evalReferentialKey(ev)===refKey &&
   ((ev.classes||[]).includes(chosen.id)||resultIds.has(ev.id)||manualIds.has(ev.id))
 ).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''),'fr')||String(a.title||'').localeCompare(String(b.title||''),'fr'));
 const gradeCell=(st,ev)=>{
   const g=effectiveEvalGrade(ev.id,st.id);
   return g===null||g===undefined?'<span class="muted" title="Aucune note enregistrée">—</span>':
     `<span title="${esc(evalGradeSourceLabel(ev.id,st.id))}">${esc(formatGrade(g))}</span>`;
 };
 const mean=st=>{
   const arr=assessments.map(ev=>effectiveEvalGrade(ev.id,st.id)).filter(n=>n!==null&&n!==undefined&&Number.isFinite(Number(n)));
   return arr.length?(arr.reduce((x,n)=>x+Number(n),0)/arr.length).toLocaleString('fr-FR',{maximumFractionDigits:2})+' / 20':'—';
 };
 const table=assessments.length?
   `<div style="overflow:auto;max-width:100%;border:1px solid var(--line);border-radius:10px"><table style="width:100%;border-collapse:separate;border-spacing:0;min-width:650px"><thead><tr><th style="position:sticky;left:0;top:0;background:var(--panel);z-index:3;min-width:180px;padding:10px;text-align:left">Élève</th>${assessments.map(ev=>`<th style="position:sticky;top:0;background:var(--panel);min-width:125px;padding:10px;text-align:center" title="${esc(ev.title||'Évaluation')}">${esc(ev.title||'Évaluation')}<div class="muted small">${esc(ev.date||'')}</div></th>`).join('')}<th style="position:sticky;top:0;background:var(--panel);padding:10px">Moyenne</th></tr></thead><tbody>${pupils.map(st=>`<tr><th style="position:sticky;left:0;background:var(--panel);padding:10px;text-align:left;white-space:nowrap">${esc(st.last||'')} ${esc(st.first||'')}</th>${assessments.map(ev=>`<td style="padding:10px;text-align:center;border-top:1px solid var(--line)">${gradeCell(st,ev)}</td>`).join('')}<td style="padding:10px;text-align:center;border-top:1px solid var(--line);font-weight:700">${mean(st)}</td></tr>`).join('')}</tbody></table></div>`:
   '<div class="card muted">Aucune évaluation associée à cette classe pour le moment.</div>';
 shell(title('Notes','Notes des élèves, par classe et par évaluation')+
   `<div class="card" style="margin-bottom:14px"><label for="teacherNotesClass">Classe</label> <select id="teacherNotesClass" class="input" style="max-width:350px">${classes.map(c=>`<option value="${esc(c.id)}" ${c.id===chosen.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><p class="muted small">${pupils.length} élève(s) · ${assessments.length} évaluation(s) · Notes sur 20 issues des évaluations enregistrées. « — » signifie qu'aucune note n'est disponible. La moyenne porte uniquement sur les notes disponibles.</p></div>`+table);
 const select=document.getElementById('teacherNotesClass');
 if(select)select.onchange=()=>{teacherNotesSelectedClass=select.value;teacherNotesPage(allowedClassIds)};
}
'''
one("function teacher(){",notes+"
function teacher(){")
p.write_text(s,encoding='utf-8')
print('Correctif V2.37 appliqué : tableau Notes et tous codes items pris en compte')
