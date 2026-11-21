from pathlib import Path
import sys,re
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
if 'function studentRadarPartialScore(' not in s:
 a=s.index('function competencyAverageScore(')
 new="""function studentRadarPartialScore(studentId,comp){
 const ref=studentReferentialData(studentId);
 const school=(ref.sub[comp]||[]).map(([code])=>subcompetencyAverageScore(studentId,code)).filter(v=>v!==null&&Number.isFinite(v));
 const pfmp=pfmpCompetencyStatuses(studentId,comp).map(score).filter(Number.isFinite);
 const values=[...school,...pfmp];
 return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}

"""
 s=s[:a]+new+s[a:]
 a=s.index('function student(){')
 b=s.find('\nfunction ',a+10)
 part=s[a:b]
 assert 'const radarVals=ref.comps.map(c=>competencyAverageScore(s.id,c)??0);' in part
 part=part.replace('const radarVals=ref.comps.map(c=>competencyAverageScore(s.id,c)??0);','const radarVals=ref.comps.map(c=>studentRadarPartialScore(s.id,c)??0);')
 part=part.replace('const avg=competencyAverageScore(s.id,c),status=', 'const avg=studentRadarPartialScore(s.id,c),status=')
 part=part.replace(" if(section==='mobileprogress')return studentMobilePage(s,'progress');",
                   " if(section==='notes')return studentNotesPage();\n if(section==='mobileprogress')return studentMobilePage(s,'progress');")
 part=part.replace('Échelle 0 à 4. Survolez un point pour afficher la moyenne de compétence du référentiel.',
                   'Échelle 0 à 4. Progression visible dès les premières évaluations. Le statut officiel demande toujours 50 % des items évalués.')
 s=s[:a]+part+s[b:]
 a=s.index('function studentMobileCompetenciesHtml(')
 b=s.find('\nfunction ',a+10)
 part=s[a:b]
 assert 'competencyAverageScore(studentId,comp)' in part
 part=part.replace('competencyAverageScore(studentId,comp)','studentRadarPartialScore(studentId,comp)')
 s=s[:a]+part+s[b:]
p.write_text(s,encoding='utf-8')
print('V2.46 : radar visible dès les premières évaluations sans changer le seuil officiel')
