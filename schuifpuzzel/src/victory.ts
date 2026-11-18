/** Een korte sterrenfontein. De animatie kent geen spelregels en wijzigt het bord niet. */
interface Spark {
 x:number;y:number;vx:number;vy:number;size:number;angle:number;spin:number;
 birth:number;life:number;color:string;
}
const COLORS=['#ffce55','#ffe9a6','#d6a0f3','#f795c1','#8fe8d6'];
export class VictoryCelebration {
 private frame:number|null=null;
 private timer:number|null=null;
 private sparks:Spark[]=[];
 private origin={x:0,y:0};
 constructor(private canvas:HTMLCanvasElement,private message:HTMLElement,private board:SVGSVGElement) {
  // Bij wisselen van tab of schermformaat blijven geen losse animaties achter.
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
  window.addEventListener('resize',()=>this.stop());
 }
 play():void {
  this.stop();
  const rect=this.board.getBoundingClientRect();
  this.message.style.top=`${Math.max(90,Math.min(innerHeight-100,rect.top+rect.height*.48))}px`;
  this.message.classList.add('visible');
  this.timer=window.setTimeout(()=>this.stop(),4400);
  // Respecteer verminderde beweging: wel een feestelijk bericht, geen vliegende deeltjes.
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const matrix=this.board.getScreenCTM();
  const point=matrix?new DOMPoint(300,320).matrixTransform(matrix):{x:rect.left+rect.width*.6,y:rect.top+rect.height*.8};
  this.origin={x:point.x,y:point.y};
  const ratio=Math.min(devicePixelRatio||1,2);
  this.canvas.width=Math.round(innerWidth*ratio);this.canvas.height=Math.round(innerHeight*ratio);
  const ctx=this.canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  this.canvas.hidden=false;
  const scale=Math.min(1,Math.max(.65,rect.width/600));
  // Drie uitbarstingen geven meer volume dan de schets, met grote sterren ertussen.
  this.sparks=Array.from({length:165},(_,i)=>{
   const angle=-Math.PI*.5+(Math.random()-.5)*2.4;
   const speed=(240+Math.random()*410)*scale;
   return {x:0,y:0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    size:(i%8===0?16+Math.random()*7:5+Math.random()*9)*scale,
    angle:Math.random()*Math.PI,spin:(Math.random()-.5)*4,
    birth:Math.floor(i/55)*.17,life:2.2+Math.random()*1.6,color:COLORS[i%COLORS.length]};
  });
  const started=performance.now();
  const tick=(now:number)=>{
   const elapsed=(now-started)/1000;
   ctx.clearRect(0,0,innerWidth,innerHeight);
   this.drawHalo(ctx,elapsed,scale);
   for(const spark of this.sparks)this.drawSpark(ctx,spark,elapsed,scale);
   if(elapsed<4.1)this.frame=requestAnimationFrame(tick);
   else{this.frame=null;this.canvas.hidden=true;}
  };
  this.frame=requestAnimationFrame(tick);
 }
 stop():void {
  if(this.frame!==null)cancelAnimationFrame(this.frame);
  if(this.timer!==null)clearTimeout(this.timer);
  this.frame=null;this.timer=null;this.sparks=[];
  this.canvas.hidden=true;this.message.classList.remove('visible');
 }
 private drawHalo(ctx:CanvasRenderingContext2D,time:number,scale:number):void {
  if(time>1.0)return;
  ctx.save();ctx.globalAlpha=(1-time)*.55;
  ctx.strokeStyle='#ffdc83';ctx.lineWidth=5*(1-time)+1;
  ctx.beginPath();ctx.arc(this.origin.x,this.origin.y,(18+time*180)*scale,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 private drawSpark(ctx:CanvasRenderingContext2D,spark:Spark,elapsed:number,scale:number):void {
  const age=elapsed-spark.birth;if(age<0||age>spark.life)return;
  const x=this.origin.x+spark.vx*age;
  const y=this.origin.y+spark.vy*age+230*scale*age*age;
  const fade=Math.min(1,(spark.life-age)/.8);
  ctx.save();ctx.translate(x,y);ctx.rotate(spark.angle+spark.spin*age);
  ctx.globalAlpha=fade;ctx.fillStyle=spark.color;ctx.strokeStyle='#fff8df';ctx.lineWidth=.7;
  ctx.shadowColor=spark.color;ctx.shadowBlur=spark.size>14?9:2;
  ctx.beginPath();
  for(let i=0;i<10;i++){
   const angle=-Math.PI/2+i*Math.PI/5,radius=spark.size*(i%2?.44:1);
   const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius;
   if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
}
