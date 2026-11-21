from pathlib import Path
import re,sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
if 'cloud-sync-v244.js' in s:
 s=re.sub(r'<title>[^<]*</title>','<title>Compétences Pro V2.44 — Données synchronisées</title>',s,count=1)
 s=s.replace('Version locale V2.43','Version en ligne V2.44')
 p.write_text(s,encoding='utf-8')
 print('V2.44 cloud already patched ; titre synchronisé');sys.exit(0)
# Charger le moteur avant le gros script applicatif.
anchor='<script>'
assert anchor in s,"script application introuvable"
i=s.rfind(anchor)
assert i>0
s=s[:i]+'<script src="cloud-sync-v244.js"></script>\n'+s[i:]
old='let data=readStoredData(),'
assert old in s,"initialiseur d'ancien stockage absent"
s=s.replace(old,'let data=JSON.parse(JSON.stringify(seed)),',1)
a=s.find('const save=(silent=false)=>{')
assert a>0,"ancienne sauvegarde locale absente"
b=s.find('\nconst name=x=>',a)
assert b>a,"fin de sauvegarde introuvable"
s=s[:a]+'''const save=(silent=false)=>{
 if(!window.cpCloudReady)return false;
 window.cpCloudSave(data);
 return true
};'''+s[b:]
old='''async function bootstrapApp(){
 await recoverFromIndexedDbIfNewer();
 normalizeDataShape();'''
new='''async function bootstrapApp(){
 try{
   data=await window.cpCloudInitialize(root);
   window.cpCloudReady=true;
   window.cpCloudListen(next=>{
     data=next;
     normalizeDataShape();
     if(session)render();else login();
   });
 }catch(error){
   console.error('Initialisation cloud impossible',error);
   root.innerHTML='<main style="max-width:560px;margin:8vh auto;padding:25px;background:#fff;color:#7a1921;font:16px system-ui;border-radius:12px"><h2>Connexion aux données en ligne impossible</h2><p id="cp-cloud-error-text"></p><button id="cp-cloud-retry">Réessayer</button></main>';
   document.getElementById('cp-cloud-error-text').textContent=error.message||String(error);
   document.getElementById('cp-cloud-retry').onclick=()=>location.reload();
   return;
 }
 normalizeDataShape();'''
assert old in s,"initialisation historique introuvable"
s=s.replace(old,new,1)
s=s.replace(''' // Crée/rafraîchit immédiatement les deux copies persistantes.
 save(true);

 if(location.hash''',''' // Aucune persistance locale des données métier : Supabase est la source unique.
 if(location.hash''',1)
assert ' // Aucune persistance locale des données métier' in s,"bootstrap non corrigé"
# Les anciens mécanismes sont conservés comme code mort pour compatibilité, sans être appelés.
s=s.replace('<title>Compétences Pro V2.43 — Suivi des compétences</title>','<title>Compétences Pro V2.44 — Données synchronisées</title>',1)
# Supprimer le cache de référentiel du navigateur : données uniquement distantes.
s=re.sub(r'function loadCatalogCache\(\)\{.*?\}\s*function loadCatalogMeta\(\)\{.*?\}\s*function saveCatalogCache\(list,meta=\{\}\)\{.*?\}(?=\s*let NATIONAL_TCI_CATALOG)',"function loadCatalogCache(){return []} function loadCatalogMeta(){return {}} function saveCatalogCache(list,meta={}){}",s,flags=re.S)
# Certaines opérations historiques écrivaient directement dans localStorage.
s=s.replace('localStorage.setItem(DATA_STORAGE_KEY,JSON.stringify(data))','save(true)')

s=s.replace('Version locale V2.43','Version en ligne V2.44')
p.write_text(s,encoding='utf-8')
print('V2.44 : mode données métier cloud uniquement activé')
