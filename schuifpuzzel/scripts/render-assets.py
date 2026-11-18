"""Maak de spelafbeeldingen vooraf: smalle afgeronde randen, vlakke glans en echte uitsparingen.

Deze stap is alleen voor vormgeving. De browser laadt PNG's en berekent geen belichting.
Benodigd om opnieuw te tekenen: Python, Pillow, NumPy en SciPy.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter

OUTPUT = Path(__file__).resolve().parents[1] / 'dist/assets'
SCALE = 3
COLORS = {'mint': (50, 204, 184), 'violet': (170, 116, 216),
          'cream': (232, 190, 142), 'pink': (235, 100, 153), 'gold': (244, 185, 51)}

def mask_for(shape):
    width, height = (200 if shape in ['horizontal','dock-right','dock-left'] else 162 if shape=='rod' else 100), (200 if shape=='vertical' else 100)
    mask = Image.new('L', (width*SCALE,height*SCALE))
    draw = ImageDraw.Draw(mask)
    def box(coords,radius,fill):
        draw.rounded_rectangle(tuple(round(v*SCALE) for v in coords),radius=radius*SCALE,fill=fill)
    if shape=='rod':
        box((0,40,162,60),10,255)
    else:
        box((5,5,width-5,height-5),13,255)
        if shape=='right':box((32,36,110,64),14,0)
        if shape=='left':box((-10,36,68,64),14,0)
        if shape=='through':draw.rectangle((0,36*SCALE,width*SCALE,64*SCALE),fill=0)
        if shape=='dock-right':box((32,38,215,62),12,0)
        if shape=='dock-left':box((-15,38,168,62),12,0)
    return mask

def render(shape,color):
    mask=mask_for(shape)
    alpha=np.asarray(mask)/255.
    h,w=alpha.shape
    yy,xx=np.mgrid[:h,:w]/SCALE
    # De afstand tot de omtrek geeft dezelfde smalle bevel rond buitenrand én uitsparingen.
    distance=distance_transform_edt(alpha)/SCALE
    bevel=4.3 if shape!='rod' else 2.7
    edge=np.clip(distance/bevel,0,1)
    height=np.sqrt(np.maximum(0,1-(1-edge)**2))
    height=gaussian_filter(height,.6)
    gy,gx=np.gradient(height)
    normal=np.stack([-gx*SCALE*1.3,-gy*SCALE*1.3,np.ones_like(gx)],axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    light=np.array([-.4,-.55,.73]);light/=np.linalg.norm(light)
    diffuse=np.maximum(0,normal@light)
    half=np.array([-.2,-.27,.94]);half/=np.linalg.norm(half)
    specular=np.maximum(0,normal@half)**24
    shade=.56+.5*diffuse
    rgb=np.array(COLORS[color])[None,None,:]*shade[:,:,None]
    # Rustig vlak midden, met een zachte reflectie bovenin en een scherpere glans op de rand.
    top=np.exp(-((yy-13)/8)**2)*.15
    sheen=np.exp(-((xx-21)/12)**2-((yy-18)/11)**2)*.45
    rim=np.exp(-((distance-1.8)/.8)**2)*np.maximum(0,-normal[:,:,1])*.35
    white=np.clip(top+sheen+rim+specular*.15,0,.72)
    rgb=rgb*(1-white[:,:,None])+255*white[:,:,None]
    pixels=np.dstack([np.clip(rgb,0,255).astype('uint8'),(alpha*255).astype('uint8')])
    face=Image.fromarray(pixels,'RGBA')
    # Een scherpe, langgerekte reflectie en een klein hoeklicht maken de lak herkenbaar.
    if shape!='rod':
        reflection=Image.new('L',mask.size)
        pen=ImageDraw.Draw(reflection)
        pen.rounded_rectangle((21*SCALE,10*SCALE,(w/SCALE-19)*SCALE,14*SCALE),radius=2*SCALE,fill=115)
        points=[]
        def curve(a,b,c):
            for t in np.linspace(0,1,24):
                q=(1-t)**2*np.array(a)+2*(1-t)*t*np.array(b)+t*t*np.array(c)
                points.append(tuple(q*SCALE))
        curve((13,28),(10,12),(26,10))
        curve((26,10),(33,9),(36,13))
        curve((36,13),(20,16),(17,29))
        pen.polygon(points,fill=215)
        reflection=reflection.filter(ImageFilter.GaussianBlur(.45*SCALE))
        clipped=np.minimum(np.asarray(reflection),np.asarray(mask))
        gloss=Image.new('RGBA',mask.size,'white');gloss.putalpha(Image.fromarray(clipped))
        face.alpha_composite(gloss)
    # Zeer kleine schaduw: bewust minder bol en minder hoog dan de eerste concepten.
    shadow_mask=Image.new('L',mask.size)
    shadow_mask.paste(mask,(0,round(1.6*SCALE)))
    shadow_mask=shadow_mask.filter(ImageFilter.GaussianBlur(1.0*SCALE)).point(lambda p:int(p*.25))
    shadow=Image.new('RGBA',mask.size,(50,41,74,0));shadow.putalpha(shadow_mask)
    shadow.alpha_composite(face)
    return shadow

if __name__=='__main__':
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for shape in ['square','vertical','horizontal','right','left','through']:
        for color in ['mint','violet']:render(shape,color).save(OUTPUT/f'{shape}-{color}.png',optimize=True)
    for shape in ['dock-right','dock-left']:
        for color in ['cream','violet']:render(shape,color).save(OUTPUT/f'{shape}-{color}.png',optimize=True)
    for color in ['pink','gold']:render('rod',color).save(OUTPUT/f'rod-{color}.png',optimize=True)
