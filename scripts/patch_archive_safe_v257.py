from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-archive-safe-v257'
if marker in s:
 print('V2.57 archive already patched');sys.exit(0)
old="data[key]=data[key].filter(x=>x.id!==b.dataset.id);save();render()"
new="""if(type==='student'){
 const st=data.students.find(x=>String(x.id)===String(b.dataset.id));
 if(!st)return;
 // data-cp-archive-safe-v257 — ne jamais supprimer le dossier et ses références.
 st.archived=true;
 st.archivedAt=new Date().toISOString();
}else if(type==='class'||type==='teacher'){
 const entity=data[key].find(x=>String(x.id)===String(b.dataset.id));
 if(!entity)return;
 entity.archived=true;
}else return;
save();render()"""
assert s.count(old)==1, 'Archivage destructif introuvable ou ambigu'
s=s.replace(old,new,1)
# Les élèves archivés ne doivent plus encombrer la liste des élèves actifs.
old="const allVisible=data.students.filter(s=>(!filter||filter.includes(s.classId))&&(!academyClasses||academyClasses.has(s.classId)));"
new="const allVisible=data.students.filter(s=>!s.archived&&(!filter||filter.includes(s.classId))&&(!academyClasses||academyClasses.has(s.classId)));"
assert s.count(old)==1,'Filtre des élèves actifs non trouvé'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('V2.57: archive conserve identifiant, état civil, historique et évaluations')
