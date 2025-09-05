(() => {
  const rowsTbody = document.getElementById('rows');
  const chartCanvas = document.getElementById('trendChart');

  function fmtDateMMDDYY(dstr) {
    if (/^\d{2}-\d{2}-\d{2}$/.test(dstr)) return dstr;
    const d = new Date(dstr);
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}-${dd}-${yy}`;
  }

  async function fetchData() {
    const url = APPS_SCRIPT_URL + '?last=30';
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) throw new Error('Backend error');
    return data.rows || [];
  }

  function renderTable(rows) {
    rowsTbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fmtDateMMDDYY(r.date)}</td>
                      <td>${r.bpm}</td>
                      <td>${Number(r.avgBreathSec).toFixed(2)}</td>`;
      rowsTbody.appendChild(tr);
    });
  }

  function renderChart(rows) {
    const labels = rows.map(r => fmtDateMMDDYY(r.date));
    const bpm = rows.map(r => r.bpm);
    const avg = rows.map(r => r.avgBreathSec);

    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'BPM', data: bpm },
          { label: 'Avg Breath (s)', data: avg }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  (async () => {
    try {
      const rows = await fetchData();
      renderTable(rows);
      renderChart(rows);
    } catch (e) {
      console.error(e);
      rowsTbody.innerHTML = '<tr><td colspan="3">Failed to load. Check APPS_SCRIPT_URL.</td></tr>';
    }
  })();
})();
