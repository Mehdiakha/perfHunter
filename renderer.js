const HISTORY_LENGTH = 60;

let stats = {};
let history = { cpu: [], memory: [], disk: [], network: [], networkTx: [] };
let currentView = 'dashboard';
let charts = {};
let pendingUpdate = false;

function init() {
  setupNavigation();
  setupWindowControls();
  initCharts();
  
  window.electronAPI.onStats((data) => {
    stats = data;
    if (!pendingUpdate) {
      pendingUpdate = true;
      requestAnimationFrame(updateUI);
    }
  });
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const view = card.dataset.view;
      switchView(view);
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === view);
      });
    });
  });
}

function setupWindowControls() {
  document.getElementById('minimize').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
  });

  document.getElementById('maximize').addEventListener('click', async () => {
    window.electronAPI.maximizeWindow();
    updateMaxIcon(await window.electronAPI.isMaximized());
  });

  document.getElementById('close').addEventListener('click', () => {
    window.electronAPI.closeWindow();
  });
}

function updateMaxIcon(isMaximized) {
  const icon = document.getElementById('max-icon');
  icon.innerHTML = isMaximized 
    ? '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>'
    : '<rect x="4" y="4" width="16" height="16" rx="2"/>';
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`${view}-view`).classList.remove('hidden');
}

function initCharts() {
  charts.cpuSparkline = createSparkline('cpu-sparkline', '#f0883e');
  charts.memorySparkline = createSparkline('memory-sparkline', '#58a6ff');
  charts.diskSparkline = createSparkline('disk-sparkline', '#bc8cff');
  charts.networkSparkline = createSparkline('network-sparkline', '#3fb950');

  charts.cpuChart = createChart('cpu-chart', '#f0883e');
  charts.memoryChart = createChart('memory-chart', '#58a6ff');
  charts.diskChart = createChart('disk-chart', '#bc8cff');
  charts.networkChart = createChart('network-chart', '#3fb950', true);
}

function createSparkline(canvasId, color) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  let width, height;
  
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  resize();
  canvas.parentElement.addEventListener('resize', resize);
  
  return {
    draw(data) {
      if (data.length < 2) return;
      ctx.clearRect(0, 0, width, height);
      
      const max = Math.max(...data, 1);
      const stepX = width / (data.length - 1);
      const stepY = (height - 4) / max;
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      data.forEach((val, i) => {
        const x = i * stepX;
        const y = height - 2 - val * stepY;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color + '00');
      
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  };
}

function createChart(canvasId, color, dual = false) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  let width, height;
  
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  resize();
  
  return {
    ctx,
    canvas,
    color,
    dual,
    draw(data, data2) {
      ctx.clearRect(0, 0, width, height);
      
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      if (data.length < 2) return;
      
      const max = Math.max(...data, 1);
      const stepX = width / (data.length - 1);
      const stepY = (height - 20) / max;
      
      drawLine(data, this.color, stepX, stepY, max);
      
      if (dual && data2 && data2.length > 0) {
        const max2 = Math.max(...data2, 1);
        const stepY2 = (height - 20) / max2;
        drawLine(data2, '#f85149', stepX, stepY2, max2);
      }
      
      function drawLine(d, c, sx, sy, m) {
        ctx.beginPath();
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        d.forEach((val, i) => {
          const x = i * sx;
          const y = height - 10 - val * sy;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, c + '30');
        grad.addColorStop(1, c + '00');
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }
  };
}

function updateUI() {
  pendingUpdate = false;
  updateHistory();
  updateDashboard();
  updateCurrentView();
}

function updateHistory() {
  history.cpu.push(stats.cpu?.load || 0);
  const memTotal = parseFloat(stats.memory?.total) || 1;
  history.memory.push(((parseFloat(stats.memory?.used) || 0) / memTotal) * 100);
  
  const primaryDisk = stats.disk?.find(d => d.mount === 'C:') || stats.disk?.[0];
  history.disk.push(primaryDisk?.usePercent || 0);
  
  history.network.push(Math.min(parseFloat(stats.network?.rx) || 0, 100));
  history.networkTx.push(Math.min(parseFloat(stats.network?.tx) || 0, 100));
  
  if (history.cpu.length > HISTORY_LENGTH) history.cpu.shift();
  if (history.memory.length > HISTORY_LENGTH) history.memory.shift();
  if (history.disk.length > HISTORY_LENGTH) history.disk.shift();
  if (history.network.length > HISTORY_LENGTH) history.network.shift();
  if (history.networkTx.length > HISTORY_LENGTH) history.networkTx.shift();
}

function updateDashboard() {
  document.getElementById('cpu-badge').textContent = `${stats.cpu?.load || 0}%`;
  document.getElementById('cpu-freq').textContent = `${(stats.cpu?.freq || 0).toFixed(2)} GHz`;
  
  const tempEl = document.getElementById('cpu-temp');
  tempEl.textContent = stats.cpu?.temp ? `${stats.cpu.temp}°C` : '';
  tempEl.className = stats.cpu?.temp ? 'temp' : '';
  
  charts.cpuSparkline.draw(history.cpu);
  
  const memPercent = stats.memory ? Math.round((parseFloat(stats.memory.used) / parseFloat(stats.memory.total)) * 100) : 0;
  document.getElementById('memory-badge').textContent = `${memPercent}%`;
  document.getElementById('memory-used').textContent = `${stats.memory?.used || 0} / ${stats.memory?.total || 0} GB`;
  
  charts.memorySparkline.draw(history.memory);
  
  if (primaryDisk = stats.disk?.find(d => d.mount === 'C:') || stats.disk?.[0]) {
    document.getElementById('disk-badge').textContent = `${primaryDisk.usePercent}%`;
    document.getElementById('disk-used').textContent = `${primaryDisk.used} / ${primaryDisk.total} GB`;
  }
  
  charts.diskSparkline.draw(history.disk);
  
  const netRx = parseFloat(stats.network?.rx) || 0;
  const netSpeed = netRx > 1024 ? `${(netRx / 1024).toFixed(1)} MB/s` : `${netRx} KB/s`;
  document.getElementById('network-badge').textContent = netSpeed;
  document.getElementById('network-total').textContent = `${stats.network?.totalRx || 0} / ${stats.network?.totalTx || 0} GB`;
  
  charts.networkSparkline.draw(history.network);
  
  if (stats.system) {
    document.getElementById('hostname').textContent = stats.system.hostname || '-';
    document.getElementById('os-info').textContent = `${stats.system.platform || ''} ${stats.system.arch || ''}`;
    document.getElementById('uptime').textContent = formatUptime(stats.system.uptime || 0);
  }
}

function updateCurrentView() {
  switch (currentView) {
    case 'cpu': updateCpuView(); break;
    case 'memory': updateMemoryView(); break;
    case 'disk': updateDiskView(); break;
    case 'network': updateNetworkView(); break;
    case 'processes': updateProcessesView(); break;
  }
}

function updateCpuView() {
  document.getElementById('cpu-detail-value').textContent = `${stats.cpu?.load || 0}%`;
  document.getElementById('cpu-freq-detail').textContent = `${(stats.cpu?.freq || 0).toFixed(2)} GHz`;
  document.getElementById('cpu-temp-detail').textContent = stats.cpu?.temp ? `${stats.cpu.temp}°C` : '-';
  document.getElementById('cpu-cores-count').textContent = stats.cpu?.cores?.length || 0;
  
  charts.cpuChart.draw(history.cpu);
  
  const coresGrid = document.getElementById('cores-grid');
  const cores = stats.cpu?.cores || [];
  
  if (coresGrid.children.length !== cores.length) {
    coresGrid.innerHTML = cores.map((load, i) => `
      <div class="core-item">
        <div class="core-label">Core ${i}</div>
        <div class="core-bar"><div class="core-bar-fill" style="width:${load}%"></div></div>
        <div class="core-value">${load}%</div>
      </div>
    `).join('');
  } else {
    cores.forEach((load, i) => {
      const core = coresGrid.children[i];
      if (core) {
        core.querySelector('.core-bar-fill').style.width = `${load}%`;
        core.querySelector('.core-value').textContent = `${load}%`;
      }
    });
  }
}

function updateMemoryView() {
  const memPercent = stats.memory ? Math.round((parseFloat(stats.memory.used) / parseFloat(stats.memory.total)) * 100) : 0;
  document.getElementById('memory-detail-value').textContent = `${memPercent}%`;
  
  charts.memoryChart.draw(history.memory);
  
  const total = parseFloat(stats.memory?.total) || 1;
  document.getElementById('mem-bar-used').style.width = `${(parseFloat(stats.memory?.used) / total) * 100}%`;
  document.getElementById('mem-bar-cached').style.width = `${(parseFloat(stats.memory?.cached) / total) * 100}%`;
  document.getElementById('mem-bar-available').style.width = `${(parseFloat(stats.memory?.available) / total) * 100}%`;
  
  document.getElementById('mem-used-value').textContent = `${stats.memory?.used || 0} GB`;
  document.getElementById('mem-cached-value').textContent = `${stats.memory?.cached || 0} GB`;
  document.getElementById('mem-avail-value').textContent = `${stats.memory?.available || 0} GB`;
}

function updateDiskView() {
  const primaryDisk = stats.disk?.find(d => d.mount === 'C:') || stats.disk?.[0];
  if (primaryDisk) {
    document.getElementById('disk-detail-value').textContent = `${primaryDisk.usePercent}%`;
  }
  
  charts.diskChart.draw(history.disk);
  
  document.getElementById('disk-list').innerHTML = (stats.disk || []).map(d => `
    <div class="disk-item">
      <div class="disk-item-header">
        <span class="disk-mount">${d.mount}</span>
        <span class="disk-percent">${d.usePercent}%</span>
      </div>
      <div class="disk-item-footer">
        <span>${d.used} GB used</span>
        <span>${d.total} GB total</span>
      </div>
      <div class="disk-progress">
        <div class="disk-progress-fill" style="width:${d.usePercent}%"></div>
      </div>
    </div>
  `).join('');
}

function updateNetworkView() {
  const rxSpeed = parseFloat(stats.network?.rx) || 0;
  const txSpeed = parseFloat(stats.network?.tx) || 0;
  
  document.getElementById('net-down-speed').textContent = rxSpeed > 1024 
    ? `${(rxSpeed / 1024).toFixed(2)} MB/s` : `${rxSpeed} KB/s`;
  document.getElementById('net-up-speed').textContent = txSpeed > 1024 
    ? `${(txSpeed / 1024).toFixed(2)} MB/s` : `${txSpeed} KB/s`;
  
  document.getElementById('net-total-rx').textContent = `${stats.network?.totalRx || 0} GB`;
  document.getElementById('net-total-tx').textContent = `${stats.network?.totalTx || 0} GB`;
  
  charts.networkChart.draw(history.network, history.networkTx);
}

function updateProcessesView() {
  const rankClasses = ['gold', 'silver', 'bronze', '', ''];
  document.getElementById('processes-list').innerHTML = (stats.topProcesses || []).map((p, i) => `
    <div class="process-item">
      <div class="process-rank ${rankClasses[i]}">${i + 1}</div>
      <div class="process-info">
        <div class="process-name">${p.name}</div>
      </div>
      <div class="process-stats">
        <div class="process-stat">
          <div class="process-stat-label">CPU</div>
          <div class="process-stat-value">${p.cpu}%</div>
        </div>
        <div class="process-stat">
          <div class="process-stat-label">MEM</div>
          <div class="process-stat-value">${p.mem} GB</div>
        </div>
      </div>
    </div>
  `).join('');
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

document.addEventListener('DOMContentLoaded', init);
