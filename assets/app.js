(() => {
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

  let cycles = []; // each: {start:number, end:number, dur:number}
  let currentPressStart = null;

  function setState(s) {
    state = s;
    pressState.textContent = s[0].toUpperCase() + s.slice(1);
  }

  function fmt(num, dp=1) {
    return Number(num).toFixed(dp);
  }

  function enableBreathBtn(enable) {
    breathBtn.disabled = !enable;
  }

  function startCountdownThenRun() {
    let countdown = 3;
    countdownEl.textContent = '3';
    setState('countdown');
    enableBreathBtn(false);
    startBtn.disabled = true;

    const cd = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        countdownEl.textContent = String(countdown);
      } else {
        clearInterval(cd);
        runWindow();
      }
    }, 1000);
  }

  function runWindow() {
    setState('running');
    countdownEl.textContent = 'Go!';
    enableBreathBtn(true);
    breathBtn.classList.remove('holding');
    breathBtnLabel.textContent = 'Hold = Inhale';

    cycles = [];
    currentPressStart = null;
    startTime = performance.now();

    elapsedTimer = setInterval(() => {
      const elapsedMs = performance.now() - startTime;
      elapsedEl.textContent = fmt(elapsedMs/1000, 1) + 's';
      const projectedBpm = (cycles.length * 60) / (Math.max(elapsedMs/1000, 1));
      bpmPreviewEl.textContent = Math.round(projectedBpm);
    }, 100);

    timerId = setTimeout(finishWindow, WINDOW_SEC * 1000);
  }

  function finishWindow() {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
    enableBreathBtn(false);
    setState('done');
    countdownEl.textContent = 'Done';

    // If user is currently holding when time ends, close that cycle at the boundary.
    if (currentPressStart !== null) {
      const end = performance.now();
      const dur = Math.max(0, (end - currentPressStart) / 1000);
      cycles.push({start: currentPressStart, end, dur});
      currentPressStart = null;
    }

    const bpm = cycles.length * 3; // 20s window -> ×3 to get per minute
    const avg = cycles.length ? (cycles.reduce((a,c) => a + c.dur, 0) / cycles.length) : 0;

    finalBpmEl.textContent = String(bpm);
    finalAvgEl.textContent = fmt(avg, 2);
    resultEl.classList.remove('hidden');
  }

  function resetAll() {
    clearInterval(elapsedTimer);
    clearTimeout(timerId);
    elapsedTimer = null; timerId = null;
    enableBreathBtn(false);
    startBtn.disabled = false;
    setState('idle');
    countdownEl.textContent = 'Ready';
    cycles = [];
    currentPressStart = null;
    cycleCountEl.textContent = '0';
    elapsedEl.textContent = '0.0s';
    bpmPreviewEl.textContent = '0';
    resultEl.classList.add('hidden');
    saveMsg.textContent = '';
  }

  // Press/hold detection (mouse + touch)
  function onPressStart(e) {
    if (state !== 'running') return;
    e.preventDefault();
    if (currentPressStart === null) {
      currentPressStart = performance.now();
      breathBtn.classList.add('holding');
      breathBtnLabel.textContent = 'Release = Exhale';
      setState('inhale (holding)');
    }
  }

  function onPressEnd(e) {
    if (state !== 'running') return;
    e.preventDefault();
    if (currentPressStart !== null) {
      const end = performance.now();
      const dur = Math.max(0, (end - currentPressStart) / 1000);
      cycles.push({start: currentPressStart, end, dur});
      currentPressStart = null;
      breathBtn.classList.remove('holding');
      breathBtnLabel.textContent = 'Hold = Inhale';
      setState('exhale (released)');
      cycleCountEl.textContent = String(cycles.length);
    }
  }

  // Attach handlers
  breathBtn.addEventListener('mousedown', onPressStart);
  breathBtn.addEventListener('mouseup', onPressEnd);
  breathBtn.addEventListener('mouseleave', onPressEnd);
  breathBtn.addEventListener('touchstart', onPressStart, {passive:false});
  breathBtn.addEventListener('touchend', onPressEnd, {passive:false});
  breathBtn.addEventListener('touchcancel', onPressEnd, {passive:false});

  startBtn.addEventListener('click', startCountdownThenRun);

  saveBtn.addEventListener('click', async () => {
    saveMsg.textContent = 'Saving...';
    const bpm = Number(finalBpmEl.textContent);
    const avg = Number(finalAvgEl.textContent);
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          bpm,
          avgBreathSec: avg,
          windowSec: 20,
          cycles: cycles.map(c => Number(c.dur.toFixed(3)))
        })
      });
      const data = await res.json();
      if (data && data.ok) {
        saveMsg.textContent = 'Saved ✅';
      } else {
        saveMsg.textContent = 'Save failed';
      }
    } catch (e) {
      console.error(e);
      saveMsg.textContent = 'Save error (check URL & deployment)';
    }
  });

  resetBtn.addEventListener('click', resetAll);
})();
