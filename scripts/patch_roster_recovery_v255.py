from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
src='<script src="roster-recovery-v255.js"></script>'
if src not in s:
 assert '</body>' in s,'Balise body introuvable'
 s=s.replace('</body>',src+'\n</body>',1)
 p.write_text(s,encoding='utf-8')
print('V2.55 : panneau de rapprochement privé des élèves de 1TCI1 activé')
