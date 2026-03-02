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
    // 1. 抓取內容層的總高度 (包含捲動範圍)
    // 如果你的內容是在 #news-container 裡面，就抓它的高度
    const container = document.getElementById('news-container');
    const fullHeight = container.scrollHeight; 

    bWidth = bCanvas.width = maskCanvas.width = window.innerWidth;
    bHeight = bCanvas.height = maskCanvas.height = fullHeight; 

    // 2. 初始化遮罩 (黑色)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, bWidth, bHeight);

    // 建立呼吸血跡點
    bloodDots = Array.from({ length: 1500 }, () => ({
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

  // 修改後的 erase 函式
  function erase(x, y) {
    // 獲取目前捲動的高度
    const scrollY = window.scrollY || window.pageYOffset;
    
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.filter = 'blur(15px)';
    maskCtx.beginPath();
    
  // 修正 Y 座標：clientX/Y 是視窗座標，需要加上捲動距離才是畫布座標
    const canvasY = y + scrollY;

    if (lastPoint) {
      maskCtx.lineWidth = 100;
      maskCtx.lineCap = 'round';
      maskCtx.moveTo(lastPoint.x, lastPoint.y);
      maskCtx.lineTo(x, canvasY);
      maskCtx.stroke();
    } else {
      maskCtx.arc(x, canvasY, 50, 0, Math.PI * 2);
      maskCtx.fill();
    }
    maskCtx.filter = 'none';
    lastPoint = { x, y: canvasY }; // 儲存修正後的 Y
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

  // 修改事件監聽
  $(bCanvas).on('mousedown touchstart', (e) => {
    isDrawing = true;
    const ev = e.originalEvent.touches ? e.originalEvent.touches[0] : e;

    const scrollY = window.scrollY || window.pageYOffset;
    lastPoint = { x: ev.clientX, y: ev.clientY + scrollY };

    erase(ev.clientX, ev.clientY);

    if (!$('#news-container').hasClass('visible')) {
      $('#news-container').addClass('visible');
      $('.instruction').fadeOut(1000);
      // 這裡不要加 .is-active，否則 pointer-events 變 none 就不能再刮了
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