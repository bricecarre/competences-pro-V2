from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
marker='data-cp-annual-pfmp-report'
if marker in s:
 print('V2.67 annual report already patched');sys.exit(0)
a=s.index('function studentBilan(')
b=s.index('\nfunction ',a+18)
block=s[a:b]
old="""@@{classReferentialKey(c)===REFERENTIAL_BAC_TCI"""
new="""<section class="card" data-cp-annual-pfmp-report="teacher" data-student-id="@@{esc(s.id)}" style="margin-bottom:12px"><h2>PFMP — bilan annuel des activités</h2><p class="muted small">Chargement des compétences validées en entreprise…</p></section>
  @@{classReferentialKey(c)===REFERENTIAL_BAC_TCI"""
old=old.replace('@@{','$'+'{');new=new.replace('@@{','$'+'{')
assert block.count(old)==1,'Bilan professeur : insertion avant unités certificatives introuvable'
block=block.replace(old,new,1)
s=s[:a]+block+s[b:]
a=s.index('function student(){')
b=s.index('\nfunction ',a+17)
block=s[a:b]
old="schoolBanner(studentSchool,"
new="""'<section class="card" data-cp-annual-pfmp-report="student" data-student-id="'+esc(s.id)+'" style="margin-bottom:12px"><h2>PFMP — bilan annuel des activités</h2><p class="muted small">Chargement des compétences validées en entreprise…</p></section>'+schoolBanner(studentSchool,"""
assert block.count(old)==1,'Bilan élève : insertion après entête imprimable introuvable'
block=block.replace(old,new,1)
s=s[:a]+block+s[b:]
tag='<script src="pfmp-annual-report-v267.js"></script>'
assert '</body>' in s,'Corps HTML manquant'
s=s.replace('</body>',tag+'\n</body>',1)
p.write_text(s,encoding='utf-8')
print('V2.67 : bilans annuels professeur et élève enrichis des activités PFMP')
