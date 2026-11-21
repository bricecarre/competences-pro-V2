/* Compétences Pro V2.44 — stockage central, sans données métier dans le navigateur.
   Les identifiants de session Supabase peuvent rester dans le navigateur ; aucun élève/évaluation n'y est stocké. */
(function(){
'use strict';
const URL='https://mzrcrehziqqraawxukia.supabase.co';
const KEY='sb_publishable_LrxIA_2Zpq3Y4P48uuchiQ_tnRZeBBl';
const BUCKET='cp-private-backups';
const MAX_CHUNK=4*1024*1024;
const SECTIONS=['school','schools','classes','teachers','students','sequences','evals','results','pfmps','pfmpResults','pfmpAppraisals','evalGrades','v2','_cpMeta','_cpBackup'];
let sb=null,user=null,manifest=null,revision=0;
let active=false,conflict=false,working=false,dirty=false;
let timer=null,pollTimer=null,pendingData=null,onRemote=null,lastData=null,lastJson={};
const loadedSections=new Set();
let firstRead=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const status=(message,isError=false)=>{
 let bar=document.getElementById('cp-cloud-v244-status');
 if(!bar){
  bar=document.createElement('div');bar.id='cp-cloud-v244-status';
  Object.assign(bar.style,{position:'fixed',bottom:'8px',right:'8px',zIndex:'999999',maxWidth:'min(90vw,470px)',padding:'10px 13px',borderRadius:'8px',font:'bold 13px system-ui',boxShadow:'0 3px 15px #0005'});
  document.body.appendChild(bar);
 }
 bar.textContent=message;
 bar.style.background=isError?'#a12225':'#075a43';bar.style.color='white';
};
function fail(message){
 conflict=true;active=false;status('Sauvegarde en ligne interrompue : '+message,true);
 alert('Compétences Pro : synchronisation arrêtée. '+message+'\n\nNe ferme pas cette page avant d’avoir récupéré tes modifications. Recharge uniquement si tu acceptes de retrouver la dernière version en ligne.');
}
function showLoader(root,msg){
 root.innerHTML='<div style="font:16px system-ui;max-width:520px;margin:13vh auto;padding:28px;background:white;color:#19344d;border-radius:14px"><h2>☁️ Compétences Pro — données en ligne</h2><p id="cp-cloud-loader"></p><p style="font-size:13px">La base Supabase est la seule source de données. Aucune donnée pédagogique n’est enregistrée dans le navigateur.</p></div>';
 const x=document.getElementById('cp-cloud-loader');if(x)x.textContent=msg;
}
async function connect(root){
 if(!sb){
  const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.0');
  sb=mod.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 }
 const {data,error}=await sb.auth.getUser();
 if(!error&&data.user){user=data.user;return}
 showLoader(root,'Connecte-toi avec le compte créé sur la page « Sauvegarde privée en ligne ».');
 const panel=root.querySelector('div');panel.insertAdjacentHTML('beforeend',
  '<form id="cp-cloud-login-form" style="display:grid;gap:12px;margin-top:18px">'
 +'<label>E-mail <input id="cp-cloud-email" type="email" autocomplete="email" required style="display:block;width:100%;padding:10px"></label>'
 +'<label>Mot de passe <input id="cp-cloud-pass" type="password" autocomplete="current-password" required style="display:block;width:100%;padding:10px"></label>'
 +'<button type="submit" style="padding:12px;background:#125a98;color:white;border:0;border-radius:8px">Accéder aux données en ligne</button>'
 +'<p id="cp-cloud-login-error" style="color:#ab2020" role="alert"></p></form>');
 await new Promise(resolve=>{
  document.getElementById('cp-cloud-login-form').onsubmit=async e=>{
   e.preventDefault();
   const btn=e.target.querySelector('button');btn.disabled=true;
   const {data,error}=await sb.auth.signInWithPassword({
    email:document.getElementById('cp-cloud-email').value.trim(),
    password:document.getElementById('cp-cloud-pass').value
   });
   if(error){document.getElementById('cp-cloud-login-error').textContent=error.message;btn.disabled=false;return}
   user=data.user;resolve();
  };
 });
}
async function sha(blob){
 const bytes=await blob.arrayBuffer();
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function getState(){
 const {data,error}=await sb.from('cp_live_state').select('owner_id,revision,manifest,updated_at').eq('owner_id',user.id).maybeSingle();
 if(error)throw error;
 return data;
}
async function readParts(paths,bytes,expected){
 // Téléchargements simultanés, mais limités pour ne pas saturer un mobile.
 const parts=new Array(paths.length);
 let next=0;
 async function worker(){
  while(next<paths.length){
   const index=next++;
   const {data,error}=await sb.storage.from(BUCKET).download(paths[index]);
   if(error)throw Error('Fichier distant introuvable : '+error.message);
   parts[index]=data;
  }
 }
 await Promise.all(Array.from({length:Math.min(4,paths.length)},()=>worker()));
 const blob=new Blob(parts);
 if(bytes!=null&&blob.size!==Number(bytes))throw Error('Intégrité : taille de fichier incorrecte.');
 if(expected&&await sha(blob)!==expected)throw Error('Intégrité : empreinte SHA-256 incorrecte.');
 return blob.text();
}
async function readBackup(root){
 const {data,error}=await sb.from('cp_backup_manifests')
  .select('id,object_prefix,total_chunks,total_bytes,summary,original_filename')
  .eq('owner_id',user.id).eq('status','ready').order('created_at',{ascending:false}).limit(1);
 if(error)throw error;
 if(!data?.length)throw Error('Aucune sauvegarde privée associée à ce compte. Ouvre la page « Sauvegarde en ligne », transfère le JSON du PC, puis reconnecte-toi.');
 const b=data[0];
 showLoader(root,'Lecture de la sauvegarde '+(b.original_filename||'')+'…');
 const paths=Array.from({length:b.total_chunks},(_,i)=>b.object_prefix+'part-'+String(i).padStart(4,'0')+'.bin');
 const raw=await readParts(paths,b.total_bytes,b.summary?.sha256_raw);
 const obj=JSON.parse(raw);
 if(!Array.isArray(obj.schools)||!Array.isArray(obj.students)||!Array.isArray(obj.evals))throw Error('Le fichier distant n’est pas une sauvegarde Compétences Pro.');
 return obj;
}
async function writeSection(key,value,tag,raw){
 const blob=new Blob([raw??JSON.stringify(value)],{type:'application/json'});
 const paths=[];
 const count=Math.max(1,Math.ceil(blob.size/MAX_CHUNK));
 for(let i=0;i<count;i++){
  const path=user.id+'/live/'+tag+'/'+encodeURIComponent(key)+'/part-'+String(i).padStart(4,'0')+'.bin';
  const {error}=await sb.storage.from(BUCKET).upload(path,blob.slice(i*MAX_CHUNK,(i+1)*MAX_CHUNK),{contentType:'application/octet-stream',upsert:false,cacheControl:'0'});
  if(error)throw Error('Écriture en ligne '+key+' : '+error.message);
  paths.push(path);
 }
 return {paths,bytes:blob.size,sha256:await sha(blob)};
}
async function publish(initial,parts,prior,serialized={}){
 const tag=crypto.randomUUID(),newManifest={...(prior||{})};
 for(const key of parts){
  status('☁️ Enregistrement en ligne : '+key);
  newManifest[key]=await writeSection(key,initial[key]??null,tag,serialized[key]);
 }
 if(!revision){
  const {data,error}=await sb.from('cp_live_state')
   .insert({owner_id:user.id,revision:1,manifest:newManifest})
   .select('revision').single();
  if(error)throw Error('Initialisation concurrente ou refusée : '+error.message);
  revision=data.revision;
 }else{
  const {data,error}=await sb.from('cp_live_state')
   .update({revision:revision+1,manifest:newManifest,updated_at:new Date().toISOString()})
   .eq('owner_id',user.id).eq('revision',revision).select('revision').maybeSingle();
  if(error)throw error;
  if(!data)throw Error('Conflit : une autre session a modifié les données. La mise à jour locale n’a PAS écrasé la version distante.');
  revision=data.revision;
 }
 manifest=newManifest;
 for(const key of parts)lastJson[key]=serialized[key]??JSON.stringify(initial[key]??null);
 status('☁️ Toutes les données sont enregistrées en ligne (version '+revision+').');
}
async function readCloud(root,state){
 revision=state.revision;manifest=state.manifest||{};
 const obj={};
 const skipLargeSequence=firstRead||!loadedSections.has('sequences');
 for(const key of Object.keys(manifest)){
  if(key==='sequences'&&skipLargeSequence){
   // Pas de téléchargement des 62 Mo documentaires avant de connaître le profil.
   obj.sequences=[];
   continue;
  }
  showLoader(root,'Lecture en ligne : '+key+'…');
  const meta=manifest[key];
  obj[key]=JSON.parse(await readParts(meta.paths,meta.bytes,meta.sha256));
  loadedSections.add(key);
  lastJson[key]=JSON.stringify(obj[key]??null);
 }
 firstRead=false;
 return obj;
}
async function ensureSequences(){
 if(loadedSections.has('sequences'))return lastData?.sequences||[];
 if(!active)throw Error('Le serveur n’est pas prêt.');
 const current=await getState();
 if(!current||current.revision!==revision)throw Error('Des données ont changé pendant la connexion. Recharge la page puis réessaie.');
 const meta=manifest?.sequences;
 if(!meta){loadedSections.add('sequences');lastJson.sequences='[]';return []}
 status('☁️ Chargement des séquences pédagogiques…');
 const raw=await readParts(meta.paths,meta.bytes,meta.sha256);
 const sequences=JSON.parse(raw);
 if(!Array.isArray(sequences))throw Error('Séquences en ligne incorrectes.');
 loadedSections.add('sequences');
 lastJson.sequences=JSON.stringify(sequences);
 if(lastData)lastData.sequences=sequences;
 status('☁️ Séquences chargées');
 return sequences;
}
async function init(root){
 showLoader(root,'Connexion au serveur…');
 await connect(root);
 let state=await getState(),obj;
 if(!state){
  obj=await readBackup(root);
  showLoader(root,'Création de la première version de travail en ligne. La sauvegarde originale sera conservée.');
  await publish(obj,SECTIONS,null);
  SECTIONS.forEach(key=>loadedSections.add(key));
 }else obj=await readCloud(root,state);
 active=true;conflict=false;lastData=obj;
 status('☁️ Données chargées depuis Supabase — version '+revision);
 pollTimer=setInterval(()=>{pullIfChanged().catch(e=>status('Synchronisation : '+e.message,true))},12000);
 return obj;
}
async function pullIfChanged(){
 if(!active||working||conflict)return;
 const remote=await getState();
 if(!remote||remote.revision===revision)return;
 if(dirty||pendingData){fail('Une autre session a enregistré des changements pendant que cet appareil avait des modifications non envoyées.');return}
 working=true;
 try{
  // Ne jamais utiliser le stockage local pour résoudre le conflit.
  const hidden=document.createElement('div');hidden.style.display='none';document.body.appendChild(hidden);
  const current=await readCloud(hidden,remote);
  hidden.remove();
  lastData=current;
  if(typeof onRemote==='function')onRemote(current);
  status('☁️ Modifications reçues — version '+revision);
 }finally{working=false}
}
async function flush(){
 if(!active||working||conflict||!pendingData)return;
 working=true;
 const obj=pendingData;pendingData=null;
 try{
  const changed=[],serialized={};
  for(const key of SECTIONS){
   // Ne jamais écrire [] pour une section omise lors du chargement ciblé.
   if(!loadedSections.has(key))continue;
   const str=JSON.stringify(obj[key]??null);
   if(str!==lastJson[key]){changed.push(key);serialized[key]=str}
  }
  if(!changed.length){dirty=false;return}
  const remote=await getState();
  if(!remote||remote.revision!==revision)throw Error('Conflit avec une autre session : données distantes non écrasées.');
  await publish(obj,changed,manifest,serialized);
  dirty=!!pendingData;
 }catch(e){pendingData=obj;fail(e.message)}
 finally{working=false;if(pendingData&&active&&!conflict){clearTimeout(timer);timer=setTimeout(()=>flush().catch(e=>fail(e.message)),1500)}}
}
function schedule(obj){
 if(!active||conflict)return;
 pendingData=obj;dirty=true;
 clearTimeout(timer);
 timer=setTimeout(()=>{flush().catch(e=>fail(e.message))},2200);
}
window.cpCloudInitialize=init;
window.cpCloudEnsureSequences=ensureSequences;
window.cpCloudSave=schedule;
window.cpCloudListPfmpActivities=async(studentId,pfmpId)=>{
 if(!user||!sb)throw Error('Session Supabase non disponible.');
 if(!studentId||!pfmpId)throw Error('Profil élève ou PFMP manquant.');
 const {data,error}=await sb.from('cp_pfmp_activity_entries')
  .select('id,student_id,pfmp_id,activity_date,activity_text,created_at')
  .eq('owner_id',user.id).eq('student_id',String(studentId)).eq('pfmp_id',String(pfmpId))
  .order('activity_date',{ascending:true}).order('created_at',{ascending:true}).limit(500);
 if(error)throw error;
 return data||[];
};
window.cpCloudAddPfmpActivity=async(studentId,pfmpId,date,content)=>{
 if(!user||!sb)throw Error('Session Supabase non disponible.');
 const text=String(content||'').trim();
 if(!studentId||!pfmpId||!/^\\d{4}-\\d{2}-\\d{2}$/.test(date))throw Error('Date, élève ou PFMP non valide.');
 if(!text||text.length>5000)throw Error('Saisis une activité de 1 à 5 000 caractères.');
 const {data,error}=await sb.from('cp_pfmp_activity_entries')
  .insert({owner_id:user.id,student_id:String(studentId),pfmp_id:String(pfmpId),activity_date:date,activity_text:text})
  .select('id,activity_date,activity_text,created_at').single();
 if(error)throw error;
 return data;
};
window.cpCloudListen=cb=>{onRemote=cb};
window.cpCloudReady=false;
window.addEventListener('beforeunload',e=>{
 if(dirty&&active){e.preventDefault();e.returnValue='Des modifications ne sont pas encore envoyées en ligne.'}
});
})();