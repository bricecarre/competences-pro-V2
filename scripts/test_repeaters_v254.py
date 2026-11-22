from pathlib import Path
import sys
source=Path(sys.argv[1]).read_text(encoding='utf-8')
a=source.index('function cpRepairKnownRepeatersV254(')
b=source.index('\nfunction listStudents(',a)
f=Path('/tmp/cp-repeaters-v254-function.js')
f.write_text(source[a:b],encoding='utf-8')
test=Path('/tmp/cp-repeaters-v254-test.cjs')
test.write_text("""
const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync('/tmp/cp-repeaters-v254-function.js','utf8');
const session={role:'teacher'};
let saveCount=0;const save=()=>{saveCount++};
const history=['2024-2025 Seconde 2TCI1','2025-2026 Première 1TCI1','2026-2027 Première 1TCI1'];
const data={
 classes:[{id:'prior',name:'2TCI1',schoolId:'montel'},{id:'target',name:'1 TCI 1',schoolId:'montel'}],
 students:[
 {id:'a',first:'Léo',last:'Alvarez',classId:'prior',schoolId:'montel',archived:true,history:[...history]},
 {id:'b',first:'Ilan',last:'Malidi',classId:'prior',archived:true,history:[...history]},
 {id:'c',first:'Samuel',last:'Poncet Lopez',classId:'prior',archived:false,history:[...history]},
 {id:'d',first:'Autre',last:'Élève',classId:'prior',archived:true,history:['Ancienne année']}
 ],
 results:[{student:'a',eval:'historique',status:'Acquis'}]
};
const before=JSON.stringify(data.results);
eval(src);
const report=cpRepairKnownRepeatersV254(['target']);
assert.deepStrictEqual(report.missing,[]);
assert.deepStrictEqual(report.unresolved,[]);
assert.equal(report.restored.length,3);
for(const student of data.students.slice(0,3)){
 assert.equal(student.classId,'target');
 assert.equal(student.archived,false);
 assert.deepStrictEqual(student.history,history);
}
assert.equal(data.students[3].classId,'prior');
assert.equal(data.students[3].archived,true);
assert.equal(JSON.stringify(data.results),before);
assert.equal(saveCount,1);
cpRepairKnownRepeatersV254(['target']);
assert.equal(saveCount,1);
data.students.pop();
data.students.splice(1,1);
const missing=cpRepairKnownRepeatersV254(['target']);
assert(missing.missing.includes('Ilan Malidi'));
console.log('OK V2.54: trois redoublants récupérés, historiques et résultats intacts, absence explicitement détectée');
""",encoding='utf-8')
