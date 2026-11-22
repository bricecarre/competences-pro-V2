from pathlib import Path
import sys,re
p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
marker="data-cp-student-repair-v252"
if marker in s:
 print("V2.52 déjà appliquée")
 sys.exit(0)
old="function student(){\n  const s=data.students.find"
new="""function student(){
  /* data-cp-student-repair-v252 */
  // La vue élève n'avait pas de séquences au démarrage cloud (frise et progression à zéro).
  if(!window.cpCloudSequencesReady?.()){
    const requestedId=session?.user;
    if(!window.cpStudentSequencesPending){
      window.cpStudentSequencesPending=true;
      window.cpStudentSequencesError='';
      window.cpCloudEnsureSequences().then(sequences=>{
        data.sequences=sequences;
        window.cpStudentSequencesPending=false;
        if(session?.role==='student'&&session.user===requestedId)render();
      }).catch(error=>{
        window.cpStudentSequencesPending=false;
        window.cpStudentSequencesError=String(error?.message||error);
        if(session?.role==='student'&&session.user===requestedId){
          shell(title('Données pédagogiques indisponibles','La connexion aux séquences a échoué.')+
            '<div class="card"><p id="cp-v252-error"></p><button class="btn primary" id="cp-v252-retry">Réessayer</button></div>');
          document.getElementById('cp-v252-error').textContent=window.cpStudentSequencesError;
          document.getElementById('cp-v252-retry').onclick=()=>{window.cpStudentSequencesError='';render()};
        }
      });
    }
    shell(title('Chargement de mon parcours','Les évaluations et les séquences sont en cours de synchronisation.')+
      '<div class="card" role="status">Chargement des séquences pédagogiques… Elles sont nécessaires à la frise et à la progression.</div>');
    return;
  }
  const s=data.students.find"""
pattern=r"function student\(\)\{\s*const s=data\.students\.find"
s,n=re.subn(pattern,lambda m:new,s,count=1)
assert n==1, "fonction student introuvable"
old="const allVisible=data.students.filter(s=>!s.archived&&(!filter||filter.includes(s.classId))&&(!academyClasses||academyClasses.has(s.classId)));"
new="""const allVisible=data.students.filter(s=>(!filter||filter.includes(s.classId))&&(!academyClasses||academyClasses.has(s.classId)));
// Les fiches archivées restent repérables pour pouvoir les réactiver sans perte.
"""
assert s.count(old)==1, "filtre listStudents introuvable"
s=s.replace(old,new,1)
old="<b>${esc(name(st))}</b><span class=\"student-progress-badge\""
new="<b>${esc(name(st))}${st.archived?' · (archivé)':''}</b><span class=\"student-progress-badge\""
assert s.count(old)>=1, "étiquette nom élève introuvable"
s=s.replace(old,new,1)
old="${session.role==='teacher'?\u0060<button class=\"btn primary eval\" data-id=\"${st.id}\">Évaluer</button><button class=\"btn bilanStudent\" data-id=\"${st.id}\">Bilan</button>\u0060:''}<button class=\"btn danger del\" data-id=\"${st.id}\">Archiver</button>"
new="${session.role==='teacher'&&!st.archived?\u0060<button class=\"btn primary eval\" data-id=\"${st.id}\">Évaluer</button><button class=\"btn bilanStudent\" data-id=\"${st.id}\">Bilan</button>\u0060:''}${st.archived?\u0060<button class=\"btn cp-v252-reactivate\" data-id=\"${st.id}\">Réactiver</button>\u0060:\u0060<button class=\"btn danger del\" data-id=\"${st.id}\">Archiver</button>\u0060}"
assert s.count(old)==1, "actions élèves introuvables"
s=s.replace(old,new,1)
old="    bindCrud('student',filter);"
new="""    bindCrud('student',filter);
    document.querySelectorAll('.cp-v252-reactivate').forEach(b=>b.onclick=()=>{
      if(!['admin','teacher'].includes(session?.role))return;
      const student=data.students.find(x=>String(x.id)===String(b.dataset.id));
      if(!student||!student.archived)return;
      if(!confirm('Réactiver la fiche de '+name(student)+' ?'))return;
      student.archived=false;
      save();
      render();
    });"""
assert s.count(old)>=1,"liaison listes élèves introuvable"
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print("V2.52 : séquences chargées pour élèves et fiches archivées réactivables")anchor="document.querySelectorAll('.eval').forEach"
a=s.index("function listStudents(")
b=s.find("\\nfunction ",a+10)
if b<0:b=len(s)
part=s[a:b]
assert anchor in part,"boutons d'évaluation de la liste introuvables"
hook="""document.querySelectorAll('.cp-v252-reactivate').forEach(b=>b.onclick=()=>{
      if(!['admin','teacher'].includes(session?.role))return;
      const student=data.students.find(x=>String(x.id)===String(b.dataset.id));
      if(!student||!student.archived)return;
      if(!confirm('Réactiver la fiche de '+name(student)+' ?'))return;
      student.archived=false;
      save();
      render();
    });
    """
part=part.replace(anchor,hook+anchor,1)
s=s[:a]+part+s[b:]
p.write_text(s,encoding='utf-8')
print("V2.52 : séquences chargées pour élèves et fiches archivées réactivables")
