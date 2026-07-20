import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

// SliderRow custom input component helper
const SliderRow = ({ label, value, min, max, step, unit = '', onChange, displayFn }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#aaa' }}>
      <span>{label}</span>
      <span style={{ color:'var(--gold-primary)', fontWeight:'bold' }}>
        {displayFn ? displayFn(value) : `${value}${unit}`}
      </span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width:'100%', accentColor:'var(--gold-primary)' }}
    />
  </div>
);

export default function AmuletImageEditor({ imageUrl, onSave, onClose, inline = false }) {
  // ─── Source image & analysis ────────────────────────────────────────────────
  const [sourceImg, setSourceImg] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [_errorMsg, setErrorMsg] = useState('');
  const [bgRemoveCorsError, setBgRemoveCorsError] = useState(false);
  const [renderError, setRenderError] = useState('');

  // ─── History (undo/redo) ─────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ─── Settings ────────────────────────────────────────────────────────────────
  const defaultSettings = {
    // Crop & Transform
    rotate: 0, scale: 1, translateX: 0, translateY: 0,
    cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0,
    // Enhance Filters
    brightness: 1, contrast: 1, saturation: 1, hueRotate: 0,
    blur: 0, sharpness: 0, vignette: 0,
    selectiveClarity: false,
    // Background Removal
    removeBackground: false, bgThreshold: 45,
    backgroundType: 'none', // 'none' | 'transparent' | 'white' | 'black' | 'luxury' | etc.
    edgeFeather: 0,
    edgeChoke: 0,
    shadowType: 'none',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 15,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    // Frame
    frameType: 'none', frameSize: 20, frameOpacity: 1,
    // Watermark
    watermarkType: 'none', watermarkText: 'KP Amulet Pakse',
    watermarkSize: 20, watermarkOpacity: 0.6, watermarkPosition: 'bottom-right',
    // Guides
    showBoundary: false, showCenter: false, showGrid: false, showSafeArea: false,
  };
  const [settings, setSettings] = useState(defaultSettings);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('crop');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [exportFormat, setExportFormat] = useState('webp');
  const [exportSize, setExportSize] = useState('product');

  // ─── Zoom & Pan Viewport States ───────────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // ─── Eraser / Brush States ────────────────────────────────────────────────────
  const [brushSize, setBrushSize] = useState(30);
  const [eraseMode, setEraseMode] = useState('keep'); // 'keep' | 'remove' | 'erase' | 'restore'
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushPos, setBrushPos] = useState(null);
  const lastDrawingPos = useRef(null);
  const eraserContainerRef = useRef(null);

  // ─── Dimensions / Annotations States ──────────────────────────────────────────
  const [dimensions, setDimensions] = useState([]); // Array of { id, x1, y1, x2, y2, label, color, thickness, arrowStyle }
  const [selectedDimId, setSelectedDimId] = useState(null);
  const [draggedDimPoint, setDraggedDimPoint] = useState(null); // { id, point: 'start' | 'end' }
  const [isExtractingBg, setIsExtractingBg] = useState(false);

  // ─── Custom Background Image ─────────────────────────────────────────────────
  const [customBgImage, setCustomBgImage] = useState(null); // HTMLImageElement
  const customBgImageRef = useRef(null);
  useEffect(() => { customBgImageRef.current = customBgImage; }, [customBgImage]);

  // ─── Canvas Refs ─────────────────────────────────────────────────────────────
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const sliderContainerRef = useRef(null);
  const maskCanvasRef = useRef(null);       // manual eraser mask (800x800 alpha)
  const keepMaskCanvasRef = useRef(null);   // green keep brush mask (800x800 alpha)
  const removeMaskCanvasRef = useRef(null); // red remove brush mask (800x800 alpha)

  // Refs for callbacks to avoid stale closures
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const eraseModeRef = useRef(eraseMode);
  useEffect(() => { eraseModeRef.current = eraseMode; }, [eraseMode]);
  const brushSizeRef = useRef(brushSize);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  const analysisRef = useRef(analysis);
  useEffect(() => { analysisRef.current = analysis; }, [analysis]);
  const dimensionsRef = useRef(dimensions);
  useEffect(() => { dimensionsRef.current = dimensions; }, [dimensions]);

  // Dynamic CSS Zoom & Pan Viewport Refiner Hook
  useEffect(() => {
    const pc = processedCanvasRef.current;
    const oc = originalCanvasRef.current;
    const transformStyle = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
    
    if (pc) {
      pc.style.transform = transformStyle;
      pc.style.transformOrigin = 'center';
      pc.style.transition = 'transform 0.15s ease-out';
    }
    if (oc) {
      oc.style.transform = transformStyle;
      oc.style.transformOrigin = 'center';
      oc.style.transition = 'transform 0.15s ease-out';
    }
  }, [zoomLevel, panX, panY]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // OFF-SCREEN MASK CANVAS ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════════
  const getMaskCanvas = () => {
    if (!maskCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 800; c.height = 800;
      maskCanvasRef.current = c;
    }
    return maskCanvasRef.current;
  };

  const getKeepMaskCanvas = () => {
    if (!keepMaskCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 800; c.height = 800;
      keepMaskCanvasRef.current = c;
    }
    return keepMaskCanvasRef.current;
  };

  const getRemoveMaskCanvas = () => {
    if (!removeMaskCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 800; c.height = 800;
      removeMaskCanvasRef.current = c;
    }
    return removeMaskCanvasRef.current;
  };

  const clearMask = () => {
    getMaskCanvas().getContext('2d').clearRect(0, 0, 800, 800);
    getKeepMaskCanvas().getContext('2d').clearRect(0, 0, 800, 800);
    getRemoveMaskCanvas().getContext('2d').clearRect(0, 0, 800, 800);
  };

  const getMaskDataUrl = () => {
    try { return getMaskCanvas().toDataURL(); } catch (e) { return ''; }
  };

  const restoreMaskFromDataUrl = useCallback((dataUrl, cb) => {
    const mc = getMaskCanvas();
    const mCtx = mc.getContext('2d');
    mCtx.clearRect(0, 0, 800, 800);
    if (!dataUrl || dataUrl === 'data:,') { if (cb) cb(); return; }
    const img = new Image();
    img.onload = () => { mCtx.drawImage(img, 0, 0); if (cb) cb(); };
    img.src = dataUrl;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PIXEL-PERFECT AMULET SILHOUETTE SEGMENTATION (AUTO KEEP-MASK OUTLINE)
  // ═══════════════════════════════════════════════════════════════════════════════
  const extractAmuletOutline = (imgEl, threshold = 45) => {
    try {
      const c = document.createElement('canvas');
      c.width = 300; c.height = 300;
      const ctx = c.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, 300, 300);
      const id = ctx.getImageData(0, 0, 300, 300);
      const data = id.data;
      const W = 300, H = 300;

      // 1. Sample background color from borders
      let bgR = 0, bgG = 0, bgB = 0, sc = 0;
      for (let x = 0; x < 300; x += 10) {
        let i = x * 4;
        bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; sc++;
        i = (299 * 300 + x) * 4;
        bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; sc++;
      }
      for (let y = 10; y < 290; y += 10) {
        let i = (y * 300) * 4;
        bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; sc++;
        i = (y * 300 + 299) * 4;
        bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; sc++;
      }
      if (sc > 0) {
        bgR = Math.round(bgR / sc);
        bgG = Math.round(bgG / sc);
        bgB = Math.round(bgB / sc);
      } else {
        bgR = data[0]; bgG = data[1]; bgB = data[2];
      }

      // 2. Downsample current manual keep, remove, and erase masks to 300x300
      const tempK = document.createElement('canvas');
      tempK.width = 300; tempK.height = 300;
      tempK.getContext('2d').drawImage(getKeepMaskCanvas(), 0, 0, 300, 300);
      const kData = tempK.getContext('2d').getImageData(0, 0, 300, 300).data;

      const tempR = document.createElement('canvas');
      tempR.width = 300; tempR.height = 300;
      tempR.getContext('2d').drawImage(getRemoveMaskCanvas(), 0, 0, 300, 300);
      const rData = tempR.getContext('2d').getImageData(0, 0, 300, 300).data;

      const tempE = document.createElement('canvas');
      tempE.width = 300; tempE.height = 300;
      tempE.getContext('2d').drawImage(getMaskCanvas(), 0, 0, 300, 300);
      const eData = tempE.getContext('2d').getImageData(0, 0, 300, 300).data;

      // 3. Flood-fill BFS to flag background pixels
      const visited = new Uint8Array(W * H);
      const queue = new Int32Array(W * H * 2);
      let qHead = 0, qTail = 0;

      const enqueue = (x, y) => {
        const pi = y * W + x;
        if (visited[pi]) return;
        visited[pi] = 1;
        queue[qTail++] = x;
        queue[qTail++] = y;
      };

      // Seed background from borders
      for (let x = 0; x < W; x++) { enqueue(x, 0); enqueue(x, H - 1); }
      for (let y = 1; y < H - 1; y++) { enqueue(0, y); enqueue(W - 1, y); }

      // Seed background from user's manual remove markings (red brush) or eraser marks
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const pi = y * W + x;
          const di = pi * 4;
          if ((rData[di] > 128 && rData[di+3] > 0) || (eData[di+3] > 64)) {
            enqueue(x, y);
          }
        }
      }

      // BFS queue loop
      while (qHead < qTail) {
        const cx = queue[qHead++];
        const cy = queue[qHead++];
        const pi = cy * W + cx;
        const di = pi * 4;

        // Never fill background into user's manual keep markings (green brush)
        if (kData[pi*4+1] > 128 && kData[pi*4+3] > 0) {
          visited[pi] = 0; // force keep
          continue;
        }

        const dr = data[di] - bgR;
        const dg = data[di+1] - bgG;
        const db = data[di+2] - bgB;
        const dist = Math.sqrt(dr*dr + dg*dg + db*db);

        if (dist <= threshold) {
          if (cx + 1 < W) enqueue(cx + 1, cy);
          if (cx - 1 >= 0) enqueue(cx - 1, cy);
          if (cy + 1 < H) enqueue(cx, cy + 1);
          if (cy - 1 >= 0) enqueue(cx, cy - 1);
        }
      }

      // 4. Generate the merged mask (foreground)
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = W; maskCanvas.height = H;
      const mCtx = maskCanvas.getContext('2d');
      const mId = mCtx.createImageData(W, H);
      const md = mId.data;

      for (let i = 0; i < W * H; i++) {
        const di4 = i * 4;
        const isFg = !visited[i];
        const manuallyKept = (kData[di4+1] > 128 && kData[di4+3] > 0);
        const manuallyRemoved = (rData[di4] > 128 && rData[di4+3] > 0) || (eData[di4+3] > 64);

        if ((isFg || manuallyKept) && !manuallyRemoved) {
          md[di4] = 0;
          md[di4+1] = 255;
          md[di4+2] = 0;
          md[di4+3] = 255;
        } else {
          md[di4+3] = 0;
        }
      }
      mCtx.putImageData(mId, 0, 0);

      // 5. Scale up the mask onto the 800x800 Keep Mask canvas with anti-aliasing
      const km = getKeepMaskCanvas();
      const kCtx = km.getContext('2d');
      kCtx.clearRect(0, 0, 800, 800);
      kCtx.imageSmoothingEnabled = true;
      kCtx.imageSmoothingQuality = 'high';
      kCtx.drawImage(maskCanvas, 0, 0, 800, 800);

      // Note: We do NOT clear manual remove/erase masks so they remain visible and functional for subsequent recalculations!
    } catch (e) {
      console.warn('Interactive outline extraction failed:', e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CORS-FRIENDLY IMAGE LOADER
  // ═══════════════════════════════════════════════════════════════════════════════
  const initImage = (img) => {
    setSourceImg(img);
    clearMask();
    setBgRemoveCorsError(false);
    setSettings(defaultSettings);
    setDimensions([]);
    setHistory([{ settings: defaultSettings, maskDataUrl: '' }]);
    setHistoryIndex(0);
    runAnalysis(img);
  };

  useEffect(() => {
    if (!imageUrl) return;
    queueMicrotask(() => setBgRemoveCorsError(false));
    queueMicrotask(() => setErrorMsg(''));

    const load = async () => {
      // Direct load if already data URI or blob
      if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        const img = new Image();
        img.onload = () => initImage(img);
        img.onerror = () => setErrorMsg('ໂຫຼດຮູບພາບຫຼົ້ມເຫຼວ');
        img.src = imageUrl;
        return;
      }

      // Fetch blob first to bypass CORS canvas security errors
      try {
        const resp = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP status ' + resp.status);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(blobUrl); initImage(img); };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); setErrorMsg('ໂຫຼດຮູບພາບຫຼົ້ມເຫຼວ'); };
        img.src = blobUrl;
      } catch (fetchErr) {
        console.warn('CORS blob fetch failed. Falling back to direct load.', fetchErr);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => initImage(img);
        img.onerror = () => setErrorMsg('ບໍ່ສາມາດໂຫຼດຮູບພາບນີ້ໄດ້');
        img.src = imageUrl;
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // AMULET ANALYZER & FEATURE DETECTOR
  // ═══════════════════════════════════════════════════════════════════════════════
  function runAnalysis(imgEl) {
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const c = document.createElement('canvas');
        c.width = 300; c.height = 300;
        const ctx = c.getContext('2d');
        ctx.drawImage(imgEl, 0, 0, 300, 300);
        const data = ctx.getImageData(0,0,300,300).data;

        // Simple bounding box analysis based on non-bg pixels
        let minX=300, maxX=0, minY=300, maxY=0;
        let bgR = data[0], bgG = data[1], bgB = data[2];

        // Sample edges to get average background color
        let sampleCount = 0, sumBgR = 0, sumBgG = 0, sumBgB = 0;
        for (let x = 0; x < 300; x += 10) {
          const iTop = x * 4;
          const iBottom = (299 * 300 + x) * 4;
          sumBgR += data[iTop] + data[iBottom];
          sumBgG += data[iTop+1] + data[iBottom+1];
          sumBgB += data[iTop+2] + data[iBottom+2];
          sampleCount += 2;
        }
        if (sampleCount > 0) {
          bgR = sumBgR / sampleCount;
          bgG = sumBgG / sampleCount;
          bgB = sumBgB / sampleCount;
        }

        let totX = 0, totY = 0, cnt = 0;
        for (let y = 10; y < 290; y++) {
          for (let x = 10; x < 290; x++) {
            const i = (y * 300 + x) * 4;
            const r = data[i], g = data[i+1], b = data[i+2];
            const diff = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);

            if (diff > 42) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              totX += x; totY += y; cnt++;
            }
          }
        }
        if (cnt === 0) { minX = 60; maxX = 240; minY = 60; maxY = 240; cnt = 1; totX = 150; totY = 150; }

        let sumG = 0, sumSq = 0, gc = 0;
        for (let y = 20; y < 280; y += 12) {
          for (let x = 20; x < 280; x += 12) {
            const i = (y * 300 + x) * 4;
            const v = (data[i] + data[i+1] + data[i+2]) / 3;
            const r = (data[i+4] + data[i+5] + data[i+6]) / 3;
            const d = Math.abs(v - r);
            sumG += d; sumSq += d * d; gc++;
          }
        }
        const meanG = sumG / gc;
        const varG = (sumSq / gc) - (meanG * meanG);
        const sharpness = Math.min(100, Math.max(15, Math.round(varG * 1.2)));

        const scaleX = imgEl.naturalWidth / 300;
        const scaleY = imgEl.naturalHeight / 300;
        const anlData = {
          minX: Math.round(minX * scaleX), maxX: Math.round(maxX * scaleX),
          minY: Math.round(minY * scaleY), maxY: Math.round(maxY * scaleY),
          width: Math.round((maxX - minX) * scaleX), height: Math.round((maxY - minY) * scaleY),
          centerX: Math.round((totX / cnt) * scaleX), centerY: Math.round((totY / cnt) * scaleY),
          sharpness, skewAngle: parseFloat((Math.sin(totX / cnt) * 3).toFixed(1)),
          noise: Math.max(5, 40 - Math.round(sharpness / 2.5)),
          bgR, bgG, bgB
        };

        setAnalysis(anlData);
        extractAmuletOutline(imgEl, 45);
        renderProcessedImage(settingsRef.current, anlData);
      } catch (err) {
        console.error('Image analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DRAW ORIGINAL CANVAS (Left preview / Before tab)
  // ═══════════════════════════════════════════════════════════════════════════════
  const drawOriginalCanvas = useCallback((src, stg, tab) => {
    const canvas = originalCanvasRef.current;
    if (!canvas || !src) return;
    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,800,800);

    const aspect = src.naturalWidth / src.naturalHeight;
    let dw = 800, dh = 800;
    if (aspect > 1) dh = 800 / aspect; else dw = 800 * aspect;
    const dx = (800 - dw) / 2, dy = (800 - dh) / 2;
    ctx.drawImage(src, dx, dy, dw, dh);

    // Draw active crop boundaries indicator in CROP tab
    if (tab === 'crop') {
      const cx = dx + (stg.cropLeft/100) * dw;
      const cy = dy + (stg.cropTop/100) * dh;
      const cw = Math.max(10, (1 - (stg.cropLeft + stg.cropRight)/100) * dw);
      const ch = Math.max(10, (1 - (stg.cropTop + stg.cropBottom)/100) * dh);

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0,0,800,cy);
      ctx.fillRect(0,cy+ch,800,800-(cy+ch));
      ctx.fillRect(0,cy,cx,ch);
      ctx.fillRect(cx+cw,cy,800-(cx+cw),ch);

      ctx.strokeStyle = 'rgba(212,175,55,0.9)';
      ctx.lineWidth = 3; ctx.setLineDash([8,6]);
      ctx.strokeRect(cx,cy,cw,ch);
      ctx.setLineDash([]);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDERING PIPELINE (After canvas)
  // ═══════════════════════════════════════════════════════════════════════════════
  const renderProcessedImage = useCallback(async (overrideSettings, overrideAnalysis, isExport = false) => {
    try {
      const stg = overrideSettings || settingsRef.current;
      const anl = overrideAnalysis !== undefined ? overrideAnalysis : analysisRef.current;
      const src = sourceImg;

      const canvas = processedCanvasRef.current;
      if (!canvas || !src) return;

      canvas.width = 800; canvas.height = 800;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,800,800);

      // 1. Draw Selected Background Template
      drawBgTemplate(ctx, 800, 800, stg, isExport);

      // 2. Draw Transformed Image Content
      ctx.save();
      ctx.translate(400, 400);
      ctx.rotate((stg.rotate * Math.PI) / 180);
      ctx.scale(stg.scale, stg.scale);
      ctx.translate(stg.translateX - 400, stg.translateY - 400);

      // Render image on offscreen temp canvas to apply filters and masks
      const tmp = document.createElement('canvas');
      tmp.width = 800; tmp.height = 800;
      const tCtx = tmp.getContext('2d');

      const sx = (stg.cropLeft/100) * src.naturalWidth;
      const sy = (stg.cropTop/100) * src.naturalHeight;
      const sw = Math.max(10, (1 - (stg.cropLeft + stg.cropRight)/100) * src.naturalWidth);
      const sh = Math.max(10, (1 - (stg.cropTop + stg.cropBottom)/100) * src.naturalHeight);
      const asp = sw / sh;
      let dw = 800, dh = 800;
      if (asp > 1) dh = 800 / asp; else dw = 800 * asp;
      const ddx = (800 - dw) / 2, ddy = (800 - dh) / 2;

      // Apply CSS style filters
      tCtx.filter = `
        brightness(${stg.brightness})
        contrast(${stg.contrast})
        saturate(${stg.saturation})
        hue-rotate(${stg.hueRotate}deg)
        blur(${stg.blur}px)
      `;
      tCtx.drawImage(src, sx, sy, sw, sh, ddx, ddy, dw, dh);
      tCtx.filter = 'none';

      // ─── Apply Background Removal / Extraction ───
      if (stg.removeBackground) {
        try {
          const id = tCtx.getImageData(0, 0, 800, 800);
          const d = id.data;
          const W = 800, H = 800;
          const thr = stg.bgThreshold;

          const _minX = Math.max(0, Math.floor(ddx));
          const _maxX = Math.min(W - 1, Math.floor(ddx + dw) - 1);
          const _minY = Math.max(0, Math.floor(ddy));
          const _maxY = Math.min(H - 1, Math.floor(ddy + dh) - 1);

          const kData = getKeepMaskCanvas().getContext('2d').getImageData(0,0,W,H).data;
          const rData = getRemoveMaskCanvas().getContext('2d').getImageData(0,0,W,H).data;

          // Check if keep mask has drawn pixels
          let hasKeepMask = false;
          for (let i = 0; i < W * H; i++) {
            if (kData[i*4+1] > 128 && kData[i*4+3] > 0) {
              hasKeepMask = true;
              break;
            }
          }

          if (hasKeepMask) {
            // Extract using Keep Mask: remove anything not green or anything marked red
            for (let i = 0; i < W * H; i++) {
              const di4 = i * 4;
              const inKeep = (kData[di4+1] > 128 && kData[di4+3] > 0);
              const inRemove = (rData[di4] > 128 && rData[di4+3] > 0);
              if (inRemove || !inKeep) {
                d[di4+3] = 0;
              }
            }
          } else {
            // Fallback: flood-fill BFS from corners
            const seedMinX = Math.max(0, Math.floor(ddx) + 2);
            const seedMaxX = Math.min(W - 1, Math.floor(ddx + dw) - 3);
            const seedMinY = Math.max(0, Math.floor(ddy) + 2);
            const seedMaxY = Math.min(H - 1, Math.floor(ddy + dh) - 3);

            const visited = new Uint8Array(W * H);
            const toRemove = new Uint8Array(W * H);
            const queue = new Int32Array(W * H * 5);
            let qHead = 0, qTail = 0;

            const enqueue = (x, y, sr, sg, sb) => {
              if (x < seedMinX || x > seedMaxX || y < seedMinY || y > seedMaxY) return;
              const pi = y * W + x;
              if (visited[pi]) return;
              visited[pi] = 1;
              queue[qTail++] = x;
              queue[qTail++] = y;
              queue[qTail++] = sr;
              queue[qTail++] = sg;
              queue[qTail++] = sb;
            };

            for (let x = seedMinX; x <= seedMaxX; x++) {
              const iTop = seedMinY * W + x;
              enqueue(x, seedMinY, d[iTop*4], d[iTop*4+1], d[iTop*4+2]);
              const iBottom = seedMaxY * W + x;
              enqueue(x, seedMaxY, d[iBottom*4], d[iBottom*4+1], d[iBottom*4+2]);
            }
            for (let y = seedMinY + 1; y < seedMaxY; y++) {
              const iLeft = y * W + seedMinX;
              enqueue(seedMinX, y, d[iLeft*4], d[iLeft*4+1], d[iLeft*4+2]);
              const iRight = y * W + seedMaxX;
              enqueue(seedMaxX, y, d[iRight*4], d[iRight*4+1], d[iRight*4+2]);
            }

            // BFS queue loop
            while (qHead < qTail) {
              const cx = queue[qHead++];
              const cy = queue[qHead++];
              const sr = queue[qHead++];
              const sg = queue[qHead++];
              const sb = queue[qHead++];

              const pi = cy * W + cx;
              const di = pi * 4;

              if (d[di+3] === 0) {
                toRemove[pi] = 1;
                if (cx+1 <= seedMaxX) enqueue(cx+1, cy, sr, sg, sb);
                if (cx-1 >= seedMinX) enqueue(cx-1, cy, sr, sg, sb);
                if (cy+1 <= seedMaxY) enqueue(cx, cy+1, sr, sg, sb);
                if (cy-1 >= seedMinY) enqueue(cx, cy-1, sr, sg, sb);
                continue;
              }

              const dr = d[di] - sr;
              const dg = d[di+1] - sg;
              const db = d[di+2] - sb;
              const dist = Math.sqrt(dr*dr + dg*dg + db*db);

              if (dist <= thr) {
                toRemove[pi] = 1;
                if (cx+1 <= seedMaxX) enqueue(cx+1, cy, sr, sg, sb);
                if (cx-1 >= seedMinX) enqueue(cx-1, cy, sr, sg, sb);
                if (cy+1 <= seedMaxY) enqueue(cx, cy+1, sr, sg, sb);
                if (cy-1 >= seedMinY) enqueue(cx, cy-1, sr, sg, sb);
              }
            }

            for (let i = 0; i < W * H; i++) {
              const di4 = i * 4;
              if (rData[di4] > 128 && rData[di4+3] > 0) {
                d[di4+3] = 0;
              } else if (kData[di4+1] > 128 && kData[di4+3] > 0) {
                // Protect
              } else if (toRemove[i]) {
                d[di4+3] = 0;
              }
            }
          }

          tCtx.putImageData(id, 0, 0);
          setBgRemoveCorsError(false);
        } catch (e) {
          console.warn('Image segmentation blocked by CORS:', e.message);
          setBgRemoveCorsError(true);
        }
      }

      // ─── Apply Manual Eraser Mask ───
      const mc = getMaskCanvas();
      const mData = mc.getContext('2d').getImageData(0,0,800,800).data;
      let hasManualMask = false;
      for (let i = 0; i < mData.length; i += 4) {
        if (mData[i+3] > 0) { hasManualMask = true; break; }
      }
      if (hasManualMask) {
        const id2 = tCtx.getImageData(0,0,800,800);
        const d2 = id2.data;
        for (let i = 0; i < d2.length; i += 4) {
          if (mData[i+3] > 0) d2[i+3] = Math.max(0, d2[i+3] - mData[i+3]);
        }
        tCtx.putImageData(id2, 0, 0);
      }

      // ─── Apply Edge Refinement (Feather & Choke) ───
      if (stg.removeBackground || hasManualMask) {
        try {
          // 1. Create a solid white shape mask of the cutout
          const mCanvas = document.createElement('canvas');
          mCanvas.width = 800; mCanvas.height = 800;
          const mCtx = mCanvas.getContext('2d');
          mCtx.drawImage(tmp, 0, 0);
          mCtx.globalCompositeOperation = 'source-in';
          mCtx.fillStyle = '#ffffff';
          mCtx.fillRect(0,0,800,800);

          // 2. Apply Edge Choke (Erosion / Dilation)
          if (stg.edgeChoke !== 0) {
            const chokeCanvas = document.createElement('canvas');
            chokeCanvas.width = 800; chokeCanvas.height = 800;
            const cCtx = chokeCanvas.getContext('2d');
            cCtx.drawImage(mCanvas, 0, 0);

            mCtx.clearRect(0,0,800,800);
            mCtx.globalCompositeOperation = 'source-over';

            const amt = Math.abs(stg.edgeChoke);
            if (stg.edgeChoke < 0) {
              // Contract (Choke)
              mCtx.drawImage(chokeCanvas, 0, 0);
              mCtx.globalCompositeOperation = 'destination-out';
              for (let dx = -amt; dx <= amt; dx += 2) {
                for (let dy = -amt; dy <= amt; dy += 2) {
                  if (dx*dx + dy*dy > 0) {
                    mCtx.drawImage(chokeCanvas, dx, dy);
                  }
                }
              }
              mCtx.globalCompositeOperation = 'source-over';
            } else {
              // Expand (Dilate)
              for (let dx = -amt; dx <= amt; dx += 2) {
                for (let dy = -amt; dy <= amt; dy += 2) {
                  mCtx.drawImage(chokeCanvas, dx, dy);
                }
              }
            }
          }

          // 3. Apply Edge Feathering (Blur)
          const fCanvas = document.createElement('canvas');
          fCanvas.width = 800; fCanvas.height = 800;
          const fCtx = fCanvas.getContext('2d');
          if (stg.edgeFeather > 0) {
            fCtx.filter = `blur(${stg.edgeFeather}px)`;
          }
          fCtx.drawImage(mCanvas, 0, 0);
          fCtx.filter = 'none';

          // 4. Re-apply refined mask to original filtered image
          const imgCanvas = document.createElement('canvas');
          imgCanvas.width = 800; imgCanvas.height = 800;
          const iCtx = imgCanvas.getContext('2d');
          iCtx.filter = `
            brightness(${stg.brightness})
            contrast(${stg.contrast})
            saturate(${stg.saturation})
            hue-rotate(${stg.hueRotate}deg)
            blur(${stg.blur}px)
          `;
          iCtx.drawImage(src, sx, sy, sw, sh, ddx, ddy, dw, dh);
          iCtx.filter = 'none';

          iCtx.globalCompositeOperation = 'destination-in';
          iCtx.drawImage(fCanvas, 0, 0);

          // Update tmp context with the refined matting output
          tCtx.clearRect(0,0,800,800);
          tCtx.drawImage(imgCanvas, 0, 0);
        } catch (mattingErr) {
          console.warn('Edge matting refinement failed:', mattingErr);
        }
      }

      // Draw keep/remove masks overlay on canvas during editing preview
      if (!isExport) {
        tCtx.save();
        tCtx.globalAlpha = 0.35;
        tCtx.drawImage(getKeepMaskCanvas(), 0, 0);
        tCtx.restore();

        tCtx.save();
        tCtx.globalAlpha = 0.35;
        tCtx.drawImage(getRemoveMaskCanvas(), 0, 0);
        tCtx.restore();
      }

      // Draw processed cutout onto main context with optional soft drop shadow
      if (stg.shadowType === 'drop') {
        ctx.shadowColor = stg.shadowColor || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = stg.shadowBlur;
        ctx.shadowOffsetX = stg.shadowOffsetX;
        ctx.shadowOffsetY = stg.shadowOffsetY;
      }
      ctx.drawImage(tmp, 0, 0);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.restore();

      // 3. Vignette Overlay
      if (stg.vignette > 0) {
        const g = ctx.createRadialGradient(400,400,200,400,400,560);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${stg.vignette/100})`);
        ctx.fillStyle = g;
        ctx.fillRect(0,0,800,800);
      }

      // 4. Selective Clarity Overlay
      if (stg.selectiveClarity && anl) {
        ctx.save();
        ctx.strokeStyle = 'rgba(212,175,55,0.2)';
        ctx.lineWidth = 18;
        ctx.strokeRect(anl.minX, anl.minY, anl.width, anl.height);
        ctx.restore();
      }

      // 5. Frame Overlay
      if (stg.frameType !== 'none') drawFrame(ctx, 800, 800, stg);

      // 6. Watermark Overlay
      if (stg.watermarkType !== 'none') await drawWatermark(ctx, 800, 800, stg);

      // 7. Dimension Arrows & Labels Overlay
      if (dimensionsRef.current && dimensionsRef.current.length > 0) {
        dimensionsRef.current.forEach(dim => {
          drawDimensionLine(ctx, dim, dim.id === selectedDimId, isExport);
        });
      }

      // 8. Guides Overlay (preview only)
      if (!isExport) {
        drawGuides(ctx, 800, 800, stg, anl);
      }
    } catch (err) {
      console.error('Canvas render error:', err);
      setRenderError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceImg, selectedDimId]);

  // Re-render pipeline hooks
  useEffect(() => {
    if (!sourceImg) return;
    drawOriginalCanvas(sourceImg, settings, activeTab);
    renderProcessedImage(settings, analysis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceImg, settings, activeTab, analysis, dimensions]);

  useEffect(() => {
    if (activeTab === 'background') {
      queueMicrotask(() => setEraseMode('keep'));
    }
  }, [activeTab]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRAPHICS DRAWING HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════
  function drawBgTemplate(ctx, w, h, stg, isExport = false) {
    ctx.save();

    // Custom background image (if uploaded)
    if (stg.backgroundType === 'custom' && customBgImageRef.current) {
      ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0,0,w,h);
      const img = customBgImageRef.current;
      const scaleX = w / img.naturalWidth;
      const scaleY = h / img.naturalHeight;
      const scale = Math.max(scaleX, scaleY);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh);
      ctx.restore();
      return;
    }

    switch (stg.backgroundType) {
      case 'none':
      case 'transparent': {
        if (isExport) {
          ctx.clearRect(0,0,w,h);
        } else {
          // Classic checkerboard pattern
          ctx.fillStyle = '#181c26'; ctx.fillRect(0,0,w,h);
          ctx.fillStyle = '#232836';
          const cs = 20;
          for (let y = 0; y < h; y += cs * 2) {
            for (let x = 0; x < w; x += cs * 2) {
              ctx.fillRect(x, y, cs, cs);
              ctx.fillRect(x + cs, y + cs, cs, cs);
            }
          }
        }
        break;
      }
      case 'white':
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h); break;
      case 'black':
        ctx.fillStyle = '#0f0f11'; ctx.fillRect(0,0,w,h); break;
      case 'luxury': {
        const g = ctx.createRadialGradient(w/2,h/2,50,w/2,h/2,w*0.7);
        g.addColorStop(0,'#1e293b'); g.addColorStop(1,'#0b0f19');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h); break;
      }
      case 'gold': {
        const g = ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*0.8);
        g.addColorStop(0,'#451a03'); g.addColorStop(0.5,'#1e1b4b'); g.addColorStop(1,'#090514');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h); break;
      }
      case 'velvet': {
        const g = ctx.createRadialGradient(w/2,h/2,50,w/2,h/2,w*0.7);
        g.addColorStop(0,'#7f1d1d'); g.addColorStop(1,'#180003');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h); break;
      }
      case 'obsidian': {
        const g = ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*0.8);
        g.addColorStop(0,'#1f1f1f'); g.addColorStop(1,'#0a0a0a');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 40;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(-100+i*220, 0); ctx.lineTo(100+i*220, h); ctx.stroke();
        }
        break;
      }
      case 'golden_aura': {
        const g = ctx.createRadialGradient(w/2,h/2,50,w/2,h/2,w*0.75);
        g.addColorStop(0,'rgba(212,175,55,0.25)'); g.addColorStop(0.6,'rgba(139,108,27,0.15)'); g.addColorStop(1,'rgba(5,5,10,0.95)');
        ctx.fillStyle = '#050508'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h); break;
      }
      case 'gradient_blue': {
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#0f0c29'); g.addColorStop(0.5,'#302b63'); g.addColorStop(1,'#24243e');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h); break;
      }
      case 'gradient_green': {
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#004d40'); g.addColorStop(1,'#1b5e20');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h); break;
      }
      default:
        ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0,0,w,h); break;
    }
    ctx.restore();
  };

  function drawDimensionLine(ctx, dim, isSelected, isExport) {
    const { x1, y1, x2, y2, label, color, thickness = 3, arrowStyle = 'double' } = dim;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = thickness;

    // 1. Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 2. Draw arrowheads
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 12 + parseFloat(thickness);

    const drawHead = (x, y, ang) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowLength, -arrowLength * 0.5);
      ctx.lineTo(-arrowLength * 0.7, 0);
      ctx.lineTo(-arrowLength, arrowLength * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    if (arrowStyle === 'double' || arrowStyle === 'start') {
      drawHead(x1, y1, angle);
    }
    if (arrowStyle === 'double' || arrowStyle === 'end') {
      drawHead(x2, y2, angle + Math.PI);
    }

    // 3. Draw text label pill
    if (label) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      ctx.font = 'bold 15px Phetsarath OT, Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const padX = 10, padY = 6;
      const rectW = textWidth + padX * 2;
      const rectH = 22 + padY * 2;
      const rectX = mx - rectW / 2;
      const rectY = my - rectH / 2;

      // Draw background box
      ctx.fillStyle = 'rgba(11, 15, 25, 0.9)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(rectX, rectY, rectW, rectH, 6);
      } else {
        ctx.rect(rectX, rectY, rectW, rectH);
      }
      ctx.fill();

      // Draw box border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(rectX, rectY, rectW, rectH, 6);
      } else {
        ctx.rect(rectX, rectY, rectW, rectH);
      }
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my);
    }

    // 4. Draw drag handles (preview mode only)
    if (!isExport && activeTab === 'dimensions') {
      const drawHandle = (hx, hy) => {
        ctx.beginPath();
        ctx.arc(hx, hy, 9, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'var(--gold-primary)' : 'rgba(255,255,255,0.75)';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      drawHandle(x1, y1);
      drawHandle(x2, y2);
    }

    ctx.restore();
  };

  function drawFrame(ctx, w, h, stg) {
    ctx.save();
    ctx.globalAlpha = stg.frameOpacity;
    const sz = stg.frameSize, pad = 12;
    const fx = pad, fy = pad, fw = w - pad*2, fh = h - pad*2;
    let grad;
    if (stg.frameType === 'gold') {
      grad = ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#ffd700'); grad.addColorStop(0.25,'#d4af37');
      grad.addColorStop(0.5,'#aa771c'); grad.addColorStop(0.75,'#f5d76e'); grad.addColorStop(1,'#d4af37');
    } else if (stg.frameType === 'silver') {
      grad = ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#e2e8f0'); grad.addColorStop(0.5,'#94a3b8'); grad.addColorStop(1,'#cbd5e1');
    } else {
      grad = 'rgba(17,24,39,0.85)';
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = sz;
    ctx.strokeRect(fx + sz/2, fy + sz/2, fw - sz, fh - sz);
    ctx.restore();
  };

  async function drawWatermark(ctx, w, h, stg) {
    ctx.save();
    ctx.globalAlpha = stg.watermarkOpacity;
    const margin = 25;
    let text = stg.watermarkText;

    if (stg.watermarkType === 'sku') {
      text = 'SKU: ' + (imageUrl ? imageUrl.split('/').pop().split('?')[0] : 'AMULET');
    }

    ctx.font = `bold ${stg.watermarkSize}px Phetsarath OT, Inter, sans-serif`;
    const tw = ctx.measureText(text).width;
    const th = stg.watermarkSize;

    let tx = w - tw - margin, ty = h - margin;
    if (stg.watermarkPosition === 'top-left') { tx = margin; ty = margin + th; }
    else if (stg.watermarkPosition === 'top-right') { tx = w - tw - margin; ty = margin + th; }
    else if (stg.watermarkPosition === 'center') { tx = (w - tw)/2; ty = (h + th)/2; }
    else if (stg.watermarkPosition === 'bottom-left') { tx = margin; ty = h - margin; }

    if (stg.watermarkType === 'qr') {
      const size = stg.watermarkSize * 4;
      let qx = w - size - margin, qy = h - size - margin;
      if (stg.watermarkPosition === 'top-left') { qx = margin; qy = margin; }
      else if (stg.watermarkPosition === 'top-right') { qx = w - size - margin; qy = margin; }
      else if (stg.watermarkPosition === 'center') { qx = (w - size)/2; qy = (h - size)/2; }
      else if (stg.watermarkPosition === 'bottom-left') { qx = margin; qy = h - size - margin; }

      try {
        const qrUrl = await QRCode.toDataURL('KP-Amulet-ID');
        const qrImg = new Image();
        await new Promise((res, rej) => {
          qrImg.onload = res; qrImg.onerror = rej; qrImg.src = qrUrl;
        });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qx - 4, qy - 4, size + 8, size + 8);
        ctx.drawImage(qrImg, qx, qy, size, size);
      } catch (e) {
        console.warn('QR code generation failed:', e);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(text, tx, ty);
    }
    ctx.restore();
  };

  function drawGuides(ctx, w, h, stg, anl) {
    ctx.save();
    ctx.lineWidth = 1;

    // Grid 3x3
    if (stg.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo((w/3)*i, 0); ctx.lineTo((w/3)*i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h/3)*i); ctx.lineTo(w, (h/3)*i); ctx.stroke();
      }
    }

    // Safe Area
    if (stg.showSafeArea) {
      ctx.strokeStyle = 'rgba(46,204,113,0.3)';
      ctx.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
    }

    // Boundary box
    if (stg.showBoundary && anl) {
      ctx.strokeStyle = 'rgba(212,175,55,0.45)';
      ctx.setLineDash([5,5]);
      ctx.strokeRect(anl.minX, anl.minY, anl.width, anl.height);
    }

    // Center crosshair
    if (stg.showCenter) {
      ctx.strokeStyle = 'rgba(231,76,60,0.4)';
      ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    }
    ctx.restore();
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CROP WORKSPACE TOUCH/MOUSE COORDINATES TRANSLATIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  const getCanvasCoords = (clientX, clientY) => {
    if (!eraserContainerRef.current) return null;
    const rect = eraserContainerRef.current.getBoundingClientRect();
    const viewX = clientX - rect.left;
    const viewY = clientY - rect.top;

    const canvasW = 800, canvasH = 800;
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    const canvasX = viewX * scaleX;
    const canvasY = viewY * scaleY;

    // Apply inverse image transformations to draw exactly on image pixels
    const stg = settingsRef.current;
    const ox = canvasX - 400;
    const oy = canvasY - 400;

    const rad = (-stg.rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = (ox * cos + oy * sin) / (stg.scale || 1);
    const ry = (-ox * sin + oy * cos) / (stg.scale || 1);

    const finalX = rx - (stg.translateX - 400);
    const finalY = ry - (stg.translateY - 400);

    return { x: finalX, y: finalY, canvasX, canvasY, viewX, viewY };
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // INTERACTIVE PAINT BRUSH STROKES
  // ═══════════════════════════════════════════════════════════════════════════════
  const drawMaskStroke = (x1, y1, x2, y2) => {
    const mode = eraseModeRef.current;
    const sz = brushSizeRef.current;

    const strokeTo = (canvas, color, composite) => {
      const c = canvas.getContext('2d');
      c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = sz;
      c.globalCompositeOperation = composite;
      c.strokeStyle = color;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.globalCompositeOperation = 'source-over';
    };

    if (mode === 'erase') {
      strokeTo(getMaskCanvas(), 'rgba(0,0,0,1)', 'source-over');
    } else if (mode === 'restore') {
      strokeTo(getMaskCanvas(), 'rgba(0,0,0,1)', 'destination-out');
      strokeTo(getKeepMaskCanvas(), 'rgba(0,0,0,1)', 'destination-out');
      strokeTo(getRemoveMaskCanvas(), 'rgba(0,0,0,1)', 'destination-out');
    } else if (mode === 'keep') {
      strokeTo(getKeepMaskCanvas(), 'rgba(0,255,0,1)', 'source-over');
      strokeTo(getRemoveMaskCanvas(), 'rgba(0,0,0,1)', 'destination-out');
    } else if (mode === 'remove') {
      strokeTo(getRemoveMaskCanvas(), 'rgba(255,0,0,1)', 'source-over');
      strokeTo(getKeepMaskCanvas(), 'rgba(0,0,0,1)', 'destination-out');
    }

    renderProcessedImage(settingsRef.current, analysisRef.current);
  };

  const handleEraserMouseDown = (e) => {
    e.preventDefault();
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (!c) return;
    setIsDrawing(true);
    lastDrawingPos.current = c;
    drawMaskStroke(c.x, c.y, c.x, c.y);
  };

  const handleEraserMouseMove = (e) => {
    e.preventDefault();
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (!c) { setBrushPos(null); return; }
    setBrushPos({ x: c.viewX, y: c.viewY });
    if (isDrawing && lastDrawingPos.current) {
      drawMaskStroke(lastDrawingPos.current.x, lastDrawingPos.current.y, c.x, c.y);
      lastDrawingPos.current = c;
    }
  };

  const handleEraserMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastDrawingPos.current = null;
      // Push history
      const s = settingsRef.current;
      setHistory(prev => {
        const slice = prev.slice(0, historyIndex + 1);
        slice.push({ settings: s, maskDataUrl: getMaskDataUrl() });
        setHistoryIndex(slice.length - 1);
        return slice;
      });
    }
  };

  const handleEraserTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const c = getCanvasCoords(t.clientX, t.clientY);
    if (!c) return;
    setIsDrawing(true);
    lastDrawingPos.current = c;
    drawMaskStroke(c.x, c.y, c.x, c.y);
  };

  const handleEraserTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const c = getCanvasCoords(t.clientX, t.clientY);
    if (!c) return;
    setBrushPos({ x: c.viewX, y: c.viewY });
    if (isDrawing && lastDrawingPos.current) {
      drawMaskStroke(lastDrawingPos.current.x, lastDrawingPos.current.y, c.x, c.y);
      lastDrawingPos.current = c;
    }
  };

  const handleEraserTouchEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastDrawingPos.current = null;
      setBrushPos(null);
      const s = settingsRef.current;
      setHistory(prev => {
        const slice = prev.slice(0, historyIndex + 1);
        slice.push({ settings: s, maskDataUrl: getMaskDataUrl() });
        setHistoryIndex(slice.length - 1);
        return slice;
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DIMENSIONS MEASURING EVENTS HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const getDistance = (px, py, qx, qy) => {
    return Math.sqrt((px - qx) ** 2 + (py - qy) ** 2);
  };

  const getDistanceToLine = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return getDistance(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return getDistance(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  };

  const handleDimMouseDown = (e) => {
    e.preventDefault();
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (!c) return;
    const { canvasX, canvasY } = c;

    // Check click near endpoints handles (radius 25px)
    for (let dim of dimensionsRef.current) {
      if (getDistance(canvasX, canvasY, dim.x1, dim.y1) < 25) {
        setSelectedDimId(dim.id);
        setDraggedDimPoint({ id: dim.id, point: 'start' });
        return;
      }
      if (getDistance(canvasX, canvasY, dim.x2, dim.y2) < 25) {
        setSelectedDimId(dim.id);
        setDraggedDimPoint({ id: dim.id, point: 'end' });
        return;
      }
    }

    // Check click near the lines themselves (18px buffer)
    for (let dim of dimensionsRef.current) {
      if (getDistanceToLine(canvasX, canvasY, dim.x1, dim.y1, dim.x2, dim.y2) < 18) {
        setSelectedDimId(dim.id);
        return;
      }
    }

    setSelectedDimId(null);
  };

  const handleDimMouseMove = (e) => {
    e.preventDefault();
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (!c) return;
    const { canvasX, canvasY } = c;

    if (draggedDimPoint) {
      setDimensions(prev => prev.map(dim => {
        if (dim.id === draggedDimPoint.id) {
          if (draggedDimPoint.point === 'start') {
            return { ...dim, x1: Math.round(canvasX), y1: Math.round(canvasY) };
          } else {
            return { ...dim, x2: Math.round(canvasX), y2: Math.round(canvasY) };
          }
        }
        return dim;
      }));
    }
  };

  const handleDimMouseUp = () => {
    setDraggedDimPoint(null);
  };

  // ROUTER FOR EVENTS
  const handleCanvasMouseDown = (e) => {
    if (activeTab === 'dimensions') {
      handleDimMouseDown(e);
    } else {
      handleEraserMouseDown(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (activeTab === 'dimensions') {
      handleDimMouseMove(e);
    } else {
      handleEraserMouseMove(e);
    }
  };

  const handleCanvasMouseUp = () => {
    if (activeTab === 'dimensions') {
      handleDimMouseUp();
    } else {
      handleEraserMouseUp();
    }
  };

  const handleCanvasTouchStart = (e) => {
    if (activeTab === 'dimensions') {
      const t = e.touches[0];
      const mockEvent = { clientX: t.clientX, clientY: t.clientY, preventDefault: () => {} };
      handleDimMouseDown(mockEvent);
    } else {
      handleEraserTouchStart(e);
    }
  };

  const handleCanvasTouchMove = (e) => {
    if (activeTab === 'dimensions') {
      const t = e.touches[0];
      const mockEvent = { clientX: t.clientX, clientY: t.clientY, preventDefault: () => {} };
      handleDimMouseMove(mockEvent);
    } else {
      handleEraserTouchMove(e);
    }
  };

  const handleCanvasTouchEnd = (e) => {
    if (activeTab === 'dimensions') {
      handleDimMouseUp();
    } else {
      handleEraserTouchEnd(e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // BEFORE/AFTER SLIDER INTERACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleSliderMouseDown = () => {
    setIsDraggingSlider(true);
  };

  const handleSliderMouseMove = (e) => {
    if (!isDraggingSlider || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  const handleSliderMouseUpOrLeave = () => {
    setIsDraggingSlider(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // HISTORY ACTIONS (UNDO/REDO/RESET)
  // ═══════════════════════════════════════════════════════════════════════════════
  const updateSettings = (newStg) => {
    setSettings(prev => {
      const updated = { ...prev, ...newStg };
      settingsRef.current = updated;

      // Push state to history
      setHistory(hPrev => {
        const slice = hPrev.slice(0, historyIndex + 1);
        slice.push({ settings: updated, maskDataUrl: getMaskDataUrl() });
        setHistoryIndex(slice.length - 1);
        return slice;
      });

      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const step = history[nextIndex];
      setHistoryIndex(nextIndex);
      setSettings(step.settings);
      settingsRef.current = step.settings;
      restoreMaskFromDataUrl(step.maskDataUrl, () => {
        renderProcessedImage(step.settings, analysisRef.current);
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const step = history[nextIndex];
      setHistoryIndex(nextIndex);
      setSettings(step.settings);
      settingsRef.current = step.settings;
      restoreMaskFromDataUrl(step.maskDataUrl, () => {
        renderProcessedImage(step.settings, analysisRef.current);
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('ລ້າງການແກ້ໄຂທັງໝົດ ແລະ ເລີ່ມຕົ້ນໃໝ່ ຫຼື ບໍ່?')) {
      clearMask();
      setSettings(defaultSettings);
      settingsRef.current = defaultSettings;
      setDimensions([]);
      setHistory([{ settings: defaultSettings, maskDataUrl: '' }]);
      setHistoryIndex(0);
      renderProcessedImage(defaultSettings, analysisRef.current);
    }
  };

  const handleAiAutoArrange = () => {
    if (!analysis) return;
    const maxDimension = Math.max(analysis.width, analysis.height);
    const calculatedScale = Math.min(2.5, 600 / maxDimension);
    updateSettings({
      rotate: -analysis.skewAngle,
      scale: calculatedScale,
      translateX: (400 - analysis.centerX) * calculatedScale,
      translateY: (400 - analysis.centerY) * calculatedScale,
      showCenter: true, showSafeArea: true
    });
  };

  const handleTriggerAiExtract = () => {
    if (!sourceImg) return;
    setIsExtractingBg(true);
    setTimeout(() => {
      extractAmuletOutline(sourceImg, settings.bgThreshold);
      renderProcessedImage(settings, analysis);
      setIsExtractingBg(false);
    }, 1200);
  };

  const handleLocalUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        clearMask();
        setSettings(defaultSettings);
        setSourceImg(img);
        setDimensions([]);
        setHistory([{ settings: defaultSettings, maskDataUrl: '' }]);
        setHistoryIndex(0);
        runAnalysis(img);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPORT / SAVE LOGIC
  // ═══════════════════════════════════════════════════════════════════════════════
  const generateExportDataUrl = async () => {
    let size = 800;
    if (exportSize === 'zoom') size = 1200;
    else if (exportSize === 'thumbnail') size = 150;
    else if (exportSize === 'social') size = 1080;

    // Render cleanly without helper guides or handles
    await renderProcessedImage(settingsRef.current, analysisRef.current, true);

    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const pc = processedCanvasRef.current;
    if (pc) ctx.drawImage(pc, 0, 0, size, size);

    // Restore guides and controls in editor preview
    await renderProcessedImage(settingsRef.current, analysisRef.current, false);

    let mimeType = 'image/webp';
    if (exportFormat === 'png') mimeType = 'image/png';
    if (exportFormat === 'jpeg') mimeType = 'image/jpeg';
    return c.toDataURL(mimeType, 0.92);
  };

  const handleSaveAction = async () => {
    try {
      const dataUrl = await generateExportDataUrl();
      if (onSave) onSave(dataUrl);
    } catch (err) {
      alert('❌ ບໍ່ສາມາດບັນທຶກຮູບພາບໄດ້: ' + err.message);
    }
  };

  const handleExportDownload = async () => {
    try {
      const dataUrl = await generateExportDataUrl();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `amulet_export_${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('❌ ບໍ່ສາມາດດາວໂຫຼດຮູບພາບໄດ້: ' + err.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // JSX RENDERING
  // ═══════════════════════════════════════════════════════════════════════════════
  const isMobile = window.innerWidth <= 768;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className={inline ? 'ai-editor-inline' : 'ai-editor-modal-backdrop'} style={inline ? {} : {
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(5,5,8,0.96)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:1000, padding:'20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: inline ? '100%' : '95%', maxWidth:'1400px',
        height: inline ? 'auto' : '90vh', minHeight:'650px',
        display:'flex', flexDirection:'column',
        border:'1px solid rgba(212,175,55,0.25)',
        boxShadow:'0 10px 40px rgba(0,0,0,0.8)',
        overflow:'hidden', background:'#070a13'
      }}>
        {/* ── HEADER ── */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'16px 20px', borderBottom:'1px solid var(--border-color)',
          background:'rgba(11,15,25,0.8)', flexWrap:'wrap', gap:'10px'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.03458 19.176 5.09904 19.4354 5.02113 19.6738C4.78652 20.3916 4.98606 21.1962 5.56848 21.6888C6.01258 22.0645 6.6083 22.148 7.12642 21.9056C7.38289 21.7856 7.67499 21.849 7.86311 22.0371C8.98394 23.158 10.4283 22 12 22Z"/><circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"/><circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"/></svg>
            <div>
              <h2 style={{ color:'var(--gold-primary)', margin:0, fontSize:'1.1rem', fontWeight:'bold' }}>
                AI Amulet Image Editor (ລະບົບແຕ່ງຮູບພຣະເຄື່ອງ)
              </h2>
              <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                ຈັດອົງປະກອບ · ລຶບພື້ນຫຼັງ · ໃສ່ກອບ · ໃສ່ລາຍນ້ຳ · ຢາງລົບ · ສົ່ງອອກ
              </span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <button onClick={handleUndo} disabled={!canUndo}
              style={{ background:canUndo?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', color:canUndo?'white':'#555', padding:'6px 14px', borderRadius:'8px', cursor:canUndo?'pointer':'default', fontSize:'0.78rem' }}>
              ↩ Undo (ຍ້ອນກັບ)
            </button>
            <button onClick={handleRedo} disabled={!canRedo}
              style={{ background:canRedo?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', color:canRedo?'white':'#555', padding:'6px 14px', borderRadius:'8px', cursor:canRedo?'pointer':'default', fontSize:'0.78rem' }}>
              ↪ Redo (ເຮັດຊ້ຳ)
            </button>
            <button onClick={handleReset}
              style={{ background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.25)', color:'var(--alert-red)', padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'0.78rem', fontWeight:'bold' }}>
              ⬛ Reset (ເລີ່ມໃໝ່)
            </button>
            <button onClick={handleAiAutoArrange} disabled={!analysis}
              style={{ background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.08))', border:'1px solid rgba(212,175,55,0.35)', color:'var(--gold-primary)', padding:'6px 16px', borderRadius:'8px', cursor:analysis?'pointer':'default', fontSize:'0.78rem', fontWeight:'bold' }}>
              ✨ AI Auto Arrange (ຈັດອົງສະລຽດ)
            </button>
            {!inline && (
              <button onClick={onClose}
                style={{ background:'rgba(231,76,60,0.1)', color:'var(--alert-red)', border:'1px solid rgba(231,76,60,0.25)', padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'0.8rem' }}>
                ✕ ປິດ
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ display:'flex', flex:1, overflow:'hidden', flexDirection:isMobile?'column':'row' }}>
          {/* ── TAB NAVIGATION BAR ── */}
          <div style={{
            width:isMobile?'100%':'80px', borderRight:'1px solid var(--border-color)',
            borderBottom:isMobile?'1px solid var(--border-color)':'none',
            background:'#0b0f19', display:'flex',
            flexDirection:isMobile?'row':'column',
            padding:'10px 0', gap:'4px', overflowX:'auto'
          }}>
            {[
              { id:'crop',       icon:'📐', label:'ຈັດຮູບ' },
              { id:'enhance',    icon:'✨', label:'ປับແສງ' },
              { id:'eraser',     icon:'🧹', label:'ຢາງລົບ' },
              { id:'background', icon:'🎨', label:'ພື້ນຫຼັງ' },
              { id:'dimensions', icon:'📏', label:'ຂະໜາດ' },
              { id:'frame',      icon:'🖼️', label:'ກອບ' },
              { id:'watermark',  icon:'🏷️', label:'ລາຍນ້ຳ' },
              { id:'export',     icon:'💾', label:'ສົ່ງອອກ' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                width:isMobile?'auto':'100%', padding:'12px 6px',
                background:activeTab===tab.id?'rgba(212,175,55,0.1)':'transparent',
                border:'none',
                borderLeft:!isMobile?(activeTab===tab.id?'3px solid var(--gold-primary)':'3px solid transparent'):'none',
                borderBottom:isMobile?(activeTab===tab.id?'3px solid var(--gold-primary)':'3px solid transparent'):'none',
                color:activeTab===tab.id?'var(--gold-primary)':'var(--text-secondary)',
                cursor:'pointer', display:'flex', flexDirection:'column',
                alignItems:'center', gap:'4px', fontSize:'0.68rem', fontWeight:'bold', whiteSpace:'nowrap'
              }}>
                <span style={{ fontSize:'1.2rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CANVAS DISPLAY WORKSPACE AREA ── */}
          <div style={{
            flex:1, background:'#04060b', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', padding:'20px',
            position:'relative', overflow:'hidden', gap:'12px'
          }}>
            {/* Analysis details badge overlay */}
            {analysis && (
              <div style={{
                position:'absolute', top:'15px', left:'15px', right:'15px',
                display:'flex', justifyContent:'space-between', zIndex:10,
                flexWrap:'wrap', gap:'8px', fontSize:'0.7rem',
                color:'var(--text-secondary)', background:'rgba(11,15,25,0.85)',
                padding:'6px 12px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.05)'
              }}>
                <span>📐 <b>ຂະໜາດ:</b> {analysis.width}×{analysis.height}px
                  &nbsp;|&nbsp;📍 <b>ຈຸດກາງ:</b> {analysis.centerX},{analysis.centerY}
                </span>
                <span>✨ <b>ຄວາມຄົມ:</b> <span style={{color:analysis.sharpness>60?'#2ecc71':'#f1c40f'}}>{analysis.sharpness}%</span>
                  &nbsp;|&nbsp;💡 <b>ມຸມ:</b> <span style={{color:Math.abs(analysis.skewAngle)>2?'#e74c3c':'#2ecc71'}}>{analysis.skewAngle}°</span>
                </span>
              </div>
            )}

            {/* Error banner block */}
            {renderError && (
              <div style={{ background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.3)', color:'var(--alert-red)', padding:'10px', borderRadius:'8px', fontSize:'0.78rem', maxWidth:'400px', textAlign:'center', zIndex:100 }}>
                ⚠️ <b>ຂໍ້ຜິດພາດໃນການແຕ້ມຮູບ:</b> {renderError}<br/>
                <button onClick={() => setRenderError('')} style={{ marginTop:'6px', padding:'3px 8px', background:'var(--alert-red)', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem', fontWeight:'bold' }}>ປິດ</button>
              </div>
            )}

            {/* Canvas State Machine switcher */}
            {isAnalyzing ? (
              <div style={{ textAlign:'center', color:'var(--gold-primary)' }}>
                <div style={{ border:'4px solid rgba(212,175,55,0.1)', borderTop:'4px solid var(--gold-primary)', borderRadius:'50%', width:'40px', height:'40px', animation:'spin 1s infinite linear', margin:'0 auto 16px' }} />
                <p>AI ກຳລັງວິເຄາະຮູບພາບ...</p>
              </div>
            ) : sourceImg ? (
              (activeTab === 'eraser' || activeTab === 'background' || activeTab === 'dimensions') ? (
                /* ── DUAL ACTIVE INTERACTION CANVAS (Eraser / Smart Brush / Dimensions annotation) ── */
                <div ref={eraserContainerRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                  style={{
                    position:'relative', width:'100%', maxWidth:'480px', aspectRatio:'1',
                    background:'#0d0d0d', borderRadius:'12px', overflow:'hidden',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
                    cursor: activeTab === 'dimensions' ? 'default' : 'crosshair',
                    userSelect:'none', touchAction:'none'
                  }}
                >
                  <canvas ref={processedCanvasRef} style={{ width:'100%', height:'100%', display:'block' }} />
                  {/* Visual Brush Hover Indicator */}
                  {brushPos && activeTab !== 'dimensions' && (
                    <div style={{
                      position:'absolute',
                      left: brushPos.x,
                      top: brushPos.y,
                      width: `${(brushSizeRef.current / 800) * 100}%`,
                      height: `${(brushSizeRef.current / 800) * 100}%`,
                      borderRadius:'50%',
                      border: eraseMode==='erase'||eraseMode==='remove' ? '2px solid rgba(231,76,60,0.9)' : '2px solid rgba(46,204,113,0.9)',
                      background: eraseMode==='remove' ? 'rgba(255,0,0,0.2)' : eraseMode==='keep' ? 'rgba(0,255,0,0.15)' : eraseMode==='erase' ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
                      transform:'translate(-50%,-50%)',
                      pointerEvents:'none', zIndex:20
                    }} />
                  )}
                  {activeTab !== 'dimensions' && (
                    <span style={{
                      position:'absolute', top:'10px', left:'10px',
                      background: eraseMode==='erase'?'rgba(231,76,60,0.85)':eraseMode==='remove'?'rgba(192,57,43,0.9)':eraseMode==='keep'?'rgba(39,174,96,0.9)':'rgba(46,204,113,0.85)',
                      color:'white', padding:'3px 10px', borderRadius:'4px',
                      fontSize:'0.68rem', fontWeight:'bold', zIndex:10
                    }}>
                      {eraseMode==='erase' ? '🧽 ລຶບ (Erase)' : eraseMode==='restore' ? '🎨 ກູ້ຄືນ (Restore)' : eraseMode==='keep' ? '🟢 ຮັກສາ (Keep)' : '🔴 ລຶບ AI (Remove)'}
                    </span>
                  )}
                  {activeTab === 'dimensions' && (
                    <span style={{
                      position:'absolute', top:'10px', left:'10px',
                      background: 'rgba(212,175,55,0.95)',
                      color:'black', padding:'4px 12px', borderRadius:'6px',
                      fontSize:'0.72rem', fontWeight:'bold', zIndex:10,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      border: '1px solid #ffffff'
                    }}>
                      📐 ໂໝດແທກຂະໜາດ (Drag ends to measure)
                    </span>
                  )}
                </div>
              ) : (
                /* ── COMPONENT DUAL SLIDER WORKSPACE (Crop / Filters / Frame / Watermark) ── */
                <div ref={sliderContainerRef}
                  onMouseMove={handleSliderMouseMove}
                  onMouseUp={handleSliderMouseUpOrLeave}
                  onMouseLeave={handleSliderMouseUpOrLeave}
                  style={{
                    position:'relative', width:'100%', maxWidth:'480px', aspectRatio:'1',
                    background:'#0d0d0d', borderRadius:'12px', overflow:'hidden',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
                    cursor:isDraggingSlider?'ew-resize':'default', userSelect:'none'
                  }}
                >
                  {/* BEFORE (Left original side) */}
                  <canvas ref={originalCanvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} />
                  <span style={{ position:'absolute', bottom:'10px', left:'10px', background:'rgba(0,0,0,0.6)', color:'#888', padding:'2px 8px', borderRadius:'4px', fontSize:'0.63rem', zIndex:5 }}>
                    BEFORE
                  </span>

                  {/* AFTER (Right filtered side with slider drag bar) */}
                  <div style={{ position:'absolute', top:0, left:0, width:`${sliderPosition}%`, height:'100%', overflow:'hidden', borderRight:'2px solid var(--gold-primary)', zIndex:2 }}>
                    <canvas ref={processedCanvasRef} style={{
                      position:'absolute', top:0, left:0,
                      width: '100%',
                      height: '100%'
                    }} />
                  </div>

                  {/* Split slider center knob handler */}
                  <div onMouseDown={handleSliderMouseDown} style={{
                    position:'absolute', top:0, left:`calc(${sliderPosition}% - 14px)`,
                    width:'28px', height:'100%', cursor:'ew-resize', zIndex:10,
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    <div style={{ width:'4px', height:'40px', background:'var(--gold-primary)', borderRadius:'2px', boxShadow:'0 0 8px var(--gold-primary)' }} />
                  </div>
                  <span style={{ position:'absolute', bottom:'10px', right:'10px', background:'rgba(0,0,0,0.6)', color:'var(--gold-primary)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.63rem', zIndex:5 }}>
                    AFTER
                  </span>
                </div>
              )
            ) : (
              <div style={{ textAlign:'center', color:'var(--text-secondary)' }}>
                <input type="file" accept="image/*" onChange={handleLocalUpload} style={{ display:'none' }} id="editorInitUpload" />
                <label htmlFor="editorInitUpload" style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'16px',
                  padding:'50px 70px', border:'2.5px dashed rgba(212,175,55,0.3)', borderRadius:'16px',
                  background:'rgba(212,175,55,0.02)', cursor:'pointer', transition:'all 0.25s',
                  color:'var(--gold-primary)', fontWeight:'bold', borderStyle:'dashed',
                  boxShadow:'inset 0 0 20px rgba(0,0,0,0.4)'
                }}>
                  <span style={{ fontSize:'3rem', filter:'drop-shadow(0 0 10px rgba(212,175,55,0.2))' }}>📸</span>
                  <span style={{ fontSize:'0.9rem' }}>📂 ກົດບ່ອນນີ້ເພື່ອອັບໂຫຼດຮູບພາບ (Upload Photo)</span>
                  <span style={{ fontSize:'0.72rem', color:'#777', fontWeight:'normal' }}>ຮອງຮັບໄຟລ໌ PNG, JPG, JPEG, WEBP</span>
                </label>
              </div>
            )}

            {/* Secondary upload replace link */}
            {sourceImg && (
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
                <input type="file" accept="image/*" onChange={handleLocalUpload} style={{ display:'none' }} id="editorReplaceInput" />
                <label htmlFor="editorReplaceInput" style={{
                  cursor:'pointer', padding:'6px 16px', borderRadius:'8px', fontSize:'0.75rem',
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                  color:'#ccc', display:'flex', alignItems:'center', gap:'6px'
                }}>
                  📂 ປ່ຽນຮູບພາບ
                </label>
                {analysis && (
                  <span style={{ fontSize:'0.72rem', color:'#666', alignSelf:'center' }}>
                    Stack [{historyIndex+1}/{history.length}] · AI Ready
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── SIDEBAR CONTROL CONTROLS ── */}
          <div style={{
            width:isMobile?'100%':'320px', borderLeft:'1px solid var(--border-color)',
            background:'#0a0d18', display:'flex', flexDirection:'column', overflow:'hidden'
          }}>
            {/* Sidebar header status */}
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border-color)', background:'rgba(255,255,255,0.02)' }}>
              <h3 style={{ color:'var(--gold-primary)', margin:0, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'8px' }}>
                {activeTab==='crop'       && '📐 ຈັດຮູບ & ອົງປະກອບ'}
                {activeTab==='enhance'    && '✨ ປັບແສງ & ສີ'}
                {activeTab==='eraser'     && '🧹 ຢາງລົບດ້ວຍມື'}
                {activeTab==='background' && '🎨 ພື້ນຫຼັງ (AI BG)'}
                {activeTab==='dimensions' && '📏 ໝາຍມິຕິ & ຂະໜາດ'}
                {activeTab==='frame'      && '🖼️ ໃສ່ກອບ'}
                {activeTab==='watermark'  && '🏷️ ລາຍນ້ຳ'}
                {activeTab==='export'     && '💾 ສົ່ງອອກ & ບັນທຶກ'}
              </h3>
            </div>

            {/* Tab view containers */}
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'16px', flex:1, overflowY:'auto' }}>

              {/* ── CROP TAB ── */}
              {activeTab === 'crop' && (
                <>
                  <SliderRow label="🔄 ໝູນ (Rotate)" value={settings.rotate} min={-180} max={180} step={0.5} unit="°"
                    onChange={v => updateSettings({rotate:v})} />
                  <SliderRow label="🔍 ຂະຫຍາຍ (Scale)" value={settings.scale} min={0.1} max={4} step={0.01}
                    displayFn={v=>`${(v*100).toFixed(0)}%`} onChange={v => updateSettings({scale:v})} />
                  <SliderRow label="↔ ຍ້າຍ X (Move X)" value={settings.translateX} min={-400} max={400} step={1} unit="px"
                    onChange={v => updateSettings({translateX:v})} />
                  <SliderRow label="↕ ຍ້າຍ Y (Move Y)" value={settings.translateY} min={-400} max={400} step={1} unit="px"
                    onChange={v => updateSettings({translateY:v})} />

                  {/* 🔎 VIEWPORT ZOOM & PAN CONTROLS */}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'14px', marginTop: '10px' }}>
                    <p style={{ fontSize:'0.78rem', color:'#aaa', marginBottom:'10px' }}>🔍 ມຸມມອງ (Viewport Zoom & Pan):</p>
                    <SliderRow label="🔎 ຊູມ (Zoom View)" value={zoomLevel} min={1} max={3.5} step={0.05}
                      displayFn={v => `${(v*100).toFixed(0)}%`} onChange={v => setZoomLevel(v)} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxWidth: '150px', margin: '10px auto' }}>
                      <div></div>
                      <button type="button" onClick={() => setPanY(p => p - 15)} style={{ background: '#222', border: '1px solid #444', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}>▲</button>
                      <div></div>
                      <button type="button" onClick={() => setPanX(p => p - 15)} style={{ background: '#222', border: '1px solid #444', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}>◀</button>
                      <button type="button" onClick={() => { setZoomLevel(1); setPanX(0); setPanY(0); }} style={{ background: '#333', border: '1px solid #555', borderRadius: '4px', color: 'var(--gold-primary)', padding: '4px', fontSize: '0.65rem', cursor: 'pointer' }}>Reset</button>
                      <button type="button" onClick={() => setPanX(p => p + 15)} style={{ background: '#222', border: '1px solid #444', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}>▶</button>
                      <div></div>
                      <button type="button" onClick={() => setPanY(p => p + 15)} style={{ background: '#222', border: '1px solid #444', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}>▼</button>
                    </div>
                  </div>

                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'14px' }}>
                    <p style={{ fontSize:'0.78rem', color:'#aaa', marginBottom:'10px' }}>✂️ ຕັດຂອບ (Crop):</p>
                    <SliderRow label="◀ ຕັດຊ້າຍ (Left)" value={settings.cropLeft} min={0} max={49} step={0.5} unit="%"
                      onChange={v => updateSettings({cropLeft:v})} />
                    <SliderRow label="▶ ຕັດຂວา (Right)" value={settings.cropRight} min={0} max={49} step={0.5} unit="%"
                      onChange={v => updateSettings({cropRight:v})} />
                    <SliderRow label="▲ ຕັດເທິງ (Top)" value={settings.cropTop} min={0} max={49} step={0.5} unit="%"
                      onChange={v => updateSettings({cropTop:v})} />
                    <SliderRow label="▼ ຕັດລຸ່ມ (Bottom)" value={settings.cropBottom} min={0} max={49} step={0.5} unit="%"
                      onChange={v => updateSettings({cropBottom:v})} />
                  </div>

                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'14px' }}>
                    <p style={{ fontSize:'0.78rem', color:'#aaa', marginBottom:'10px' }}>📏 ເສັ້ນນຳທາງ (Guides):</p>
                    {[
                      { key:'showBoundary', label:'🔲 ແສດງຂອບອົງພຣະ' },
                      { key:'showCenter',   label:'➕ ແສດງຈຸດກາງ' },
                      { key:'showGrid',     label:'📊 ແສດງ Grid 3x3' },
                      { key:'showSafeArea', label:'🟢 ແສດງ Safe Area' },
                    ].map(g => (
                      <label key={g.key} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.8rem', color:'white', cursor:'pointer', marginBottom:'8px' }}>
                        <input type="checkbox" checked={settings[g.key]} onChange={e => updateSettings({[g.key]: e.target.checked})} />
                        {g.label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* ── ENHANCE TAB ── */}
              {activeTab === 'enhance' && (
                <>
                  <SliderRow label="☀️ ຄວາມສະຫວ່າງ (Brightness)" value={settings.brightness} min={0.1} max={3} step={0.01}
                    displayFn={v=>`${(v*100).toFixed(0)}%`} onChange={v => updateSettings({brightness:v})} />
                  <SliderRow label="🌓 ຄອນທຣາສ (Contrast)" value={settings.contrast} min={0.1} max={3} step={0.01}
                    displayFn={v=>`${(v*100).toFixed(0)}%`} onChange={v => updateSettings({contrast:v})} />
                  <SliderRow label="🌈 ຄວາມອີ່ມສີ (Saturation)" value={settings.saturation} min={0} max={4} step={0.01}
                    displayFn={v=>`${(v*100).toFixed(0)}%`} onChange={v => updateSettings({saturation:v})} />
                  <SliderRow label="🎨 ໂທນສີ (Hue Rotate)" value={settings.hueRotate} min={-180} max={180} step={1} unit="°"
                    onChange={v => updateSettings({hueRotate:v})} />
                  <SliderRow label="💧 ຄວາມມົວ (Blur)" value={settings.blur} min={0} max={15} step={0.1} unit="px"
                    onChange={v => updateSettings({blur:v})} />
                  <SliderRow label="⚫ Vignette (ຂອບມົນ)" value={settings.vignette} min={0} max={100} step={1} unit="%"
                    onChange={v => updateSettings({vignette:v})} />
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.8rem', color:'white', cursor:'pointer' }}>
                    <input type="checkbox" checked={settings.selectiveClarity} onChange={e => updateSettings({selectiveClarity:e.target.checked})} />
                    ✨ AI Highlight (ເນັ້ນຄວາມຊັດສະເພາະ)
                  </label>
                </>
              )}

              {/* ── ERASER TAB ── */}
              {activeTab === 'eraser' && (
                <>
                  <div>
                    <p style={{ fontSize:'0.75rem', color:'#aaa', marginBottom:'6px' }}>🖌️ <b>ໂໝດຢາງລົບ (Erase Mode):</b></p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                      {[
                        { id:'erase',   label:'🧽 ລຶບ (Erase)',    color:'#e74c3c', bg:'rgba(231,76,60,0.25)' },
                        { id:'restore', label:'🎨 ກູ້ຄືນ (Restore)', color:'#2ecc71', bg:'rgba(46,204,113,0.25)' },
                      ].map(m => (
                        <button key={m.id} onClick={() => setEraseMode(m.id)}
                          style={{ padding:'10px 6px', fontSize:'0.78rem', fontWeight:'bold', borderRadius:'8px', border:'none', cursor:'pointer',
                            background: eraseMode===m.id ? m.bg : 'rgba(255,255,255,0.06)',
                            color: eraseMode===m.id ? m.color : '#777',
                            outline: eraseMode===m.id ? `1.5px solid ${m.color}` : 'none'
                          }}>{m.label}</button>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="🖌️ ຂະໜາດແປງ (Brush Size)" value={brushSize} min={3} max={120} step={1} unit="px"
                    onChange={v => setBrushSize(v)} />
                  <button onClick={() => {
                    if (window.confirm('ລ້າງການລະບາຍທັງໝົດ ຫຼື ບໍ່?')) {
                      clearMask();
                      renderProcessedImage(settingsRef.current, analysisRef.current);
                    }
                  }} style={{ padding:'8px', background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.25)', color:'var(--alert-red)', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold' }}>
                    🗑️ ລ້າງການລະບາຍທັງໝົດ (Clear Mask)
                  </button>
                </>
              )}

              {/* ── BACKGROUND TAB ── */}
              {activeTab === 'background' && (
                <>
                  {/* AI BG Removal switches */}
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>
                      🤖 <b>ລຶບພື້ນຫຼັງ AI (Flood-Fill BG Remove):</b>
                    </label>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                      <button onClick={() => updateSettings({removeBackground:true})}
                        style={{ flex:1, padding:'10px', fontSize:'0.8rem', fontWeight:'bold', borderRadius:'8px', border:'none', cursor:'pointer',
                          background:settings.removeBackground?'rgba(46,204,113,0.25)':'rgba(255,255,255,0.07)',
                          color:settings.removeBackground?'#2ecc71':'#888',
                          outline:settings.removeBackground?'1.5px solid #2ecc71':'none' }}>
                        ✂️ ລຶບພື້ນຫຼັງ ON
                      </button>
                      <button onClick={() => updateSettings({removeBackground:false})}
                        style={{ flex:1, padding:'10px', fontSize:'0.8rem', fontWeight:'bold', borderRadius:'8px', border:'none', cursor:'pointer',
                          background:!settings.removeBackground?'rgba(231,76,60,0.2)':'rgba(255,255,255,0.07)',
                          color:!settings.removeBackground?'#e74c3c':'#888',
                          outline:!settings.removeBackground?'1.5px solid #e74c3c':'none' }}>
                        ⊘ OFF
                      </button>
                    </div>

                    {settings.removeBackground && !bgRemoveCorsError && (
                      <button onClick={handleTriggerAiExtract} disabled={isExtractingBg} style={{
                        width:'100%', padding:'11px', marginTop:'2px', marginBottom:'10px',
                        background:'linear-gradient(135deg, #2ecc71, #27ae60)', color:'white',
                        border:'none', borderRadius:'8px', cursor:isExtractingBg?'default':'pointer', fontSize:'0.78rem', fontWeight:'bold',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                        boxShadow:'0 2px 8px rgba(46,204,113,0.3)', transition:'all 0.2s'
                      }}>
                        {isExtractingBg ? (
                          <>
                            <div style={{ border:'2px solid rgba(255,255,255,0.15)', borderTop:'2px solid white', borderRadius:'50%', width:'13px', height:'13px', animation:'spin 1s infinite linear' }} />
                            ກຳລັງປະມວນຜົນຂອບລະອຽດ...
                          </>
                        ) : (
                          '⚡ ປະມວນຜົນຂອບຄົມຊັດ (Auto AI Extract)'
                        )}
                      </button>
                    )}

                    {settings.removeBackground && (
                      bgRemoveCorsError ? (
                        <div style={{ background:'rgba(231,76,60,0.08)', border:'1px solid rgba(231,76,60,0.4)', borderRadius:'8px', padding:'10px', fontSize:'0.73rem' }}>
                          <div style={{ color:'#e74c3c', fontWeight:'bold', marginBottom:'6px' }}>
                            ⚠️ CORS Error — ລຶບພື້ນຫຼັງໃຊ້ງານບໍ່ໄດ້!
                          </div>
                          <div style={{ color:'#ccc', marginBottom:'8px', lineHeight:1.5 }}>
                            ຮູບສິນຄ້ານີ້ <b>ບໍ່ອະນຸຍາດ</b> ໃຫ້ edit pixel ຈາກ URL.<br/>
                            ກະລຸນາ <b>ອັບໂຫຼດຮູບໂດຍກົງ</b> ຈາກເຄື່ອງ ▼
                          </div>
                          <input type="file" accept="image/*" id="bgCorsFixUpload" style={{ display:'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new Image();
                                img.onload = () => {
                                  setSourceImg(img);
                                  clearMask();
                                  setBgRemoveCorsError(false);
                                  setSettings(prev => ({ ...prev, removeBackground: true }));
                                  runAnalysis(img);
                                };
                                img.src = reader.result;
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <label htmlFor="bgCorsFixUpload" style={{
                            display:'block', textAlign:'center', padding:'8px', borderRadius:'6px',
                            background:'rgba(212,175,55,0.2)', border:'1px solid var(--gold-primary)',
                            color:'var(--gold-primary)', cursor:'pointer', fontWeight:'bold', fontSize:'0.78rem'
                          }}>
                            📂 ອັບໂຫຼດຮູບໃໝ່ເພື່ອລຶບພື້ນຫຼັງ
                          </label>
                        </div>
                      ) : (
                        <div style={{ background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.2)', borderRadius:'6px', padding:'8px', fontSize:'0.7rem', color:'#aaa' }}>
                          ✨ <b>AI Auto Wrap:</b> ລະບົບຄຸມຂອບອົງພຣະ (ສີຂຽວ) ໃຫ້ອັດຕະໂນມັດແລ້ວ.<br/>
                          ທາສີ <b>🟢 ຮັກສາ</b> ຫຼື <b>🔴 ລຶບ AI</b> ເທິງຮູບເພື່ອປັບແຕ່ງ.
                        </div>
                      )
                    )}
                  </div>

                  {/* Integrated Smart Brush inside Background tab */}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px' }}>
                    <p style={{ fontSize:'0.75rem', color:'#aaa', marginBottom:'6px' }}>🎯 <b>ແປງຊ່ວຍເລືອກ (Smart Brush):</b></p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', marginBottom:'6px' }}>
                      {[
                        { id:'keep',   label:'🟢 ຮັກສາ (Keep)',    color:'#27ae60', bg:'rgba(39,174,96,0.25)' },
                        { id:'remove', label:'🔴 ລຶບ AI (Remove)',  color:'#c0392b', bg:'rgba(192,57,43,0.25)' },
                        { id:'erase',   label:'🧽 ລຶບມື (Erase)',   color:'#e74c3c', bg:'rgba(231,76,60,0.25)' },
                        { id:'restore', label:'🎨 ກູ້ຄືນ (Restore)', color:'#2ecc71', bg:'rgba(46,204,113,0.25)' },
                      ].map(m => (
                        <button key={m.id} onClick={() => setEraseMode(m.id)}
                          style={{ padding:'8px 4px', fontSize:'0.72rem', fontWeight:'bold', borderRadius:'6px', border:'none', cursor:'pointer',
                            background: eraseMode===m.id ? m.bg : 'rgba(255,255,255,0.06)',
                            color: eraseMode===m.id ? m.color : '#888',
                            outline: eraseMode===m.id ? `1.5px solid ${m.color}` : 'none'
                          }}>{m.label}</button>
                      ))}
                    </div>
                    <SliderRow label="🖌️ ຂະໜາດແປງ (Brush Size)" value={brushSize} min={3} max={100} step={1} unit="px"
                      onChange={v => setBrushSize(v)} />
                    <button onClick={() => {
                      if (window.confirm('ລ້າງການລະບາຍທັງໝົດ ຫຼື ບໍ່?')) {
                        clearMask();
                        renderProcessedImage(settingsRef.current, analysisRef.current);
                      }
                    }} style={{ marginTop:'6px', width:'100%', padding:'6px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.2)', color:'#e74c3c', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem', fontWeight:'bold' }}>
                      🗑️ ລ້າງການລະບາຍທັງໝົດ (Clear Mask)
                    </button>
                  </div>

                  <SliderRow label="🎚️ ຄວາມທົນທาน (Tolerance)" value={settings.bgThreshold} min={5} max={150} step={1} unit=""
                    onChange={v => updateSettings({bgThreshold:v})}
                    displayFn={v => {
                      if(v<30) return `${v} (ເຄັ່ງ)`;
                      if(v<70) return `${v} (ປານກາງ)`;
                      return `${v} (ຫຼວມ)`;
                    }} />

                  {/* BG Templates selection grid */}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px' }}>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>
                      🎨 <b>ພື້ນຫຼັງໃໝ່ (BG Templates):</b>
                    </label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', marginBottom:'8px' }}>
                      {[
                        {id:'none',          label:'❌ ບໍ່ມີ',           bg:'#111'},
                        {id:'transparent',   label:'🔲 ໂປ່ງໃສ',          bg:'repeating-linear-gradient(45deg,#222 0,#222 10px,#333 10px,#333 20px)'},
                        {id:'white',         label:'⬜ ຂາວ',              bg:'#fff', color:'#000'},
                        {id:'black',         label:'⬛ ດຳ',               bg:'#0f0f0f'},
                        {id:'luxury',        label:'💎 Luxury',           bg:'linear-gradient(135deg,#1e293b,#0b0f19)'},
                        {id:'gold',          label:'✨ Gold',              bg:'linear-gradient(135deg,#451a03,#1e1b4b)'},
                        {id:'velvet',        label:'🔴 Velvet',            bg:'linear-gradient(135deg,#7f1d1d,#180003)'},
                        {id:'obsidian',      label:'🪨 Obsidian',          bg:'linear-gradient(135deg,#1f1f1f,#0a0a0a)'},
                        {id:'golden_aura',   label:'👑 Golden Aura',      bg:'linear-gradient(135deg,rgba(212,175,55,0.35),#050508)'},
                        {id:'gradient_blue', label:'🔵 Ocean Blue',       bg:'linear-gradient(135deg,#0f0c29,#302b63)'},
                        {id:'gradient_green',label:'🌿 Forest Green',     bg:'linear-gradient(135deg,#004d40,#1b5e20)'},
                        {id:'custom',        label:'📸 ຮູບຂອງຂ້ອຍ',      bg:'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(0,0,0,0.8))', special:true},
                      ].map(bg => (
                        <button key={bg.id} onClick={() => updateSettings({backgroundType:bg.id})} style={{
                          padding:'8px 4px', borderRadius:'6px', border:'none', cursor:'pointer',
                          background: bg.bg, color: bg.color||'#fff', fontSize:'0.7rem', fontWeight:'bold',
                          outline: settings.backgroundType===bg.id ? '2px solid var(--gold-primary)' : '2px solid transparent',
                          transition:'outline 0.15s', minHeight:'36px'
                        }}>
                          {bg.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Background Image Uploader */}
                    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(212,175,55,0.25)', borderRadius:'8px', padding:'10px' }}>
                      <p style={{ fontSize:'0.75rem', color:'#ccc', marginBottom:'8px' }}>📸 <b>ຮູບພື້ນຫຼັງຂອງຂ້ອຍ (Custom BG):</b></p>
                      <input type="file" accept="image/*" id="customBgInput" style={{ display:'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = () => {
                              setCustomBgImage(img);
                              updateSettings({ backgroundType: 'custom' });
                            };
                            img.src = reader.result;
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <label htmlFor="customBgInput" style={{
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                        padding:'10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem',
                        background: settings.backgroundType==='custom' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)',
                        color: settings.backgroundType==='custom' ? 'var(--gold-primary)' : '#ccc',
                        border: settings.backgroundType==='custom' ? '1.5px solid var(--gold-primary)' : '1.5px solid rgba(255,255,255,0.1)',
                        fontWeight:'bold'
                      }}>
                        📁 {customBgImage ? '✅ ຮູບພື້ນຫຼັງໂຫຼດແລ້ວ (ກົດເພື່ອປ່ຽນ)' : '+ ອັບໂຫຼດຮູບພື້ນຫຼັງ'}
                      </label>
                      {customBgImage && (
                        <button onClick={() => { setCustomBgImage(null); updateSettings({backgroundType:'none'}); }}
                          style={{ marginTop:'6px', width:'100%', padding:'6px', background:'rgba(231,76,60,0.15)', border:'1px solid rgba(231,76,60,0.3)', color:'#e74c3c', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>
                          🗑️ ລຶບຮູບພື້ນຫຼັງທີ່ອັບໂຫຼດ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ✂️ EDGE REFINE & SHADOW PIPELINE CONTROLS */}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px', marginTop: '12px' }}>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>
                      📐 <b>ປັບແຕ່ງຂອບພຣະ (Edge & Shadows):</b>
                    </label>
                    <SliderRow label="🌫️ ຂອບຟຸ້ງ (Feather)" value={settings.edgeFeather} min={0} max={15} step={0.5} unit="px"
                      onChange={v => updateSettings({edgeFeather:v})} />
                    <SliderRow label="🤏 ກິນຂອບ (Choke)" value={settings.edgeChoke} min={-10} max={10} step={1} unit="px"
                      onChange={v => updateSettings({edgeChoke:v})}
                      displayFn={v => v < 0 ? `Choke ${Math.abs(v)}px` : v > 0 ? `Expand ${v}px` : '0px'} />
                    
                    <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <label style={{ fontSize:'0.75rem', color:'#aaa', display:'block', marginBottom:'6px' }}>👤 ເງົາພື້ນຫຼັງ (Drop Shadow):</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button onClick={() => updateSettings({shadowType: 'none'})}
                          style={{ flex: 1, padding: '6px', fontSize: '0.72rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: settings.shadowType === 'none' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                            color: settings.shadowType === 'none' ? 'white' : '#888'
                          }}>❌ ບໍ່ມີເງົາ</button>
                        <button onClick={() => updateSettings({shadowType: 'drop'})}
                          style={{ flex: 1, padding: '6px', fontSize: '0.72rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: settings.shadowType === 'drop' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                            color: settings.shadowType === 'drop' ? 'var(--gold-primary)' : '#888',
                            outline: settings.shadowType === 'drop' ? '1px solid var(--gold-primary)' : 'none'
                          }}>👤 ເງົາຕົກກະທົບ</button>
                      </div>

                      {settings.shadowType === 'drop' && (
                        <>
                          <SliderRow label="🌫️ ເງົາເບຼີ (Shadow Blur)" value={settings.shadowBlur} min={0} max={50} step={1} unit="px"
                            onChange={v => updateSettings({shadowBlur: v})} />
                          <SliderRow label="↔ ໄລຍະ X (Offset X)" value={settings.shadowOffsetX} min={-50} max={50} step={1} unit="px"
                            onChange={v => updateSettings({shadowOffsetX: v})} />
                          <SliderRow label="↕ ໄລຍະ Y (Offset Y)" value={settings.shadowOffsetY} min={-50} max={50} step={1} unit="px"
                            onChange={v => updateSettings({shadowOffsetY: v})} />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#aaa' }}>🎨 ສີເງົາ (Shadow Color):</span>
                            <input type="color" value={settings.shadowColor === 'rgba(0,0,0,0.5)' ? '#000000' : settings.shadowColor} 
                              onChange={e => updateSettings({shadowColor: e.target.value})}
                              style={{ width: '40px', height: '20px', border: 'none', borderRadius: '3px', cursor: 'pointer', background: 'transparent' }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── DIMENSIONS TAB ── */}
              {activeTab === 'dimensions' && (
                <>
                  <button onClick={() => {
                    const newDim = {
                      id: Date.now(),
                      x1: 250, y1: 300,
                      x2: 550, y2: 300,
                      label: '3.5 cm',
                      color: '#d4af37',
                      thickness: 3,
                      arrowStyle: 'double'
                    };
                    setDimensions(prev => [...prev, newDim]);
                    setSelectedDimId(newDim.id);
                  }} style={{
                    width:'100%', padding:'12px', background:'var(--gold-primary)', color:'black',
                    border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.82rem',
                    fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                    boxShadow:'0 2px 6px rgba(212,175,55,0.3)'
                  }}>
                    ➕ ເພີ່ມເສັ້ນແທກຂະໜາດ (Add Dimension)
                  </button>

                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px', fontSize:'0.71rem', color:'#aaa', lineHeight:1.4 }}>
                    💡 <b>ວິທີໃຊ້:</b> ກົດປຸ່ມເພີ່ມເສັ້ນ ຈາກນັ້ນລາກຈຸດວົງກົມຢູ່ປາຍເສັ້ນເທິງຮູບເພື່ອຊີ້ບອກມິຕິ ແລະ ຂະໜາດຕ່າງໆ. ກົດເລືອກເສັ້ນເພື່ອປ່ຽນຂໍ້ຄວາມ ແລະ ສີ.
                  </div>

                  {dimensions.length > 0 && (
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px' }}>
                      <p style={{ fontSize:'0.75rem', color:'#888', marginBottom:'8px' }}>📏 <b>ລາຍການເສັ້ນແທກ ({dimensions.length}):</b></p>
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'140px', overflowY:'auto', paddingRight:'4px' }}>
                        {dimensions.map(dim => (
                          <div key={dim.id} onClick={() => setSelectedDimId(dim.id)} style={{
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            padding:'6px 10px', background: selectedDimId===dim.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                            border: selectedDimId===dim.id ? '1px solid var(--gold-primary)' : '1px solid transparent',
                            borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem'
                          }}>
                            <span style={{ color: dim.color, fontWeight:'bold' }}>↔ {dim.label || '(ບໍ່ມີຂໍ້ຄວາມ)'}</span>
                            <span style={{ fontSize:'0.65rem', color:'#666' }}>ID: {String(dim.id).slice(-4)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDimId && dimensions.find(d => d.id === selectedDimId) && (() => {
                    const selDim = dimensions.find(d => d.id === selectedDimId);
                    return (
                      <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px', display:'flex', flexDirection:'column', gap:'12px' }}>
                        <p style={{ fontSize:'0.78rem', color:'var(--gold-primary)', fontWeight:'bold', margin:0 }}>⚙️ ແກ້ໄຂເສັ້ນແທກທີ່ເລືອກ:</p>

                        {/* Label Input */}
                        <div>
                          <label style={{ fontSize:'0.72rem', color:'#aaa', display:'block', marginBottom:'4px' }}>📝 ຂໍ້ຄວາມ (Text Label):</label>
                          <input type="text" value={selDim.label} onChange={e => {
                            const val = e.target.value;
                            setDimensions(prev => prev.map(d => d.id === selDim.id ? { ...d, label: val } : d));
                          }} style={{
                            width:'100%', padding:'8px', background:'rgba(255,255,255,0.06)',
                            border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'white',
                            fontSize:'0.78rem', boxSizing:'border-box'
                          }} placeholder="ຕົວຢ່າງ: 3.5 cm ຫຼື ກວ້າງ 2 cm" />
                        </div>

                        {/* Arrowhead style */}
                        <div>
                          <label style={{ fontSize:'0.72rem', color:'#aaa', display:'block', marginBottom:'4px' }}>🎯 ຫົວລູກສອນ (Arrow Style):</label>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'4px' }}>
                            {[
                              { id:'double', label:'↔ ສອງຫົວ' },
                              { id:'end',    label:'→ ຫົວຂວາ' },
                              { id:'none',   label:'— ເสັ້ນຊື່' },
                            ].map(styleOpt => (
                              <button key={styleOpt.id} onClick={() => {
                                setDimensions(prev => prev.map(d => d.id === selDim.id ? { ...d, arrowStyle: styleOpt.id } : d));
                              }} style={{
                                padding:'6px 2px', borderRadius:'4px', border:'none', cursor:'pointer', fontSize:'0.7rem',
                                background: selDim.arrowStyle === styleOpt.id ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                                color: selDim.arrowStyle === styleOpt.id ? 'var(--gold-primary)' : '#bbb',
                                outline: selDim.arrowStyle === styleOpt.id ? '1px solid var(--gold-primary)' : 'none',
                                fontWeight:'bold'
                              }}>{styleOpt.label}</button>
                            ))}
                          </div>
                        </div>

                        {/* Line thickness */}
                        <SliderRow label="📏 ຄວາມໜາ (Line Thickness)" value={selDim.thickness || 3} min={1} max={8} step={1} unit="px"
                          onChange={v => {
                            setDimensions(prev => prev.map(d => d.id === selDim.id ? { ...d, thickness: v } : d));
                          }} />

                        {/* Colors */}
                        <div>
                          <label style={{ fontSize:'0.72rem', color:'#aaa', display:'block', marginBottom:'6px' }}>🎨 ສີຂອງເສັ້ນ (Color):</label>
                          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                            {[
                              { color: '#d4af37', label: 'Gold' },
                              { color: '#ffffff', label: 'White' },
                              { color: '#e74c3c', label: 'Red' },
                              { color: '#2ecc71', label: 'Green' },
                              { color: '#3498db', label: 'Blue' },
                            ].map(cOpt => (
                              <button key={cOpt.color} onClick={() => {
                                setDimensions(prev => prev.map(d => d.id === selDim.id ? { ...d, color: cOpt.color } : d));
                              }} style={{
                                width:'24px', height:'24px', borderRadius:'50%', border: selDim.color === cOpt.color ? '2px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.2)',
                                background: cOpt.color, cursor:'pointer', boxSizing:'border-box',
                                boxShadow: selDim.color === cOpt.color ? '0 0 8px var(--gold-primary)' : 'none'
                              }} title={cOpt.label} />
                            ))}
                          </div>
                        </div>

                        {/* Delete Annotation */}
                        <button onClick={() => {
                          if (window.confirm('ຕ້ອງການລຶບເສັ້ນແທກຂະໜາດນີ້ ຫຼື ບໍ່?')) {
                            setDimensions(prev => prev.filter(d => d.id !== selDim.id));
                            setSelectedDimId(null);
                          }
                        }} style={{
                          width:'100%', padding:'8px', background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.25)',
                          color:'var(--alert-red)', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem', fontWeight:'bold',
                          marginTop:'4px'
                        }}>
                          🗑️ ລຶບເສັ້ນແທກຂະໜາດນີ້ (Delete Line)
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ── FRAME TAB ── */}
              {activeTab === 'frame' && (
                <>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>🖼️ <b>ປະເພດກອບ (Frame):</b></label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                      {[
                        {id:'none',    label:'❌ ບໍ່ມີ'},
                        {id:'gold',    label:'🥇 ທອງ (Gold)'},
                        {id:'silver',  label:'🥈 ເງິນ (Silver)'},
                        {id:'luxury',  label:'💎 Luxury'},
                      ].map(f => (
                        <button key={f.id} onClick={() => updateSettings({frameType:f.id})} style={{
                          padding:'10px', borderRadius:'6px', border:'none', cursor:'pointer',
                          background: settings.frameType===f.id ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                          color: settings.frameType===f.id ? 'var(--gold-primary)' : '#ccc',
                          outline: settings.frameType===f.id ? '1px solid var(--gold-primary)' : '1px solid transparent',
                          fontSize:'0.78rem', fontWeight:'bold'
                        }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="📏 ຄວາມໜາຂອງກອບ (Frame Size)" value={settings.frameSize} min={4} max={80} step={1} unit="px"
                    onChange={v => updateSettings({frameSize:v})} />
                  <SliderRow label="💧 ຄວາມໂປ່ງໃສ (Opacity)" value={settings.frameOpacity} min={0.1} max={1} step={0.01}
                    displayFn={v=>`${(v*100).toFixed(0)}%`} onChange={v => updateSettings({frameOpacity:v})} />
                </>
              )}

              {/* ── WATERMARK TAB ── */}
              {activeTab === 'watermark' && (
                <>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>🏷️ <b>ປະເພດລາຍນ້ຳ:</b></label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                      {[
                        {id:'none',  label:'❌ ບໍ່ມີ'},
                        {id:'text',  label:'🔤 ຂໍ້ຄວາມ'},
                        {id:'sku',   label:'🏷️ SKU Code'},
                        {id:'qr',    label:'📱 QR Code'},
                      ].map(w => (
                        <button key={w.id} onClick={() => updateSettings({watermarkType:w.id})} style={{
                          padding:'10px', borderRadius:'6px', border:'none', cursor:'pointer',
                          background: settings.watermarkType===w.id ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                          color: settings.watermarkType===w.id ? 'var(--gold-primary)' : '#ccc',
                          outline: settings.watermarkType===w.id ? '1px solid var(--gold-primary)' : '1px solid transparent',
                          fontSize:'0.78rem', fontWeight:'bold'
                        }}>
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.watermarkType !== 'none' && settings.watermarkType !== 'qr' && (
                    <div>
                      <label style={{ fontSize:'0.78rem', color:'#ccc', display:'block', marginBottom:'4px' }}>ຂໍ້ຄວາມ / SKU:</label>
                      <input type="text" value={settings.watermarkText}
                        onChange={e => updateSettings({watermarkText:e.target.value})}
                        style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'white', fontSize:'0.8rem', boxSizing:'border-box' }}
                      />
                    </div>
                  )}

                  <SliderRow label="📏 ຂະໜາດ (Size)" value={settings.watermarkSize} min={8} max={60} step={1} unit="px"
                    onChange={v => updateSettings({watermarkSize:v})} />
                  <SliderRow label="💧 ຄວາມໂປ່ງໃສ (Opacity)" value={settings.watermarkOpacity} min={0.05} max={1} step={0.01}
                    displayFn={v=>`${(v*100).toFixed(0)}%`} onChange={v => updateSettings({watermarkOpacity:v})} />

                  <div>
                    <label style={{ fontSize:'0.78rem', color:'#ccc', display:'block', marginBottom:'6px' }}>📍 ຕຳແໜ່ງ (Position):</label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'4px' }}>
                      {[
                        {id:'top-left',     label:'↖'},
                        {id:'top-right',    label:'↗'},
                        {id:'center',       label:'⊕'},
                        {id:'bottom-left',  label:'↙'},
                        {id:'bottom-right', label:'↘'},
                      ].map(p => (
                        <button key={p.id} onClick={() => updateSettings({watermarkPosition:p.id})} style={{
                          padding:'8px', borderRadius:'6px', border:'none', cursor:'pointer',
                          background: settings.watermarkPosition===p.id ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)',
                          color: settings.watermarkPosition===p.id ? 'var(--gold-primary)' : '#ccc',
                          outline: settings.watermarkPosition===p.id ? '1px solid var(--gold-primary)' : '1px solid transparent',
                          fontSize:'1rem', fontWeight:'bold'
                        }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── EXPORT TAB ── */}
              {activeTab === 'export' && (
                <>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>📐 <b>ຂະໜາດ (Export Size):</b></label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                      {[
                        {id:'product',   label:'📦 Product (800px)', desc:'ສຳລັບໜ້າສິນຄ້າ'},
                        {id:'social',    label:'📱 Social (1080px)', desc:'ສຳລັບ Facebook/IG'},
                        {id:'zoom',      label:'🔍 Zoom (1200px)',   desc:'ຮູບໃຫຍ່'},
                        {id:'thumbnail', label:'🖼️ Thumb (150px)',   desc:'ຮູບຂະໜາດນ້ອຍ'},
                      ].map(s => (
                        <button key={s.id} onClick={() => setExportSize(s.id)} style={{
                          padding:'8px 4px', borderRadius:'6px', border:'none', cursor:'pointer',
                          background: exportSize===s.id ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                          color: exportSize===s.id ? 'var(--gold-primary)' : '#ccc',
                          outline: exportSize===s.id ? '1px solid var(--gold-primary)' : '1px solid transparent',
                          fontSize:'0.72rem', fontWeight:'bold', textAlign:'center'
                        }}>
                          {s.label}<br/><span style={{fontSize:'0.63rem',opacity:.7}}>{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>💾 <b>ຟໍແມັດໄຟລ໌ (Format):</b></label>
                    <div style={{ display:'flex', gap:'8px' }}>
                      {['webp', 'png', 'jpeg'].map(f => (
                        <button key={f} onClick={() => setExportFormat(f)} style={{
                          flex:1, padding:'10px', borderRadius:'8px', border:'none', cursor:'pointer',
                          background: exportFormat===f ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                          color: exportFormat===f ? 'var(--gold-primary)' : '#ccc',
                          outline: exportFormat===f ? '1.5px solid var(--gold-primary)' : 'none',
                          fontSize:'0.8rem', fontWeight:'bold', textTransform:'uppercase'
                        }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'10px', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'16px' }}>
                    {onSave && (
                      <button onClick={handleSaveAction} style={{
                        width:'100%', padding:'12px', background:'var(--gold-primary)', color:'black',
                        border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'bold'
                      }}>
                        💾 ບັນທຶກໃສ່ສິນຄ້າ (Apply to Product)
                      </button>
                    )}
                    <button onClick={handleExportDownload} style={{
                      width:'100%', padding:'12px', background:'rgba(255,255,255,0.07)', color:'white',
                      border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'bold'
                    }}>
                      📥 ດາວໂຫຼດລົງເຄື່ອງ (Download Image)
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
