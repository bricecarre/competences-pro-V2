from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-pfmp-activity-eval-v265'
if marker in s:
 print('V2.65 already installed');sys.exit(0)
old='function cpPfmpTeacherDiary(studentId,pfmpId,zoneId){'
new="""function cpPfmpTeacherDiary(studentId,pfmpId,zoneId){
 // data-cp-pfmp-activity-eval-v265
 if(typeof window.cpPfmpTeacherActivityReview==='function'){
  return window.cpPfmpTeacherActivityReview(studentId,pfmpId,zoneId);
 }"""
assert s.count(old)==1,'PFMP teacher diary hook missing'
s=s.replace(old,new,1)
tag='<script src="pfmp-teacher-activity-v265.js"></script>'
assert '</body>' in s
s=s.replace('</body>',tag+'\n</body>',1)
p.write_text(s,encoding='utf-8')
print('V2.65 teacher diary hooked to per-activity evaluation')
