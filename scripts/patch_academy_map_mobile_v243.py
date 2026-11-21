from pathlib import Path
import sys,re
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
if 'academy-map-tactile-v243' in s:
 print('V2.43 déjà appliquée')
 sys.exit(0)
# Annuler précisément le menu supplémentaire introduit en V2.42.
a=s.index('function academyGate(){')
b=s.index('\nconst SCOPED_BACKUP_FORMAT=',a)
piece=s[a:b]
pattern=r'\s*<div class="academy-mobile-access-v242">.*?</div>\s*(?=<main class="academy-premium-main">)'
piece,n=re.subn(pattern,'\n     ',piece,count=1,flags=re.S)
assert n==1,'Le menu ajouté en V2.42 est introuvable : interruption'
hook=""" document.querySelectorAll('[data-academy]').forEach(b=>b.onclick=()=>choose(b.dataset.academy));
 const academyMobileSelect=document.getElementById('academy-mobile-select-v242');
 if(academyMobileSelect)academyMobileSelect.addEventListener('change',e=>{
  if(ALL_ACADEMIES.includes(e.target.value))choose(e.target.value);
 });"""
assert piece.count(hook)==1,'Écouteur du menu V2.42 introuvable'
piece=piece.replace(hook," document.querySelectorAll('[data-academy]').forEach(b=>b.onclick=()=>choose(b.dataset.academy))",1)
s=s[:a]+piece+s[b:]
start=s.find("/* V2.42 : accès tactile fiable pour le choix d'académie sur smartphone */")
if start!=-1:
 end=s.index('/* === V2.33 bibliothèque de séquences / passerelle Bac ↔ CAP === */',start)
 s=s[:start]+s[end:]

# Corriger la carte existante, sans nouveau champ ni bouton.
# Son image native est 910 x 880 : conserver ce rapport et permettre de
# glisser horizontalement la carte quand l'écran est étroit.
css="""/* academy-map-tactile-v243 : boutons directement sur la carte, sans menu supplémentaire */
@media(max-width:780px){
 .academy-premium-map-panel{overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
 .academy-premium-map{width:620px;min-width:620px;min-height:600px;height:600px;flex:none;background-size:100% 100%;background-position:center}
 .academy-premium-hit{width:54px;height:54px;min-width:54px;min-height:54px;z-index:9;touch-action:manipulation;-webkit-tap-highlight-color:rgba(245,170,70,.32);border-radius:12px}
 .academy-premium-hit::after{width:17px;height:17px;transform:translate(-50%,-50%) scale(1);background:rgba(255,166,53,.72);border:2px solid #fff;box-shadow:0 0 0 3px rgba(0,0,0,.55)}
 .academy-premium-hit::before{content:attr(data-academy);position:absolute;top:70%;left:50%;transform:translateX(-50%);font-weight:700;font-size:10px;white-space:nowrap;color:white;text-shadow:0 1px 4px #000,0 1px 2px #000;pointer-events:none}
 .academy-premium-hit:active::after{background:#ffcc62}
 .academy-premium-extra-label{pointer-events:none;opacity:0}
}
"""
anchor='/* === V2.33 bibliothèque de séquences / passerelle Bac ↔ CAP === */'
assert s.count(anchor)==1,'Ancre CSS introuvable'
s=s.replace(anchor,css+'\n'+anchor,1)
assert 'academy-mobile-select-v242' not in s,'Menu V2.42 encore présent'
p.write_text(s,encoding='utf-8')
print('V2.43 : menu retiré, carte existante défilable et cibles tactiles élargies')
