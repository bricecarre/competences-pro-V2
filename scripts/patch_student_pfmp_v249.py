from pathlib import Path
import re,sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
# L'onglet PFMP réutilise l'écran PFMP élève existant, en lecture seule.
old=": [['dashboard','Mon tableau'],['timeline','Ma frise'],['history','Historique']];"
new=": [['dashboard','Mon tableau'],['pfmp','Mes PFMP'],['timeline','Ma frise'],['history','Historique']];"
if old in s:
 s=s.replace(old,new,1)
elif "['pfmp','Mes PFMP']" not in s:
 raise RuntimeError('V2.49 : menu élève introuvable')
old=" if(section==='mobilepfmp')return studentMobilePage(s,'pfmp');"
new=" if(section==='pfmp'||section==='mobilepfmp')return studentMobilePage(s,'pfmp');"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise RuntimeError('V2.49 : route PFMP élève introuvable')
s=s.replace('data-s="mobilepfmp"><span class="mobile-nav-icon">🏭</span><span class="mobile-nav-label">PFMP</span>',
            'data-s="pfmp"><span class="mobile-nav-icon">🏭</span><span class="mobile-nav-label">Mes PFMP</span>',1)
s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.49 — Mes PFMP</title>',s,count=1)
p.write_text(s,encoding='utf-8')
print('V2.49 : onglet Mes PFMP desktop et mobile, consultation seule')
