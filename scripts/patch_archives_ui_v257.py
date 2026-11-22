from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
tag='<script src="student-archives-v257.js"></script>'
if tag not in s:
 assert '</body>' in s,'Balise body absente'
 s=s.replace('</body>',tag+'\n</body>',1)
 p.write_text(s,encoding='utf-8')
print('V2.57 panneau Archives activé')
