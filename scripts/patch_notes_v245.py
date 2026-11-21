from pathlib import Path
import sys

path=Path(sys.argv[1])
source=path.read_text(encoding="utf-8")
marker="data-notes-readability-v245"
if marker in source:
    print("V2.45 : affichage du tableau des notes déjà appliqué")
    sys.exit(0)

start=source.index("function teacherNotesPage(")
end=source.index("\nfunction teacher(){", start)
s=source[start:end]

def replace(old,new,number=None):
    global s
    count=s.count(old)
    if number is not None and count!=number:
        raise RuntimeError(f"V2.45 : motif ambigu : {old[:95]!r}, trouvé {count}, attendu {number}")
    if count<1:
        raise RuntimeError(f"V2.45 : motif absent : {old[:110]!r}")
    s=s.replace(old,new)

# La largeur de la colonne est calculée sur le nom complet le plus long.
# La police et l'espacement sont fixes, le calcul se fait au pixel près.
replace(
 " const head=ev=>",
 """ const nameMeasure=document.createElement('canvas').getContext('2d');
 nameMeasure.font='600 13px system-ui';
 const nameColWidth=Math.max(145,Math.ceil(Math.max(0,...pupils.map(st=>nameMeasure.measureText(String(st.last||'')+' '+String(st.first||'')).width))+18));
 const nameStyle='width:'+nameColWidth+'px;min-width:'+nameColWidth+'px;max-width:'+nameColWidth+'px;';
 const head=ev=>""",1)

# Évaluations : titres verticaux inchangés, colonne de notes étroite.
replace("width:64px;min-width:64px;max-width:64px;padding:4px;background:var(--panel);position:sticky;top:0;vertical-align:bottom;text-align:center",
        "width:43px;min-width:43px;max-width:43px;padding:2px;background:var(--panel);position:sticky;top:0;vertical-align:bottom;text-align:center",1)

replace('<table data-notes-layout-v241="1" style="',
        '<table data-notes-layout-v241="1" data-notes-readability-v245="1" style="',1)

replace(
 """'<th style="position:sticky;left:0;top:0;background:var(--panel);width:132px;min-width:132px;max-width:132px;padding:5px;z-index:6;text-align:left">Élève</th>'+""",
 """'<th style="position:sticky;left:0;top:0;background:var(--panel);'+nameStyle+'padding:5px 8px;z-index:6;text-align:left">Élève</th>'+""",1)

# Colonnes des trois moyennes : réduction de 74 à 65 px.
replace("right:148px","right:130px")
replace("right:74px","right:65px")
replace("width:74px;min-width:74px;max-width:74px","width:65px;min-width:65px;max-width:65px")
replace("padding:4px;z-index:5","padding:2px;z-index:5")
replace("padding:4px;font-weight:700;z-index:2","padding:2px;font-weight:700;z-index:2")

# Ligne sur deux légèrement teintée, y compris dans les colonnes figées.
replace(
 """pupils.map(st=>'<tr><th style="position:sticky;left:0;background:var(--panel);width:132px;min-width:132px;max-width:132px;text-align:left;padding:5px;z-index:3"><span title="'+esc((st.last||'')+' '+(st.first||''))+'" style="display:block;max-width:122px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(st.last||'')+' '+esc(st.first||'')+'</span></th>'+""",
 """pupils.map((st,rowIndex)=>'<tr class="notes-student-row-v245" style="--notes-row-bg:'+(rowIndex%2?'rgba(96,148,206,.105)':'var(--panel)')+'"><th style="position:sticky;left:0;background:var(--notes-row-bg);'+nameStyle+'text-align:left;padding:4px 8px;z-index:3;white-space:nowrap;font-size:13px;font-weight:600"><span title="'+esc((st.last||'')+' '+(st.first||''))+'" style="display:block;white-space:nowrap;overflow:visible">'+esc(st.last||'')+' '+esc(st.first||'')+'</span></th>'+""",1)

# Cellules de notes au plus près des chiffres, sans changer leur contenu.
replace("text-align:center;padding:5px;border-top:1px solid var(--line)",
        "text-align:center;padding:4px 2px;border-top:1px solid var(--line);background:var(--notes-row-bg);font-size:12px",2)

# La séparation orange S1/S2 reste déplaçable, et participe au zébrage.
replace("padding:0;border-left:4px solid #e6a23c;background:transparent",
        "padding:0;border-left:4px solid #e6a23c;background:var(--notes-row-bg)",1)

# Fond des moyennes identique à la ligne de l'élève (pas un bloc uniforme).
replace("background:var(--panel);text-align:center;padding:2px;font-weight:700;z-index:2",
        "background:var(--notes-row-bg);text-align:center;padding:2px;font-weight:700;z-index:2",3)

source=source[:start]+s+source[end:]
source=source.replace("<title>Compétences Pro V2.44 — Données synchronisées</title>",
                      "<title>Compétences Pro V2.45 — Tableau des notes lisible</title>",1)
path.write_text(source,encoding="utf-8")
print("V2.45 : noms entiers, 43px par évaluation, moyennes 65px, lignes alternées")
