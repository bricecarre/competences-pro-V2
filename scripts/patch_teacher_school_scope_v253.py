from pathlib import Path
import sys,re
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
marker='data-cp-school-class-scope-v253'
if marker in s:
 print('V2.53 déjà appliquée');sys.exit(0)
# Une attribution incomplète c.teachers écartait les classes Bac Pro du professeur.
pattern=r"const t=data\.teachers\.find\(x=>x\.id===session\.user\),allowed=data\.classes\.filter\(c=>c\.teachers\.includes\(t\.id\)\)\.map\(c=>c\.id\),schoolIds=\[\.\.\.new Set\(data\.classes\.filter\(c=>allowed\.includes\(c\.id\)\)\.map\(c=>c\.schoolId\)\)\];"
replacement="""const t=data.teachers.find(x=>x.id===session.user);
  if(!t){shell(title('Profil professeur introuvable','Reconnexion nécessaire.'));return}
  // data-cp-school-class-scope-v253
  // La liste de classes du professeur peut être incomplète dans un export ancien.
  // Montrer toutes les classes de SON établissement, y compris Bac Pro,
  // sans modifier les élèves, leurs évaluations ou les affectations enregistrées.
  const allowed=data.classes.filter(c=>
    (t.schoolId&&String(c.schoolId)===String(t.schoolId))||
    (Array.isArray(c.teachers)&&c.teachers.includes(t.id))
  ).map(c=>c.id);
  const schoolIds=[...new Set(data.classes.filter(c=>allowed.includes(c.id)).map(c=>c.schoolId))];"""
s,n=re.subn(pattern,lambda m:replacement,s,count=1)
assert n==1,'Entrée professeur / attribution de classes introuvable'
# Expliquer l'étendue réelle de l'écran.
s=s.replace("shell(title(filter?'Mes élèves':'Élèves','Les élèves sont séparés entre Bac Pro TCI et CAP RICS.'", "shell(title(filter?'Mes élèves':'Élèves','Élèves des classes accessibles dans l’établissement, en Bac Pro TCI et CAP RICS.'",1)
p.write_text(s,encoding='utf-8')
print('V2.53 : toutes les classes de l’établissement du professeur deviennent visibles')
