from pathlib import Path
import sys

path=Path(sys.argv[1])
source=path.read_text(encoding='utf-8')
marker='data-notes-layout-v241'
if marker in source:
    print('V2.41 déjà appliquée')
    sys.exit(0)

start=source.index('function teacherNotesPage(')
end=source.index('\nfunction teacher(){',start)
s=source[start:end]

def change(old,new,expected=1):
    global s
    n=s.count(old)
    if n!=expected:
        raise RuntimeError(f'V2.41: motif ambigu ou absent ({n}) : {old[:100]}')
    s=s.replace(old,new,expected)

# Affichage compact des notes, sans suffixe /20 (moyennes inchangées).
change("esc(formatGrade(n))","esc(Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2}))")
change(""" const mean=(st,evals)=>{
  const values=evals.map(ev=>grade(st,ev)).filter(valid).map(Number);
  return values.length?(values.reduce((a,b)=>a+b,0)/values.length).toLocaleString('fr-FR',{maximumFractionDigits:2})+' / 20':'—';
 };""",""" const meanValue=(st,evals)=>{
  const values=evals.map(ev=>grade(st,ev)).filter(valid).map(Number);
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 };
 const displayMean=n=>n===null?'—':n.toLocaleString('fr-FR',{maximumFractionDigits:2})+' / 20';
 const mean=(st,evals)=>displayMean(meanValue(st,evals));
 // Une moyenne annuelle équilibrée entre S1 et S2, même si les semestres ont
 // des nombres d'évaluations différents. Un semestre sans note est ignoré.
 const annualMean=st=>{
  const semesters=[meanValue(st,left),meanValue(st,right)].filter(n=>n!==null);
  return displayMean(semesters.length?semesters.reduce((a,b)=>a+b,0)/semesters.length:null);
 };""")
change("width:72px;min-width:72px;max-width:72px;padding:6px;background:var(--panel);position:sticky;top:0;vertical-align:bottom;text-align:center","width:64px;min-width:64px;max-width:64px;padding:4px;background:var(--panel);position:sticky;top:0;vertical-align:bottom;text-align:center")
change("'<table style=\"width:100%;border-spacing:0;min-width:580px\"><thead><tr>'+","'<table data-notes-layout-v241=\"1\" style=\"width:max-content;min-width:100%;table-layout:fixed;border-spacing:0\"><thead><tr>'+")
change("""'<th style="position:sticky;left:0;top:0;background:var(--panel);min-width:180px;padding:10px;z-index:3;text-align:left">Élève</th>'+""",
       """'<th style="position:sticky;left:0;top:0;background:var(--panel);width:132px;min-width:132px;max-width:132px;padding:5px;z-index:6;text-align:left">Élève</th>'+""")
change("""'<th style="background:var(--panel);padding:10px;min-width:85px">Moy. S1</th><th style="background:var(--panel);padding:10px;min-width:85px">Moy. S2</th></tr></thead><tbody>'+""",
       """'<th style="position:sticky;right:148px;top:0;background:var(--panel);width:74px;min-width:74px;max-width:74px;padding:4px;z-index:5;border-left:1px solid var(--line)">Moy. S1</th>'+
  '<th style="position:sticky;right:74px;top:0;background:var(--panel);width:74px;min-width:74px;max-width:74px;padding:4px;z-index:5">Moy. S2</th>'+
  '<th style="position:sticky;right:0;top:0;background:var(--panel);width:74px;min-width:74px;max-width:74px;padding:4px;z-index:5">Moy. année</th></tr></thead><tbody>'+""")
change("""'<tr><th style="position:sticky;left:0;background:var(--panel);text-align:left;padding:10px;z-index:1;white-space:nowrap">'+esc(st.last||'')+' '+esc(st.first||'')+'</th>'+""",
       """'<tr><th style="position:sticky;left:0;background:var(--panel);width:132px;min-width:132px;max-width:132px;text-align:left;padding:5px;z-index:3"><span title="'+esc((st.last||'')+' '+(st.first||''))+'" style="display:block;max-width:122px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(st.last||'')+' '+esc(st.first||'')+'</span></th>'+""")
change("""'<td style="text-align:center;padding:8px;font-weight:700">'+mean(st,left)+'</td>'+
   '<td style="text-align:center;padding:8px;font-weight:700">'+mean(st,right)+'</td></tr>').join('')+""",
       """'<td style="position:sticky;right:148px;background:var(--panel);text-align:center;padding:4px;font-weight:700;z-index:2;border-left:1px solid var(--line);width:74px;min-width:74px;max-width:74px">'+mean(st,left)+'</td>'+
   '<td style="position:sticky;right:74px;background:var(--panel);text-align:center;padding:4px;font-weight:700;z-index:2;width:74px;min-width:74px;max-width:74px">'+mean(st,right)+'</td>'+
   '<td style="position:sticky;right:0;background:var(--panel);text-align:center;padding:4px;font-weight:700;z-index:2;width:74px;min-width:74px;max-width:74px">'+annualMean(st)+'</td></tr>').join('')+""")
change("""'<td style="text-align:center;padding:8px;border-top:1px solid var(--line)">'+cell(st,ev)+'</td>'""",
       """'<td style="text-align:center;padding:5px;border-top:1px solid var(--line)">'+cell(st,ev)+'</td>'""",2)
source=source[:start]+s+source[end:]
path.write_text(source,encoding='utf-8')
print('V2.41 : élèves compacts, notes brutes, moyennes S1/S2/année collées à droite')
