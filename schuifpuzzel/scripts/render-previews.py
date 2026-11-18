"""Ruwe bewegingsstudies; gebruikt exact dezelfde PNG-blokjes als de website."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random
ROOT=Path(__file__).resolve().parents[1]/'dist'
OUT=ROOT/'ontwerpen';OUT.mkdir(exist_ok=True)
W,H=640,680
S=1.06; X,Y=55,132
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
fonts={size:ImageFont.truetype(FONT,size) for size in [12,14,16,18]}
headline=ImageFont.truetype(BOLD,27)
assets={p.stem:Image.open(p).convert('RGBA') for p in (ROOT/'assets').glob('*.png')}
resized={name:image.resize((round(image.width/3*S),round(image.height/3*S)),Image.Resampling.LANCZOS) for name,image in assets.items()}
def mix(a,b,t):return Image.blend(resized[a],resized[b],max(0,min(1,t)))
def paste(frame,asset,x,y):frame.alpha_composite(asset,(round(X+x*S),round(Y+y*S)))
def star(draw,cx,cy,r,fill,angle=0):
 points=[]
 for i in range(10):
  a=angle-math.pi/2+i*math.pi/5;radius=r if i%2==0 else r*.45
  points.append((cx+math.cos(a)*radius,cy+math.sin(a)*radius))
 draw.polygon(points,fill=fill)
def smooth(x):return 1-(1-max(0,min(1,x)))**3
def text_center(draw,text,y,font,fill):
 box=draw.textbbox((0,0),text,font=font);draw.text(((W-box[2])/2,y),text,font=font,fill=fill)
def frame_at(kind,t):
 im=Image.new('RGBA',(W,H),'#fff7fa');d=ImageDraw.Draw(im)
 titles=['1 · De staaf wordt goud','2 · Een fontein van sterren','3 · Het slot sluit']
 text_center(d,titles[kind],35,headline,'#65457d')
 text_center(d,'Ruwe bewegingsstudie — geen speluitleg',79,fonts[14],'#a58aaf')
 d.rounded_rectangle((39,119,601,575),radius=29,fill='#ad80c4')
 d.rounded_rectangle((39,113,601,569),radius=29,fill='#cba7df',outline='#f9eaff',width=3)
 d.rounded_rectangle((X,Y,X+500*S,Y+400*S),radius=17,fill='#f7eaf5')
 progress=smooth((t-.2)/.65)
 paste(im,resized['dock-right-cream'],100,0)
 paste(im,mix('dock-left-cream','dock-left-violet',progress),200,300)
 pieces=[('vertical',0,0),('square',100,100),('square',300,0),('square',400,0),('square',400,100),('square',0,200),('left',100,200),('horizontal',200,200),('vertical',400,200)]
 for shape,x,y in pieces:paste(im,resized[shape+'-mint'],x,y)
 for shape,x in [('right',0),('through',100)]:paste(im,mix(shape+'-violet',shape+'-mint',progress),x,300)
 rod=resized['rod-pink']
 if kind==0:rod=mix('rod-pink','rod-gold',smooth((t-.9)/.45))
 rodx=33+172*progress
 paste(im,rod,rodx,300)
 d=ImageDraw.Draw(im)
 starx,stary=X+300*S,Y+320*S
 star(d,starx,stary,10,'#ffe39b')
 elapsed=max(0,t-.95)
 if t>.95:
  layer=Image.new('RGBA',im.size);ld=ImageDraw.Draw(layer)
  if kind==0:
   # Kleine sprankels markeren de gouden verandering; een lichtstreep reist over de staaf.
   sweep=max(0,min(1,(t-1.3)/1.1))
   cx=X+(rodx+12+138*sweep)*S;cy=Y+350*S
   if 1.3<t<2.4:star(ld,cx,cy,9,'#fff8d6')
   for j in range(7):
    a=j*math.tau/7;rad=25+elapsed*12
    fade=max(0,1-elapsed/2)
    star(ld,starx+math.cos(a)*rad,stary+math.sin(a)*rad,3+2*math.sin(elapsed*3+j)**2,(255,207,91,round(190*fade)))
  if kind==1:
   rnd=random.Random(17)
   for j in range(40):
    a=rnd.uniform(-2.8,-.4);speed=rnd.uniform(70,185);delay=rnd.uniform(0,.22)
    tt=max(0,elapsed-delay)
    cx=starx+math.cos(a)*speed*tt;cy=Y+346*S+math.sin(a)*speed*tt+100*tt*tt
    fade=max(0,1-tt/2.0)
    color=rnd.choice([(255,200,76),(196,144,236),(255,155,192)])
    star(ld,cx,cy,rnd.uniform(3,7)*max(.2,fade),(*color,round(255*fade)),tt*2+j)
  if kind==2:
   # Twee kleine gouden sluitdelen komen om de staaf samen, als een bevredigende klik.
   close=smooth(elapsed/.4);claspX=X+223*S
   cy=Y+350*S
   gap=23*(1-close)
   ld.rounded_rectangle((claspX-6,cy-15-gap,claspX+6,cy-3-gap),radius=3,fill='#ffdc7e')
   ld.rounded_rectangle((claspX-6,cy+3+gap,claspX+6,cy+15+gap),radius=3,fill='#ffdc7e')
   if .3<elapsed<1.7:
    radius=22+elapsed*22;opacity=round(180*(1-(elapsed-.3)/1.4))
    ld.ellipse((starx-radius,stary-radius,starx+radius,stary+radius),outline=(255,213,99,max(0,opacity)),width=3)
   star(ld,starx,stary,10+4*math.sin(min(elapsed,1)*math.pi),'#ffdf77')
  im.alpha_composite(layer)
 if t>1.2:
  d=ImageDraw.Draw(im)
  text_center(d,'Mooi opgelost!',604,headline,'#765190')
 return im.convert('RGB')

if __name__=='__main__':
 combined=[]
 for kind,name in enumerate(['gouden-staaf','sterrenfontein','slot-sluit']):
  frames=[frame_at(kind,i/18) for i in range(63)]
  frames[32].save(OUT/f'{name}.png')
  # Een gedeeld palet voorkomt kleurflikkeringen tussen frames.
  palette=frames[32].quantize(colors=192,method=Image.Quantize.MEDIANCUT)
  indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
  indexed[0].save(OUT/f'{name}.gif',save_all=True,append_images=indexed[1:],duration=56,loop=0,optimize=True)
  combined.extend(frames)
 palette=combined[95].quantize(colors=224,method=Image.Quantize.MEDIANCUT)
 indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in combined]
 indexed[0].save(OUT/'drie-beloningen.gif',save_all=True,append_images=indexed[1:],duration=56,loop=0,optimize=True)
 print('Vier GIF-bestanden en drie stilstaande beelden gemaakt.')
