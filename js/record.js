(()=>{
  const startBtn = document.getElementById('startBtn');
  const breathBtn = document.getElementById('breathBtn');
  const breathBtnLabel = document.getElementById('breathBtnLabel');
  const pressState = document.getElementById('pressState');
  const cycleCountEl = document.getElementById('cycleCount');
  const elapsedEl = document.getElementById('elapsed');
  const bpmPreviewEl = document.getElementById('bpmPreview');
  const countdownEl = document.getElementById('countdown');

  const resultEl = document.getElementById('result');
  const finalBpmEl = document.getElementById('finalBpm');
  const finalAvgEl = document.getElementById('finalAvg');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const saveMsg = document.getElementById('saveMsg');

  const WINDOW_SEC = 20;
  let state = 'idle';
  let startTime = null;
  let timerId = null;
  let elapsedTimer = null;

  let cycles = []; // array of {down:number, up:number, dur:number(ms)}
  let downAt = null;

  function setPressState(s){ pressState.textContent = s; }

  function resetAll(){
    state='idle'; startTime=null;
    if(timerId){ clearTimeout(timerId); timerId=null; }
    if(elapsedTimer){ clearInterval(elapsedTimer); elapsedTimer=null; }
    cycles=[]; downAt=null;
    cycleCountEl.textContent='0';
    elapsedEl.textContent='0.0s';
    bpmPreviewEl.textContent='0';
    countdownEl.textContent='Ready';
    resultEl.classList.add('hidden');
    breathBtn.disabled = true;
    breathBtn.classList.remove('active');
    breathBtnLabel.textContent = 'Press & Hold = Inhale';
    setPressState('idle');
    saveMsg.textContent='';
  }

  function previewBpm(){
    const bpm = Math.round((cycles.length) * 3);
    bpmPreviewEl.textContent = String(bpm);
  }

  function startCountdown(cb){
    let c = 3;
    countdownEl.textContent = c;
    const id = setInterval(()=>{
      c--;
      if(c>0){ countdownEl.textContent = c; }
      else{
        clearInterval(id);
        countdownEl.textContent = 'GO';
        cb();
      }
    }, 1000);
  }

  function startWindow(){
    state='running';
    startTime = performance.now();
    breathBtn.disabled = false;
    setPressState('ready');

    elapsedTimer = setInterval(()=>{
      const t = (performance.now()-startTime)/1000;
      elapsedEl.textContent = t.toFixed(1)+'s';
    }, 100);

    timerId = setTimeout(()=>{
      finishWindow();
    }, WINDOW_SEC*1000);
  }

  function finishWindow(){
    state='done';
    breathBtn.disabled = true;
    if(elapsedTimer){ clearInterval(elapsedTimer); elapsedTimer=null; }
    if(timerId){ clearTimeout(timerId); timerId=null; }
    countdownEl.textContent = 'Done';

    // compute final stats
    const bpm = Math.round(cycles.length * 3);
    const avgMs = cycles.length ? (cycles.reduce((a,c)=>a+c.dur,0) / cycles.length) : 0;
    const avgSec = avgMs/1000;

    finalBpmEl.textContent = String(bpm);
    finalAvgEl.textContent = avgSec.toFixed(2);
    resultEl.classList.remove('hidden');

    // attach payload for save
    resultEl.dataset.payload = JSON.stringify({
      bpm,
      avgBreathSec: Number(avgSec.toFixed(3)),
      sampleCount: cycles.length,
      rawCycles: cycles
    });
  }

  function handleDown(){
    if(state!=='running') return;
    if(downAt!==null) return; // already down
    downAt = performance.now();
    breathBtn.classList.add('active');
    breathBtnLabel.textContent = 'Holding = Inhale';
    setPressState('holding');
  }
  function handleUp(){
    if(state!=='running') return;
    if(downAt===null) return;
    const upAt = performance.now();
    const dur = upAt - downAt;
    cycles.push({down:downAt, up:upAt, dur});
    downAt = null;
    breathBtn.classList.remove('active');
    breathBtnLabel.textContent = 'Press & Hold = Inhale';
    setPressState('released');
    cycleCountEl.textContent = String(cycles.length);
    previewBpm();
  }

  // pointer + mouse + touch
  breathBtn.addEventListener('pointerdown', e=>{ e.preventDefault(); handleDown(); });
  breathBtn.addEventListener('pointerup',   e=>{ e.preventDefault(); handleUp(); });
  breathBtn.addEventListener('pointercancel', e=>{ e.preventDefault(); handleUp(); });

  startBtn.addEventListener('click', ()=>{
    resetAll();
    startCountdown(startWindow);
  });

  resetBtn.addEventListener('click', ()=> resetAll());

  saveBtn.addEventListener('click', async ()=>{
    try{
      const payload = JSON.parse(resultEl.dataset.payload || "{}");
      if(!payload || !('bpm' in payload)){ saveMsg.textContent='No result.'; return; }
      saveBtn.disabled = true;
      saveMsg.textContent = 'Saving...';
      const res = await apiPostSample(payload);
      saveMsg.textContent = res?.status === 'ok' ? 'Saved!' : 'Failed.';
    }catch(err){
      console.error(err);
      saveMsg.textContent = 'Error saving.';
    }finally{
      saveBtn.disabled = false;
    }
  });

  // init
  resetAll();
})();