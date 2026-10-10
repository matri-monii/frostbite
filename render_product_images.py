import numpy as np, math, random
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
W,H=1600,2000
FD='/home/claude/fonts_dl/'
def hexc(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)],np.float32)/255
def blur(a,s): return ndi.gaussian_filter(a,(s,s,0) if a.ndim==3 else s)
def lerp(a,b,t): return a+(b-a)*t
def norm3(v): v=np.array(v,np.float32); return v/np.linalg.norm(v)
def font(name,size,wght=None):
    f=ImageFont.truetype(FD+name,size)
    if wght:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f
def tracked(d,xc,y,s,f,fill,track=0,anchor='m'):
    w=sum(d.textlength(ch,font=f)+track for ch in s)-track; x=xc-w/2
    for ch in s:
        d.text((x,y),ch,font=f,fill=fill,anchor='ls'); x+=d.textlength(ch,font=f)+track

def background(c,rng):
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    t=(yy/H)[...,None]
    img=lerp(hexc(c['bg1']),hexc(c['bg2']),t**1.15)*np.ones((H,W,1),np.float32)
    img+=hexc(c['glow'])*np.exp(-(((xx-800)/760)**2+((yy-900)/820)**2))[...,None]*.5
    for _ in range(36):
        r=rng.uniform(40,210); cx=rng.uniform(-50,W+50); cy=rng.uniform(0,1500)
        col=hexc(c['bokeh'][rng.integers(len(c['bokeh']))])
        x0,x1,y0,y1=int(max(cx-r-8,0)),int(min(cx+r+8,W)),int(max(cy-r-8,0)),int(min(cy+r+8,H))
        if x1<=x0 or y1<=y0: continue
        sy,sx=np.mgrid[y0:y1,x0:x1]; d=np.hypot(sx-cx,sy-cy)
        a=np.clip((r-d)/7,0,1)*rng.uniform(.07,.26)+np.clip(1-abs(d-r*.94)/9,0,1)*.07
        img[y0:y1,x0:x1]=img[y0:y1,x0:x1]*(1-a[...,None])+col*a[...,None]
    return blur(img,4)

def prop(kind,size,albedo,rng,rot=0,light=(-.5,-.6,.65)):
    """pillow-inflated 3D-ish prop, returns RGBA float (S,S,4)"""
    S=int(size*1.6); im=Image.new('L',(S,S),0); d=ImageDraw.Draw(im); cx=cy=S/2; r=size/2
    if kind=='hexnut': d.polygon([(cx+r*math.cos(math.radians(60*i)),cy+r*math.sin(math.radians(60*i))) for i in range(6)],fill=255)
    elif kind=='lemon': d.ellipse([cx-r,cy-r*.92,cx+r,cy+r*.92],fill=255)
    elif kind=='chunk':
        pts=[(cx+r*rng.uniform(.55,1.05)*math.cos(a),cy+r*rng.uniform(.5,.95)*math.sin(a)) for a in np.linspace(0,2*math.pi,11)[:-1]]; d.polygon(pts,fill=255)
    elif kind=='cone':
        d.polygon([(cx-r*.28,cy-r*1.0),(cx+r*.28,cy-r*1.0),(cx+r*.78,cy+r*1.0),(cx-r*.78,cy+r*1.0)],fill=255)
    elif kind=='rebar':
        d.rounded_rectangle([cx-r*1.5,cy-r*.07,cx+r*1.5,cy+r*.07],radius=int(r*.07),fill=255)
    m=np.asarray(im,np.float32)/255
    if rot: m=ndi.rotate(m,rot,reshape=False,order=1)
    hgt=blur(m,size*.11)*3; hgt=hgt/ (hgt.max()+1e-6)*size*.35
    gy,gx=np.gradient(hgt); n=np.stack([-gx*1.2,-gy*1.2,np.ones_like(gx)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    L=norm3(light); diff=np.clip((n*L).sum(-1),0,1)
    nz=rng.normal(0,1,(S,S)); tex=1+blur(nz,1.4)*.9*0+(blur(nz,2.2)*1.6)
    col=np.broadcast_to(albedo,(S,S,3)).copy()
    if kind=='cone':
        yy,xx=np.mgrid[0:S,0:S]; band=((yy>cy-r*.15)&(yy<cy+r*.38)); col[band]=hexc('#f4f3ee')
    if kind=='lemon':
        yy,xx=np.mgrid[0:S,0:S]; rr=np.hypot(xx-cx,(yy-cy)/.92)/r; ang=np.arctan2(yy-cy,xx-cx)
        inner=(rr<.86); seg=(np.abs(np.sin(ang*4))<.07)&(rr<.8); pith=np.where(inner,1,0)[...,None]
        col=np.where(inner[...,None],hexc('#fff3a8'),col); col=np.where(seg[...,None],hexc('#fff9d8'),col)
    shade=(.3+.85*diff)[...,None]; out=col*shade*np.clip(tex,.6,1.4)[...,None]
    spec=(np.clip((n*norm3(L+np.array([0,0,1]))).sum(-1),0,1)**40*.6)[...,None]
    out=out+spec
    return np.concatenate([np.clip(out,0,1),m[...,None]],-1)

def over(base,rgba,x,y,blur_s=0):
    h,w=rgba.shape[:2]
    if blur_s: rgba=np.concatenate([blur(rgba[...,:3]*rgba[...,3:],blur_s),blur(rgba[...,3],blur_s)[...,None]],-1); rgb=rgba[...,:3]; a=rgba[...,3:]
    else: rgb=rgba[...,:3]*rgba[...,3:]; a=rgba[...,3:]
    x0,y0=int(x-w/2),int(y-h/2); X0,Y0=max(x0,0),max(y0,0); X1,Y1=min(x0+w,W),min(y0+h,H)
    if X1<=X0 or Y1<=Y0: return
    sr=rgb[Y0-y0:Y1-y0,X0-x0:X1-x0]; sa=a[Y0-y0:Y1-y0,X0-x0:X1-x0]
    base[Y0:Y1,X0:X1]=base[Y0:Y1,X0:X1]*(1-sa)+sr

def label_tex(c,TW=1100,TH=1000):
    t=np.linspace(0,1,TH)[:,None,None]; g1,g2,g3=hexc(c['can1']),hexc(c['can2']),hexc(c['can3'])
    col=np.where(t<.52,lerp(g1,g2,t/.52),lerp(g2,g3,(t-.52)/.48))
    im=Image.fromarray((np.broadcast_to(col,(TH,TW,3))*255).astype(np.uint8)); d=ImageDraw.Draw(im)
    cx=TW/2; wh=(255,255,255); wl=tuple(int(v*255) for v in hexc(c.get('txt2','#ffffff')))
    # top line  "Micro-batch Ice Cream"
    f1=font('InstrumentSerif-Regular.ttf',58); f2=font('InstrumentSerif-Italic.ttf',58)
    w1=d.textlength('Micro-batch ',font=f1); w2=d.textlength('Ice Cream',font=f2); x=cx-(w1+w2)/2
    d.text((x,128),'Micro-batch ',font=f1,fill=wh,anchor='ls'); d.text((x+w1,128),'Ice Cream',font=f2,fill=wh,anchor='ls')
    # italic wordmark
    wm=Image.new('RGBA',(TW,260),(0,0,0,0)); wd=ImageDraw.Draw(wm); fw=font('InterTight.ttf',190,800)
    tw=wd.textlength('frostbite',font=fw); wd.text((cx-tw/2,200),'frostbite',font=fw,fill=wh+(255,),anchor='ls')
    wm=wm.transform(wm.size,Image.AFFINE,(1,.2,-40,0,1,0),Image.BICUBIC); im.paste(wm,(0,230),wm)
    fn=font('InterTight.ttf',82,500); tracked(d,cx,680,c['name'].upper(),fn,wl+(240,),track=-1)
    if c.get('name2'): tracked(d,cx,770,c['name2'].upper(),fn,wl+(240,),track=-1)
    ft=font('InstrumentSerif-Regular.ttf',58); y=860 if c.get('name2') else 780
    tracked(d,cx,y,c['tag'],ft,wl+(240,),track=0)
    fm=font('DepartureMono-Regular.otf',26) if False else font('InterTight.ttf',24,600)
    px=cx-300
    for i,p in enumerate(c['pills']):
        w=190; x0=px+i*205; d.rounded_rectangle([x0,y+40,x0+w,y+92],radius=26,outline=wl+(230,),width=3)
        tracked(d,x0+w/2,y+75,p,fm,wl+(240,),track=.5)
    tracked(d,cx,960,'1 PINT (473 mL)',font('InterTight.ttf',32,700),wl+(225,),track=1)
    return np.asarray(im,np.float32)/255

def tube(c,rng,cx=700,ytop=430,ybot=1590,rx0=262,rx1=240):
    ry0,ry1=rx0*.2,rx1*.2
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    frac=np.clip((yy-ytop)/(ybot-ytop),0,1); hw=lerp(rx0,rx1,frac)
    u=np.clip((xx-cx)/hw,-1,1); nzc=np.sqrt(1-u**2)
    ry=lerp(ry0,ry1,frac)
    top_edge=ytop+ry0*nzc; bot_edge=ybot+ry1*nzc
    body=((np.abs(xx-cx)<=hw)&(yy>=top_edge)&(yy<=bot_edge)).astype(np.float32)
    body=blur(body,.8)
    # texture
    tex=label_tex(c); TH,TW=tex.shape[:2]
    tx=(0.5+np.arcsin(u)/math.pi)*(TW-1); ty=np.clip((yy-ytop)/(ybot-ytop),0,1)*(TH-1)
    alb=np.stack([ndi.map_coordinates(tex[...,k],[ty,tx],order=1) for k in range(3)],-1)
    # condensation
    bx0,bx1,by0,by1=int(cx-rx0),int(cx+rx0),int(ytop),int(ybot+ry1)
    dl=Image.new('L',(W,H),0); dd=ImageDraw.Draw(dl)
    for _ in range(1500):
        x=rng.uniform(bx0,bx1); y=rng.uniform(by0,by1); r=rng.choice([1.6,2.2,3,4.2,6],p=[.4,.32,.18,.08,.02])*(1.25 if y<ytop+500 else 1)
        dd.ellipse([x-r,y-r,x+r,y+r],fill=int(rng.uniform(150,255)))
    drop=blur(np.asarray(dl,np.float32)/255,1.5)
    gy,gx=np.gradient(drop)
    nx=u-gx*26; ny=-gy*26; nz=nzc; n=np.stack([nx,ny,nz],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    L=norm3((-.55,-.4,.75)); diff=np.clip((n*L).sum(-1),0,1)
    fill=np.clip((n*norm3((.85,0,.35))).sum(-1),0,1)
    Hh=norm3(L+np.array([0,0,1])); spec=np.clip((n*Hh).sum(-1),0,1)**70
    strip=np.exp(-((u+.52)/.075)**2)*np.clip(1-np.abs((yy-(ytop+ybot)/2)/((ybot-ytop)/2))**4,0,1)*.62
    strip2=np.exp(-((u-.74)/.045)**2)*.22
    rim=(1-nzc)**2.6
    frost=blur(rng.uniform(0,1,(H,W)).astype(np.float32),.7); frost=np.clip((frost-.56)*9,0,1)*np.clip(1.15-frac*.9,0,1)
    glow=hexc(c['glow'])
    col=alb*(.30+.85*diff+.2*fill)[...,None]*(1-.1*drop[...,None])
    col+= (spec*.55+strip+strip2)[...,None]*np.array([1,1,1])*(1-.35*drop[...,None])*.9
    col+= (drop*np.clip(gx*-60+gy*-40,0,1))[...,None]*.42   # droplet glints
    col+= rim[...,None]*glow*.55
    col=lerp(col,np.ones(3),(frost*.12)[...,None])
    rgba=np.concatenate([np.clip(col,0,1),body[...,None]],-1)
    # lid
    lid_mask=(((xx-cx)/rx0)**2+((yy-ytop)/ry0)**2<=1).astype(np.float32); lid_mask=blur(lid_mask,.8)
    lu=(xx-cx)/rx0; lv=(yy-ytop)/ry0
    ring=np.clip(1-np.abs(np.sqrt(lu**2+lv**2)-.9)/.07,0,1)
    lid=lerp(hexc(c['lid1']),hexc(c['lid2']),np.clip((lu+1)/2,0,1)[...,None])*(.82+.18*np.clip(-lv,0,1)[...,None])
    lid=lid*(1-.25*ring[...,None])+ring[...,None]*.18+ (np.exp(-((lu+.35)/.22)**2)*np.exp(-((lv+.2)/.5)**2)*.35)[...,None]
    la=lid_mask[...,None]
    rgba[...,:3]=rgba[...,:3]*(1-la)+np.clip(lid,0,1)*la; rgba[...,3:]=np.maximum(rgba[...,3:],la)
    return rgba

def scoop(c,rng,cx,base_y,R=200):
    S=int(R*3); yy,xx=np.mgrid[0:S,0:S].astype(np.float32); ccx=S/2; ccy=S/2-R*.15
    dx=(xx-ccx)/R; dy=(yy-ccy)/R
    # irregular silhouette
    ang=np.arctan2(dy,dx); rr=np.hypot(dx,dy)
    wob=1+.035*np.sin(ang*5+1.3)+.02*np.sin(ang*9)
    m=np.clip((wob-rr)*R/1.5,0,1)
    nz=np.sqrt(np.clip(1-(rr/wob)**2,0,1))
    bump=blur(rng.normal(0,1,(S,S)).astype(np.float32),R*.07)*R*.18
    gy,gx=np.gradient(bump)
    n=np.stack([dx/wob-gx*1.2,dy/wob-gy*1.2,nz],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    L=norm3((-.55,-.55,.65)); diff=np.clip((n*L).sum(-1),0,1)
    alb=np.broadcast_to(hexc(c['cream']),(S,S,3)).copy()
    sp=Image.new('RGB',(S,S),(0,0,0)); sd=ImageDraw.Draw(sp)
    for _ in range(c.get('nspeck',120)):
        a=rng.uniform(0,2*math.pi); rad=rng.uniform(0,.92)*R; x=ccx+rad*math.cos(a); y=ccy+rad*math.sin(a); r=rng.uniform(1.6,4.6)
        sd.ellipse([x-r,y-r,x+r,y+r],fill=tuple(int(v*255) for v in hexc(c['speck'][rng.integers(len(c['speck']))])))
    spk=np.asarray(sp,np.float32)/255; sm=(spk.sum(-1,keepdims=True)>0)
    alb=np.where(sm,spk,alb)
    col=alb*(.42+.72*diff)[...,None]
    Hh=norm3(L+np.array([0,0,1])); col+= (np.clip((n*Hh).sum(-1),0,1)**22*.28)[...,None]
    col+= ((1-nz)**3*.25)[...,None]*hexc(c['glow'])
    # skirt
    sk=np.clip(1-(((xx-ccx)/(R*1.12))**2+((yy-(ccy+R*.93))/(R*.26))**2),0,1); sk=np.clip(sk*18,0,1)*(yy>ccy+R*.55)
    skcol=hexc(c['cream'])*(.62+.25*np.clip(1-(yy-(ccy+R*.7))/(R*.4),0,1))[...,None]
    a=np.maximum(m,sk); col=np.where((sk>m)[...,None],skcol,col)
    rgba=np.concatenate([np.clip(col,0,1),a[...,None]],-1)
    return rgba,(cx,base_y-(S/2-R*.15)+ (S/2-R*.15) - 0)  # placeholder

def make(name,c,seed=3,wide=False):
    global W,H
    W,H=(2200,1400) if wide else (1600,2000)
    P=dict(YH=1010,axis=1112,tube=(1360,150,1105,250,230),sc=(1840,1170,185),sh=[(1360,1112,320,52,.8),(1840,1172,260,42,.75)],back=c['back_w'],front=c['front_w'],out=name+'-wide',cut=False) if wide else dict(YH=1500,axis=1612,tube=(700,430,1590,262,240),sc=(1215,1660,200),sh=[(700,1605,330,56,.8),(1215,1660,270,44,.75)],back=c['back'],front=c['front'],out=name,cut=True)
    rng=np.random.default_rng(seed)
    img=background(c,rng)
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    YH=P['YH']
    # floor
    fl=lerp(hexc(c['floor1']),hexc(c['floor2']),np.clip((yy-YH)/(H-YH),0,1)[...,None])
    fm=(yy>=YH)[...,None]; edge=np.clip((yy-YH)/3,0,1)[...,None]
    img=np.where(fm,lerp(img,fl,edge),img)
    img+=(np.exp(-((yy-YH)/4.5)**2)*.16)[...,None]
    # back props (blurred)
    for k,(kind,x,y,s,al,rot,bs) in enumerate(P['back']): over(img,prop(kind,s,hexc(al),rng,rot),x,y,bs)
    # objects layer
    objs=np.zeros((H,W,4),np.float32)
    def add(rgba,x,y):
        tmp=np.zeros((H,W,4),np.float32); h,w=rgba.shape[:2]; x0,y0=int(x-w/2),int(y-h/2)
        X0,Y0=max(x0,0),max(y0,0); X1,Y1=min(x0+w,W),min(y0+h,H)
        tmp[Y0:Y1,X0:X1]=rgba[Y0-y0:Y1-y0,X0-x0:X1-x0]
        a=tmp[...,3:]; objs[...,:3]=objs[...,:3]*(1-a)+tmp[...,:3]*a; objs[...,3:]=np.maximum(objs[...,3:],a)
    # contact shadows
    sh=np.zeros((H,W),np.float32)
    for (ex,ey,rx,ry,st) in P['sh']:
        sh=np.maximum(sh,np.clip(1-(((xx-ex)/rx)**2+((yy-ey)/ry)**2),0,1)*st)
    sh=blur(sh,16); img*= (1-.7*sh)[...,None]
    tcx,tyt,tyb,trx0,trx1=P['tube']; t=tube(c,rng,tcx,tyt,tyb,trx0,trx1); add(t,W/2,H/2)
    if P['cut']:
        cut=(np.clip(t[380:1660,400:1000],0,1)*255).astype(np.uint8); Image.fromarray(cut,'RGBA').resize((300,640),Image.LANCZOS).save(f'/home/claude/frostbite/public/images/{name}-can.png')
    sc,_=scoop(c,rng,0,0,R=P['sc'][2]); S=sc.shape[0]
    add(sc,P['sc'][0],P['sc'][1]-1.04*P['sc'][2])
    comp=img*(1-objs[...,3:])+objs[...,:3]*objs[...,3:]
    # reflection
    axis=P['axis']; refl=img.copy()
    for y in range(YH,H):
        s=2*axis-y
        if 0<=s<H: refl[y]=comp[s]
    refl=blur(refl,5)
    a=np.clip(.62*np.exp(-np.maximum(yy-axis,0)/230),0,.62)*(yy>=axis-50)
    img=np.where((yy>=YH)[...,None],lerp(img,refl*.95,a[...,None]),img)
    img=img*(1-objs[...,3:])+objs[...,:3]*objs[...,3:]
    # front props (blurred)
    for (kind,x,y,s,al,rot,bs) in P['front']: over(img,prop(kind,s,hexc(al),rng,rot),x,y,bs)
    # bloom
    bright=np.clip(img-.72,0,1); img=img+blur(bright,28)*.55
    # grade: vignette + grain
    v=1-.34*(((xx-W/2)/(W/2))**2*.8+((yy-H*.5)/(H*.62))**2); img*=np.clip(v,.5,1)[...,None]
    img+=rng.normal(0,.022,(H,W,1)).astype(np.float32)
    out=Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8))
    out.save(f"/home/claude/frostbite/public/images/{P['out']}.jpg",quality=88); out.resize((W//4,H//4)).save(f"/home/claude/shot/{P['out']}_sm.jpg")

CEMENT=dict(name='Wet Cement',tag='Smoky | Salty | Smooth',pills=['SESAME','SMOKED SALT','COCOA'],
 bg1='#8fa6bb',bg2='#2d3a47',glow='#dcecf8',bokeh=['#c8dcef','#5d7a96','#e9f3fb','#1f2b36'],floor1='#46525e',floor2='#151b21',
 can1='#0f141a',can2='#4f6275',can3='#5f7488',lid1='#e9eef2',lid2='#aab6c0',glow_='#fff',
 cream='#9aa0a5',speck=['#0a0a0a','#1b1b1b','#2a2a2a'],nspeck=220,
 back=[('rebar',420,520,420,'#3a444d',-14,7),('rebar',1230,330,520,'#3a444d',9,9),('chunk',1400,1180,300,'#7d8790',0,14)],
 front=[('chunk',130,1790,360,'#6f7a84',0,22),('rebar',1500,1930,520,'#2f383f',-6,16)],
 back_w=[('rebar',300,250,520,'#3a444d',-10,8),('rebar',1000,120,500,'#3a444d',7,10),('chunk',820,700,280,'#7d8790',0,16)],
 front_w=[('chunk',110,1290,330,'#6f7a84',0,24),('rebar',1900,1370,520,'#2f383f',-6,18)])
RUST=dict(name='Rust Belt',name2='Caramel',tag='Burnt | Warm | Sticky',pills=['CARAMEL','IRON SALT','ORANGE'],
 bg1='#f08a3a',bg2='#6e2509',glow='#ffd0a0',bokeh=['#ffb36b','#c4531c','#ffd9b0','#5a1c07'],floor1='#6a2a10',floor2='#1d0a03',
 can1='#1b0c07',can2='#a63a14',can3='#e8541a',lid1='#f6e3c6',lid2='#c9a373',
 cream='#cf9650',speck=['#ffdca0','#e24b1e','#8a4a12'],nspeck=150,
 back=[('hexnut',330,500,300,'#8a3512',0,10),('hexnut',1280,420,360,'#9b4018',15,12),('hexnut',1420,1050,260,'#7a2f10',-10,11)],
 front=[('hexnut',110,1800,420,'#823012',20,22),('hexnut',1520,1900,360,'#8f3b16',-8,20)],
 back_w=[('hexnut',560,330,300,'#8a3512',0,11),('hexnut',900,640,230,'#9b4018',15,12),('hexnut',2060,360,330,'#7a2f10',-10,12)],
 front_w=[('hexnut',130,1290,380,'#823012',20,24),('hexnut',2050,1360,360,'#8f3b16',-8,20)])
HIVIS=dict(name='Hi-Vis',name2='Lemon',tag='Sharp | Bright | Zesty',pills=['LEMON','YUZU','PEPPER'],
 bg1='#f0fa55',bg2='#4f6b06',glow='#fffec0',bokeh=['#fffb9a','#9ec216','#f6ff7a','#2d4203','#2fb7a8'],floor1='#4a5d0a',floor2='#141a02',
 can1='#0b100d',can2='#5f8a14',can3='#e6f23a',txt2='#0b100d',lid1='#f4f9a0',lid2='#b7cf2a',
 cream='#f1e48a',speck=['#fffbe0','#e7c518','#fff6a8'],nspeck=140,
 back=[('cone',300,780,420,'#ff6a13',0,10),('cone',1330,640,360,'#ff7a1f',0,12)],
 front=[('lemon',130,1790,430,'#f0cc1a',0,22),('lemon',1500,1930,360,'#f4d52a',20,20)],
 back_w=[('cone',420,520,380,'#ff6a13',0,11),('cone',840,430,300,'#ff7a1f',0,13)],
 front_w=[('lemon',120,1290,400,'#f0cc1a',0,24),('lemon',2060,1370,340,'#f4d52a',20,22)])
import sys
for nm,cf in [('wet-cement',CEMENT),('rust-belt',RUST),('hi-vis-lemon',HIVIS)]:
    if len(sys.argv)<2 or sys.argv[1]==nm: make(nm,cf,wide=True); print('done wide',nm,flush=True)
