import { advanceScroll, STEP_SPACING } from './motion.js';
const W=390,H=844;
export class Renderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.scroll=0;this.clock=0;this.legPhase=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);}
  resize(){const ratio=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.canvas.clientWidth*ratio);this.canvas.height=Math.round(this.canvas.clientHeight*ratio);}
  path(points,fill,stroke){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
  ellipse(x,y,rx,ry,fill){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
  draw(game,dt){const c=this.ctx;c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.clearRect(0,0,W,H);const moving=game.state!=='paused';if(moving){this.clock+=dt;this.scroll=advanceScroll(this.scroll,game.speed,dt);this.legPhase+=dt*(game.state==='title'?26:game.running?Math.max(9,game.velocity*.3):9);}
    c.save();if(!this.reduced&&game.state==='playing'&&game.d<35)c.translate(Math.sin(this.clock*63)*1.3,Math.cos(this.clock*51));
    const bg=c.createLinearGradient(0,0,390,700);bg.addColorStop(0,'#242c31');bg.addColorStop(.5,'#656d74');bg.addColorStop(1,'#3c444b');c.fillStyle=bg;c.fillRect(0,0,W,H);
    this.path([[0,0],[32,0],[32,H],[0,H]],'#282f33');this.path([[358,0],[390,0],[390,H],[358,H]],'#232a2e');
    c.save();this.path([[32,0],[358,0],[358,747],[32,747]]);c.clip();
    const steel=c.createLinearGradient(0,0,390,0);steel.addColorStop(0,'#414a52');steel.addColorStop(.3,'#6e7881');steel.addColorStop(.65,'#4f5963');steel.addColorStop(1,'#78818a');c.fillStyle=steel;c.fillRect(0,0,W,H);
    for(let i=-5;i<65;i++){const x=i*7;c.beginPath();c.moveTo(x,0);c.lineTo(x,760);c.lineWidth=3;c.strokeStyle='#29333cc4';c.stroke();c.beginPath();c.moveTo(x+2,0);c.lineTo(x+2,760);c.lineWidth=1;c.strokeStyle='#aeb6ba65';c.stroke();}
    for(let y=this.scroll-STEP_SPACING;y<1000;y+=STEP_SPACING){c.beginPath();c.moveTo(0,y);c.lineTo(390,y);c.strokeStyle='#1c252d';c.lineWidth=7;c.stroke();c.translate(0,4);c.strokeStyle='#8d989e';c.lineWidth=1;c.stroke();c.translate(0,-4);}
    const shade=c.createLinearGradient(0,0,0,760);shade.addColorStop(0,'#111a24b8');shade.addColorStop(.55,'#111a2410');shade.addColorStop(1,'#111a2400');c.fillStyle=shade;c.fillRect(0,0,W,H);c.restore();
    this.path([[26,0],[32,0],[32,726],[26,726]],'#b2a348');this.path([[358,0],[364,0],[364,726],[358,726]],'#b2a348');
    for(const x of [15,375]){c.strokeStyle='#b2bbc32c';c.lineWidth=2;c.beginPath();c.moveTo(x,0);c.lineTo(x,740);c.stroke();}
    const d=game.state==='title'?55:game.d;
    const ingestY=674;
    const x=W/2+(this.reduced?0:Math.sin(this.clock*11)*game.fatigue*6),y=ingestY-d;
    let scale=1;if(game.state==='dying'||game.state==='over')scale=Math.max(0,1-game.deathTime/.42);
    if(scale>0)this.roach(x,y+(1-scale)*25,game,scale);
    // Draw teeth over the character.
    c.save();c.translate(0,ingestY+17);
    const plate=c.createLinearGradient(0,-12,0,180);plate.addColorStop(0,'#f0d22b');plate.addColorStop(.12,'#ddbc12');plate.addColorStop(1,'#b39a19');
    c.fillStyle='#192027';c.fillRect(-35,-18,490,29);
    for(let x=-25;x<455;x+=7){this.path([[x,-17],[x+3,-17],[x+5,22],[x-1,22]],plate);c.strokeStyle='#ffe76080';c.lineWidth=.7;c.beginPath();c.moveTo(x+1,-14);c.lineTo(x+1,19);c.stroke();}
    c.fillStyle=plate;c.fillRect(-35,18,490,210);c.fillStyle='#ffe969';c.fillRect(-35,18,490,2);c.fillStyle='#6e610d';c.fillRect(-35,24,490,2);
    for(let row=42;row<155;row+=5){c.fillStyle=row%10?'#695c1924':'#fff19e22';c.fillRect(-35,row,490,1);}
    for(const x of [30,350]){this.ellipse(x,46,5,5,'#8b791e');this.ellipse(x-1,45,3,3,'#dace74');c.strokeStyle='#6f672c';c.beginPath();c.moveTo(x-2,43);c.lineTo(x+1,46);c.stroke();}
    c.save();c.beginPath();c.rect(-30,90,490,18);c.clip();c.fillStyle='#252d2c';c.fillRect(-30,90,490,18);for(let x=-40;x<500;x+=33)this.path([[x,90],[x+16,90],[x-2,108],[x-18,108]],'#c6ab25');c.restore();c.restore();
    if(game.state==='playing'&&game.d<100){const warning=c.createLinearGradient(0,400,0,745);warning.addColorStop(0,'#e6c20000');warning.addColorStop(1,`rgba(230,194,0,${.18*(1-Math.max(0,game.d)/100)})`);c.fillStyle=warning;c.fillRect(0,350,W,400);}
    if(game.state==='title'||game.state==='paused'||game.state==='over'){const scrim=c.createLinearGradient(0,100,0,590);scrim.addColorStop(0,'#16202810');scrim.addColorStop(.5,'#16202899');scrim.addColorStop(1,'#16202800');c.fillStyle=scrim;c.fillRect(0,100,W,500);}
    if(game.noticeLeft>0&&game.state==='playing'){c.font='bold 16px system-ui, sans-serif';c.textAlign='center';const width=c.measureText(game.notice).width;c.fillStyle='#172026ee';c.fillRect(x-width/2-10,y-77,width+20,32);c.fillStyle='#fff0a0';c.fillText(game.notice,x,y-55);}
    c.restore();
  }
  roach(x,y,game,scale){const c=this.ctx;const running=game.state==='title'||game.running;const danger=game.d<70&&game.state!=='title';const tired=game.state==='title'?0:game.fatigue;const phase=this.legPhase;c.save();c.translate(x,y);c.rotate(game.burstLeft>0?-.12:0);c.scale(scale,scale);this.ellipse(2,9,24,12,'#10151d65');c.translate(0,running?Math.sin(phase*2)*1.1:0);if(!this.reduced)c.scale(1+Math.sin(this.clock*8)*tired*.045,1-Math.sin(this.clock*8)*tired*.03);
    c.strokeStyle='#382315';c.lineWidth=4;c.lineCap='round';for(let side of [-1,1])for(let i=0;i<3;i++){const swing=Math.sin(phase+i*2+side)*7;c.beginPath();c.moveTo(side*11,-11+i*11);c.lineTo(side*(22+Math.cos(phase+i)*3),-10+i*10+swing);c.lineTo(side*27,-14+i*10+swing);c.stroke();}
    this.ellipse(0,1,15,24,'#44271c');this.ellipse(-1,-1,12,21,'#8a4a2a');this.ellipse(-4,-6,6,13,'#aa6640');c.strokeStyle='#63371f';c.lineWidth=1.5;c.beginPath();c.moveTo(1,-13);c.lineTo(2,18);c.stroke();this.ellipse(0,-19,12,10,'#754024');
    c.strokeStyle='#422a1d';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(side*6,-25);c.quadraticCurveTo(side*15,-35,side*12+Math.sin(phase)*2,-40);c.stroke();this.ellipse(side*5,-24,3.8,4.5,'#e4d9ac');this.ellipse(side*5,-26,1.8,2.2,'#192026');}
    const sweat=Math.max(danger?.35:0,Math.max(0,(tired-.08)/.92));
    if(sweat>0){for(let i=0;i<4;i++){const weight=Math.max(0,Math.min(1,sweat*5-i));if(!weight)continue;const fall=this.reduced?.4:(this.clock*(.8+tired)+i*.27)%1;const side=i%2?1:-1;const sx=side*(21+fall*13),sy=-31+fall*30;c.save();c.globalAlpha=weight*(1-fall)*.95;c.fillStyle='#b9eaf4';c.beginPath();c.moveTo(sx,sy-8);c.quadraticCurveTo(sx-6,sy+3,sx,sy+3);c.quadraticCurveTo(sx+6,sy+3,sx,sy-8);c.fill();c.restore();}}
    if(game.burstLeft>0){c.strokeStyle='#fff0a188';c.lineWidth=2;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*13,34);c.lineTo(i*16,55);c.stroke();}}c.restore();
  }
}
