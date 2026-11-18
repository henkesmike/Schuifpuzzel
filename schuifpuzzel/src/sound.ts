/** Lokale Web Audio: een rustig zetgeluid en een korte, warmere overwinningsmelodie. */
export class PuzzleSound {
 private context:AudioContext|null=null;
 private enabled=true;
 private voices:OscillatorNode[]=[];
 private generation=0;
 constructor(private button:HTMLButtonElement) {
  try{this.enabled=localStorage.getItem('staafpuzzel-geluid')!=='uit';}catch{/* Voorkeur is optioneel. */}
  this.update();button.addEventListener('click',()=>{
   this.enabled=!this.enabled;
   if(!this.enabled)this.stop();
   this.unlock();this.update();
   try{localStorage.setItem('staafpuzzel-geluid',this.enabled?'aan':'uit');}catch{/* Optionele voorkeur. */}
   if(this.enabled)this.play(false);
  });
 }
 unlock():void {
  if(!this.enabled)return;
  try{this.context??=new AudioContext();void this.context.resume().catch(()=>{});}catch{/* Stil verder spelen als audio ontbreekt. */}
 }
 private update():void {
  this.button.textContent=this.enabled?'♫ Geluid aan':'♪ Geluid uit';
  this.button.setAttribute('aria-pressed',String(this.enabled));
  this.button.setAttribute('aria-label',this.enabled?'Geluid uitschakelen':'Geluid inschakelen');
 }
 stop():void {
  this.generation++;
  for(const voice of this.voices){try{voice.stop();}catch{/* Toon kan al afgelopen zijn. */}}
  this.voices=[];
 }
 async play(victory:boolean):Promise<void> {
  this.stop();
  const generation=this.generation;
  if(!this.enabled)return;
  this.unlock();
  const audio=this.context;if(!audio)return;
  try{if(audio.state!=='running')await audio.resume();}catch{return;}
  if(!this.enabled||audio.state!=='running'||generation!==this.generation)return;
  const start=audio.currentTime+.015;
  if(!victory){this.note(660,start,.17,.04);return;}
  // Een oplopend majeurmotief, een zacht slotakkoord en een hoge glinstering.
  // Geen achtergrondmuziek; de hele beloning is na circa twee seconden stil.
  [523.25,659.25,783.99,1046.5].forEach((frequency,i)=>this.note(frequency,start+i*.14,.38,.065));
  [523.25,659.25,783.99,1046.5].forEach(frequency=>this.note(frequency,start+.65,.9,.022,'triangle'));
  [1567.98,2093].forEach((frequency,i)=>this.note(frequency,start+1.05+i*.12,.5,.018));
 }
 private note(frequency:number,start:number,duration:number,level:number,type:OscillatorType='sine'):void {
  const audio=this.context!;
  const tone=audio.createOscillator(),volume=audio.createGain();
  tone.type=type;tone.frequency.setValueAtTime(frequency,start);
  volume.gain.setValueAtTime(0,start);volume.gain.linearRampToValueAtTime(level,start+.012);
  volume.gain.exponentialRampToValueAtTime(.0001,start+duration);
  tone.connect(volume);volume.connect(audio.destination);tone.start(start);tone.stop(start+duration+.02);
  this.voices.push(tone);
  tone.onended=()=>{tone.disconnect();volume.disconnect();this.voices=this.voices.filter(voice=>voice!==tone);};
 }
}
