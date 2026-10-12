import sys
import os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=open(os.path.join(root,'index.html')).read()
tpl=open(sys.argv[1]).read()
def between(a,b):
    i=src.index(a); j=src.index(b,i); return src[i:j]
base=between("/* ---------- renk yardımcıları","/* ================== Ses")
fx=between("/* ---------- metin, parçacık, efektler","function addBlob(")
fx=fx.replace("function ring(x, y, max = 220, color = INK)","function ring(x, y, max = 220, color = '#fff')")
fx=fx.replace("o.ringColor || INK","o.ringColor || '#fff'")
fx=fx.replace("[INK, '#ffcf3f', SCARF, '#4cc9f0']","['#fff', '#ffcf3f', SCARF, '#4cc9f0']")
fx=fx.replace("'rgba(80,80,105,.28)'","'rgba(225,225,240,.22)'")
mv=between("function heroRunTo","/* ================== Çizim: kahraman")
hd=between("function rr(","/* ================== Çizim: genel")
for a,b in [("'rgba(50,50,80,.18)'","'rgba(255,255,255,.07)'"),("'rgba(50,50,80,.5)'","'rgba(255,255,255,.55)'"),
            ("const sw = Math.sin(h.phase) * .55 * h.walk, air = h.hop > 4;","const sw = Math.sin(h.phase) * .55 * h.walk, air = h.hop > 4 && !h.ride;"),
            ("ctx.scale(TOOLS, TOOLS); drawTool(h.tool, h);","ctx.scale(TOOLS * (h.ts || 1), TOOLS * (h.ts || 1)); drawTool(h.tool, h);")]:
    assert a in hd, a; hd=hd.replace(a,b)
df=between("function drawField()","function drawTitle()")
df=df.replace("ctx.globalAlpha = l.a * .45; ctx.strokeStyle = INK;","ctx.globalAlpha = l.a * .5; ctx.strokeStyle = '#fff';")
for k,v in [("/*@@BASE@@*/",base),("/*@@FX@@*/",fx),("/*@@HEROMOVE@@*/",mv),("/*@@HERODRAW@@*/",hd),("/*@@DRAWFX@@*/",df)]:
    assert k in tpl; tpl=tpl.replace(k,v)
open(os.path.join(root,'video.html'),'w').write(tpl)
print('built', len(tpl))
