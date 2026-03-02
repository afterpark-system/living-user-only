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
    // 初始化血跡畫布尺寸 (Fixed)
    bWidth = bCanvas.width = maskCanvas.width = window.innerWidth;
    bHeight = bCanvas.height = maskCanvas.height = window.innerHeight;
    
    // 初始化遮罩 (黑色代表未刮開)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, bWidth, bHeight);

    // 建立呼吸血跡點
    bloodDots = Array.from({ length: 3500 }, () => ({
      x: Math.random() * bWidth,
      y: Math.random() * bHeight,
      r: Math.random() * 25,
      baseAlpha: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2
    }));

    // 初始化點雲畫布尺寸 (根據 CSS RWD 決定)
    const rect = pCanvas.parentElement.getBoundingClientRect();
    pCanvas.width = rect.width;
    pCanvas.height = rect.height; // 隨 CSS 變動 (280px 或更高)

    initPointCloud();
  }

  function erase(x, y) {
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.filter = 'blur(15px)';
    maskCtx.beginPath();
    if (lastPoint) {
      maskCtx.lineWidth = 100;
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
    // 1. 繪製動態血跡
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

    // 2. 套用遮罩
    bCtx.globalCompositeOperation = 'destination-in';
    bCtx.drawImage(maskCanvas, 0, 0);

    // 3. 繪製點雲
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
    // 簡易街道
    for (let x = -200; x <= 200; x += 15) {
      for (let z = 0; z <= 600; z += 15) {
        let color = "rgba(100,100,100,0.2)";
        if (z > 150 && z < 300 && Math.abs(x) < 150) color = "rgba(255,255,255,0.4)";
        pPoints.push({ x, y: -20, z, size: 1.2, color });
      }
    }
    // 紅綠燈
    const addTL = (x, z) => {
      for (let h = -20; h < 100; h += 5) pPoints.push({ x, y: h, z, size: 2, color: "rgba(150,150,150,0.6)" });
      pPoints.push({ x, y: 115, z, size: 6, color: "red" });
    };
    addTL(120, 100);
  }

  // 事件監聽 (因為 MaskLayer 是 Fixed，直接用 clientX/Y 即可)
  $(bCanvas).on('mousedown touchstart', (e) => {
    isDrawing = true;
    const ev = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
    lastPoint = { x: ev.clientX, y: ev.clientY };
    erase(lastPoint.x, lastPoint.y);
    
    if ($('#news-container').css('opacity') === '0') {
      $('#news-container').addClass('visible');
      $('.instruction').fadeOut(1000);
    }
  });

  $(window).on('mousemove touchmove', (e) => {
    if (!isDrawing) return;
    const ev = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
    erase(ev.clientX, ev.clientY);
  });

  $(window).on('mouseup touchend', () => { isDrawing = false; lastPoint = null; });
  $(window).on('resize', init);

  init();
  requestAnimationFrame(loop);
});