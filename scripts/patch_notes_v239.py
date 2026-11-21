from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
marker="data-notes-heading-vertical-v239"
if marker in s:
    print("V2.39 déjà appliquée")
    sys.exit(0)
old_head='min-width:155px;padding:10px;background:var(--panel);position:sticky;top:0'
new_head='width:72px;min-width:72px;max-width:72px;padding:6px;background:var(--panel);position:sticky;top:0;vertical-align:bottom'
old_title="esc(ev.title||'Évaluation')+'<div class=\"muted small\">'"
new_title="'<div data-notes-heading-vertical-v239=\"1\" style=\"writing-mode:vertical-rl;transform:rotate(180deg);display:inline-block;height:185px;max-height:185px;overflow:hidden;text-align:left;white-space:nowrap;vertical-align:middle\" title=\"'+esc(ev.title||'Évaluation')+'\">'+esc(ev.title||'Évaluation')+'</div><div class=\"muted small\">'"
for old,new in [(old_head,new_head),(old_title,new_title)]:
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"Motif attendu une seule fois ({n}): {old[:70]}")
    s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("V2.39: titres d'évaluations verticaux, semestre conservé")
