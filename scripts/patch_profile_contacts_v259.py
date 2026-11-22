from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text(encoding='utf-8')
marker='data-cp-contact-v259'
if marker in s:
 print('V2.59 déjà appliquée');sys.exit(0)
old='<div class="field"><label>Email</label><input id="email" value="@@{esc(obj.email||\'\')}"></div>'
new='''<div class="field"><label>Adresse e-mail (facultatif)</label><input id="email" type="email" autocomplete="email" value="@@{esc(obj.email||'')}" placeholder="nom@exemple.fr"></div>
  <div class="field"><label>Numéro de téléphone (facultatif)</label><input id="phone" type="tel" autocomplete="tel" value="@@{esc(obj.phone||'')}" placeholder="06 00 00 00 00"></div>'''
old=old.replace('@@{','$'+'{');new=new.replace('@@{','$'+'{')
assert s.count(old)==1,'Champ e-mail enseignant introuvable'
s=s.replace(old,new,1)
old='<div class="row"><div class="field"><label>Date de naissance</label>'
new='''<div class="row" data-cp-contact-v259="student"><div class="field"><label>Adresse e-mail (facultatif)</label><input id="email" type="email" autocomplete="email" value="@@{esc(obj.email||'')}" placeholder="eleve@exemple.fr"></div><div class="field"><label>Numéro de téléphone (facultatif)</label><input id="phone" type="tel" autocomplete="tel" value="@@{esc(obj.phone||'')}" placeholder="06 00 00 00 00"></div></div><div class="row"><div class="field"><label>Date de naissance</label>'''
new=new.replace('@@{','$'+'{')
assert s.count(old)==1,'Champ date naissance élève introuvable'
s=s.replace(old,new,1)
old="     x.last=document.getElementById('last').value;"
new="""     x.last=document.getElementById('last').value;
     // data-cp-contact-v259 — champs facultatifs pour chaque profil.
     const contactEmail=String(document.getElementById('email')?.value||'').trim();
     const contactPhone=String(document.getElementById('phone')?.value||'').trim();
     if(contactEmail&&(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contactEmail)||contactEmail.length>254)){
       return alert('Adresse e-mail incorrecte. Vérifie le format ou laisse le champ vide.');
     }
     if(contactPhone&&!/^[+0-9().\\s-]{6,30}$/.test(contactPhone)){
       return alert('Numéro de téléphone incorrect. Utilise 6 à 30 caractères : chiffres, espaces et + éventuel.');
     }
     x.email=contactEmail;
     x.phone=contactPhone;"""
assert s.count(old)==1,'Sauvegarde prénom nom introuvable'
s=s.replace(old,new,1)
s=s.replace("       x.email=document.getElementById('email').value;\n       x.schoolId=selectedSchoolId;","       x.schoolId=selectedSchoolId;",1)
p.write_text(s,encoding='utf-8')
print('V2.59 : email et téléphone facultatifs enseignants et élèves')
