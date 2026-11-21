from pathlib import Path
import sys,re
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-lazy-v248'
if marker not in s:
 old="document.getElementById('connect').onclick=()=>{"
 assert s.count(old)==1,'Bouton de connexion locale introuvable'
 s=s.replace(old,"document.getElementById('connect').onclick=async()=>{ /* data-cp-lazy-v248 */",1)
 old="""   session={role,user:selected||'admin'};
   section='dashboard';
   render()"""
 assert s.count(old)==1,'Ouverture de session introuvable'
 new="""   // Aucun élève ne télécharge les documents des autres classes à l'ouverture.
   // Professeurs/admin : les séquences restent nécessaires aux outils pédagogiques.
   if(role!=='student'){
    const connectBtn=document.getElementById('connect');
    if(connectBtn){connectBtn.disabled=true;connectBtn.textContent='Chargement des séquences…'}
    try{
     data.sequences=await window.cpCloudEnsureSequences();
    }catch(error){
     alert('Chargement des séquences impossible : '+(error?.message||error));
     if(connectBtn){connectBtn.disabled=false;connectBtn.textContent='Se connecter'}
     return;
    }
   }
   session={role,user:selected||'admin'};
   section='dashboard';
   render()"""
 s=s.replace(old,new,1)
s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.48 — Accès allégé</title>',s,count=1)
p.write_text(s,encoding='utf-8')
print('V2.48 : connexion élève allégée, documents réservés aux vues pédagogiques')
