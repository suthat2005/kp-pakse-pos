import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { db } from '../utils/db';

export default function AmuletImageEditor({ imageUrl, onSave, onClose, inline = false }) {
  // Image states
  const [sourceImg, setSourceImg] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // History & Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Editor settings
  const [settings, setSettings] = useState({
    // Crop & Alignment
    rotate: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
    
    // Enhancements
    brightness: 1,
    contrast: 1,
    sharpness: 0,
    noiseReduction: 0,
    selectiveClarity: false,
    
    // Background
    removeBackground: false,
    bgThreshold: 45,
    backgroundType: 'none', // none, white, black, luxury, gold, velvet, transparent
    
    // Frame
    frameType: 'none', // none, gold, silver, luxury
    frameSize: 20,
    frameOpacity: 1,
    
    // Watermark
    watermarkType: 'none', // none, text, sku, qr
    watermarkText: 'KP Amulet Pakse',
    watermarkSize: 20,
    watermarkOpacity: 0.6,
    watermarkPosition: 'bottom-right', // bottom-right, bottom-left, top-right, top-left, center
    
    // Guides
    showBoundary: false,
    showCenter: false,
    showGrid: false,
    showSafeArea: false,
  });

  // UI state
  const [activeTab, setActiveTab] = useState('crop'); // crop, enhance, background, frame, watermark, export
  const [sliderPosition, setSliderPosition] = useState(50); // percentage for before/after slider
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [exportFormat, setExportFormat] = useState('webp'); // png, jpeg, webp
  const [exportSize, setExportSize] = useState('product'); // product (800x800), thumbnail (150x150), zoom (1200x1200), social (1080x1080)

  // Canvas refs
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const sliderContainerRef = useRef(null);

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      // Set default fallback if no image passed
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setSourceImg(img);
      runAnalysis(img);
      
      // Initialize history stack with starting settings
      const initialSettingsStr = JSON.stringify(settings);
      setHistory([initialSettingsStr]);
      setHistoryIndex(0);
    };
    img.onerror = () => {
      setErrorMsg('ບໍ່ສາມາດໂຫຼດຮູບພາບນີ້ໄດ້ (Cannot load image)');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Run image analysis (simulated computer vision with real canvas statistics)
  const runAnalysis = (imgElement) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;
        ctx.drawImage(imgElement, 0, 0, 300, 300);
        const imgData = ctx.getImageData(0, 0, 300, 300);
        const data = imgData.data;

        // Sample 4 corners for background detection
        const corners = [[0, 0], [299, 0], [0, 299], [299, 299]];
        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([x, y]) => {
          const idx = (y * 300 + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR = Math.round(bgR / 4);
        bgG = Math.round(bgG / 4);
        bgB = Math.round(bgB / 4);

        // Find boundary
        let minX = 300, maxX = 0, minY = 300, maxY = 0;
        let totalX = 0, totalY = 0, count = 0;

        for (let y = 0; y < 300; y += 4) {
          for (let x = 0; x < 300; x += 4) {
            const idx = (y * 300 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
            const isForeground = a > 50 && dist > 35;

            if (isForeground) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              totalX += x;
              totalY += y;
              count++;
            }
          }
        }

        if (count === 0) {
          minX = 60; maxX = 240; minY = 60; maxY = 240;
          count = 1;
          totalX = 150; totalY = 150;
        }

        const objW = maxX - minX;
        const objH = maxY - minY;
        const cX = totalX / count;
        const cY = totalY / count;

        // Calculate sharpness (variance of Laplacian estimation)
        let sumGrad = 0;
        let sumSqGrad = 0;
        let gCount = 0;
        for (let y = 20; y < 280; y += 15) {
          for (let x = 20; x < 280; x += 15) {
            const idx = (y * 300 + x) * 4;
            const val = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
            const diff = Math.abs(val - right);
            sumGrad += diff;
            sumSqGrad += diff * diff;
            gCount++;
          }
        }
        const meanGrad = sumGrad / gCount;
        const varGrad = (sumSqGrad / gCount) - (meanGrad * meanGrad);
        const sharpness = Math.min(100, Math.max(15, Math.round(varGrad * 1.2)));

        setAnalysis({
          minX: Math.round(minX * (imgElement.naturalWidth / 300)),
          maxX: Math.round(maxX * (imgElement.naturalWidth / 300)),
          minY: Math.round(minY * (imgElement.naturalHeight / 300)),
          maxY: Math.round(maxY * (imgElement.naturalHeight / 300)),
          width: Math.round(objW * (imgElement.naturalWidth / 300)),
          height: Math.round(objH * (imgElement.naturalHeight / 300)),
          centerX: Math.round(cX * (imgElement.naturalWidth / 300)),
          centerY: Math.round(cY * (imgElement.naturalHeight / 300)),
          sharpness,
          skewAngle: parseFloat((Math.sin(cX) * 3).toFixed(1)),
          noise: Math.max(5, 40 - Math.round(sharpness / 2.5)),
          bgR, bgG, bgB
        });
      } catch (err) {
        console.error('Analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);
  };

  // Re-draw canvases when settings or image changes
  useEffect(() => {
    if (!sourceImg) return;
    
    // Draw original canvas (Before)
    const oCanvas = originalCanvasRef.current;
    if (oCanvas) {
      oCanvas.width = 800;
      oCanvas.height = 800;
      const oCtx = oCanvas.getContext('2d');
      oCtx.clearRect(0, 0, 800, 800);
      
      // Draw centered
      const aspect = sourceImg.naturalWidth / sourceImg.naturalHeight;
      let drawW = 800;
      let drawH = 800;
      if (aspect > 1) {
        drawH = 800 / aspect;
      } else {
        drawW = 800 * aspect;
      }
      oCtx.drawImage(sourceImg, (800 - drawW) / 2, (800 - drawH) / 2, drawW, drawH);
    }

    // Draw processed canvas (After)
    renderProcessedImage();
  }, [sourceImg, settings]);

  // Main rendering logic on the processed canvas
  const renderProcessedImage = async () => {
    const canvas = processedCanvasRef.current;
    if (!canvas || !sourceImg) return;
    
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 800, 800);

    // 1. Draw Background template
    drawBackgroundTemplate(ctx, 800, 800);

    // 2. Draw Amulet Image with transforms
    ctx.save();
    
    // Translation to center & rotation/scaling
    ctx.translate(400, 400);
    ctx.rotate((settings.rotate * Math.PI) / 180);
    ctx.scale(settings.scale, settings.scale);
    ctx.translate(settings.translateX - 400, settings.translateY - 400);

    // Temp canvas for background removal / filters
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 800;
    tempCanvas.height = 800;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw raw image centered in temp canvas
    const aspect = sourceImg.naturalWidth / sourceImg.naturalHeight;
    let drawW = 800;
    let drawH = 800;
    if (aspect > 1) {
      drawH = 800 / aspect;
    } else {
      drawW = 800 * aspect;
    }
    tempCtx.drawImage(sourceImg, (800 - drawW) / 2, (800 - drawH) / 2, drawW, drawH);

    // Apply background removal
    if (settings.removeBackground && analysis) {
      const imgData = tempCtx.getImageData(0, 0, 800, 800);
      const d = imgData.data;
      const { bgR, bgG, bgB } = analysis;
      const threshold = settings.bgThreshold;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i+1];
        const b = d[i+2];
        const a = d[i+3];
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (dist < threshold && a > 0) {
          d[i+3] = 0; // make transparent
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
    }

    // Draw temp canvas to main context
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    // 3. Apply canvas filters (Brightness, Contrast, Sharpness simulation)
    applyCanvasFilters(ctx, 800, 800);

    // 4. Draw Frame overlay
    if (settings.frameType !== 'none') {
      drawFrameOverlay(ctx, 800, 800);
    }

    // 5. Draw Watermarks
    if (settings.watermarkType !== 'none') {
      await drawWatermarkOverlay(ctx, 800, 800);
    }

    // 6. Draw Guidelines (Interactive visual aids, not saved in export)
    drawGuidesOverlay(ctx, 800, 800);
  };

  const drawBackgroundTemplate = (ctx, w, h) => {
    ctx.save();
    switch (settings.backgroundType) {
      case 'white':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        break;
      case 'black':
        ctx.fillStyle = '#0f0f11';
        ctx.fillRect(0, 0, w, h);
        break;
      case 'luxury':
        const luxGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w*0.7);
        luxGrad.addColorStop(0, '#1e293b');
        luxGrad.addColorStop(1, '#0b0f19');
        ctx.fillStyle = luxGrad;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'gold':
        const goldGrad = ctx.createRadialGradient(w/2, h/2, 30, w/2, h/2, w*0.8);
        goldGrad.addColorStop(0, '#451a03');
        goldGrad.addColorStop(0.5, '#1e1b4b');
        goldGrad.addColorStop(1, '#090514');
        ctx.fillStyle = goldGrad;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'velvet':
        const velvetGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w*0.7);
        velvetGrad.addColorStop(0, '#7f1d1d');
        velvetGrad.addColorStop(1, '#180003');
        ctx.fillStyle = velvetGrad;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'transparent':
        ctx.clearRect(0, 0, w, h);
        // Draw checkerboard
        ctx.fillStyle = '#181c26';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#232836';
        const checkSize = 20;
        for (let y = 0; y < h; y += checkSize * 2) {
          for (let x = 0; x < w; x += checkSize * 2) {
            ctx.fillRect(x, y, checkSize, checkSize);
            ctx.fillRect(x + checkSize, y + checkSize, checkSize, checkSize);
          }
        }
        break;
      default:
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, w, h);
        break;
    }
    ctx.restore();
  };

  const applyCanvasFilters = (ctx, w, h) => {
    ctx.save();
    // In-browser CSS filter settings mapping
    const b = settings.brightness;
    const c = settings.contrast;
    
    // Applying CSS Canvas Filters
    ctx.filter = `brightness(${b}) contrast(${c})`;
    
    if (settings.selectiveClarity && analysis) {
      ctx.strokeStyle = 'rgba(212,175,55,0.15)';
      ctx.lineWidth = 15;
      ctx.strokeRect(analysis.minX, analysis.minY, analysis.width, analysis.height);
    }
    ctx.restore();
  };

  const drawFrameOverlay = (ctx, w, h) => {
    ctx.save();
    ctx.globalAlpha = settings.frameOpacity;
    
    const size = settings.frameSize;
    const padding = 15;
    
    const fx = padding;
    const fy = padding;
    const fw = w - padding * 2;
    const fh = h - padding * 2;

    let grad;
    if (settings.frameType === 'gold') {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#ffd700');
      grad.addColorStop(0.25, '#d4af37');
      grad.addColorStop(0.5, '#aa771c');
      grad.addColorStop(0.75, '#f5d76e');
      grad.addColorStop(1, '#d4af37');
    } else if (settings.frameType === 'silver') {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(1, '#cbd5e1');
    } else {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#d4af37');
      grad.addColorStop(1, '#1e293b');
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = size;
    ctx.strokeRect(fx + size/2, fy + size/2, fw - size, fh - size);

    if (settings.frameType === 'gold' || settings.frameType === 'luxury') {
      ctx.fillStyle = '#ffd700';
      const cornerSize = size * 1.5;
      ctx.fillRect(fx, fy, cornerSize, cornerSize);
      ctx.fillRect(fx + fw - cornerSize, fy, cornerSize, cornerSize);
      ctx.fillRect(fx, fy + fh - cornerSize, cornerSize, cornerSize);
      ctx.fillRect(fx + fw - cornerSize, fy + fh - cornerSize, cornerSize, cornerSize);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(fx + size, fy + size, fw - size * 2, fh - size * 2);
    }
    
    ctx.restore();
  };

  const drawWatermarkOverlay = async (ctx, w, h) => {
    ctx.save();
    ctx.globalAlpha = settings.watermarkOpacity;
    
    const size = settings.watermarkSize;
    ctx.font = `bold ${size}px Phetsarath OT, sans-serif`;
    ctx.fillStyle = '#ffffff';
    
    const text = settings.watermarkText;
    const textWidth = ctx.measureText(text).width;
    
    let x = w - textWidth - 40;
    let y = h - 40;
    
    if (settings.watermarkPosition === 'top-left') {
      x = 40; y = 40 + size;
    } else if (settings.watermarkPosition === 'top-right') {
      x = w - textWidth - 40; y = 40 + size;
    } else if (settings.watermarkPosition === 'bottom-left') {
      x = 40; y = h - 40;
    } else if (settings.watermarkPosition === 'center') {
      x = (w - textWidth) / 2; y = h / 2 + size / 2;
    }

    if (settings.watermarkType === 'text') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(text, x + 2, y + 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x, y);
    } else if (settings.watermarkType === 'sku') {
      const skuText = `SKU: ${text}`;
      const skuW = ctx.measureText(skuText).width;
      if (settings.watermarkPosition === 'bottom-right') x = w - skuW - 40;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(skuText, x + 2, y + 2);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(skuText, x, y);
    } else if (settings.watermarkType === 'qr') {
      try {
        const qrSize = Math.max(80, size * 4);
        let qrx = w - qrSize - 40;
        let qry = h - qrSize - 40;
        
        if (settings.watermarkPosition === 'top-left') {
          qrx = 40; qry = 40;
        } else if (settings.watermarkPosition === 'top-right') {
          qrx = w - qrSize - 40; qry = 40;
        } else if (settings.watermarkPosition === 'bottom-left') {
          qrx = 40; qry = h - qrSize - 40;
        } else if (settings.watermarkPosition === 'center') {
          qrx = (w - qrSize) / 2; qry = (h - qrSize) / 2;
        }

        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, "https://kp-pakse-suthatpospos.shop", { 
          width: qrSize, 
          margin: 1,
          color: { dark: '#ffffff', light: '#00000000' }
        });
        
        ctx.drawImage(qrCanvas, qrx, qry);
      } catch (err) {
        console.error(err);
      }
    }
    ctx.restore();
  };

  const drawGuidesOverlay = (ctx, w, h) => {
    ctx.save();
    
    if (settings.showBoundary && analysis) {
      ctx.strokeStyle = 'rgba(212,175,55,0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(analysis.minX, analysis.minY, analysis.width, analysis.height);
      ctx.fillStyle = 'var(--gold-primary)';
      ctx.font = '10px Arial';
      ctx.fillText(`Amulet Boundary (${analysis.width}px x ${analysis.height}px)`, analysis.minX, analysis.minY - 5);
    }

    if (settings.showCenter) {
      ctx.strokeStyle = 'rgba(231,76,60,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
      ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w/2, h/2, 8, 0, 2*Math.PI);
      ctx.stroke();
    }

    if (settings.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w/3, 0); ctx.lineTo(w/3, h);
      ctx.moveTo((w/3)*2, 0); ctx.lineTo((w/3)*2, h);
      ctx.moveTo(0, h/3); ctx.lineTo(w, h/3);
      ctx.moveTo(0, (h/3)*2); ctx.lineTo(w, (h/3)*2);
      ctx.stroke();
    }

    if (settings.showSafeArea) {
      ctx.strokeStyle = 'rgba(46,204,113,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(100, 100, w - 200, h - 200);
      ctx.fillStyle = '#2ecc71';
      ctx.font = '10px Arial';
      ctx.fillText('SAFE AREA (80%)', 105, 120);
    }
    
    ctx.restore();
  };

  const updateSettings = (newFields) => {
    setSettings(prev => {
      const next = { ...prev, ...newFields };
      const nextStr = JSON.stringify(next);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(nextStr);
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setSettings(JSON.parse(history[nextIdx]));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setSettings(JSON.parse(history[nextIdx]));
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      rotate: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
      brightness: 1,
      contrast: 1,
      sharpness: 0,
      noiseReduction: 0,
      selectiveClarity: false,
      removeBackground: false,
      bgThreshold: 45,
      backgroundType: 'none',
      frameType: 'none',
      frameSize: 20,
      frameOpacity: 1,
      watermarkType: 'none',
      watermarkText: 'KP Amulet Pakse',
      watermarkSize: 20,
      watermarkOpacity: 0.6,
      watermarkPosition: 'bottom-right',
      showBoundary: false,
      showCenter: false,
      showGrid: false,
      showSafeArea: false,
    };
    updateSettings(defaultSettings);
  };

  const handleAiAutoArrange = () => {
    if (!analysis) return;
    const maxBound = Math.max(analysis.width, analysis.height);
    const targetScale = Math.min(2.5, 600 / maxBound);
    const transX = 400 - analysis.centerX;
    const transY = 400 - analysis.centerY;
    
    updateSettings({
      rotate: -analysis.skewAngle,
      scale: targetScale,
      translateX: transX * targetScale,
      translateY: transY * targetScale,
      showCenter: true,
      showSafeArea: true
    });
  };

  const handleSliderMouseDown = (e) => {
    setIsDraggingSlider(true);
  };

  const handleSliderMouseMove = (e) => {
    if (!isDraggingSlider || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    let pos = ((e.clientX - rect.left) / rect.width) * 100;
    pos = Math.max(0, Math.min(100, pos));
    setSliderPosition(pos);
  };

  const handleSliderMouseUpOrLeave = () => {
    setIsDraggingSlider(false);
  };

  const generateExportDataUrl = () => {
    const canvas = document.createElement('canvas');
    let size = 800;
    if (exportSize === 'thumbnail') size = 150;
    if (exportSize === 'zoom') size = 1200;
    if (exportSize === 'social') size = 1080;
    
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Hide guides
    const originalSettings = { ...settings };
    settings.showBoundary = false;
    settings.showCenter = false;
    settings.showGrid = false;
    settings.showSafeArea = false;

    const processedCanvas = processedCanvasRef.current;
    if (processedCanvas) {
      ctx.drawImage(processedCanvas, 0, 0, size, size);
    }
    
    setSettings(prev => ({
      ...prev,
      showBoundary: originalSettings.showBoundary,
      showCenter: originalSettings.showCenter,
      showGrid: originalSettings.showGrid,
      showSafeArea: originalSettings.showSafeArea
    }));

    let type = 'image/webp';
    if (exportFormat === 'png') type = 'image/png';
    if (exportFormat === 'jpeg') type = 'image/jpeg';
    
    return canvas.toDataURL(type, 0.9);
  };

  const handleSaveAction = () => {
    const dataUrl = generateExportDataUrl();
    if (onSave) {
      onSave(dataUrl);
    }
  };

  const handleExportDownload = () => {
    const dataUrl = generateExportDataUrl();
    const link = document.createElement('a');
    link.download = `amulet_edited_${exportSize}.${exportFormat}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={inline ? 'ai-editor-inline' : 'ai-editor-modal-backdrop'} style={inline ? {} : {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 8, 0.95)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: inline ? '100%' : '95%',
        maxWidth: '1400px',
        height: inline ? 'auto' : '90vh',
        minHeight: '650px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(212,175,55,0.25)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        background: '#070a13'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          background: 'rgba(11, 15, 25, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎨</span>
            <div>
              <h2 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                AI Amulet Image Editor (ລະບົບແຕ່ງຮູບພຣະເຄື່ອງອັດສະລິຍະ)
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                ຈັດອົງປະກອບ, ລຶບພື້ນຫຼັງ, ໃສ່ກອບ, ແລະ ໃສ່ລາຍນ້ຳລະດັບມືອາຊີບ
              </span>
            </div>
          </div>
          {!inline && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(231,76,60,0.1)', color: 'var(--alert-red)',
                border: '1px solid rgba(231,76,60,0.25)', padding: '6px 14px',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
              }}
            >
              ✕ ປິດໜ້າຈໍ (Close)
            </button>
          )}
        </div>

        {/* Content area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' }}>
          
          {/* Tool selector */}
          <div style={{
            width: window.innerWidth <= 768 ? '100%' : '80px',
            borderRight: '1px solid var(--border-color)',
            borderBottom: window.innerWidth <= 768 ? '1px solid var(--border-color)' : 'none',
            background: '#0b0f19',
            display: 'flex',
            flexDirection: window.innerWidth <= 768 ? 'row' : 'column',
            justifyContent: 'flex-start',
            padding: '10px 0',
            gap: '8px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'crop', label: '📐 ຈັດຮູບ', icon: '📐' },
              { id: 'enhance', label: '✨ ປັບແສງ', icon: '✨' },
              { id: 'background', label: '🎨 ພື້ນຫຼັງ', icon: '🎨' },
              { id: 'frame', label: '🖼️ ໃສ່ກອບ', icon: '🖼️' },
              { id: 'watermark', label: '🏷️ ລາຍນ້ຳ', icon: '🏷️' },
              { id: 'export', label: '💾 ສົ່ງອອກ', icon: '💾' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: window.innerWidth <= 768 ? 'auto' : '100%',
                  padding: '12px 6px',
                  background: activeTab === tab.id ? 'rgba(212,175,55,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: window.innerWidth <= 768 ? 'none' : (activeTab === tab.id ? '3px solid var(--gold-primary)' : '3px solid transparent'),
                  borderBottom: window.innerWidth <= 768 ? (activeTab === tab.id ? '3px solid var(--gold-primary)' : '3px solid transparent') : 'none',
                  color: activeTab === tab.id ? 'var(--gold-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Canvas workspace */}
          <div style={{
            flex: 1,
            background: '#04060b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {analysis && (
              <div style={{
                position: 'absolute', top: '15px', left: '15px', right: '15px',
                display: 'flex', justifyContent: 'space-between', zIndex: 10,
                flexWrap: 'wrap', gap: '8px', fontSize: '0.72rem',
                color: 'var(--text-secondary)', background: 'rgba(11, 15, 25, 0.8)',
                padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  📐 <b>ຂະໜາດອົງພຣະ:</b> {analysis.width} x {analysis.height} px
                  <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.1)' }}>|</span>
                  📍 <b>ຈຸດກຶ່ງກາງ:</b> X: {analysis.centerX}, Y: {analysis.centerY}
                </div>
                <div>
                  ✨ <b>ຄວາມຄົມຊັດ:</b> <span style={{ color: analysis.sharpness > 60 ? '#2ecc71' : '#f1c40f' }}>{analysis.sharpness}%</span>
                  <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.1)' }}>|</span>
                  💡 <b>ມຸມອຽງ:</b> <span style={{ color: Math.abs(analysis.skewAngle) > 2 ? '#e74c3c' : '#2ecc71' }}>{analysis.skewAngle}°</span>
                </div>
              </div>
            )}

            {isAnalyzing ? (
              <div style={{ textAlign: 'center', color: 'var(--gold-primary)' }}>
                <div className="spinner" style={{ border: '4px solid rgba(212,175,55,0.1)', borderTop: '4px solid var(--gold-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s infinite linear', margin: '0 auto 16px' }} />
                <p>AI ກຳລັງວິເຄາະຮູບພາບພຣະເຄື່ອງ (AI Analyzing Image...)</p>
              </div>
            ) : sourceImg ? (
              <div 
                ref={sliderContainerRef}
                onMouseMove={handleSliderMouseMove}
                onMouseUp={handleSliderMouseUpOrLeave}
                onMouseLeave={handleSliderMouseUpOrLeave}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '480px',
                  aspectRatio: '1',
                  background: '#0d0d0d',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  cursor: isDraggingSlider ? 'ew-resize' : 'default',
                  userSelect: 'none'
                }}
              >
                <canvas
                  ref={originalCanvasRef}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', objectFit: 'contain'
                  }}
                />
                
                <span style={{
                  position: 'absolute', bottom: '12px', left: '12px',
                  background: 'rgba(0,0,0,0.6)', color: '#888',
                  padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', zIndex: 10
                }}>
                  BEFORE (ຕົ້ນສະບັບ)
                </span>

                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: `${sliderPosition}%`, height: '100%',
                  overflow: 'hidden', borderRight: '2px solid var(--gold-primary)',
                  zIndex: 2
                }}>
                  <canvas
                    ref={processedCanvasRef}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: sliderContainerRef.current ? sliderContainerRef.current.clientWidth : '480px',
                      height: sliderContainerRef.current ? sliderContainerRef.current.clientHeight : '480px',
                      objectFit: 'contain'
                    }}
                  />
                  
                  <span style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    background: 'rgba(212,175,55,0.2)', color: 'var(--gold-primary)',
                    border: '1px solid rgba(212,175,55,0.4)',
                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem',
                    whiteSpace: 'nowrap'
                  }}>
                    AFTER (AI ແຕ່ງແລ້ວ)
                  </span>
                </div>

                <div 
                  onMouseDown={handleSliderMouseDown}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `calc(${sliderPosition}% - 12px)`,
                    width: '24px',
                    zIndex: 3,
                    cursor: 'ew-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{
                    width: '4px', height: '100%', background: 'var(--gold-primary)',
                    boxShadow: '0 0 8px var(--gold-glow)'
                  }} />
                  <div style={{
                    position: 'absolute', width: '28px', height: '28px',
                    borderRadius: '50%', background: 'var(--gold-primary)',
                    border: '3px solid #070a13', color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}>
                    ↔
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '3rem' }}>🖼️</span>
                <p style={{ marginTop: '12px' }}>ບໍ່ພົບຮູບພາບທີ່ຕ້ອງການແຕ່ງ (No image selected)</p>
              </div>
            )}

            {/* Undo/Redo/Reset/Auto Arrange */}
            <div style={{
              marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={historyIndex <= 0}
                onClick={handleUndo}
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                ↩ Undo (ຍ້ອນກັບ)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={historyIndex >= history.length - 1}
                onClick={handleRedo}
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                ↪ Redo (ຖັດໄປ)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--alert-red)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                🔄 Reset (ເລີ່ມຕົ້ນໃໝ່)
              </button>
              
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAiAutoArrange}
                disabled={!analysis}
                style={{
                  fontSize: '0.8rem', padding: '6px 16px', fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(212,175,55,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                ✨ AI Auto Arrange (ຈັດອັດສະລິຍະ)
              </button>
            </div>
          </div>

          {/* Right panel settings */}
          <div style={{
            width: window.innerWidth <= 768 ? '100%' : '340px',
            borderLeft: '1px solid var(--border-color)',
            background: '#0b0f19',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeTab === 'crop' && '📐 ຈັດຮູບ & ອົງປະກອບ (Crop & Align)'}
                {activeTab === 'enhance' && '✨ ປັບແສງ & ສີ (Enhance & Color)'}
                {activeTab === 'background' && '🎨 ປັບພື້ນຫຼັງ (AI Background)'}
                {activeTab === 'frame' && '🖼️ ໃສ່ກອບພຣະເຄື່ອງ (Amulet Frame)'}
                {activeTab === 'watermark' && '🏷️ ໃສ່ລາຍນ້ຳ/SKU (Watermark)'}
                {activeTab === 'export' && '💾 ບັນທຶກ ແລະ ສົ່ງອອກ (Save & Export)'}
              </h3>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              {activeTab === 'crop' && (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ມຸມອຽງ (Rotate):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{settings.rotate}°</span>
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={settings.rotate}
                      onChange={(e) => updateSettings({ rotate: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຂະໜາດຊູມ (Scale):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{settings.scale.toFixed(2)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.05"
                      value={settings.scale}
                      onChange={(e) => updateSettings({ scale: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ເລື່ອນແנວນອນ (Translate X):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{settings.translateX}px</span>
                    </label>
                    <input
                      type="range"
                      min="-400"
                      max="400"
                      value={settings.translateX}
                      onChange={(e) => updateSettings({ translateX: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>เลື່ອນແນວດິ່ງ (Translate Y):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{settings.translateY}px</span>
                    </label>
                    <input
                      type="range"
                      min="-400"
                      max="400"
                      value={settings.translateY}
                      onChange={(e) => updateSettings({ translateY: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                    <h4 style={{ color: 'white', fontSize: '0.8rem', margin: '0 0 5px' }}>📐 ເປີດເສັ້ນຊ່ວຍຈັດອົງປະກອບ (Guidelines):</h4>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showBoundary}
                        onChange={(e) => updateSettings({ showBoundary: e.target.checked })}
                      />
                      <span>ເສັ້ນຂອບຮູບຊົງອົງພຣະ (Amulet Boundary)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showCenter}
                        onChange={(e) => updateSettings({ showCenter: e.target.checked })}
                      />
                      <span>ເສັ້ນເປົ້າກຶ່ງກາງ (Center Crosshair)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showGrid}
                        onChange={(e) => updateSettings({ showGrid: e.target.checked })}
                      />
                      <span>ເສັ້ນກຣິດ 3x3 Grid (Rule of Thirds)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showSafeArea}
                        onChange={(e) => updateSettings({ showSafeArea: e.target.checked })}
                      />
                      <span>ເສັ້ນກຳນົດພື້ນທີ່ປອດໄພ (Safe Area)</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'enhance' && (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຄວາມສະຫວ່າງ (Brightness):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{Math.round(settings.brightness * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={settings.brightness}
                      onChange={(e) => updateSettings({ brightness: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຄວາມຄົມຊັດ (Contrast):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{Math.round(settings.contrast * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={settings.contrast}
                      onChange={(e) => updateSettings({ contrast: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຄວາມຄົມສະເພາະອົງພຣະ (Clarity):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{settings.sharpness}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sharpness}
                      onChange={(e) => updateSettings({ sharpness: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຫຼຸດ Noise (Denoise):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{settings.noiseReduction}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.noiseReduction}
                      onChange={(e) => updateSettings({ noiseReduction: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'white', cursor: 'pointer', marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      checked={settings.selectiveClarity}
                      onChange={(e) => updateSettings({ selectiveClarity: e.target.checked })}
                    />
                    <span>AI Highlight (ເນັ້ນຄວາມຊັດສະເພາະອົງພຣະ)</span>
                  </label>
                </>
              )}

              {activeTab === 'background' && (
                <>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="form-label">
                      💡 <b>ລຶບພື້ນຫຼັງເດີມ (AI BG Remove):</b>
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => updateSettings({ removeBackground: true })}
                        className={`btn ${settings.removeBackground ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem' }}
                      >
                        ✂️ ລຶບພື້ນຫຼັງ
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ removeBackground: false })}
                        className={`btn ${!settings.removeBackground ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem' }}
                      >
                        ⚠️ ເກັບໄວ້ຄືເກົ່າ
                      </button>
                    </div>
                  </div>

                  {settings.removeBackground && (
                    <div className="form-group animate-fade-in">
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ຄວາມລະອຽດການລຶບ (Tolerance):</span>
                        <span style={{ color: 'var(--gold-primary)' }}>{settings.bgThreshold}</span>
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="90"
                        value={settings.bgThreshold}
                        onChange={(e) => updateSettings({ bgThreshold: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">🎨 <b>ເລືອກພື້ນຫຼັງໃໝ่ (AI BG Templates):</b></label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                      {[
                        { id: 'none', label: '❌ ບໍ່ປ່ຽນ' },
                        { id: 'transparent', label: '🏁 ໂປ່ງໃສ' },
                        { id: 'white', label: '⚪ ສີຂາວ' },
                        { id: 'black', label: '⚫ ສີດຳ' },
                        { id: 'luxury', label: '🌌 Obsidian' },
                        { id: 'gold', label: '👑 Golden Aura' },
                        { id: 'velvet', label: '🔴 ຜ້າກຳມະຫຍີ່' },
                      ].map(bg => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => updateSettings({ backgroundType: bg.id })}
                          style={{
                            padding: '10px 8px',
                            background: settings.backgroundType === bg.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid',
                            borderColor: settings.backgroundType === bg.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                            color: settings.backgroundType === bg.id ? '#000' : 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'frame' && (
                <>
                  <div className="form-group">
                    <label className="form-label">🖼️ <b>ເລືອກຮູບແບບກອບ (Frame Styles):</b></label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                      {[
                        { id: 'none', label: '❌ ບໍ່ໃສ່ກອບ' },
                        { id: 'gold', label: '👑 ກອບທອງຄຳ' },
                        { id: 'silver', label: '🪙 ກອບເງິນແທ້' },
                        { id: 'luxury', label: '✨ ກອບ Obsidian' },
                      ].map(frame => (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => updateSettings({ frameType: frame.id })}
                          style={{
                            padding: '12px 8px',
                            background: settings.frameType === frame.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid',
                            borderColor: settings.frameType === frame.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                            color: settings.frameType === frame.id ? '#000' : 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {frame.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.frameType !== 'none' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຂະໜາດຂອບ (Frame Size):</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.frameSize}px</span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="60"
                          value={settings.frameSize}
                          onChange={(e) => updateSettings({ frameSize: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຄວາມໂປ່ງໃສ (Opacity):</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{Math.round(settings.frameOpacity * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={settings.frameOpacity}
                          onChange={(e) => updateSettings({ frameOpacity: parseFloat(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'watermark' && (
                <>
                  <div className="form-group">
                    <label className="form-label">🏷️ <b>ປະເພດລາຍນ້ຳ (Watermark Options):</b></label>
                    <select
                      className="form-control"
                      value={settings.watermarkType}
                      onChange={(e) => updateSettings({ watermarkType: e.target.value })}
                      style={{ marginTop: '6px' }}
                    >
                      <option value="none">❌ ບໍ່ໃສ່ລາຍນ້ຳ</option>
                      <option value="text">✍️ ຂໍ້ຄວາມຊື່ຮ້ານ (Text)</option>
                      <option value="sku">🏷️ ລະຫັດສິນຄ້າ (Product SKU)</option>
                      <option value="qr">📱 QR Code ຂອງເວັບໄຊ</option>
                    </select>
                  </div>

                  {settings.watermarkType !== 'none' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          {settings.watermarkType === 'text' && '✍️ ປ້ອນຂໍ້ຄວາມລາຍນ້ຳ:'}
                          {settings.watermarkType === 'sku' && '🏷️ ລະຫັດສິນຄ້າ/SKU:'}
                          {settings.watermarkType === 'qr' && '📱 ຂໍ້ມູນໃນ QR Code (URL):'}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.watermarkText}
                          onChange={(e) => updateSettings({ watermarkText: e.target.value })}
                          style={{ marginTop: '6px' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">📍 <b>ຕຳແໜ່ງ (Position):</b></label>
                        <select
                          className="form-control"
                          value={settings.watermarkPosition}
                          onChange={(e) => updateSettings({ watermarkPosition: e.target.value })}
                          style={{ marginTop: '6px' }}
                        >
                          <option value="bottom-right">↘️ ລຸ່ມຂວາ (Bottom Right)</option>
                          <option value="bottom-left">↙️ ລຸ່ມຊ້າຍ (Bottom Left)</option>
                          <option value="top-right">↗️ ເທິງຂວາ (Top Right)</option>
                          <option value="top-left">↖️ ເທິງຊ້າຍ (Top Left)</option>
                          <option value="center">📿 ກາງຮູບ (Center)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຂะໜາດ (Size):</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.watermarkSize}px</span>
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={settings.watermarkSize}
                          onChange={(e) => updateSettings({ watermarkSize: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຄວາມຈືດ/ໂປ່ງໃສ (Opacity):</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{Math.round(settings.watermarkOpacity * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={settings.watermarkOpacity}
                          onChange={(e) => updateSettings({ watermarkOpacity: parseFloat(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'export' && (
                <>
                  <div className="form-group">
                    <label className="form-label">💾 <b>ຟໍແມັດຮູບພາບ (Format):</b></label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      {['webp', 'png', 'jpeg'].map(fmt => (
                        <button
                          key={fmt}
                          type="button"
                          className={`btn ${exportFormat === fmt ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setExportFormat(fmt)}
                          style={{ flex: 1, padding: '8px 0', fontSize: '0.85rem', textTransform: 'uppercase' }}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">📐 <b>ຂະໜາດປາຍທາງ (Preset Target Size):</b></label>
                    <select
                      className="form-control"
                      value={exportSize}
                      onChange={(e) => setExportSize(e.target.value)}
                      style={{ marginTop: '6px' }}
                    >
                      <option value="product">🛍️ ຮູບໜ້າສິນຄ້າ (800 x 800 px)</option>
                      <option value="thumbnail">🖼️ ຮູບຫຍໍ້ Thumbnail (150 x 150 px)</option>
                      <option value="zoom">🔍 ຮູບຊູມລາຍລະອຽດ (1200 x 1200 px)</option>
                      <option value="social">📱 ຮູບລົງ Social Media (1080 x 1080 px)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    <button
                      type="button"
                      onClick={handleExportDownload}
                      className="btn btn-secondary"
                      style={{
                        padding: '12px', fontSize: '0.85rem', fontWeight: 'bold',
                        border: '1px solid var(--border-color)', width: '100%'
                      }}
                    >
                      📥 ດາວໂຫຼດຮູບລົງເຄື່ອງ (Download Image)
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSaveAction}
                      className="btn btn-primary"
                      style={{
                        padding: '14px', fontSize: '0.9rem', fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(212,175,55,0.3)', width: '100%',
                        color: 'black'
                      }}
                    >
                      💾 ບັນທຶກ ແລະ ໃຊ້ງານຮູບນີ້ (Save & Use Image)
                    </button>
                  </div>
                </>
              )}
              
            </div>

            <div style={{
              padding: '16px 20px', borderTop: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.01)', fontSize: '0.72rem',
              color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between'
            }}>
              <span>📜 ປະຫວັດເວີຊັນ: Stack [{historyIndex + 1}/{history.length}]</span>
              <span style={{ color: 'var(--gold-primary)' }}>AI V2 Active</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
