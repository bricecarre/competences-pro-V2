from pathlib import Path
import sys,re
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
s=s.replace("['notes','Mes notes'],","")
s=s.replace('data-s="notes"><span class="mobile-nav-icon">📝</span><span class="mobile-nav-label">Mes notes</span>',
            'data-s="mobileevals"><span class="mobile-nav-icon">📝</span><span class="mobile-nav-label">Évaluations</span>')
s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.47 — Accès rapide</title>',s,count=1)
p.write_text(s,encoding='utf-8')
print('V2.47 : onglet Mes notes retiré')
