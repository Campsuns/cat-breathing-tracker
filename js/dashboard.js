(async ()=>{
  const tbody = document.getElementById('rows');
  const ctx = document.getElementById('trendChart').getContext('2d');

  try{
    const data = await apiGetLatest(30);
    const rows = data?.rows || [];

    // table
    tbody.innerHTML = rows.map(r=>{
      const date = fmtMMDDYY(r.Date);
      const bpm = r.BPM;
      const avg = r.AvgBreathSec;
      return `<tr><td>${date}</td><td>${bpm}</td><td>${avg.toFixed(2)}</td></tr>`;
    }).join('');

    // chart
    const labels = rows.map(r=>fmtMMDDYY(r.Date));
    const bpmData = rows.map(r=>r.BPM);
    const avgData = rows.map(r=>r.AvgBreathSec);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'BPM', data: bpmData, tension: 0.25 },
          { label: 'Avg Breath (sec)', data: avgData, tension: 0.25 }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="3">Failed to load data</td></tr>`;
  }
})();