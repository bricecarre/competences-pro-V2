"""Correctif non destructif PFMP : appliqué à la copie HTML GitHub Pages."""
from pathlib import Path
import sys

src = Path(sys.argv[1])
s = src.read_text(encoding='utf-8')
patches = [
    (
        "let selectedRefs=new Set(ownRefs.length?ownRefs:[viewableRefs[0]||REFERENTIAL_BAC_TCI]);",
        "// V2.36 : afficher aussi les filières CAP/Bac Pro des classes suivies.\n let selectedRefs=new Set([...ownRefs,...professionalRefs].length?[...ownRefs,...professionalRefs]:[viewableRefs[0]||REFERENTIAL_BAC_TCI]);"
    ),
    (
        " const classSelect=document.getElementById('pfmpClassSelect');",
        " // V2.36 : accès direct à la frise à partir de l'onglet PFMP.\n const classSelect=document.getElementById('pfmpClassSelect');"
    ),
    (
        "savePfmpRecord(normalizePfmp({...current,startDate,durationWeeks,label}));draw()",
        """if(startDate<SCHOOL_CALENDAR.start||startDate>schoolWeekInfo(SCHOOL_CALENDAR.weeks).friday){
       return alert('La date de début doit appartenir à l’année scolaire 2026-2027. Une date hors calendrier ne peut pas être placée sur la frise.');
     }
     savePfmpRecord(normalizePfmp({...current,startDate,durationWeeks,label}));
     draw();
     const notice=document.createElement('div');
     notice.className='card';
     notice.style.cssText='margin-bottom:12px;border-left:4px solid #38a169';
     notice.innerHTML=`<b>✓ PFMP enregistrée : ${esc(label||'PFMP')}</b><div class="muted small">Consultez l’onglet Frise pédagogique et la discipline ${esc(referentialShortLabel(refKey))}. Toutes les filières de vos classes y sont désormais affichées par défaut.</div><button class="btn" id="openPfmpTimeline" style="margin-top:8px">Voir sur la frise</button>`;
     zone.prepend(notice);
     const link=document.getElementById('openPfmpTimeline');
     if(link)link.onclick=()=>{section='timeline';render()};"""
    ),
    (
        "savePfmpRecord(p);draw()",
        """savePfmpRecord(p);draw();
     const notice=document.createElement('div');
     notice.className='card';
     notice.style.cssText='margin-bottom:12px;border-left:4px solid #38a169';
     notice.innerHTML='<b>✓ Nouvelle PFMP créée.</b><div class="muted small">Précisez son intitulé et ses dates, puis cliquez sur Enregistrer. La frise est accessible depuis le menu.</div>';
     zone.prepend(notice)"""
    ),
]
for old, new in patches:
    count = s.count(old)
    if count != 1:
        raise RuntimeError(f'Correction non appliquée (attendu 1, obtenu {count}) : {old[:90]}')
    s = s.replace(old, new, 1)
src.write_text(s, encoding='utf-8')
print('Correctif PFMP V2.36 appliqué : 4 corrections')
