import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { db } from '../utils/db';

export default function AmuletImageEditor({ imageUrl, onSave, onClose, inline = false }) {
  // ─── Source image & analysis ────────────────────────────────────────────────
  const [sourceImg, setSourceImg] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bgRemoveCorsError, setBgRemoveCorsError] = useState(false);

  // ─── History (undo/redo) ─────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ─── Settings ────────────────────────────────────────────────────────────────
  const defaultSettings = {
    // Crop
    rotate: 0, scale: 1, translateX: 0, translateY: 0,
    cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0,
    // Enhance
    brightness: 1, contrast: 1, saturation: 1, hueRotate: 0,
    blur: 0, sharpness: 0, vignette: 0,
    selectiveClarity: false,
    // Background removal
    removeBackground: false, bgThreshold: 45,
    // Background template
    backgroundType: 'none',
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

  // ─── Eraser States ────────────────────────────────────────────────────────────
  const [brushSize, setBrushSize] = useState(35);
  const [eraseMode, setEraseMode] = useState('erase'); // 'erase' | 'restore' | 'keep' | 'remove'
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushPos, setBrushPos] = useState(null);
  const lastDrawingPos = useRef(null);
  const eraserContainerRef = useRef(null);

  // ─── Custom Background Image ─────────────────────────────────────────────────
  const [customBgImage, setCustomBgImage] = useState(null); // HTMLImageElement
  const customBgImageRef = useRef(null);
  useEffect(() => { customBgImageRef.current = customBgImage; }, [customBgImage]);

  // ─── Canvas Refs ─────────────────────────────────────────────────────────────
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const sliderContainerRef = useRef(null);
  const maskCanvasRef = useRef(null);       // offscreen 800×800 alpha mask (eraser)
  const keepMaskCanvasRef = useRef(null);   // offscreen: green = force keep
  const removeMaskCanvasRef = useRef(null); // offscreen: red   = force remove

  // ─── Current settings ref (for use inside callbacks without re-render) ───────
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const eraseModeRef = useRef(eraseMode);
  useEffect(() => { eraseModeRef.current = eraseMode; }, [eraseMode]);
  const brushSizeRef = useRef(brushSize);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  const analysisRef = useRef(analysis);
  useEffect(() => { analysisRef.current = analysis; }, [analysis]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // MASK CANVAS HELPERS
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
  // LOAD IMAGE  — uses fetch→blob to bypass CORS canvas taint
  // ═══════════════════════════════════════════════════════════════════════════════
  const initImage = (img) => {
    setSourceImg(img);
    clearMask();
    setBgRemoveCorsError(false);
    setSettings(defaultSettings);
    setHistory([{ settings: defaultSettings, maskDataUrl: '' }]);
    setHistoryIndex(0);
    runAnalysis(img);
  };

  useEffect(() => {
    if (!imageUrl) return;
    setBgRemoveCorsError(false);

    const load = async () => {
      // If already a data URL / blob URL — load directly (no CORS issue)
      if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        const img = new Image();
        img.onload = () => initImage(img);
        img.onerror = () => setErrorMsg('ໂຫຼດຮູບຜິດພາດ');
        img.src = imageUrl;
        return;
      }

      // Try fetch → blob URL (avoids canvas CORS taint for pixel ops)
      try {
        const resp = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(blobUrl); initImage(img); };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); setErrorMsg('ໂຫຼດຮູບຜິດພາດ'); };
        img.src = blobUrl;
      } catch (fetchErr) {
        // Fallback: load directly (works for display but getImageData will be CORS-blocked)
        console.warn('fetch failed, loading directly (CORS may block pixel ops):', fetchErr);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => initImage(img);
        img.onerror = () => setErrorMsg('ບໍ່ສາມາດໂຫຼດຮູບພາບນີ້ໄດ້');
        img.src = imageUrl;
      }
    };

    load();
  }, [imageUrl]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════════
  const runAnalysis = (imgEl) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const c = document.createElement('canvas');
        c.width = 300; c.height = 300;
        const ctx = c.getContext('2d');
        ctx.drawImage(imgEl, 0, 0, 300, 300);
        const { data } = ctx.getImageData(0, 0, 300, 300);

        // Sample corners for background colour
        const corners = [[0,0],[299,0],[0,299],[299,299]];
        let bgR=0, bgG=0, bgB=0;
        corners.forEach(([x,y]) => {
          const i = (y*300+x)*4;
          bgR += data[i]; bgG += data[i+1]; bgB += data[i+2];
        });
        bgR = Math.round(bgR/4); bgG = Math.round(bgG/4); bgB = Math.round(bgB/4);

        let minX=300,maxX=0,minY=300,maxY=0,totX=0,totY=0,cnt=0;
        for (let y=0; y<300; y+=3) for (let x=0; x<300; x+=3) {
          const i=(y*300+x)*4;
          const dist=Math.sqrt((data[i]-bgR)**2+(data[i+1]-bgG)**2+(data[i+2]-bgB)**2);
          if (data[i+3]>50 && dist>30) {
            if(x<minX)minX=x; if(x>maxX)maxX=x;
            if(y<minY)minY=y; if(y>maxY)maxY=y;
            totX+=x; totY+=y; cnt++;
          }
        }
        if(cnt===0){minX=60;maxX=240;minY=60;maxY=240;cnt=1;totX=150;totY=150;}

        let sumG=0,sumSq=0,gc=0;
        for(let y=20;y<280;y+=12) for(let x=20;x<280;x+=12){
          const i=(y*300+x)*4;
          const v=(data[i]+data[i+1]+data[i+2])/3;
          const r=(data[i+4]+data[i+5]+data[i+6])/3;
          const d=Math.abs(v-r);
          sumG+=d; sumSq+=d*d; gc++;
        }
        const meanG=sumG/gc;
        const varG=(sumSq/gc)-(meanG*meanG);
        const sharpness=Math.min(100,Math.max(15,Math.round(varG*1.2)));

        const scaleX = imgEl.naturalWidth/300;
        const scaleY = imgEl.naturalHeight/300;
        setAnalysis({
          minX:Math.round(minX*scaleX), maxX:Math.round(maxX*scaleX),
          minY:Math.round(minY*scaleY), maxY:Math.round(maxY*scaleY),
          width:Math.round((maxX-minX)*scaleX), height:Math.round((maxY-minY)*scaleY),
          centerX:Math.round((totX/cnt)*scaleX), centerY:Math.round((totY/cnt)*scaleY),
          sharpness, skewAngle:parseFloat((Math.sin(totX/cnt)*3).toFixed(1)),
          noise:Math.max(5,40-Math.round(sharpness/2.5)),
          bgR,bgG,bgB
        });
      } catch(err){ console.error('Analysis failed:', err); }
      finally { setIsAnalyzing(false); }
    }, 600);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DRAW ORIGINAL CANVAS (Before)
  // ═══════════════════════════════════════════════════════════════════════════════
  const drawOriginalCanvas = useCallback((src, stg, tab) => {
    const canvas = originalCanvasRef.current;
    if (!canvas || !src) return;
    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,800,800);

    const aspect = src.naturalWidth / src.naturalHeight;
    let dw = 800, dh = 800;
    if (aspect > 1) dh = 800/aspect; else dw = 800*aspect;
    const dx = (800-dw)/2, dy = (800-dh)/2;
    ctx.drawImage(src, dx, dy, dw, dh);

    if (tab === 'crop') {
      const cx = dx + (stg.cropLeft/100)*dw;
      const cy = dy + (stg.cropTop/100)*dh;
      const cw = Math.max(10, (1-(stg.cropLeft+stg.cropRight)/100)*dw);
      const ch = Math.max(10, (1-(stg.cropTop+stg.cropBottom)/100)*dh);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0,0,800,cy);
      ctx.fillRect(0,cy+ch,800,800-(cy+ch));
      ctx.fillRect(0,cy,cx,ch);
      ctx.fillRect(cx+cw,cy,800-(cx+cw),ch);
      ctx.strokeStyle='rgba(212,175,55,0.9)';
      ctx.lineWidth=3; ctx.setLineDash([8,6]);
      ctx.strokeRect(cx,cy,cw,ch);
      ctx.setLineDash([]);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // DRAW PROCESSED CANVAS (After) — main render pipeline
  // ═══════════════════════════════════════════════════════════════════════════════
  const renderProcessedImage = useCallback(async (overrideSettings, overrideAnalysis) => {
    const stg = overrideSettings || settingsRef.current;
    const anl = overrideAnalysis !== undefined ? overrideAnalysis : analysisRef.current;
    const src = sourceImg;

    const canvas = processedCanvasRef.current;
    if (!canvas || !src) return;

    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,800,800);

    // 1. Background template
    drawBgTemplate(ctx, 800, 800, stg);

    // 2. Image with transforms
    ctx.save();
    ctx.translate(400, 400);
    ctx.rotate((stg.rotate * Math.PI) / 180);
    ctx.scale(stg.scale, stg.scale);
    ctx.translate(stg.translateX - 400, stg.translateY - 400);

    // Temp canvas for image + filters + BG removal + eraser mask
    const tmp = document.createElement('canvas');
    tmp.width = 800; tmp.height = 800;
    const tCtx = tmp.getContext('2d');

    // Crop source rect
    const sx = (stg.cropLeft/100) * src.naturalWidth;
    const sy = (stg.cropTop/100) * src.naturalHeight;
    const sw = Math.max(10, (1-(stg.cropLeft+stg.cropRight)/100) * src.naturalWidth);
    const sh = Math.max(10, (1-(stg.cropTop+stg.cropBottom)/100) * src.naturalHeight);
    const asp = sw/sh;
    let dw=800, dh=800;
    if (asp>1) dh=800/asp; else dw=800*asp;
    const ddx=(800-dw)/2, ddy=(800-dh)/2;

    // Apply CSS filters on temp context
    try {
      tCtx.filter = [
        `brightness(${stg.brightness})`,
        `contrast(${stg.contrast})`,
        `saturate(${stg.saturation})`,
        `hue-rotate(${stg.hueRotate}deg)`,
        stg.blur > 0 ? `blur(${stg.blur}px)` : ''
      ].filter(Boolean).join(' ');
    } catch(e) {}

    tCtx.drawImage(src, sx, sy, sw, sh, ddx, ddy, dw, dh);
    try { tCtx.filter = 'none'; } catch(e) {}

    // ════════════════════════════════════════════════════════════════════════
    // AI BG REMOVAL — Flood-Fill BFS from all border edges
    // ════════════════════════════════════════════════════════════════════════
    if (stg.removeBackground) {
      let corsBlocked = false;
      try {
        const id = tCtx.getImageData(0, 0, 800, 800);
        const d = id.data;
        const W = 800, H = 800;
        const thr = stg.bgThreshold;

        // ─── Sample BG colour from corners (fixed — never mutated during BFS) ───
        let bgR = 0, bgG = 0, bgB = 0, sc = 0;
        // Use analysis result if available (most accurate)
        if (anl && anl.bgR !== undefined) {
          bgR = anl.bgR; bgG = anl.bgG; bgB = anl.bgB; sc = 1;
        } else {
          // Average of 4 corners
          [[0,0],[W-1,0],[0,H-1],[W-1,H-1]].forEach(([x,y]) => {
            const i = (y * W + x) * 4;
            if (d[i+3] > 0) { bgR += d[i]; bgG += d[i+1]; bgB += d[i+2]; sc++; }
          });
          if (sc > 0) { bgR = Math.round(bgR/sc); bgG = Math.round(bgG/sc); bgB = Math.round(bgB/sc); }
        }
        // FIXED reference — do NOT mutate during BFS
        const fixedBgR = bgR, fixedBgG = bgG, fixedBgB = bgB;

        // ─── Collect all border seed pixels ───
        const visited  = new Uint8Array(W * H);
        const toRemove = new Uint8Array(W * H);
        // Use typed array as BFS queue for speed
        const queue = new Int32Array(W * H * 2);
        let qHead = 0, qTail = 0;

        const enqueue = (x, y) => {
          const pi = y * W + x;
          if (visited[pi]) return;
          visited[pi] = 1;
          queue[qTail++] = x;
          queue[qTail++] = y;
        };

        // Seed all 4 edges
        for (let x = 0; x < W; x++) { enqueue(x, 0); enqueue(x, H-1); }
        for (let y = 1; y < H-1; y++) { enqueue(0, y); enqueue(W-1, y); }

        // ─── BFS with FIXED colour comparison ───
        while (qHead < qTail) {
          const cx = queue[qHead++];
          const cy = queue[qHead++];
          const pi = cy * W + cx;
          const di = pi * 4;

          if (d[di+3] === 0) continue; // already transparent

          const dr = d[di]   - fixedBgR;
          const dg = d[di+1] - fixedBgG;
          const db = d[di+2] - fixedBgB;
          const dist = Math.sqrt(dr*dr + dg*dg + db*db);

          if (dist <= thr) {
            toRemove[pi] = 1;
            // Spread to 4 neighbours
            if (cx+1 < W) enqueue(cx+1, cy);
            if (cx-1 >= 0) enqueue(cx-1, cy);
            if (cy+1 < H)  enqueue(cx, cy+1);
            if (cy-1 >= 0) enqueue(cx, cy-1);
          }
        }

        // ─── Apply: respect keep/remove brushes ───
        const kData = getKeepMaskCanvas().getContext('2d').getImageData(0,0,W,H).data;
        const rData = getRemoveMaskCanvas().getContext('2d').getImageData(0,0,W,H).data;

        for (let i = 0; i < W * H; i++) {
          const di4 = i * 4;
          if (rData[di4] > 128 && rData[di4+3] > 0) {
            d[di4+3] = 0;            // force remove (red brush)
          } else if (kData[di4+1] > 128 && kData[di4+3] > 0) {
            // force keep (green brush) — do nothing
          } else if (toRemove[i]) {
            d[di4+3] = 0;            // auto flood-fill removal
          }
        }
        tCtx.putImageData(id, 0, 0);
        setBgRemoveCorsError(false);
      } catch (err) {
        corsBlocked = true;
        console.warn('BG removal blocked (CORS):', err.message);
        setBgRemoveCorsError(true);
      }
    }

    // Apply manual eraser mask (black pixels → transparent)
    const mc = getMaskCanvas();
    const mData = mc.getContext('2d').getImageData(0,0,800,800).data;
    // Only apply if mask has any black painted pixels
    let hasMask = false;
    for (let i=0; i<mData.length; i+=4) {
      if (mData[i+3] > 0) { hasMask=true; break; }
    }
    if (hasMask) {
      try {
        const id2 = tCtx.getImageData(0,0,800,800);
        const d2 = id2.data;
        for (let i=0; i<d2.length; i+=4) {
          // mask is black = erase → make source pixel transparent
          if (mData[i+3] > 0) d2[i+3] = Math.max(0, d2[i+3] - mData[i+3]);
        }
        tCtx.putImageData(id2, 0, 0);
      } catch(e) {}
    }

    ctx.drawImage(tmp, 0, 0);
    ctx.restore();

    // 3. Vignette overlay
    if (stg.vignette > 0) {
      const g = ctx.createRadialGradient(400,400,200,400,400,560);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${stg.vignette/100})`);
      ctx.fillStyle = g;
      ctx.fillRect(0,0,800,800);
    }

    // 4. Selective clarity highlight
    if (stg.selectiveClarity && anl) {
      ctx.save();
      ctx.strokeStyle = 'rgba(212,175,55,0.2)';
      ctx.lineWidth = 18;
      ctx.strokeRect(anl.minX, anl.minY, anl.width, anl.height);
      ctx.restore();
    }

    // 5. Frame overlay
    if (stg.frameType !== 'none') drawFrame(ctx, 800, 800, stg);

    // 6. Watermark
    if (stg.watermarkType !== 'none') await drawWatermark(ctx, 800, 800, stg);

    // 7. Guides (not saved on export)
    drawGuides(ctx, 800, 800, stg, anl);
  }, [sourceImg]);

  // ─── Re-render when anything changes ────────────────────────────────────────
  useEffect(() => {
    if (!sourceImg) return;
    drawOriginalCanvas(sourceImg, settings, activeTab);
    renderProcessedImage(settings, analysis);
  }, [sourceImg, settings, activeTab, analysis]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // DRAW HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const drawBgTemplate = (ctx, w, h, stg) => {
    ctx.save();

    // Custom background image (user-uploaded)
    if (stg.backgroundType === 'custom' && customBgImageRef.current) {
      ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0,0,w,h);
      // Cover fit
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
      case 'white':
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h); break;
      case 'black':
        ctx.fillStyle = '#0f0f11'; ctx.fillRect(0,0,w,h); break;
      case 'luxury': {
        const g = ctx.createRadialGradient(w/2,h/2,50,w/2,h/2,w*0.7);
        g.addColorStop(0,'#1e293b'); g.addColorStop(1,'#0b0f19');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h); break;
      }
      case 'gold': {
        const g = ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*0.8);
        g.addColorStop(0,'#451a03'); g.addColorStop(0.5,'#1e1b4b'); g.addColorStop(1,'#090514');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h); break;
      }
      case 'velvet': {
        const g = ctx.createRadialGradient(w/2,h/2,50,w/2,h/2,w*0.7);
        g.addColorStop(0,'#7f1d1d'); g.addColorStop(1,'#180003');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h); break;
      }
      case 'obsidian': {
        const g = ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*0.8);
        g.addColorStop(0,'#1f1f1f'); g.addColorStop(1,'#0a0a0a');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        ctx.strokeStyle='rgba(255,255,255,0.03)';
        ctx.lineWidth=40;
        for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-100+i*220,0);ctx.lineTo(100+i*220,h);ctx.stroke();}
        break;
      }
      case 'golden_aura': {
        const g = ctx.createRadialGradient(w/2,h/2,50,w/2,h/2,w*0.75);
        g.addColorStop(0,'rgba(212,175,55,0.25)'); g.addColorStop(0.6,'rgba(139,108,27,0.15)'); g.addColorStop(1,'rgba(5,5,10,0.95)');
        ctx.fillStyle='#050508'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h); break;
      }
      case 'gradient_blue': {
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#0f0c29'); g.addColorStop(0.5,'#302b63'); g.addColorStop(1,'#24243e');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h); break;
      }
      case 'gradient_green': {
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#004d40'); g.addColorStop(1,'#1b5e20');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h); break;
      }
      case 'transparent': {
        ctx.fillStyle='#181c26'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#232836';
        const cs=20;
        for(let y=0;y<h;y+=cs*2) for(let x=0;x<w;x+=cs*2){
          ctx.fillRect(x,y,cs,cs); ctx.fillRect(x+cs,y+cs,cs,cs);
        }
        break;
      }
      default:
        ctx.fillStyle='#0d0d0d'; ctx.fillRect(0,0,w,h); break;
    }
    ctx.restore();
  };

  const drawFrame = (ctx, w, h, stg) => {
    ctx.save();
    ctx.globalAlpha = stg.frameOpacity;
    const sz = stg.frameSize, pad = 12;
    const fx=pad, fy=pad, fw=w-pad*2, fh=h-pad*2;
    let grad;
    if (stg.frameType==='gold') {
      grad=ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#ffd700'); grad.addColorStop(0.25,'#d4af37');
      grad.addColorStop(0.5,'#aa771c'); grad.addColorStop(0.75,'#f5d76e'); grad.addColorStop(1,'#d4af37');
    } else if (stg.frameType==='silver') {
      grad=ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#e2e8f0'); grad.addColorStop(0.5,'#94a3b8'); grad.addColorStop(1,'#cbd5e1');
    } else {
      grad=ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#1e293b'); grad.addColorStop(0.5,'#d4af37'); grad.addColorStop(1,'#1e293b');
    }
    ctx.strokeStyle=grad; ctx.lineWidth=sz;
    ctx.strokeRect(fx+sz/2, fy+sz/2, fw-sz, fh-sz);
    if (stg.frameType==='gold'||stg.frameType==='luxury') {
      const cs=sz*1.5;
      ctx.fillStyle='#ffd700';
      [[fx,fy],[fx+fw-cs,fy],[fx,fy+fh-cs],[fx+fw-cs,fy+fh-cs]].forEach(([x,y])=>ctx.fillRect(x,y,cs,cs));
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5;
      ctx.strokeRect(fx+sz,fy+sz,fw-sz*2,fh-sz*2);
    }
    ctx.restore();
  };

  const drawWatermark = async (ctx, w, h, stg) => {
    ctx.save();
    ctx.globalAlpha = stg.watermarkOpacity;
    const sz = stg.watermarkSize;
    const text = stg.watermarkText;

    const getPos = (textW, textH) => {
      const p = stg.watermarkPosition;
      if (p==='top-left')     return {x:40, y:40+textH};
      if (p==='top-right')    return {x:w-textW-40, y:40+textH};
      if (p==='bottom-left')  return {x:40, y:h-40};
      if (p==='center')       return {x:(w-textW)/2, y:h/2+textH/2};
      return {x:w-textW-40, y:h-40}; // bottom-right default
    };

    if (stg.watermarkType==='text') {
      ctx.font=`bold ${sz}px Phetsarath OT, sans-serif`;
      const tw = ctx.measureText(text).width;
      const {x,y}=getPos(tw,sz);
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText(text,x+2,y+2);
      ctx.fillStyle='#ffffff'; ctx.fillText(text,x,y);
    } else if (stg.watermarkType==='sku') {
      ctx.font=`bold ${sz}px Phetsarath OT, sans-serif`;
      const t2=`SKU: ${text}`;
      const tw=ctx.measureText(t2).width;
      const {x,y}=getPos(tw,sz);
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText(t2,x+2,y+2);
      ctx.fillStyle='#ffd700'; ctx.fillText(t2,x,y);
    } else if (stg.watermarkType==='qr') {
      try {
        const qrSize=Math.max(80,sz*4);
        const qrC=document.createElement('canvas');
        await QRCode.toCanvas(qrC, 'https://kp-pakse-suthatpospos.shop', {
          width:qrSize, margin:1, color:{dark:'#ffffff',light:'#00000000'}
        });
        const {x,y}=getPos(qrSize,qrSize);
        const qry = stg.watermarkPosition.startsWith('top') ? 40 : h-qrSize-40;
        ctx.drawImage(qrC, x, qry);
      } catch(e){ console.error(e); }
    }
    ctx.restore();
  };

  const drawGuides = (ctx, w, h, stg, anl) => {
    ctx.save();
    if (stg.showBoundary && anl) {
      ctx.strokeStyle='rgba(212,175,55,0.75)'; ctx.lineWidth=2; ctx.setLineDash([6,6]);
      ctx.strokeRect(anl.minX,anl.minY,anl.width,anl.height);
      ctx.fillStyle='#d4af37'; ctx.font='10px Arial';
      ctx.fillText(`Amulet (${anl.width}×${anl.height}px)`,anl.minX,anl.minY-5);
      ctx.setLineDash([]);
    }
    if (stg.showCenter) {
      ctx.strokeStyle='rgba(231,76,60,0.7)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);
      ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(w/2,h/2,8,0,2*Math.PI); ctx.stroke();
    }
    if (stg.showGrid) {
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
      ctx.beginPath();
      [w/3,2*w/3].forEach(x=>{ctx.moveTo(x,0);ctx.lineTo(x,h);});
      [h/3,2*h/3].forEach(y=>{ctx.moveTo(0,y);ctx.lineTo(w,y);});
      ctx.stroke();
    }
    if (stg.showSafeArea) {
      ctx.strokeStyle='rgba(46,204,113,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([10,5]);
      ctx.strokeRect(100,100,w-200,h-200);
      ctx.fillStyle='#2ecc71'; ctx.font='10px Arial';
      ctx.fillText('SAFE AREA (80%)',105,120);
      ctx.setLineDash([]);
    }
    ctx.restore();
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // HISTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════
  const pushHistory = (newSettings, maskDataUrl) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push({ settings: newSettings, maskDataUrl: maskDataUrl || getMaskDataUrl() });
      return next;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const updateSettings = useCallback((fields) => {
    setSettings(prev => {
      const next = { ...prev, ...fields };
      // Push to history asynchronously after state update
      setTimeout(() => {
        setHistory(h => {
          const slice = h.slice(0, historyIndex + 1);
          slice.push({ settings: next, maskDataUrl: getMaskDataUrl() });
          setHistoryIndex(slice.length - 1);
          return slice;
        });
      }, 0);
      return next;
    });
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const nextIdx = historyIndex - 1;
    const item = history[nextIdx];
    setHistoryIndex(nextIdx);
    setSettings(item.settings);
    restoreMaskFromDataUrl(item.maskDataUrl, () => {
      renderProcessedImage(item.settings, analysisRef.current);
    });
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const item = history[nextIdx];
    setHistoryIndex(nextIdx);
    setSettings(item.settings);
    restoreMaskFromDataUrl(item.maskDataUrl, () => {
      renderProcessedImage(item.settings, analysisRef.current);
    });
  };

  const handleReset = () => {
    clearMask();
    setSettings(defaultSettings);
    setHistory([{ settings: defaultSettings, maskDataUrl: '' }]);
    setHistoryIndex(0);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // ERASER BRUSH
  // ═══════════════════════════════════════════════════════════════════════════════
  const getCanvasCoords = (clientX, clientY) => {
    if (!eraserContainerRef.current) return null;
    const rect = eraserContainerRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 800,
      y: ((clientY - rect.top) / rect.height) * 800,
      viewX: clientX - rect.left,
      viewY: clientY - rect.top
    };
  };

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
    setBrushPos({x: c.viewX, y: c.viewY});
    if (isDrawing && lastDrawingPos.current) {
      drawMaskStroke(lastDrawingPos.current.x, lastDrawingPos.current.y, c.x, c.y);
      lastDrawingPos.current = c;
    }
  };
  const handleEraserMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastDrawingPos.current = null;
      // Save stroke to history
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
    setIsDrawing(true); lastDrawingPos.current = c;
    drawMaskStroke(c.x, c.y, c.x, c.y);
  };
  const handleEraserTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const c = getCanvasCoords(t.clientX, t.clientY);
    if (!c) return;
    setBrushPos({x:c.viewX,y:c.viewY});
    if (isDrawing && lastDrawingPos.current) {
      drawMaskStroke(lastDrawingPos.current.x, lastDrawingPos.current.y, c.x, c.y);
      lastDrawingPos.current = c;
    }
  };
  const handleEraserTouchEnd = () => {
    if (isDrawing) {
      setIsDrawing(false); lastDrawingPos.current = null; setBrushPos(null);
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
  // AI AUTO ARRANGE
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleAiAutoArrange = () => {
    if (!analysis) return;
    const maxB = Math.max(analysis.width, analysis.height);
    const tScale = Math.min(2.5, 600 / maxB);
    updateSettings({
      rotate: -analysis.skewAngle,
      scale: tScale,
      translateX: (400 - analysis.centerX) * tScale,
      translateY: (400 - analysis.centerY) * tScale,
      showCenter: true, showSafeArea: true
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOCAL UPLOAD
  // ═══════════════════════════════════════════════════════════════════════════════
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
        setHistory([{ settings: defaultSettings, maskDataUrl: '' }]);
        setHistoryIndex(0);
        runAnalysis(img);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // SLIDER (Before / After)
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleSliderMouseDown = () => setIsDraggingSlider(true);
  const handleSliderMouseMove = (e) => {
    if (!isDraggingSlider || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    setSliderPosition(Math.max(0, Math.min(100, ((e.clientX - rect.left)/rect.width)*100)));
  };
  const handleSliderMouseUpOrLeave = () => setIsDraggingSlider(false);

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPORT / SAVE
  // ═══════════════════════════════════════════════════════════════════════════════
  const generateExportDataUrl = () => {
    let size = 800;
    if (exportSize==='thumbnail') size=150;
    if (exportSize==='zoom') size=1200;
    if (exportSize==='social') size=1080;
    const c = document.createElement('canvas');
    c.width=size; c.height=size;
    const ctx = c.getContext('2d');
    const pc = processedCanvasRef.current;
    if (pc) ctx.drawImage(pc, 0, 0, size, size);
    let type = 'image/webp';
    if (exportFormat==='png') type='image/png';
    if (exportFormat==='jpeg') type='image/jpeg';
    return c.toDataURL(type, 0.92);
  };

  const handleSaveAction = () => {
    try {
      const url = generateExportDataUrl();
      if (onSave) onSave(url);
    } catch(err) {
      alert('❌ ບໍ່ສາມາດບັນທຶກໄດ້: ' + err.message);
    }
  };

  const handleExportDownload = () => {
    try {
      const url = generateExportDataUrl();
      const a = document.createElement('a');
      a.download = `amulet_${exportSize}.${exportFormat}`;
      a.href = url; a.click();
    } catch(err) {
      alert('❌ ດາວໂຫຼດບໍ່ສຳເລັດ: ' + err.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // SLIDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const SliderRow = ({ label, value, min, max, step=0.01, unit='', onChange, displayFn }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#ccc' }}>
        <span>{label}</span>
        <span style={{ color:'var(--gold-primary)', fontWeight:'bold' }}>
          {displayFn ? displayFn(value) : `${value}${unit}`}
        </span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:'100%', accentColor:'var(--gold-primary)' }}
      />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  const isMobile = window.innerWidth <= 768;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className={inline ? 'ai-editor-inline' : 'ai-editor-modal-backdrop'} style={inline ? {} : {
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(5,5,8,0.95)', display:'flex', alignItems:'center',
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
            <span style={{ fontSize:'1.4rem' }}>🎨</span>
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

          {/* ── TAB ICONS ── */}
          <div style={{
            width:isMobile?'100%':'80px', borderRight:'1px solid var(--border-color)',
            borderBottom:isMobile?'1px solid var(--border-color)':'none',
            background:'#0b0f19', display:'flex',
            flexDirection:isMobile?'row':'column',
            padding:'10px 0', gap:'4px', overflowX:'auto'
          }}>
            {[
              { id:'crop',       icon:'📐', label:'ຈັດຮູບ' },
              { id:'enhance',    icon:'✨', label:'ປັບແສງ' },
              { id:'eraser',     icon:'🧹', label:'ຢາງລົບ' },
              { id:'background', icon:'🎨', label:'ພື້ນຫຼັງ' },
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

          {/* ── CANVAS AREA ── */}
          <div style={{
            flex:1, background:'#04060b', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', padding:'20px',
            position:'relative', overflow:'hidden', gap:'12px'
          }}>
            {/* Analysis info bar */}
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

            {/* Loading / Canvas / Upload empty state */}
            {isAnalyzing ? (
              <div style={{ textAlign:'center', color:'var(--gold-primary)' }}>
                <div style={{ border:'4px solid rgba(212,175,55,0.1)', borderTop:'4px solid var(--gold-primary)', borderRadius:'50%', width:'40px', height:'40px', animation:'spin 1s infinite linear', margin:'0 auto 16px' }} />
                <p>AI ກຳລັງວິເຄາະຮູບພາບ...</p>
              </div>
            ) : sourceImg ? (
              activeTab === 'eraser' ? (
                /* ── ERASER WORKSPACE ── */
                <div ref={eraserContainerRef}
                  onMouseDown={handleEraserMouseDown}
                  onMouseMove={handleEraserMouseMove}
                  onMouseUp={handleEraserMouseUp}
                  onMouseLeave={handleEraserMouseUp}
                  onTouchStart={handleEraserTouchStart}
                  onTouchMove={handleEraserTouchMove}
                  onTouchEnd={handleEraserTouchEnd}
                  style={{
                    position:'relative', width:'100%', maxWidth:'480px', aspectRatio:'1',
                    background:'#0d0d0d', borderRadius:'12px', overflow:'hidden',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
                    cursor:'crosshair', userSelect:'none', touchAction:'none'
                  }}
                >
                  <canvas ref={processedCanvasRef} style={{ width:'100%', height:'100%', display:'block' }} />
                  {/* Brush cursor indicator */}
                  {brushPos && eraserContainerRef.current && (
                    <div style={{
                      position:'absolute',
                      left: brushPos.x,
                      top: brushPos.y,
                      width: `${(brushSizeRef.current / 800) * eraserContainerRef.current.clientWidth}px`,
                      height: `${(brushSizeRef.current / 800) * eraserContainerRef.current.clientWidth}px`,
                      borderRadius:'50%',
                      border: eraseMode==='erase'||eraseMode==='remove' ? '2px solid rgba(231,76,60,0.9)' : '2px solid rgba(46,204,113,0.9)',
                      background: eraseMode==='remove' ? 'rgba(255,0,0,0.2)' : eraseMode==='keep' ? 'rgba(0,255,0,0.15)' : eraseMode==='erase' ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
                      transform:'translate(-50%,-50%)',
                      pointerEvents:'none', zIndex:20
                    }} />
                  )}
                  <span style={{
                    position:'absolute', top:'10px', left:'10px',
                    background: eraseMode==='erase'?'rgba(231,76,60,0.85)':eraseMode==='remove'?'rgba(192,57,43,0.9)':eraseMode==='keep'?'rgba(39,174,96,0.9)':'rgba(46,204,113,0.85)',
                    color:'white', padding:'3px 10px', borderRadius:'4px',
                    fontSize:'0.68rem', fontWeight:'bold', zIndex:10
                  }}>
                    {eraseMode==='erase' ? '🧽 ລຶບ (Erase)' : eraseMode==='restore' ? '🎨 ກູ້ຄືນ (Restore)' : eraseMode==='keep' ? '🟢 ຮັກສາ (Keep)' : '🔴 ລຶບ AI (Remove)'}
                  </span>
                </div>
              ) : (
                /* ── BEFORE / AFTER SLIDER WORKSPACE ── */
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
                  {/* BEFORE (original) */}
                  <canvas ref={originalCanvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} />
                  <span style={{ position:'absolute', bottom:'10px', left:'10px', background:'rgba(0,0,0,0.6)', color:'#888', padding:'2px 8px', borderRadius:'4px', fontSize:'0.63rem', zIndex:5 }}>
                    BEFORE
                  </span>
                  {/* AFTER (processed) - clipped to left side */}
                  <div style={{ position:'absolute', top:0, left:0, width:`${sliderPosition}%`, height:'100%', overflow:'hidden', borderRight:'2px solid var(--gold-primary)', zIndex:2 }}>
                    <canvas ref={processedCanvasRef} style={{
                      position:'absolute', top:0, left:0,
                      width: sliderContainerRef.current ? sliderContainerRef.current.clientWidth+'px' : '480px',
                      height: sliderContainerRef.current ? sliderContainerRef.current.clientHeight+'px' : '480px'
                    }} />
                    <span style={{ position:'absolute', bottom:'10px', right:'10px', background:'rgba(212,175,55,0.2)', color:'var(--gold-primary)', border:'1px solid rgba(212,175,55,0.4)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.63rem', whiteSpace:'nowrap' }}>
                      AFTER ✨
                    </span>
                  </div>
                  {/* Drag handle */}
                  <div onMouseDown={handleSliderMouseDown} style={{
                    position:'absolute', top:0, bottom:0, left:`calc(${sliderPosition}% - 12px)`,
                    width:'24px', zIndex:3, cursor:'ew-resize',
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    <div style={{ width:'3px', height:'100%', background:'var(--gold-primary)', boxShadow:'0 0 8px var(--gold-glow)' }} />
                    <div style={{
                      position:'absolute', width:'26px', height:'26px', borderRadius:'50%',
                      background:'var(--gold-primary)', border:'3px solid #070a13', color:'#000',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'10px', fontWeight:'bold', boxShadow:'0 2px 8px rgba(0,0,0,0.5)'
                    }}>↔</div>
                  </div>
                </div>
              )
            ) : (
              /* ── UPLOAD EMPTY STATE ── */
              <div style={{
                textAlign:'center', color:'var(--text-secondary)',
                border:'2px dashed rgba(212,175,55,0.2)', borderRadius:'12px',
                padding:'40px 20px', background:'rgba(255,255,255,0.01)', width:'100%', maxWidth:'400px'
              }}>
                <span style={{ fontSize:'3.5rem', display:'block', marginBottom:'16px' }}>📁</span>
                <h4 style={{ color:'var(--gold-primary)', margin:'0 0 8px', fontSize:'1rem' }}>ອັບໂຫຼດຮູບພາບເພື່ອເລີ່ມແຕ່ງ</h4>
                <p style={{ fontSize:'0.78rem', margin:'0 0 20px', color:'#888' }}>
                  ເລືອກໄຟລ໌ຮູບ (.png, .jpg, .webp)
                </p>
                <input type="file" accept="image/*" onChange={handleLocalUpload} style={{ display:'none' }} id="editorLocalFileInput" />
                <label htmlFor="editorLocalFileInput" className="btn btn-primary" style={{ cursor:'pointer', padding:'10px 24px', fontSize:'0.85rem' }}>
                  📂 ເລືອກຮູບຈາກເຄື່ອງ
                </label>
                {errorMsg && <p style={{ color:'var(--alert-red)', marginTop:'12px', fontSize:'0.8rem' }}>{errorMsg}</p>}
              </div>
            )}

            {/* Upload button always visible at bottom when image loaded */}
            {sourceImg && (
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
                <input type="file" accept="image/*" onChange={handleLocalUpload} style={{ display:'none' }} id="editorReplaceInput" />
                <label htmlFor="editorReplaceInput" style={{
                  cursor:'pointer', padding:'6px 16px', borderRadius:'8px', fontSize:'0.75rem',
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                  color:'#ccc', display:'flex', alignItems:'center', gap:'6px'
                }}>
                  📂 ປ່ຽນຮູບ
                </label>
                {analysis && (
                  <span style={{ fontSize:'0.72rem', color:'#666', alignSelf:'center' }}>
                    Stack [{historyIndex+1}/{history.length}] · AI Active
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── SIDEBAR CONTROLS ── */}
          <div style={{
            width:isMobile?'100%':'300px', borderLeft:'1px solid var(--border-color)',
            background:'#0a0d18', display:'flex', flexDirection:'column', overflow:'hidden'
          }}>
            {/* Sidebar header */}
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border-color)', background:'rgba(255,255,255,0.02)' }}>
              <h3 style={{ color:'var(--gold-primary)', margin:0, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'8px' }}>
                {activeTab==='crop'       && '📐 ຈັດຮູບ & ອົງປະກອບ'}
                {activeTab==='enhance'    && '✨ ປັບແສງ & ສີ'}
                {activeTab==='eraser'     && '🧹 ຢາງລົບດ້ວຍມື'}
                {activeTab==='background' && '🎨 ພື້ນຫຼັງ (AI BG)'}
                {activeTab==='frame'      && '🖼️ ໃສ່ກອບ'}
                {activeTab==='watermark'  && '🏷️ ລາຍນ້ຳ'}
                {activeTab==='export'     && '💾 ສົ່ງອອກ & ບັນທຶກ'}
              </h3>
            </div>

            {/* Sidebar content */}
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

                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'14px' }}>
                    <p style={{ fontSize:'0.78rem', color:'#aaa', marginBottom:'10px' }}>✂️ ຕັດຂອບ (Crop):</p>
                    <SliderRow label="◀ ຕັດຊ້າຍ (Left)" value={settings.cropLeft} min={0} max={49} step={0.5} unit="%"
                      onChange={v => updateSettings({cropLeft:v})} />
                    <SliderRow label="▶ ຕັດຂວາ (Right)" value={settings.cropRight} min={0} max={49} step={0.5} unit="%"
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
                  {/* Eraser Mode buttons */}
                  <div>
                    <p style={{ fontSize:'0.75rem', color:'#aaa', marginBottom:'6px' }}>🖌️ <b>ໂໝດການລຶບ (Erase Mode):</b></p>
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

                  {/* Keep/Remove Selection Brush */}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px' }}>
                    <p style={{ fontSize:'0.75rem', color:'#aaa', marginBottom:'6px' }}>🎯 <b>ເລືອກວັດຖຸ (Smart Select):</b></p>
                    <p style={{ fontSize:'0.7rem', color:'#888', marginBottom:'8px' }}>ໃຊ້ຮ່ວມກັບ "ລຶບພື້ນຫຼັງ AI" ໃນແທັບ 🎨</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                      {[
                        { id:'keep',   label:'🟢 ບັງຄັບຮັກສາ (Keep)',    color:'#27ae60', bg:'rgba(39,174,96,0.25)' },
                        { id:'remove', label:'🔴 ບັງຄັບລຶບ (Remove)',      color:'#c0392b', bg:'rgba(192,57,43,0.25)' },
                      ].map(m => (
                        <button key={m.id} onClick={() => setEraseMode(m.id)}
                          style={{ padding:'10px 6px', fontSize:'0.75rem', fontWeight:'bold', borderRadius:'8px', border:'none', cursor:'pointer',
                            background: eraseMode===m.id ? m.bg : 'rgba(255,255,255,0.06)',
                            color: eraseMode===m.id ? m.color : '#777',
                            outline: eraseMode===m.id ? `1.5px solid ${m.color}` : 'none'
                          }}>{m.label}</button>
                      ))}
                    </div>
                    <p style={{ fontSize:'0.68rem', color:'#666', marginTop:'6px' }}>
                      🟢 ລາກສີຂຽວ = ບອກ AI ໃຫ້ຮັກສາສ່ວນນີ້ໄວ້<br/>
                      🔴 ລາກສີແດງ = ບອກ AI ໃຫ້ລຶບສ່ວນນີ້ອອກ
                    </p>
                  </div>

                  <SliderRow label="🖌️ ຂະໜາດແປງ (Brush Size)" value={brushSize} min={3} max={120} step={1} unit="px"
                    onChange={v => setBrushSize(v)} />

                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    <button onClick={() => {
                      if (window.confirm('ລ້າງການລຶບ/ເລືອກທັງໝົດ ຫຼື ບໍ່?')) {
                        clearMask();
                        renderProcessedImage(settingsRef.current, analysisRef.current);
                        setHistory(prev => {
                          const s = [...prev.slice(0, historyIndex+1), {settings:settingsRef.current, maskDataUrl:''}];
                          setHistoryIndex(s.length-1);
                          return s;
                        });
                      }
                    }} style={{ padding:'8px', background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.25)', color:'var(--alert-red)', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold' }}>
                      🗑️ ລ້າງທັງໝົດ (Clear All)
                    </button>
                  </div>

                  <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:'8px', padding:'10px', fontSize:'0.71rem', color:'#bbb', lineHeight:1.5 }}>
                    💡 <b>ຄຳແນະນຳ:</b><br/>
                    • <b>🧽 ລຶບ</b> = ລຶບພິກເຊລໂດຍກົງ (ກໍານົດເອງ)<br/>
                    • <b>🎨 ກູ້ຄືນ</b> = ດຶງສ່ວນທີ່ລຶບຜິດກັບຄືນ<br/>
                    • <b>🟢 ຮັກສາ</b> = ວາດຕ້ານ AI ໃຫ້ຢ່າລຶບ<br/>
                    • <b>🔴 ລຶບ AI</b> = ວາດບອກ AI ໃຫ້ລຶບ<br/>
                    • <b>Undo</b> ຍ້ອນກັບໄດ້ທຸກຄັ້ງ
                  </div>
                </>
              )}

              {/* ── BACKGROUND TAB ── */}
              {activeTab === 'background' && (
                <>
                  {/* AI BG Removal */}
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
                          ✅ ລະບົບໃຊ້ <b>Flood-Fill BFS</b> ຈາກຂອບຮູບ — ລຶບໄດ້ຊັດເຈນ.<br/>
                          ປັບ <b>Tolerance</b> ຫາກລຶບຫຼາຍ/ໜ້ອຍເກີນ.<br/>
                          ໃຊ້ <b>🟢 ຮັກສາ</b> / <b>🔴 ລຶບ AI</b> ໃນ Tab ຢາງລົບ ເພື່ອຄວບຄຸມ.
                        </div>
                      )
                    )}
                  </div>

                  <SliderRow label="🎚️ ຄວາມທົນທານ (Tolerance)" value={settings.bgThreshold} min={5} max={150} step={1} unit=""
                    onChange={v => updateSettings({bgThreshold:v})}
                    displayFn={v => {
                      if(v<30) return `${v} (ເຄັ່ງ)`;
                      if(v<70) return `${v} (ປານກາງ)`;
                      return `${v} (ຫຼວມ)`;
                    }} />

                  {/* BG Templates */}
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

                    {/* Custom BG Image Upload */}
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
                    <label style={{ fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:'8px' }}>🗂️ <b>ຮູບແບບໄຟລ໌ (Format):</b></label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {[
                        {id:'webp',  label:'WebP (ດີທີ່ສຸດ)'},
                        {id:'png',   label:'PNG (ໂປ່ງໃສ)'},
                        {id:'jpeg',  label:'JPEG (ໄວ)'},
                      ].map(f => (
                        <button key={f.id} onClick={() => setExportFormat(f.id)} style={{
                          flex:1, padding:'8px 4px', borderRadius:'6px', border:'none', cursor:'pointer',
                          background: exportFormat===f.id ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                          color: exportFormat===f.id ? 'var(--gold-primary)' : '#ccc',
                          outline: exportFormat===f.id ? '1px solid var(--gold-primary)' : '1px solid transparent',
                          fontSize:'0.72rem', fontWeight:'bold'
                        }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>
                    {onSave && (
                      <button onClick={handleSaveAction} disabled={!sourceImg} className="btn btn-primary"
                        style={{ padding:'12px', fontSize:'0.88rem', fontWeight:'bold', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:sourceImg?1:0.5 }}>
                        💾 ບັນທຶກເຂົ້າໄປໃນລະບົບ (Save to POS)
                      </button>
                    )}
                    <button onClick={handleExportDownload} disabled={!sourceImg}
                      style={{ padding:'12px', fontSize:'0.88rem', fontWeight:'bold', width:'100%', borderRadius:'8px', border:'1px solid rgba(212,175,55,0.35)', background:'rgba(212,175,55,0.1)', color:'var(--gold-primary)', cursor:sourceImg?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:sourceImg?1:0.5 }}>
                      📥 ດາວໂຫຼດຮູບ (Download Image)
                    </button>
                  </div>

                  <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:'8px', padding:'12px', fontSize:'0.72rem', color:'#bbb', lineHeight:1.5 }}>
                    📌 <b>ຫມາຍເຫດ:</b> ຮູບຈະຖືກສົ່ງອອກໂດຍບໍ່ມີ Grid, Safe Area ຫຼື ຂອບນຳທາງ (Guides).
                    ຫາກຮູບມີ CORS Error, ໃຫ້ອັບໂຫຼດຮູບໃໝ່ຈາກເຄື່ອງຂອງທ່ານກ່ອນ.
                  </div>
                </>
              )}

            </div>{/* end sidebar content */}
          </div>{/* end sidebar */}

        </div>{/* end main content */}
      </div>
    </div>
  );
}
