import $ from "https://esm.sh/jquery";

$(function() {
  const bCanvas = document.getElementById('bloodCanvas');
  const bCtx = bCanvas.getContext('2d');
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d');
  const pCanvas = document.getElementById('pointCloud');
  const pCtx = pCanvas.getContext('2d');

  let bWidth, bHeight, isDrawing = false, lastPoint = null;
  let bloodDots = [], pPoints = [];

  function init() {
    // 1. 初始化血跡畫布 (Fixed 定位)
    bWidth = bCanvas.width = maskCanvas.width = window.innerWidth;
    bHeight = bCanvas.height = maskCanvas.height = window.innerHeight;
    
    // 初始化遮罩 (黑色代表未刮開)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, bWidth, bHeight);

    // 建立呼吸血跡點 (手機建議 1500 點即可，兼顧效能與視覺)
    bloodDots = Array.from({ length: 1500 }, () => ({
      x: Math.random() * bWidth,
      y: Math.random() * bHeight,
      r: Math.random() * 25,
      baseAlpha: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2
    }));

    // 2. 初始化點雲畫布 (隨 CSS RWD 決定)
    const rect = pCanvas.parentElement.getBoundingClientRect();
    pCanvas.width = rect.width;
    pCanvas.height = rect.height; 

    initPointCloud();
  }

  // 抹除函式：改進座標邏輯
  function erase(x, y) {
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.filter = 'blur(15px)'; // 柔化邊緣
    maskCtx.beginPath();
    
    if (lastPoint) {
      maskCtx.lineWidth = 100; // 刮除寬度
      maskCtx.lineCap = 'round';
      maskCtx.moveTo(lastPoint.x, lastPoint.y);
      maskCtx.lineTo(x, y);
      maskCtx.stroke();
    } else {
      maskCtx.arc(x, y, 50, 0, Math.PI * 2);
      maskCtx.fill();
    }
    maskCtx.filter = 'none';
    lastPoint = { x, y };
  }

  function loop(time) {
    // A. 繪製動態血跡
    bCtx.clearRect(0, 0, bWidth, bHeight);
    bCtx.globalCompositeOperation = 'source-over';
    bCtx.fillStyle = '#1a0000'; // 暗色底
    bCtx.fillRect(0, 0, bWidth, bHeight);

    bloodDots.forEach(dot => {
      const breath = Math.sin(time * 0.002 + dot.phase) * 0.2;
      bCtx.fillStyle = `rgba(110, 0, 0, ${Math.max(0, dot.baseAlpha + breath)})`;
      bCtx.beginPath();
      bCtx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      bCtx.fill();
    });

    // B. 套用遮罩 (刮開效果)
    bCtx.globalCompositeOperation = 'destination-in';
    bCtx.drawImage(maskCanvas, 0, 0);

    // C. 繪製點雲新聞圖片
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    const perspective = 400;
    pPoints.forEach(p => {
      const scale = perspective / (perspective + p.z);
      const x2d = p.x * scale + pCanvas.width / 2;
      const y2d = -p.y * scale + pCanvas.height / 1.6;
      pCtx.fillStyle = p.color;
      pCtx.fillRect(x2d, y2d, p.size * scale * 2, p.size * scale * 2);
    });

    requestAnimationFrame(loop);
  }

  function initPointCloud() {
    pPoints = [];
    for (let x = -200; x <= 200; x += 15) {
      for (let z = 0; z <= 600; z += 15) {
        let color = "rgba(100,100,100,0.2)";
        if (z > 150 && z < 300 && Math.abs(x) < 150) color = "rgba(255,255,255,0.4)";
        pPoints.push({ x, y: -20, z, size: 1.2, color });
      }
    }
    const addTL = (x, z) => {
      for (let h = -20; h < 100; h += 5) pPoints.push({ x, y: h, z, size: 2, color: "rgba(150,150,150,0.6)" });
      pPoints.push({ x, y: 115, z, size: 6, color: "red" });
    };
    addTL(120, 100);
  }

  // --- 手機優化事件監聽 ---
  
  const getPos = (e) => {
    const ev = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
    const rect = bCanvas.getBoundingClientRect();
    // 即使頁面捲動，因為 Canvas 是 Fixed，所以 clientX/Y 是最準確的
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  $(bCanvas).on('mousedown touchstart', (e) => {
    isDrawing = true;
    const pos = getPos(e);
    lastPoint = pos;
    erase(pos.x, pos.y);
    
    // 顯示內容並淡出提示
    if ($('#news-container').css('opacity') === '0') {
      $('#news-container').addClass('visible');
      $('.instruction').fadeOut(1000);
    }
  });

  $(window).on('mousemove touchmove', (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    erase(pos.x, pos.y);
    // 注意：這裡不寫 e.preventDefault()，讓手機保留原生捲動功能
  });

  $(window).on('mouseup touchend touchcancel', () => { 
    isDrawing = false; 
    lastPoint = null; 
  });

  // 視窗縮放重新初始化
  $(window).on('resize', init);

  // 啟動
  init();
  requestAnimationFrame(loop);
});