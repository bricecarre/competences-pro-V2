from pathlib import Path
import sys,re
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-student-notes-v246'
if marker in s:
 old=" let cut=stored&&stored.firstS2Id?assessments.findIndex(x=>String(x.ev.id)===String(stored.firstS2Id)):-1;"
 revised=""" let cut=-1;
 if(stored&&stored.firstS2Id){
  const boundary=candidates.findIndex(ev=>String(ev.id)===String(stored.firstS2Id));
  if(boundary>=0)cut=assessments.filter(x=>candidates.indexOf(x.ev)<boundary).length;
 }"""
 if old in s:s=s.replace(old,revised,1)
if marker not in s:
 new="""function studentNotesPage(){
 if(!session||session.role!=='student')return;
 const st=data.students.find(x=>x.id===session.user);
 const cls=data.classes.find(c=>c.id===st?.classId);
 if(!st||!cls){shell(title('Mes notes','Profil élève indisponible'));return}
 const refKey=classReferentialKey(cls);
 const ids=new Set((data.results||[]).filter(r=>r.student===st.id).map(r=>r.eval));
 const gradeIds=new Set((data.evalGrades||[]).filter(g=>g.studentId===st.id).map(g=>g.evalId));
 const valid=n=>n!==null&&n!==undefined&&Number.isFinite(Number(n));
 const assessments=data.evals.filter(ev=>evalReferentialKey(ev)===refKey&&
   ((ev.classes||[]).includes(cls.id)||ids.has(ev.id)||gradeIds.has(ev.id)))
   .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''),'fr')||String(a.title||'').localeCompare(String(b.title||''),'fr'))
   .map(ev=>({ev,grade:effectiveEvalGrade(ev.id,st.id)}))
   .filter(x=>valid(x.grade));
 const stored=(data.teacherNotesSemesterCutoffs||{})[String(cls.id)];
 let cut=-1;
 if(stored&&stored.firstS2Id){
  const boundary=candidates.findIndex(ev=>String(ev.id)===String(stored.firstS2Id));
  if(boundary>=0)cut=assessments.filter(x=>candidates.indexOf(x.ev)<boundary).length;
 }
 if(cut<0&&stored&&Number.isInteger(stored.index))cut=Math.max(0,Math.min(assessments.length,stored.index));
 if(cut<0){
  const old=assessments.findIndex(x=>(data.teacherNotesSemesters||{})[JSON.stringify([cls.id,x.ev.id])]===2);
  cut=old>=0?old:Math.ceil(assessments.length/2);
 }
 const first=assessments.slice(0,cut),second=assessments.slice(cut);
 const mean=list=>list.length?list.reduce((a,x)=>a+Number(x.grade),0)/list.length:null;
 const m1=mean(first),m2=mean(second),ms=[m1,m2].filter(x=>x!==null),my=ms.length?ms.reduce((a,b)=>a+b,0)/ms.length:null;
 const fmt=n=>n===null?'—':n.toLocaleString('fr-FR',{maximumFractionDigits:2});
 const table=(list,n,m)=>'<section class="card" style="flex:1 1 290px;min-width:0"><h2>Semestre '+n+'</h2>'
 +'<p class="muted small">'+list.length+' évaluation(s) notée(s)</p>'
 +'<div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Évaluation</th><th style="text-align:right;padding:8px">Note</th></tr></thead><tbody>'
 +(list.length?list.map((x,i)=>'<tr style="background:'+(i%2?'rgba(96,148,206,.105)':'var(--panel)')+'"><td style="padding:9px 8px;border-bottom:1px solid var(--line)"><b>'+esc(x.ev.title||'Évaluation')+'</b><div class="muted small">'+esc(x.ev.code||'')+(x.ev.date?' · '+esc(x.ev.date):'')+'</div></td><td style="padding:9px 8px;text-align:right;white-space:nowrap;font-weight:700;border-bottom:1px solid var(--line)">'+esc(fmt(Number(x.grade)))+' / 20</td></tr>').join(''):'<tr><td colspan="2" style="padding:12px">Aucune note.</td></tr>')
 +'</tbody></table></div><p style="font-weight:700;margin-top:12px">Moyenne S'+n+' : '+esc(fmt(m))+' / 20</p></section>';
 shell(title('Mes notes',esc(name(st))+' · '+esc(cls.name||''))+
 '<div data-student-notes-v246="1"><div class="card" style="margin-bottom:12px"><h2>Mes moyennes</h2>'
 +'<div style="display:flex;gap:20px;flex-wrap:wrap"><span>S1 : <b>'+esc(fmt(m1))+' / 20</b></span><span>S2 : <b>'+esc(fmt(m2))+' / 20</b></span><span>Année : <b>'+esc(fmt(my))+' / 20</b></span></div>'
 +'<p class="muted small">Semestres définis comme dans le tableau du professeur. Consultation uniquement.</p></div>'
 +'<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">'+table(first,1,m1)+table(second,2,m2)+'</div></div>');
}

"""
 a=s.index('function student(){')
 s=s[:a]+new+s[a:]
 old=": [['dashboard','Mon tableau'],['timeline','Ma frise'],['history','Historique']];"
 assert s.count(old)==1,'Menu élève absent'
 s=s.replace(old,": [['dashboard','Mon tableau'],['notes','Mes notes'],['timeline','Ma frise'],['history','Historique']];",1)
 a=s.index('const mobileNav=')
 b=s.index('root.innerHTML=',a)
 menu=s[a:b]
 pattern=r'<button class="[^"]+" data-s="mobileevals"><span class="mobile-nav-icon">📝</span><span class="mobile-nav-label">Évaluations</span></button>'
 assert len(re.findall(pattern,menu))==1,'Bouton évaluations mobile absent'
 menu=re.sub(pattern,'<button class="btn" data-s="notes"><span class="mobile-nav-icon">📝</span><span class="mobile-nav-label">Mes notes</span></button>',menu,count=1)
 s=s[:a]+menu+s[b:]
s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.46 — Mes notes et compétences</title>',s,count=1)
p.write_text(s,encoding='utf-8')
print('V2.46 : page Mes notes en lecture seule')
