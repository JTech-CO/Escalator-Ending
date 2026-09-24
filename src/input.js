export function bindInput(board, { press, tap, burst, pause, blur }) {
  const pointers=new Set();let space=false;let taps=[];
  const register=()=>{press();tap();const now=performance.now();taps=taps.filter(t=>now-t<=160);taps.push(now);if(taps.length>=3){burst();taps=[];}};
  const clear=()=>{pointers.clear();space=false;taps=[];};
  board.addEventListener('pointerdown',e=>{if(e.target.closest('.tools'))return;if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();board.focus({preventScroll:true});board.setPointerCapture(e.pointerId);pointers.add(e.pointerId);register();});
  const release=e=>pointers.delete(e.pointerId);
  board.addEventListener('pointerup',release);board.addEventListener('pointercancel',release);board.addEventListener('lostpointercapture',release);
  window.addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat){pause();return;}if(e.code!=='Space'||e.target.closest('button:not(#play),a'))return;e.preventDefault();if(!space&&!e.repeat){space=true;register();}});
  window.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;e.preventDefault();}});
  window.addEventListener('blur',()=>{clear();blur();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();blur();}});
  return { get held(){return space||pointers.size>0;}, clear };
}
