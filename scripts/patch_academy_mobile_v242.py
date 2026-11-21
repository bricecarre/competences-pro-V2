from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
if 'academy-mobile-select-v242' in s:
 print('V2.42 déjà appliquée')
 sys.exit(0)
start=s.index('function academyGate(){')
end=s.index('\nconst SCOPED_BACKUP_FORMAT=',start)
part=s[start:end]
old='''     <main class="academy-premium-main">'''
new='''     <div class="academy-mobile-access-v242">
       <label for="academy-mobile-select-v242">Sélectionner mon académie</label>
       <select id="academy-mobile-select-v242" aria-label="Choisir une académie sur téléphone">
         <option value="">— Choisir une académie —</option>
         __DOLLAR_OPEN__ALL_ACADEMIES.slice().sort((a,b)=>a.localeCompare(b,'fr')).map(a=>'<option value="'+esc(a)+'">'+esc(a)+'</option>').join('')}
       </select>
       <p>Sur téléphone, utilisez cette liste si les zones de la carte sont difficiles à toucher.</p>
     </div>
     <main class="academy-premium-main">'''.replace('__DOLLAR_OPEN__',chr(36)+'{')
assert part.count(old)==1, 'Emplacement de la sélection mobile non trouvé'
part=part.replace(old,new,1)
old_hook=" document.querySelectorAll('[data-academy]').forEach(b=>b.onclick=()=>choose(b.dataset.academy))"
new_hook=""" document.querySelectorAll('[data-academy]').forEach(b=>b.onclick=()=>choose(b.dataset.academy));
 const academyMobileSelect=document.getElementById('academy-mobile-select-v242');
 if(academyMobileSelect)academyMobileSelect.addEventListener('change',e=>{
  if(ALL_ACADEMIES.includes(e.target.value))choose(e.target.value);
 });"""
assert part.count(old_hook)==1, 'Gestionnaire de sélection non trouvé'
part=part.replace(old_hook,new_hook,1)
s=s[:start]+part+s[end:]
css="""/* V2.42 : accès tactile fiable pour le choix d'académie sur smartphone */
.academy-mobile-access-v242{display:none}
@media(max-width:780px){
 .academy-mobile-access-v242{display:block;margin:8px 10px 0;padding:14px;border:1px solid #557fa6;border-radius:12px;background:#122b45;color:#f0f5fc}
 .academy-mobile-access-v242 label{display:block;font-weight:700;font-size:15px;margin-bottom:8px}
 .academy-mobile-access-v242 select{display:block;width:100%;min-height:48px;padding:10px 12px;border-radius:9px;background:#fff;color:#142033;font-size:16px;border:2px solid #8abef0}
 .academy-mobile-access-v242 p{font-size:12px;margin:8px 0 0;color:#b8d0e7}
 .academy-premium-hit{min-width:44px;min-height:44px;touch-action:manipulation}
}
"""
anchor='/* === V2.33 bibliothèque de séquences / passerelle Bac ↔ CAP === */'
assert s.count(anchor)==1, 'Point insertion CSS ambigu'
s=s.replace(anchor,css+'\n'+anchor,1)
p.write_text(s,encoding='utf-8')
print('V2.42 : choix des académies mobile ajouté, carte préservée')
