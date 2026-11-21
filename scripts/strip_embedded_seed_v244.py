from pathlib import Path
import sys,json
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
a=s.find('const seed=')
b=s.find('const DATA_STORAGE_KEY=',a)
assert a>=0 and b>a,"seed ou constante de sauvegarde non trouvée"
old=s[a:b]
if len(old)<1000000:
 print('Jeu de données embarqué déjà retiré');sys.exit(0)
assert old.rstrip().endswith('};'),"Fin de jeu de données inattendue"
# Les collections pédagogiques proviennent désormais exclusivement de Supabase.
blank={'school':{'name':'Données en ligne','year':'2026-2027'},
 'schools':[],'classes':[],'teachers':[],'students':[],
 'sequences':[],'evals':[],'results':[],
 'pfmps':[],'pfmpResults':[],'pfmpAppraisals':[],'evalGrades':[],
 'v2':{}}
replacement='const seed='+json.dumps(blank,ensure_ascii=False,separators=(',',':'))+';\n'
s=s[:a]+replacement+s[b:]
assert len(s)<len(old)//2,"Anciennes données non retirées"
p.write_text(s,encoding='utf-8')
print('V2.44 :',len(old),'octets de données embarquées retirés du HTML')
