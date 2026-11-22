from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-pfmp-period-v257'
if marker in s:
 print('V2.57 PFMP already patched');sys.exit(0)
# Affecter les dates aux activités existantes et nouvelles, sans changer la date historique.
old="'<b>'+esc(e.activity_date||'')+'</b> · <span class=\"muted small\">'"
new="'<b>'+esc(e.activity_date||'')+(e.activity_end_date&&e.activity_end_date!==e.activity_date?' → '+esc(e.activity_end_date):'')+'</b> · <span class=\"muted small\">'"
assert s.count(old)==1,'Affichage des activités introuvable'
s=s.replace(old,new,1)
old="""'<label style="display:block;margin-bottom:5px">Date de l’activité</label><input class="cp-diary-date-v250" type="date" value="'+new Date().toISOString().slice(0,10)+'" style="display:block;width:100%;max-width:220px;padding:8px">'"""
new="""'<label style="display:block;margin-bottom:5px">Date de début</label><input class="cp-diary-date-v250" type="date" value="'+new Date().toISOString().slice(0,10)+'" style="display:block;width:100%;max-width:220px;padding:8px">'
   // data-cp-pfmp-period-v257
   +'<label style="display:block;margin:8px 0 5px">Date de fin</label><input class="cp-diary-end-date-v257" type="date" value="'+new Date().toISOString().slice(0,10)+'" style="display:block;width:100%;max-width:220px;padding:8px">'"""
assert s.count(old)==1,'Formulaire PFMP début introuvable'
s=s.replace(old,new,1)
old="const date=wrapper.querySelector('.cp-diary-date-v250').value;"
new="const date=wrapper.querySelector('.cp-diary-date-v250').value;\n   const endDate=wrapper.querySelector('.cp-diary-end-date-v257').value;"
assert s.count(old)==1,'Date PFMP introuvable'
s=s.replace(old,new,1)
old="if(!date||!message){info.textContent='Renseigne une date et une activité.';return}"
new="""if(!date||!endDate||!message){info.textContent='Renseigne les dates de début, de fin et une activité.';return}
   if(endDate<date){info.textContent='La date de fin doit être égale ou postérieure à la date de début.';return}"""
assert s.count(old)==1,'Validation ancienne activité introuvable'
s=s.replace(old,new,1)
old="await window.cpCloudAddPfmpActivity(studentId,pfmpId,date,message);"
new="await window.cpCloudAddPfmpActivity(studentId,pfmpId,date,message,endDate);"
assert s.count(old)==1,'Enregistrement activité PFMP introuvable'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('V2.57 : dates de début et de fin dans carnet PFMP')
