from pathlib import Path
import sys,re
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
if "['notes','Mes notes']" not in s and "data-s=\\"notes\\"" not in s:
 print('V2.47 : lien Mes notes déjà retiré')
else:
 s=s.replace("['notes','Mes notes'],","")
 # Retour à la navigation mobile antérieure. L'écran notes reste comme code
 # historique inactif, sans modifier les notes ou les calculs du professeur.
 s=s.replace('data-s="notes"><span class="mobile-nav-icon">📝</span><span class="mobile-nav-label">Mes notes</span>',
             'data-s="mobileevals"><span class="mobile-nav-icon">📝</span><span class="mobile-nav-label">Évaluations</span>')
 print('V2.47 : onglet Mes notes retiré des navigations élève')
s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.47 — Accès rapide</title>',s,count=1)
p.write_text(s,encoding='utf-8')
