import {State, Piece, size, DOCKS} from './model.js';
import {barPixels,BAR_WIDTH} from './geometry.js';
const NS='http://www.w3.org/2000/svg';
function svgElement(name:string,attributes:Record<string,string|number>):SVGElement {
  const el=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attributes)) el.setAttribute(key,String(value));
  return el;
}
/** Alleen tekenen: dit onderdeel verandert de speltoestand nooit. */
export function renderBoard(board:SVGSVGElement,s:State,selected:string|null):void {
  board.replaceChildren();
  const carriers:string[]=Array.isArray(s.support)?s.support:[];
  const selectionIsCoupled=selected!==null&&(selected==='bar'||carriers.includes(selected));
  const selectedIds=selectionIsCoupled?carriers:selected?[selected]:[];
  DOCKS.forEach((d,i)=>{
    const carrying=s.support===(i===0?'start':'finish');
    const g=svgElement('g',{transform:`translate(${d.x*100},${d.y*100})`,class:`dock ${i===1?'destination':''} ${carrying?'carrying':''}`,role:'img','aria-label':`${i===0?'Bovenste':'Onderste'} vaste houder${carrying?', met staaf':''}`});
    g.append(svgElement('image',{
      href:`./assets/dock-${i===0?'right':'left'}-${carrying?'violet':'cream'}.png`,
      x:0,y:0,width:200,height:100,class:'piece-art'
    }));
    if(i===1) {
      // Een gouden ster markeert de bestemming zonder tekst op het bord.
      g.append(svgElement('path',{d:'M100 10 L103 17 L111 18 L105 23 L107 30 L100 26 L93 30 L95 23 L89 18 L97 17 Z',class:'goal-star'}));
    }
    board.append(g);
  });
  s.pieces.forEach(p=>board.append(drawPiece(p,selectedIds.includes(p.id),carriers.includes(p.id))));
  const position=barPixels(s);
  const bar=svgElement('g',{'data-id':'bar',role:'button',tabindex:0,'aria-label':'Staaf selecteren',class:`bar ${selected==='bar'||(selectionIsCoupled&&carriers.length)?'selected':''}`,transform:`translate(${position.x},${position.y})`});
  bar.append(svgElement('rect',{x:0,y:40,width:BAR_WIDTH,height:20,rx:10,class:'bar-hit'}));
  bar.append(svgElement('image',{href:'./assets/rod-pink.png',x:0,y:0,width:BAR_WIDTH,height:100,class:'piece-art'}));
  bar.append(svgElement('rect',{x:0,y:40,width:BAR_WIDTH,height:20,rx:10,class:'bar-outline'}));
  board.append(bar);
}
function drawPiece(p:Piece,selected:boolean,carrying:boolean):SVGElement {
  const [w,h]=size(p);
  const group=svgElement('g',{transform:`translate(${p.x*100},${p.y*100})`,'data-id':p.id,role:'button',tabindex:0,'aria-label':`Blok ${p.id}${carrying?', gekoppeld door de staaf':''}`,class:`piece ${selected?'selected':''} ${carrying?'carrying':''}`});
  const outline=pieceOutline(p,w*100,h*100);
  // De glans en smalle bevel zijn vooraf gerenderd. De spelcode blijft daardoor klein;
  // de geometrische omtrek blijft verantwoordelijk voor aanraken en selectieranden.
  group.append(svgElement('path',{d:outline,fill:'transparent',class:'piece-hit'}));
  group.append(svgElement('image',{
    href:`./assets/${p.shape}-${carrying?'violet':'mint'}.png`,
    x:0,y:0,width:w*100,height:h*100,class:'piece-art'
  }));
  group.append(svgElement('path',{d:outline,class:'asset-outline'}));
  return group;
}

/** Eén doorlopende omtrek voorkomt geschilderde vakjes achter de uitsparingen. */
function pieceOutline(piece:Piece,width:number,height:number):string {
 const right=width-5,bottom=height-5;
 const top=`M 17 5 H ${right-12} Q ${right} 5 ${right} 17`;
 const lower=`V ${bottom-12} Q ${right} ${bottom} ${right-12} ${bottom} H 17 Q 5 ${bottom} 5 ${bottom-12}`;
 const close='V 17 Q 5 5 17 5 Z';
 if(piece.shape==='right')return top+' V 36 H 46 Q 32 36 32 50 Q 32 64 46 64 H 95 '+lower+close;
 if(piece.shape==='left')return top+lower+' V 64 H 54 Q 68 64 68 50 Q 68 36 54 36 H 5 '+close;
 if(piece.shape==='through')return top+' V 36 H 5 V 17 Q 5 5 17 5 Z M 5 64 H 95 V 83 Q 95 95 83 95 H 17 Q 5 95 5 83 Z';
 return top+lower+close;
}
