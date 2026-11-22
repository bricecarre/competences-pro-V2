from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
marker='data-cp-repeaters-v254'
if marker in s:
 print('V2.54 déjà appliquée')
 sys.exit(0)
target='function listStudents(filter){'
assert s.count(target)==1,'Entrée liste élèves introuvable'
inject="""function cpRepairKnownRepeatersV254(visibleClassIds){
  // data-cp-repeaters-v254. Restauration prudente sans recréer de fiches.
  if(!['teacher','admin'].includes(session?.role))return {restored:[],missing:[],unresolved:[]};
  const canon=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const targets=[
    ['Léo Alvarez',['leo','alvarez']],
    ['Ilan Malidi',['ilan','malidi']],
    ['Samuel Poncet Lopez',['samuel','poncet','lopez']]
  ];
  const classOptions=data.classes.filter(c=>canon(c.name)==='1tci1'&&(!visibleClassIds||visibleClassIds.includes(c.id)));
  const restored=[],missing=[],unresolved=[];
  if(classOptions.length!==1){
    return {restored,missing:[],unresolved:targets.map(t=>t[0]+' : classe 1TCI1 '+(classOptions.length?'ambiguë':'non accessible'))};
  }
  const cls=classOptions[0];
  let changed=false;
  for(const [label,tokens] of targets){
    const matching=data.students.filter(st=>{
      const full=canon([st.first,st.last,st.firstName,st.lastName,st.name].filter(Boolean).join(' '));
      return tokens.every(token=>full.split(' ').includes(token));
    });
    if(matching.length===0){missing.push(label);continue}
    if(matching.length!==1){unresolved.push(label+' : plusieurs fiches');continue}
    const st=matching[0];
    const prior=data.classes.find(c=>String(c.id)===String(st.classId));
    const priorName=canon(prior?.name);
    const historical=canon((st.history||[]).join(' '));
    if(prior&&prior.id!==cls.id&&!priorName.includes('tci')&&!historical.includes('tci')){
      unresolved.push(label+' : autre classe à vérifier');continue;
    }
    if(st.classId!==cls.id){st.classId=cls.id;changed=true}
    if(st.archived){st.archived=false;changed=true}
    if(st.schoolId&&st.schoolId!==cls.schoolId){st.schoolId=cls.schoolId;changed=true}
    restored.push(label);
  }
  if(changed)save();
  return {restored,missing,unresolved};
}
function listStudents(filter){
  const repeaterCheck=cpRepairKnownRepeatersV254(filter);
"""
s=s.replace(target,inject,1)
anchor="document.getElementById('studentFilterSummary').innerHTML="
assert s.count(anchor)==1,'Compteur des élèves introuvable'
notice="""const repeaterNotice=(repeaterCheck.missing.length||repeaterCheck.unresolved.length)
      ? '<div id="cp-repeaters-v254-warning" class="card" style="margin:10px 0;border-left:4px solid #e5a03a"><b>Contrôle des redoublants 1TCI1</b>'
        +(repeaterCheck.missing.length?'<p>Fiches absentes des données synchronisées : '+repeaterCheck.missing.map(esc).join(', ')+'.</p>':'')
        +(repeaterCheck.unresolved.length?'<p>À vérifier : '+repeaterCheck.unresolved.map(esc).join(' ; ')+'</p>':'')+'</div>'
      : '';
    if(repeaterNotice&&!document.getElementById('cp-repeaters-v254-warning')){
      document.getElementById('studentFilterSummary').insertAdjacentHTML('beforebegin',repeaterNotice);
    }
    """
a=s.index('function listStudents(filter){')
b=s.find('\nfunction ',a+20)
if b<0:b=len(s)
part=s[a:b]
assert anchor in part,'Compteur non trouvé dans listStudents'
part=part.replace(anchor,notice+anchor,1)
s=s[:a]+part+s[b:]
p.write_text(s,encoding='utf-8')
print('V2.54 : fiches redoublants 1TCI1 rapprochées sans altérer leurs historiques')
