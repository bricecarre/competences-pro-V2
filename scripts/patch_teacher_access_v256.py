from pathlib import Path
import re,sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-teacher-assigned-only-v256'
if marker in s:
 print('V2.56 already applied');sys.exit(0)
start=s.find('  // data-cp-school-class-scope-v253')
assert start>=0,'V2.53 broad access block missing'
end=s.find('  const schoolIds=',start)
assert end>start,'End of teacher scope missing'
replacement="""  // data-cp-teacher-assigned-only-v256
  // Un professeur ne consulte que ses classes explicitement attribuées.
  // Ni l'établissement entier ni un nom de classe ne donnent cet accès.
  const allowed=data.classes.filter(c=>Array.isArray(c.teachers)&&c.teachers.some(id=>String(id)===String(t.id))).map(c=>c.id);
"""
s=s[:start]+replacement+s[end:]
# Eliminate V2.54 side effect: merely visiting Mes élèves must never change pupils.
old='  const repeaterCheck=cpRepairKnownRepeatersV254(filter);'
assert s.count(old)==1,'automatic repeater side effect not found'
s=s.replace(old,"  const repeaterCheck={restored:[],missing:[],unresolved:[]}; // V2.56 : lecture seule à l’ouverture",1)
p.write_text(s,encoding='utf-8')
print('V2.56 accès professeur limité aux classes attribuées; mutation automatique désactivée')
