from pathlib import Path
import sys,re
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
version="V2.43"
new_title="Compétences Pro V2.43 — Suivi des compétences"
s,n=re.subn(r"<title>[^<]*</title>","<title>"+new_title+"</title>",s,count=1)
assert n==1,"Titre de l'onglet introuvable"
s,n=re.subn(r"Version locale V2\.\d+(?:\.\d+)?\s*—\s*Administration à deux niveaux",
            "Version locale "+version+" — Administration à deux niveaux",s,count=1)
assert n==1,"Version affichée sur la connexion introuvable"
# Le navigateur utilisera le titre du document, qui ne dépend plus des anciens composants.
p.write_text(s,encoding='utf-8')
print("Version visible synchronisée :",version)
