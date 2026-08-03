// ──────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────
let currentMode = 'wend'; // 'wend' | 'sudoku'
let gridSize = 5;
let sudokuSize = 6;
let blocked = new Set();  // "r,c" keys
let hWalls = new Set();   // "r,c" keys (wall UNDER cell)
let vWalls = new Set();   // "r,c" keys (wall RIGHT OF cell)

function getCell(r, c) {
  return document.getElementById(`c${r}_${c}`);
}

function rebuildGrid() {
  gridSize = parseInt(document.getElementById('gridSizeSelect').value);
  blocked = new Set();
  hWalls = new Set();
  vWalls = new Set();
  renderGrid();
}

function renderGrid() {
  const el = document.getElementById('gridEl');
  el.innerHTML = '';
  // Using CSS grid directly on the container
  el.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  el.style.display = 'grid';
  el.style.gap = gridSize > 7 ? '3px' : '5px';

  // Handle clicking on gaps between cells to toggle walls
  el.onclick = (e) => {
    if (e.target === el) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cellW = rect.width / gridSize;
      const cellH = rect.height / gridSize;
      const c = Math.floor(x / cellW);
      const r = Math.floor(y / cellH);
      
      const dx = Math.abs(x - (c * cellW + cellW));
      const dy = Math.abs(y - (r * cellH + cellH));
      
      if (dy < dx) {
        if (r < gridSize - 1) {
          const k = `${r},${c}`;
          const cell = getCell(r, c);
          if (hWalls.has(k)) {
            hWalls.delete(k);
            cell.style.borderBottom = '';
          } else {
            hWalls.add(k);
            cell.style.borderBottom = '4px solid #f87171';
          }
        }
      } else {
        if (c < gridSize - 1) {
          const k = `${r},${c}`;
          const cell = getCell(r, c);
          if (vWalls.has(k)) {
            vWalls.delete(k);
            cell.style.borderRight = '';
          } else {
            vWalls.add(k);
            cell.style.borderRight = '4px solid #f87171';
          }
        }
      }
    }
  };

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 2; // For up to "99" in Zip
      input.className = 'cell';
      input.id = `c${r}_${c}`;
      input.autocomplete = 'off';
      input.autocorrect = 'off';
      input.autocapitalize = 'characters';
      input.spellcheck = false;

      // Typing handler
      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
          input.value = '';
          e.preventDefault();
          return;
        }
        if (e.key === 'ArrowRight') { advanceFocus(r, c, 0, 1);  e.preventDefault(); return; }
        if (e.key === 'ArrowLeft')  { advanceFocus(r, c, 0, -1); e.preventDefault(); return; }
        if (e.key === 'ArrowDown')  { advanceFocus(r, c, 1, 0);  e.preventDefault(); return; }
        if (e.key === 'ArrowUp')    { advanceFocus(r, c, -1, 0); e.preventDefault(); return; }
        if (e.key === 'Tab')        { advanceFocus(r, c, 0, e.shiftKey ? -1 : 1); e.preventDefault(); return; }

        if (currentMode === 'zip') {
          if (e.key === 'Enter') { solveZip(); e.preventDefault(); return; }
          // Let standard typing happen for numbers, don't auto-advance
          if (/^[0-9]$/.test(e.key)) return;
        } else {
          if (e.key === 'Enter') { solveGrid(); e.preventDefault(); return; }
          if (/^[a-zA-Z]$/.test(e.key)) {
            input.value = e.key.toUpperCase();
            e.preventDefault();
            // Auto-advance right, then wrap to next row
            if (c + 1 < gridSize) advanceFocus(r, c, 0, 1);
            else if (r + 1 < gridSize) focusCell(r + 1, 0);
            return;
          }
        }
        e.preventDefault();
      });

      // Keep only 1 uppercase letter for Wend, or digits for Zip
      input.addEventListener('input', () => {
        if (currentMode === 'zip') {
          input.value = input.value.replace(/[^0-9]/g, '');
        } else {
          const v = input.value.replace(/[^a-zA-Z]/g, '');
          input.value = v ? v[v.length - 1].toUpperCase() : '';
        }
      });

      // Double-click = toggle blocked
      input.addEventListener('dblclick', () => {
        toggleBlocked(r, c);
      });

      // Click on blocked cell to unblock
      input.addEventListener('click', () => {
        if (blocked.has(`${r},${c}`)) toggleBlocked(r, c);
      });

      el.appendChild(input);
    }
  }
}

function advanceFocus(r, c, dr, dc) {
  let nr = r + dr;
  let nc = c + dc;
  // Skip blocked cells
  while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
    if (!blocked.has(`${nr},${nc}`)) { focusCell(nr, nc); return; }
    nr += dr; nc += dc;
  }
}

function focusCell(r, c) {
  const el = getCell(r, c);
  if (el) { el.focus(); el.select(); }
}

function toggleBlocked(r, c) {
  const k = `${r},${c}`;
  const el = getCell(r, c);
  if (!el) return;
  if (blocked.has(k)) {
    blocked.delete(k);
    el.classList.remove('blocked');
    el.disabled = false;
    el.value = '';
    el.focus();
  } else {
    blocked.add(k);
    el.classList.add('blocked');
    el.disabled = true;
    el.value = '';
    el.blur();
  }
}

function clearGridColors() {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const el = getCell(r, c);
      if (el) el.className = el.className.replace(/color-\d+/g, '').trim();
    }
  }
  const svg = document.getElementById('pathOverlay');
  if (svg) svg.innerHTML = '';
}

function drawSvgPath(pathsData) {
  const svg = document.getElementById('pathOverlay');
  if (!svg) return;
  svg.innerHTML = '';
  if (!pathsData || !pathsData.length) return;
  
  const colors = ['#7c3aed', '#10b981', '#f59e0b', '#f87171', '#38bdf8', '#f43f5e'];
  
  pathsData.forEach((pathCells, wi) => {
    if (!pathCells || pathCells.length < 2) return;
    const color = colors[wi % colors.length];
    
    let d = '';
    const points = [];
    pathCells.forEach(([r, c]) => {
      const el = getCell(r, c);
      if (!el) return;
      const x = el.offsetLeft + el.offsetWidth / 2;
      const y = el.offsetTop + el.offsetHeight / 2;
      points.push({x, y});
    });
    
    if (points.length < 2) return;

    points.forEach((p, idx) => {
      d += (idx === 0 ? 'M' : 'L') + ` ${p.x} ${p.y} `;
    });
    
    // Background thick line (glow)
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glow.setAttribute("d", d.trim());
    glow.setAttribute("stroke", "rgba(18, 18, 42, 0.8)");
    glow.setAttribute("stroke-width", "10");
    glow.setAttribute("fill", "none");
    glow.setAttribute("stroke-linecap", "round");
    glow.setAttribute("stroke-linejoin", "round");
    svg.appendChild(glow);

    // Main colored line
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d.trim());
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "4");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    
    // Draw directional arrows on each segment
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      
      const arrowGlow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      arrowGlow.setAttribute("points", "-6,-6 6,0 -6,6");
      arrowGlow.setAttribute("fill", "rgba(18, 18, 42, 0.8)");
      arrowGlow.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle}) scale(1.4)`);
      svg.appendChild(arrowGlow);

      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      arrow.setAttribute("points", "-6,-6 6,0 -6,6");
      arrow.setAttribute("fill", color);
      arrow.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`);
      svg.appendChild(arrow);
    }
    
    // Starting dot (filled circle)
    const pStart = points[0];
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pStart.x);
    circle.setAttribute("cy", pStart.y);
    circle.setAttribute("r", "6");
    circle.setAttribute("fill", color);
    circle.setAttribute("stroke", "#fff");
    circle.setAttribute("stroke-width", "2.5");
    svg.appendChild(circle);

    // Ending dot (white square)
    const pEnd = points[points.length - 1];
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", pEnd.x - 5);
    rect.setAttribute("y", pEnd.y - 5);
    rect.setAttribute("width", "10");
    rect.setAttribute("height", "10");
    rect.setAttribute("fill", "#fff");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", "2.5");
    svg.appendChild(rect);
  });
}

function clearGrid() {
  blocked = new Set();
  hWalls = new Set();
  vWalls = new Set();
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const el = getCell(r, c);
      if (el) {
        el.value = '';
        el.classList.remove('blocked');
        el.disabled = false;
        el.style.borderBottom = '';
        el.style.borderRight = '';
      }
    }
  }
  clearGridColors();
  clearStatus();
  hideResults();
}

// ──────────────────────────────────────────────────────────
// SOLVE FROM GRID
// ──────────────────────────────────────────────────────────
function solveGrid() {
  const grid = [];
  let hasLetter = false;
  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      if (blocked.has(`${r},${c}`)) {
        row.push('#');
      } else {
        const v = (getCell(r, c)?.value || '').trim().toUpperCase();
        if (/^[A-Z]$/.test(v)) { row.push(v); hasLetter = true; }
        else row.push('?');
      }
    }
    grid.push(row);
  }
  if (!hasLetter) {
    setStatus('Enter letters in the grid above, then press Solve!', 'error');
    return;
  }
  sendSolve(grid);
}

// ──────────────────────────────────────────────────────────
// SEND TO BACKGROUND SOLVER
// ──────────────────────────────────────────────────────────
function sendSolve(grid) {
  clearGridColors();
  setStatus('Solving...', 'loading');
  hideResults();
  chrome.runtime.sendMessage({ action: 'solvePuzzle', grid }, response => {
    if (chrome.runtime.lastError) {
      setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    if (response?.success && response.results?.length > 0) {
      showResults(response.results);
    } else {
      setStatus('No words found. Double-check the grid letters.', 'error');
    }
  });
}

// ──────────────────────────────────────────────────────────
// RESULTS DISPLAY
// ──────────────────────────────────────────────────────────
function showResults(results) {
  clearStatus();
  const panel = document.getElementById('resultsPanel');
  const scroll = document.getElementById('resultsScroll');
  scroll.innerHTML = '';
  panel.style.display = 'block';
  document.getElementById('resultsCount').textContent = `${results.length} words`;

  // Group by length
  const groups = {};
  results.forEach(r => {
    const len = r.word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(r);
  });

  Object.keys(groups).map(Number).sort((a, b) => b - a).forEach(len => {
    const g = document.createElement('div');
    g.className = 'length-group';
    const lbl = document.createElement('div');
    lbl.className = 'length-label';
    lbl.textContent = `${len}-letter words`;
    g.appendChild(lbl);
    const wrap = document.createElement('div');
    wrap.className = 'words-wrap';
    groups[len].forEach(r => {
      const chip = document.createElement('span');
      chip.className = 'word-chip';
      chip.textContent = r.word.toUpperCase();
      chip.title = 'Click to copy';
      chip.addEventListener('click', () => copyWord(r.word));
      
      // Hover to highlight path
      chip.addEventListener('mouseenter', () => {
        clearGridColors();
        r.path.forEach(([pr, pc]) => {
          const el = getCell(pr, pc);
          if (el) el.classList.add('color-0');
        });
        drawSvgPath([r.path]);
      });
      chip.addEventListener('mouseleave', clearGridColors);

      wrap.appendChild(chip);
    });
    g.appendChild(wrap);
    scroll.appendChild(g);
  });
}

function hideResults() {
  document.getElementById('resultsPanel').style.display = 'none';
}

function copyWord(word) {
  navigator.clipboard.writeText(word.toUpperCase()).then(() => {
    const t = document.getElementById('toast');
    t.textContent = `"${word.toUpperCase()}" copied!`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1600);
  });
}

// ──────────────────────────────────────────────────────────
// STATUS HELPERS
// ──────────────────────────────────────────────────────────
function setStatus(msg, type) {
  const bar = document.getElementById('statusBar');
  if (type === 'loading') {
    bar.innerHTML = `<div class="spinner"></div><span>${msg}</span>`;
    bar.className = 'loading';
    bar.style.display = 'flex';
  } else {
    bar.textContent = msg;
    bar.className = type;
    bar.style.display = 'block';
  }
}
function clearStatus() {
  const bar = document.getElementById('statusBar');
  bar.style.display = 'none';
  bar.className = '';
}

// ──────────────────────────────────────────────────────────
// OCR PRE-WARM
// ──────────────────────────────────────────────────────────
let tesseractWorker = null;
let workerReady = false;

async function initWorker() {
  try {
    if (typeof Tesseract === 'undefined') await sleep(600);
    tesseractWorker = await Tesseract.createWorker('eng', 1, {
      workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
      corePath: chrome.runtime.getURL('tesseract/tesseract-core.wasm.js'),
      langPath: chrome.runtime.getURL('tesseract'),
      workerBlobURL: false,
    });
    await tesseractWorker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
      tessedit_pageseg_mode: '6',
    });
    workerReady = true;
    const pill = document.getElementById('readyPill');
    pill.textContent = 'Ready';
    pill.classList.add('ready');
  } catch (e) {
    document.getElementById('readyPill').textContent = 'No OCR';
    console.warn('Tesseract init failed:', e);
  }
}

// ──────────────────────────────────────────────────────────
// CANVAS PIXEL HELPERS
// ──────────────────────────────────────────────────────────

// Load dataUrl into canvas and return pixel data
function loadImagePixels(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height);
      resolve({ px: d.data, w: img.width, h: img.height });
    };
    img.src = dataUrl;
  });
}

// Average RGB brightness in a square patch around (cx, cy)
function sampleBrightness(pxData, cx, cy, radius) {
  const { px, w, h } = pxData;
  const r = Math.max(2, Math.floor(radius));
  let sum = 0, n = 0;
  for (let dy = -r; dy <= r; dy += 2) {
    for (let dx = -r; dx <= r; dx += 2) {
      const x = Math.round(cx + dx), y = Math.round(cy + dy);
      if (x >= 0 && x < w && y >= 0 && y < h) {
        const i = (y * w + x) * 4;
        sum += (px[i] + px[i + 1] + px[i + 2]) / 3;
        n++;
      }
    }
  }
  return n > 0 ? sum / n : 255;
}

// Cluster 1-D values; returns sorted array of cluster centres
function cluster1D(values, minGap) {
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const groups = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] < minGap) groups[groups.length - 1].push(sorted[i]);
    else groups.push([sorted[i]]);
  }
  return groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);
}

// Build grid: cluster Tesseract symbol positions, then use pixel brightness
// for cells where no letter was detected (blocked vs truly empty)
function buildGridFromSymbols(symbols, pxData) {
  const charRegex = currentMode === 'sudoku' ? /^[1-9]$/ : currentMode === 'zip' ? /^[0-9]+$/ : /^[A-Za-z]$/;
  
  let pts = symbols
    .filter(s => charRegex.test(s.text.trim()) && (s.confidence || 0) > 30)
    .map(s => ({
      ch: s.text.trim(),
      cx: (s.bbox.x0 + s.bbox.x1) / 2,
      cy: (s.bbox.y0 + s.bbox.y1) / 2,
      bw: s.bbox.x1 - s.bbox.x0,
      bh: s.bbox.y1 - s.bbox.y0,
    }));

  if (pts.length < 4) return null;

  // Filter out noise (logos, small text) by finding the dominant character height
  const allH = pts.map(p => p.bh).sort((a, b) => a - b);
  const medianH = allH[Math.floor(allH.length / 2)];
  
  // Keep only points that are roughly the same size as the median
  pts = pts.filter(p => Math.abs(p.bh - medianH) < medianH * 0.4);

  if (pts.length < 4) return null;

  // Spatial outlier filter to remove stray text that happens to match the height
  const allCx = pts.map(p => p.cx).sort((a, b) => a - b);
  const allCy = pts.map(p => p.cy).sort((a, b) => a - b);
  const medCx = allCx[Math.floor(allCx.length / 2)];
  const medCy = allCy[Math.floor(allCy.length / 2)];
  
  pts = pts.filter(p => Math.abs(p.cx - medCx) < medianH * 15 && Math.abs(p.cy - medCy) < medianH * 15);

  if (pts.length < 4) return null;

  const allX = pts.map(p => p.cx).sort((a,b) => a-b);
  const allY = pts.map(p => p.cy).sort((a,b) => a-b);

  function findBestGridSpacing(coords, maxAllowedD) {
    const span = coords[coords.length - 1] - coords[0];
    if (span < 10) return { x0: coords[0], d: 0 };
    
    const minD = span / 15;
    const maxD = Math.min(span, maxAllowedD || span);

    let bestX0 = 0, bestD = 0, bestScore = -Infinity;
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const dist = coords[j] - coords[i];
        if (dist < minD * 0.5) continue;
        
        for (let gap = 1; gap <= 15; gap++) {
          const d = dist / gap;
          if (d < minD || d > maxD) continue;
          
          for (let ci = 0; ci <= 15 - gap; ci++) {
            const x0 = coords[i] - ci * d;
            
            let matches = 0;
            let minC = Infinity, maxC = -Infinity;
            for (const x of coords) {
              const c = Math.round((x - x0) / d);
              if (c >= 0 && c <= 15) {
                if (Math.abs(x - (x0 + c * d)) < Math.min(d * 0.35, span / 20)) {
                  matches++;
                  if (c < minC) minC = c;
                  if (c > maxC) maxC = c;
                }
              }
            }
            const gridLines = maxC - minC + 1;
            const score = matches - gridLines * 0.5;
            if (score > bestScore) {
              bestScore = score;
              bestX0 = x0;
              bestD = d;
            }
          }
        }
      }
    }
    return { x0: bestX0, d: bestD };
  }

  const maxX = pxData && pxData.w ? pxData.w / 3.5 : undefined;
  const maxY = pxData && pxData.h ? pxData.h / 3.5 : undefined;
  const xFit = findBestGridSpacing(allX, maxX);
  const yFit = findBestGridSpacing(allY, maxY);

  if (!xFit.d || !yFit.d) return null;

  // Find actual grid bounds
  let minCol = 9, maxCol = 0, minRow = 9, maxRow = 0;
  for (const p of pts) {
    const c = Math.round((p.cx - xFit.x0) / xFit.d);
    const r = Math.round((p.cy - yFit.x0) / yFit.d);
    if (c < minCol) minCol = c;
    if (c > maxCol) maxCol = c;
    if (r < minRow) minRow = r;
    if (r > maxRow) maxRow = r;
  }
  
  const numCols = pxData && pxData.w ? Math.round(pxData.w / xFit.d) : Math.max(4, maxCol - minCol + 1);
  const numRows = pxData && pxData.h ? Math.round(pxData.h / yFit.d) : Math.max(4, maxRow - minRow + 1);
  const size = Math.max(numCols, numRows);

  const sampleR = Math.min(xFit.d, yFit.d) * 0.22;

  let startCol = minCol, startRow = minRow;
  if (pxData && pxData.w) {
    startCol = Math.round((xFit.d / 2 - xFit.x0) / xFit.d);
    startRow = Math.round((yFit.d / 2 - yFit.x0) / yFit.d);
  }

  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const cx = xFit.x0 + (startCol + c) * xFit.d;
      const cy = yFit.x0 + (startRow + r) * yFit.d;

      const match = pts.find(p =>
        Math.abs(p.cx - cx) < xFit.d * 0.42 &&
        Math.abs(p.cy - cy) < yFit.d * 0.42
      );

      if (match) {
        row.push(currentMode === 'wend' ? match.ch.toUpperCase() : match.ch);
      } else {
        if (currentMode === 'wend') {
          const brightness = sampleBrightness(pxData, cx, cy, sampleR);
          row.push(brightness < 215 ? '#' : '?');
        } else {
          row.push('?');
        }
      }
    }
    grid.push(row);
  }
  return grid;
}

// ──────────────────────────────────────────────────────────
// SUDOKU GRID INFERENCE (handles missing rows/columns)
// ──────────────────────────────────────────────────────────
function inferSudokuGrid(pts, size) {
  if (pts.length < 2) return null;

  function findBest1D(coords) {
    const span = coords[coords.length - 1] - coords[0];
    if (span < 10) return { x0: coords[0], d: 0, score: 0 };
    
    // The true cell spacing must be between span / size and span.
    const minD = span / size;
    const maxD = span;

    let bestX0 = 0, bestD = 0, bestMatches = -1, minError = Infinity;
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const dist = coords[j] - coords[i];
        if (dist < minD * 0.5) continue;
        
        for (let gap = 1; gap < size; gap++) {
          const d = dist / gap;
          if (d < minD * 0.8 || d > maxD * 1.2) continue;
          
          for (let ci = 0; ci < size - gap; ci++) {
            const x0 = coords[i] - ci * d;
            
            let matches = 0;
            let error = 0;
            for (const x of coords) {
              const c = Math.round((x - x0) / d);
              if (c >= 0 && c < size) {
                const diff = Math.abs(x - (x0 + c * d));
                if (diff < d * 0.35) {
                  matches++;
                  error += diff;
                }
              }
            }
            if (matches > bestMatches || (matches === bestMatches && error < minError)) {
              bestMatches = matches;
              minError = error;
              bestX0 = x0;
              bestD = d;
            }
          }
        }
      }
    }
    return { x0: bestX0, d: bestD, score: bestMatches };
  }

  const allX = pts.map(p => p.cx).sort((a,b) => a-b);
  const allY = pts.map(p => p.cy).sort((a,b) => a-b);
  
  const xFit = findBest1D(allX);
  const yFit = findBest1D(allY);
  
  if (xFit.score < pts.length * 0.4 || yFit.score < pts.length * 0.4) return null;

  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const cx = xFit.x0 + c * xFit.d;
      const cy = yFit.x0 + r * yFit.d;
      const match = pts.find(p => Math.abs(p.cx - cx) < xFit.d * 0.4 && Math.abs(p.cy - cy) < yFit.d * 0.4);
      row.push(match ? match.ch : '?');
    }
    grid.push(row);
  }
  return grid;
}

// ──────────────────────────────────────────────────────────
// PROCESS IMAGE (capture / upload / paste entry point)
// ──────────────────────────────────────────────────────────
async function processImage(dataUrl) {
  if (!workerReady || !tesseractWorker) {
    setStatus('OCR not ready. Type letters into the grid manually.', 'error');
    return;
  }

  setStatus('Reading image...', 'loading');

  try {
    await tesseractWorker.setParameters(
      currentMode === 'sudoku'
        ? { tessedit_char_whitelist: '123456789', tessedit_pageseg_mode: '11' }  // PSM 11 = sparse text
        : currentMode === 'zip'
        ? { tessedit_char_whitelist: '0123456789', tessedit_pageseg_mode: '11' } // PSM 11 for sparse digits
        : { tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', tessedit_pageseg_mode: '6' }
    );

    // Run simultaneously: pixel load + OCR
    const [pxData, result] = await Promise.all([
      loadImagePixels(dataUrl),
      tesseractWorker.recognize(dataUrl),
    ]);

    const symbols = result.data.symbols || [];
    setStatus('Building grid...', 'loading');

    // For Sudoku also harvest from words (PSM 11 sometimes groups digits)
    let extraPts = [];
    if (currentMode === 'sudoku') {
      const words = result.data.words || [];
      words.forEach(w => {
        (w.text || '').trim().split('').forEach((ch, i) => {
          if (/^[1-9]$/.test(ch)) {
            const fracX = (i + 0.5) / w.text.length;
            extraPts.push({
              ch,
              cx: w.bbox.x0 + (w.bbox.x1 - w.bbox.x0) * fracX,
              cy: (w.bbox.y0 + w.bbox.y1) / 2,
              bw: (w.bbox.x1 - w.bbox.x0) / w.text.length,
              bh: w.bbox.y1 - w.bbox.y0,
            });
          }
        });
      });
    }

    let grid;
    if (currentMode === 'sudoku') {
      // Merge symbol-level and word-level digit detections, dedupe by proximity
      const symPts = symbols
        .filter(s => /^[1-9]$/.test(s.text.trim()))
        .map(s => ({
          ch: s.text.trim(),
          cx: (s.bbox.x0 + s.bbox.x1) / 2,
          cy: (s.bbox.y0 + s.bbox.y1) / 2,
          bw: s.bbox.x1 - s.bbox.x0,
          bh: s.bbox.y1 - s.bbox.y0,
        }));

      // Dedupe: keep symPts, add extraPts only if far from all existing
      const minMergeD = 20;
      for (const ep of extraPts) {
        if (!symPts.some(sp => Math.abs(sp.cx - ep.cx) < minMergeD && Math.abs(sp.cy - ep.cy) < minMergeD)) {
          symPts.push(ep);
        }
      }

      const pts = symPts;
      console.log('[Sudoku OCR] detected pts:', pts.length, pts.map(p => `${p.ch}@(${Math.round(p.cx)},${Math.round(p.cy)})`));

      grid = pts.length >= 2 ? inferSudokuGrid(pts, sudokuSize) : null;
    } else {
      // For Wend use symbols, for Zip use words to capture multi-digit numbers (e.g. "10")
      grid = buildGridFromSymbols(currentMode === 'zip' ? (result.data.words || []) : symbols, pxData);
    }

    if (!grid) {
      const n = currentMode === 'sudoku' ? (symbols.filter(s => /^[1-9]$/.test(s.text.trim())).length) : 0;
      setStatus(
        currentMode === 'sudoku'
          ? `OCR found ${n} digit(s) — too few to map grid.\nTry cropping tighter around the board, or enter digits manually.`
          : 'Could not detect grid structure.\nPlease enter manually.',
        'error'
      );
      return;
    }

    if (currentMode === 'sudoku') {
      populateSudokuGrid(grid);
      clearStatus();
      solveSudoku();
    } else {
      // WEND OR ZIP MODE
      const letterCount = grid.flat().filter(ch => /^[A-Z0-9]+$/.test(ch)).length;
      if (letterCount < 3) {
        setStatus('Too few characters detected. Please enter manually.', 'error');
        return;
      }

      const size = Math.min(Math.max(grid.length, 4), 10);
      const sel = document.getElementById('gridSizeSelect');
      if (sel.querySelector(`option[value="${size}"]`)) sel.value = size;
      rebuildGrid();

      grid.forEach((row, r) => {
        row.forEach((ch, c) => {
          const el = getCell(r, c);
          if (!el) return;
          if (ch === '#') toggleBlocked(r, c);
          else if (/^[A-Z0-9]+$/.test(ch)) el.value = ch;
        });
      });

      clearStatus();
      if (currentMode === 'zip') solveZip();
      else solveGrid();
    }
  } catch (e) {
    setStatus('OCR error: ' + e.message, 'error');
  }
}


// ──────────────────────────────────────────────────────────
// CAPTURE / UPLOAD / PASTE
// ──────────────────────────────────────────────────────────
let _pendingCaptureDataUrl = null; // Captured BEFORE overlay is shown

document.getElementById('captureBtn').addEventListener('click', async () => {
  if (currentMode === 'sudoku') {
    // For Sudoku: scrape the DOM directly — no OCR needed!
    setStatus('Scanning page for Sudoku grid...', 'loading');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeSudokuFromDOM
      });
      const grid = results?.[0]?.result;
      if (grid && grid.length >= 2) {
        populateSudokuGrid(grid);
        clearStatus();
        solveSudoku();
        return;
      }
      setStatus('Could not find Sudoku grid in page.\nTry entering digits manually.', 'error');
    } catch (e) {
      setStatus('DOM scan failed: ' + e.message, 'error');
    }
    return;
  }

  if (currentMode === 'wend') { // Only for Wend
    // Try DOM scraping first (no OCR needed!)
    setStatus('Scanning page for grid...', 'loading');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeWendFromDOM,
        args: [gridSize]
      });
      const scraped = results?.[0]?.result;
      if (scraped && scraped.grid && scraped.grid.length >= 2) {
        const { grid, size, wordLengths } = scraped;
        const sel = document.getElementById('gridSizeSelect');
        const sz = Math.min(Math.max(size, 4), 10);
        if (sel.querySelector(`option[value="${sz}"]`)) sel.value = sz;
        rebuildGrid();
        grid.forEach((row, r) => {
          row.forEach((ch, c) => {
            const el = getCell(r, c);
            if (!el) return;
            if (ch === '#') toggleBlocked(r, c);
            else if (/^[A-Z0-9]+$/.test(ch)) el.value = ch;
          });
        });

        // If word lengths were scraped, auto-populate the Wend panel
        if (wordLengths && wordLengths.length >= 2) {
          const countSel = document.getElementById('wendWordCount');
          // Make sure the option exists
          if (countSel.querySelector(`option[value="${wordLengths.length}"]`)) {
            countSel.value = wordLengths.length;
          }
          updateWendLengths();
          // Open the Wend panel
          const body = document.getElementById('wendBody');
          const chevron = document.getElementById('wendChevron');
          if (!body.classList.contains('open')) {
            body.classList.add('open');
            chevron.classList.add('open');
          }
          // Populate word length inputs
          const inputs = document.getElementById('wendLengths').querySelectorAll('.wend-len-input');
          wordLengths.forEach((len, i) => { if (inputs[i]) inputs[i].value = len; });
          setStatus(`Grid captured! ${wordLengths.length} word lengths pre-filled — verify lengths then click Solve Wend.`, 'loading');
        } else {
          clearStatus();
          if (currentMode === 'zip') solveZip();
          else solveGrid();
        }
        return;
      }
    } catch (e) {
      console.warn('DOM scrape failed, falling back to OCR:', e);
    }
  }

  // Fallback / Zip: crop + OCR (or scoped DOM scrape)
  setStatus(currentMode === 'zip' ? 'Drag a box around the puzzle grid...' : 'Could not read DOM — drag a box around the grid to use OCR...', 'loading');
  try {
    _pendingCaptureDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectCropper
    });
  } catch (e) {
    _pendingCaptureDataUrl = null;
    setStatus('Crop failed: ' + e.message, 'error');
  }
});


// DOM scraper — runs inside the page context, returns a 2D grid
function scrapeSudokuFromDOM() {
  // Collect all leaf elements whose trimmed text is a single digit 1-9
  const digitEls = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    // Skip hidden elements
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) continue;
    // Only leaf-ish elements (no children or only text children)
    const text = (node.innerText || node.textContent || '').trim();
    if (/^[1-9]$/.test(text) && node.children.length === 0) {
      const r = node.getBoundingClientRect();
      if (r.width > 5 && r.height > 5) {
        digitEls.push({ ch: text, cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height });
      }
    }
  }

  if (digitEls.length < 2) return null;

  // Cluster into rows and columns
  function cluster1D(vals, gap) {
    const sorted = [...vals].sort((a, b) => a - b);
    const groups = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] < gap) groups[groups.length - 1].push(sorted[i]);
      else groups.push([sorted[i]]);
    }
    return groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);
  }

  const medH = [...digitEls].sort((a, b) => a.h - b.h)[Math.floor(digitEls.length / 2)].h;
  const gap = medH * 0.7;

  const colCenters = cluster1D(digitEls.map(d => d.cx), gap);
  const rowCenters = cluster1D(digitEls.map(d => d.cy), gap);

  if (colCenters.length < 2 || rowCenters.length < 2) return null;

  // Snap each digit to nearest row/col
  const numCols = colCenters.length;
  const numRows = rowCenters.length;
  const gridArr = Array.from({ length: numRows }, () => Array(numCols).fill('?'));

  for (const d of digitEls) {
    let bestR = 0, bestC = 0;
    let minDr = Infinity, minDc = Infinity;
    rowCenters.forEach((ry, ri) => { const dr = Math.abs(d.cy - ry); if (dr < minDr) { minDr = dr; bestR = ri; } });
    colCenters.forEach((cx, ci) => { const dc = Math.abs(d.cx - cx); if (dc < minDc) { minDc = dc; bestC = ci; } });
    if (minDr < medH * 0.6 && minDc < medH * 0.6) gridArr[bestR][bestC] = d.ch;
  }

  return gridArr;
}

// DOM scraper for Wend puzzles — runs inside the page context
function scrapeWendFromDOM(expectedGridSize, cropRect) {
  // Collect all visible elements that contain a single uppercase letter
  // Be permissive: allow elements with children (e.g. empty styling spans)
  const letterEls = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) continue;

    // Get direct text content (ignoring child elements)
    let directText = '';
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) directText += child.textContent;
    }
    directText = directText.trim();

    // Also try innerText if no direct text found
    const text = directText || (node.children.length === 0 ? (node.innerText || node.textContent || '').trim() : '');

    if (/^[A-Za-z0-9]+$/.test(text)) {
      const r = node.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cropRect) {
        if (cx < cropRect.x || cx > cropRect.x + cropRect.w || cy < cropRect.y || cy > cropRect.y + cropRect.h) {
          continue; // Skip elements outside the crop area
        }
      }
      if (r.width > 8 && r.height > 8) {
        letterEls.push({ ch: text.toUpperCase(), cx, cy, w: r.width, h: r.height, top: r.top, left: r.left });
      }
    }
  }

  if (letterEls.length < 2) return null;

  // Deduplicate: if two elements are within 5px of each other, keep the larger one
  const deduped = [];
  const used = new Set();
  for (let i = 0; i < letterEls.length; i++) {
    if (used.has(i)) continue;
    let best = i;
    for (let j = i + 1; j < letterEls.length; j++) {
      if (used.has(j)) continue;
      const a = letterEls[best], b = letterEls[j];
      if (Math.abs(a.cx - b.cx) < 8 && Math.abs(a.cy - b.cy) < 8) {
        if (b.w * b.h > a.w * a.h) best = j;
        used.add(j);
      }
    }
    used.add(best);
    deduped.push(letterEls[best]);
  }


  // Filter to the dominant size to ignore logos/nav
  const sortedH = [...deduped].sort((a, b) => a.h - b.h);
  const medH = sortedH[Math.floor(sortedH.length / 2)].h;
  const gridEls = deduped.filter(el => Math.abs(el.h - medH) < medH * 0.5);

  if (gridEls.length < 2) return null;

  function findRobustGridSpacing(coords, maxAllowedD) {
    const span = coords[coords.length - 1] - coords[0];
    if (span < 10) return { x0: coords[0], d: 0 };
    
    const minD = span / 15;
    const maxD = Math.min(span, maxAllowedD || span);

    let bestX0 = 0, bestD = 0, bestScore = -Infinity;
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const dist = coords[j] - coords[i];
        if (dist < minD * 0.5) continue;
        
        for (let gap = 1; gap <= 15; gap++) {
          const d = dist / gap;
          if (d < minD || d > maxD) continue;
          
          for (let ci = 0; ci <= 15 - gap; ci++) {
            const x0 = coords[i] - ci * d;
            
            let matches = 0;
            let minC = Infinity, maxC = -Infinity;
            for (const x of coords) {
              const c = Math.round((x - x0) / d);
              if (c >= 0 && c <= 15) {
                if (Math.abs(x - (x0 + c * d)) < Math.min(d * 0.35, span / 20)) {
                  matches++;
                  if (c < minC) minC = c;
                  if (c > maxC) maxC = c;
                }
              }
            }
            // Score = matches - penalty for empty grid lines. This prevents d/2 overfitting.
            const gridLines = maxC - minC + 1;
            const score = matches - gridLines * 0.5;
            if (score > bestScore) {
              bestScore = score;
              bestX0 = x0;
              bestD = d;
            }
          }
        }
      }
    }
    return { x0: bestX0, d: bestD };
  }

  const allX = gridEls.map(d => d.cx).sort((a, b) => a - b);
  const allY = gridEls.map(d => d.cy).sort((a, b) => a - b);
  
  const maxX = cropRect && cropRect.w ? cropRect.w / 3.5 : undefined;
  const maxY = cropRect && cropRect.h ? cropRect.h / 3.5 : undefined;
  const xFit = findRobustGridSpacing(allX, maxX);
  const yFit = findRobustGridSpacing(allY, maxY);

  if (!xFit.d || !yFit.d) return null;

  let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
  for (const el of gridEls) {
    const c = Math.round((el.cx - xFit.x0) / xFit.d);
    const r = Math.round((el.cy - yFit.x0) / yFit.d);
    if (Math.abs(el.cx - (xFit.x0 + c * xFit.d)) < xFit.d * 0.4 && 
        Math.abs(el.cy - (yFit.x0 + r * yFit.d)) < yFit.d * 0.4) {
      if (c < minCol) minCol = c;
      if (c > maxCol) maxCol = c;
      if (r < minRow) minRow = r;
      if (r > maxRow) maxRow = r;
    }
  }

  const finalCols = cropRect ? Math.round(cropRect.w / xFit.d) : Math.max(2, maxCol - minCol + 1);
  const finalRows = cropRect ? Math.round(cropRect.h / yFit.d) : Math.max(2, maxRow - minRow + 1);
  const finalSize = Math.max(finalCols, finalRows);

  let startCol = minCol;
  let startRow = minRow;
  if (cropRect) {
    startCol = Math.round(((cropRect.x + xFit.d / 2) - xFit.x0) / xFit.d);
    startRow = Math.round(((cropRect.y + yFit.d / 2) - yFit.x0) / yFit.d);
  }

  const square = Array.from({ length: finalSize }, () => Array(finalSize).fill('#'));
  for (const el of gridEls) {
    const c = Math.round((el.cx - xFit.x0) / xFit.d) - startCol;
    const r = Math.round((el.cy - yFit.x0) / yFit.d) - startRow;
    if (r >= 0 && r < finalSize && c >= 0 && c < finalSize) {
      if (Math.abs(el.cx - (xFit.x0 + (c + startCol) * xFit.d)) < xFit.d * 0.4 && 
          Math.abs(el.cy - (yFit.x0 + (r + startRow) * yFit.d)) < yFit.d * 0.4) {
        square[r][c] = el.ch;
      }
    }
  }

  // Restore the empty cells inside the grid bounding box to '?' so they aren't blocked
  for (let r = 0; r < finalSize; r++) {
    for (let c = 0; c < finalSize; c++) {
      if (square[r][c] === '#') square[r][c] = '?';
    }
  }

  // Scrape word lengths from the answer rows (circles/bubbles in the answer area)
  const wordLengths = [];
  try {
    const allEls = Array.from(document.querySelectorAll('*'));
    const circles = [];
    for (const el of allEls) {
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 15 || r.width > 60) continue;
      if (Math.abs(r.width - r.height) > r.width * 0.35) continue;
      const br = parseFloat(st.borderRadius);
      if (br < r.width * 0.3) continue;
      circles.push({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width });
    }
    if (circles.length >= 3) {
      const sortedByY = [...circles].sort((a, b) => a.cy - b.cy);
      const medW = sortedByY[Math.floor(sortedByY.length / 2)].w;
      const rowGap = medW * 1.8;
      const rowGroups = [[sortedByY[0]]];
      for (let i = 1; i < sortedByY.length; i++) {
        const prev = rowGroups[rowGroups.length - 1];
        if (Math.abs(sortedByY[i].cy - prev[prev.length - 1].cy) < rowGap) {
          prev.push(sortedByY[i]);
        } else {
          rowGroups.push([sortedByY[i]]);
        }
      }
      for (const row of rowGroups) {
        if (row.length >= 3 && row.length <= 15) wordLengths.push(row.length);
      }
    }
  } catch(e) {}

  return { grid: square, size: finalSize, wordLengths };
}

function injectCropper() {
  if (document.getElementById('wend-cropper-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'wend-cropper-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2147483647, cursor: 'crosshair'
  });
  const selection = document.createElement('div');
  Object.assign(selection.style, {
    position: 'absolute', border: '2px solid #a78bfa', background: 'rgba(167, 139, 250, 0.2)',
    display: 'none', pointerEvents: 'none'
  });
  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  let startX, startY, isDragging = false;
  
  overlay.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0px';
    selection.style.height = '0px';
    selection.style.display = 'block';
  });
  
  overlay.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    selection.style.left = Math.min(e.clientX, startX) + 'px';
    selection.style.top = Math.min(e.clientY, startY) + 'px';
    selection.style.width = w + 'px';
    selection.style.height = h + 'px';
  });

  overlay.addEventListener('mouseup', e => {
    isDragging = false;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    document.body.removeChild(overlay);
    chrome.runtime.sendMessage({ action: 'CROP_DONE', rect: { x, y, w, h, dpr: window.devicePixelRatio } });
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'CROP_DONE') handleCrop(msg.rect);
});

async function handleCrop(rect) {
  if (rect.w < 20 || rect.h < 20) {
    setStatus('Crop area too small. Try again.', 'error');
    return;
  }
  const dataUrl = _pendingCaptureDataUrl;
  _pendingCaptureDataUrl = null;
  if (!dataUrl) {
    setStatus('No screenshot available — click Crop & Solve again.', 'error');
    return;
  }
  
  if (currentMode === 'zip') {
    setStatus('Extracting grid from cropped area...', 'loading');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeWendFromDOM,
        args: [gridSize, rect] // Pass crop rect to filter DOM elements!
      });
      const scraped = results?.[0]?.result;
      if (scraped && scraped.grid && scraped.grid.length >= 2) {
        const { grid, size } = scraped;
        const sel = document.getElementById('gridSizeSelect');
        const sz = Math.min(Math.max(size, 4), 10);
        if (sel.querySelector(`option[value="${sz}"]`)) sel.value = sz;
        rebuildGrid();
        grid.forEach((row, r) => {
          row.forEach((ch, c) => {
            const el = getCell(r, c);
            if (!el) return;
            if (/^[0-9]+$/.test(ch)) el.value = ch;
          });
        });
        clearStatus();
        solveZip();
        return; // Success! No OCR needed!
      }
    } catch (e) {
      console.warn('DOM scrape in crop failed:', e);
    }
  }

  setStatus('Processing cropped image with OCR...', 'loading');
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    const dpr = rect.dpr || 1;
    canvas.width  = Math.round(rect.w * dpr);
    canvas.height = Math.round(rect.h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      img,
      Math.round(rect.x * dpr), Math.round(rect.y * dpr),
      canvas.width, canvas.height,
      0, 0, canvas.width, canvas.height
    );

    // Preprocess image for OCR if in Zip mode:
    // Tesseract struggles with white text on dark circles. 
    // We threshold the image so dark circles become white backgrounds, and white text/page background become black text.
    if (currentMode === 'zip') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] * 299 + data[i+1] * 587 + data[i+2] * 114) / 1000;
        if (brightness > 180) {
          // White text and white background -> BLACK
          data[i] = data[i+1] = data[i+2] = 0;
        } else {
          // Dark circles -> WHITE
          data[i] = data[i+1] = data[i+2] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    await processImage(canvas.toDataURL('image/png'));
  } catch (e) {
    setStatus('Crop processing failed: ' + e.message, 'error');
  }
}

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => await processImage(ev.target.result);
  reader.readAsDataURL(file);
  e.target.value = '';
});

document.getElementById('pasteBtn').addEventListener('click', async () => {
  setStatus('Reading clipboard...', 'loading');
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes('image/png')) {
        const blob = await item.getType('image/png');
        const reader = new FileReader();
        reader.onload = async ev => await processImage(ev.target.result);
        reader.readAsDataURL(blob);
        return;
      }
    }
    setStatus('No image in clipboard. Copy a screenshot first (Win+Shift+S).', 'error');
  } catch (e) {
    setStatus('Clipboard error: ' + e.message, 'error');
  }
});

// ──────────────────────────────────────────────────────────
// MODE SWITCHING & BUTTON WIRING
// ──────────────────────────────────────────────────────────
document.getElementById('tabWend').addEventListener('click', () => switchMode('wend'));
document.getElementById('tabSudoku').addEventListener('click', () => switchMode('sudoku'));
document.getElementById('tabZip').addEventListener('click', () => switchMode('zip'));

document.getElementById('solveBtn').addEventListener('click', solveGrid);
document.getElementById('clearBtn').addEventListener('click', clearGrid);
document.getElementById('wendSolveBtn').addEventListener('click', solveWend);
document.getElementById('wendHeader').addEventListener('click', toggleWend);
document.getElementById('gridSizeSelect').addEventListener('change', rebuildGrid);
document.getElementById('wendWordCount').addEventListener('change', updateWendLengths);
document.getElementById('sudokuSizeSelect').addEventListener('change', (e) => {
  sudokuSize = parseInt(e.target.value);
  const container = document.getElementById('sudokuGrid');
  container.className = `sudoku-grid s${sudokuSize}x${sudokuSize}`;
  renderSudokuGrid();
});

document.getElementById('sudokuSolveBtn').addEventListener('click', solveSudoku);
document.getElementById('sudokuClearBtn').addEventListener('click', clearSudoku);

document.getElementById('zipSolveBtn').addEventListener('click', solveZip);
document.getElementById('zipClearBtn').addEventListener('click', clearGrid);

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('tabWend').classList.toggle('active', mode === 'wend');
  document.getElementById('tabSudoku').classList.toggle('active', mode === 'sudoku');
  document.getElementById('tabZip').classList.toggle('active', mode === 'zip');
  
  document.getElementById('wendSection').style.display = mode === 'wend' ? 'block' : 'none';
  document.getElementById('sudokuSection').style.display = mode === 'sudoku' ? 'block' : 'none';
  document.getElementById('zipSection').style.display = mode === 'zip' ? 'block' : 'none';
  document.getElementById('sharedGridSection').style.display = (mode === 'wend' || mode === 'zip') ? 'block' : 'none';
  
  // Re-run input validation to ensure lengths are right when switching
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const el = getCell(r, c);
      if (el) {
        if (mode === 'zip') {
          el.value = el.value.replace(/[^0-9]/g, '');
        } else if (mode === 'wend') {
          const v = el.value.replace(/[^a-zA-Z]/g, '');
          el.value = v ? v[v.length - 1].toUpperCase() : '';
        }
      }
    }
  }

  hideResults();
  clearStatus();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────────────────────────────────────────
// WEND MODE UI
// ──────────────────────────────────────────────────────────
function toggleWend() {
  const body = document.getElementById('wendBody');
  const chev = document.getElementById('wendChevron');
  const open = body.classList.toggle('open');
  chev.classList.toggle('open', open);
  if (open) { updateWendLengths(); updateWendCounter(); }
}

function countValidCells() {
  let count = 0;
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (!blocked.has(`${r},${c}`)) count++;
  return count;
}

function updateWendLengths() {
  const count = parseInt(document.getElementById('wendWordCount').value);
  const container = document.getElementById('wendLengths');
  const existing = [...container.querySelectorAll('.wend-len-input')].map(i => i.value);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const group = document.createElement('div');
    group.className = 'wend-len-group';
    const label = document.createElement('div');
    label.className = 'wend-len-label';
    label.textContent = `Word ${i + 1}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 3; input.max = 15;
    input.className = 'wend-len-input';
    input.value = existing[i] || '';
    input.placeholder = '?';
    input.addEventListener('input', updateWendCounter);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') solveWend(); });
    group.appendChild(label);
    group.appendChild(input);
    container.appendChild(group);
  }
  updateWendCounter();
}

function updateWendCounter() {
  const validCells = countValidCells();
  const inputs = [...document.getElementById('wendLengths').querySelectorAll('.wend-len-input')];
  const sum = inputs.reduce((acc, i) => acc + (parseInt(i.value) || 0), 0);
  let hint = document.getElementById('wendCellCount');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'wendCellCount';
    hint.style.cssText = 'font-size:11px;margin-top:6px;padding:4px 8px;border-radius:6px;text-align:center;';
    document.getElementById('wendLengths').after(hint);
  }
  if (validCells === 0) {
    hint.style.display = 'none';
    return;
  }
  hint.style.display = 'block';
  if (sum === validCells) {
    hint.style.background = '#1a3a2a'; hint.style.color = '#4ade80';
    hint.textContent = `✓ Lengths sum to ${sum} — matches ${validCells} grid cells`;
  } else {
    hint.style.background = '#3a1a1a'; hint.style.color = '#f87171';
    hint.textContent = `Sum: ${sum} / ${validCells} cells  (${sum < validCells ? '+' + (validCells - sum) : '-' + (sum - validCells)} off)`;
  }
}

function solveWend() {
  const inputs = [...document.getElementById('wendLengths').querySelectorAll('.wend-len-input')];
  const wordLengths = inputs.map(i => parseInt(i.value)).filter(n => n > 0);

  if (wordLengths.length === 0) {
    setStatus('Enter the letter count for each word (e.g. 6, 7, 8).', 'error');
    return;
  }

  const grid = [];
  let hasLetter = false;
  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      if (blocked.has(`${r},${c}`)) { row.push('#'); }
      else {
        const v = (getCell(r, c)?.value || '').trim().toUpperCase();
        if (/^[A-Z]$/.test(v)) { row.push(v); hasLetter = true; }
        else row.push('?');
      }
    }
    grid.push(row);
  }

  if (!hasLetter) {
    setStatus('Enter letters in the grid first!', 'error');
    return;
  }

  setStatus('Solving Wend (covering all cells)...', 'loading');
  clearGridColors();
  hideResults();

  chrome.runtime.sendMessage({ action: 'solveWend', grid, wordLengths }, response => {
    if (chrome.runtime.lastError) { setStatus('Error: ' + chrome.runtime.lastError.message, 'error'); return; }
    if (!response?.success) { setStatus('Error: ' + (response?.error || 'Unknown error'), 'error'); return; }
    if (!response.results?.length) {
      setStatus('No valid solution found.\nCheck: grid letters, word lengths, and that they sum to the number of non-blocked cells.', 'error');
      return;
    }
    showWendResults(response.results);
  });
}

function showWendResults(solutions) {
  clearStatus();
  const panel = document.getElementById('resultsPanel');
  const scroll = document.getElementById('resultsScroll');
  scroll.innerHTML = '';
  panel.style.display = 'block';
  document.getElementById('resultsCount').textContent = `${solutions.length} solution${solutions.length !== 1 ? 's' : ''}`;

  solutions.forEach((wordSet, si) => {
    const block = document.createElement('div');
    block.className = 'solution-block';
    const lbl = document.createElement('div');
    lbl.className = 'solution-label';
    lbl.textContent = solutions.length > 1 ? `Solution ${si + 1}` : 'Solution';
    block.appendChild(lbl);
    const wrap = document.createElement('div');
    wrap.className = 'solution-words';
    wordSet.forEach((w, wi) => {
      const chip = document.createElement('span');
      const colorIdx = wi % 6;
      chip.className = `solution-word color-${colorIdx}`;
      chip.textContent = w.word.toUpperCase();
      chip.title = 'Click to copy';
      chip.addEventListener('click', () => copyWord(w.word));
      wrap.appendChild(chip);

      // Color the grid with the first solution's paths
      if (si === 0) {
        w.path.forEach(([pr, pc]) => {
          const el = getCell(pr, pc);
          if (el) el.classList.add(`color-${colorIdx}`);
        });
      }
    });
    block.appendChild(wrap);
    scroll.appendChild(block);
  });

  if (solutions.length > 0) {
    drawSvgPath(solutions[0].map(w => w.path));
  }
}

// ──────────────────────────────────────────────────────────
// ZIP MODE UI
// ──────────────────────────────────────────────────────────
function solveZip() {
  const grid = [];
  let maxNum = 0, startR = -1;
  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      if (blocked.has(`${r},${c}`)) { row.push('#'); }
      else {
        const v = (getCell(r, c)?.value || '').trim();
        if (/^[0-9]+$/.test(v)) {
          const n = parseInt(v);
          row.push(n);
          if (n > maxNum) maxNum = n;
          if (n === 1) startR = r;
        } else {
          row.push('');
        }
      }
    }
    grid.push(row);
  }

  if (startR === -1 || maxNum < 2) {
    setStatus('Enter at least numbers 1 and 2.', 'error');
    return;
  }

  setStatus('Solving Zip...', 'loading');
  clearGridColors();
  hideResults();

  chrome.runtime.sendMessage({ 
    action: 'solveZip', 
    grid,
    hWalls: Array.from(hWalls),
    vWalls: Array.from(vWalls)
  }, response => {
    if (chrome.runtime.lastError) { setStatus('Error: ' + chrome.runtime.lastError.message, 'error'); return; }
    if (!response?.success) { setStatus('Error: ' + (response?.error || 'Unknown error'), 'error'); return; }
    if (!response.results?.length) {
      setStatus('No valid solution found. Check your numbers.', 'error');
      return;
    }
    
    clearStatus();
    // Zip has exactly 1 continuous path, which is response.results[0]
    drawSvgPath([response.results[0]]);
  });
}


// ──────────────────────────────────────────────────────────
// SUDOKU UI
// ──────────────────────────────────────────────────────────
function renderSudokuGrid() {
  const container = document.getElementById('sudokuGrid');
  container.innerHTML = '';
  for (let r = 0; r < sudokuSize; r++) {
    for (let c = 0; c < sudokuSize; c++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 's-cell';
      
      // Determine thick borders based on size
      if (sudokuSize === 9) {
        if (r === 2 || r === 5) input.classList.add('bb');
        if (c === 2 || c === 5) input.classList.add('br');
      } else if (sudokuSize === 6) {
        if (r === 1 || r === 3) input.classList.add('bb');
        if (c === 2) input.classList.add('br');
      }

      input.id = `sc_${r}_${c}`;
      input.autocomplete = 'off';
      input.spellcheck = false;

      // Handle keyboard nav and input
      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
          input.value = '';
          input.className = input.className.replace(/given|solved|conflict/g, '').trim();
          e.preventDefault();
          return;
        }
        if (e.key === 'ArrowRight') { focusSudoku(r, c + 1); e.preventDefault(); return; }
        if (e.key === 'ArrowLeft')  { focusSudoku(r, c - 1); e.preventDefault(); return; }
        if (e.key === 'ArrowDown')  { focusSudoku(r + 1, c); e.preventDefault(); return; }
        if (e.key === 'ArrowUp')    { focusSudoku(r - 1, c); e.preventDefault(); return; }
        if (e.key === 'Enter')      { solveSudoku(); e.preventDefault(); return; }

        if (/^[1-9]$/.test(e.key)) {
          input.value = e.key;
          input.classList.add('given');
          input.classList.remove('solved', 'conflict');
          e.preventDefault();
          if (c + 1 < sudokuSize) focusSudoku(r, c + 1);
          else if (r + 1 < sudokuSize) focusSudoku(r + 1, 0);
          return;
        }
        e.preventDefault(); // block other keys
      });

      // Double-click to clear just this cell
      input.addEventListener('dblclick', () => {
        input.value = '';
        input.className = input.className.replace(/given|solved|conflict/g, '').trim();
      });

      container.appendChild(input);
    }
  }
}

function focusSudoku(r, c) {
  if (r >= 0 && r < sudokuSize && c >= 0 && c < sudokuSize) {
    document.getElementById(`sc_${r}_${c}`)?.focus();
  }
}

function populateSudokuGrid(grid) {
  for (let r = 0; r < sudokuSize; r++) {
    for (let c = 0; c < sudokuSize; c++) {
      const cell = document.getElementById(`sc_${r}_${c}`);
      const val = grid[r][c];
      cell.className = cell.className.replace(/given|solved|conflict/g, '').trim();
      if (/^[1-9]$/.test(val)) {
        cell.value = val;
        cell.classList.add('given');
      } else {
        cell.value = '';
      }
    }
  }
}

function getSudokuBoard() {
  const board = [];
  for (let r = 0; r < sudokuSize; r++) {
    const row = [];
    for (let c = 0; c < sudokuSize; c++) {
      const val = document.getElementById(`sc_${r}_${c}`).value;
      row.push(/^[1-9]$/.test(val) ? parseInt(val) : 0);
    }
    board.push(row);
  }
  return board;
}

function clearSudoku() {
  for (let r = 0; r < sudokuSize; r++) {
    for (let c = 0; c < sudokuSize; c++) {
      const cell = document.getElementById(`sc_${r}_${c}`);
      cell.value = '';
      cell.className = cell.className.replace(/given|solved|conflict/g, '').trim();
    }
  }
  clearStatus();
  focusSudoku(0, 0);
}

function solveSudoku() {
  const board = getSudokuBoard();
  
  // Basic validation - check if empty
  const count = board.flat().filter(v => v !== 0).length;
  if (count === 0) {
    setStatus('Enter some digits first!', 'error');
    return;
  }

  setStatus('Solving Sudoku...', 'loading');

  chrome.runtime.sendMessage({ action: 'solveSudoku', board, size: sudokuSize }, response => {
    if (chrome.runtime.lastError) { setStatus('Error: ' + chrome.runtime.lastError.message, 'error'); return; }
    if (!response?.success) { setStatus(response?.error || 'No solution found.', 'error'); return; }

    clearStatus();
    // Fill the grid with solution
    const sol = response.solution;
    for (let r = 0; r < sudokuSize; r++) {
      for (let c = 0; c < sudokuSize; c++) {
        const cell = document.getElementById(`sc_${r}_${c}`);
        if (!cell.value) {
          cell.value = sol[r][c];
          cell.classList.add('solved');
        }
      }
    }
  });
}

// ──────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────
renderGrid();
renderSudokuGrid();
initWorker();
updateWendLengths();
setTimeout(() => {
  if (currentMode === 'wend') focusCell(0, 0);
  else focusSudoku(0, 0);
}, 100);
