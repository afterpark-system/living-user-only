import $ from "https://esm.sh/jquery";

$(function() {
  // --- 1. 全域變數與畫布宣告 ---
  const bCanvas = document.getElementById('bloodCanvas'); // 解鎖層血跡畫布
  const bCtx = bCanvas.getContext('2d');
  const pCanvas = document.getElementById('pointCloud'); // 新聞內點雲畫布
  const pCtx = pCanvas.getContext('2d');
  
  let isDragging = false; // 紀錄使用者是否正在拖拽
  let startX = 0;         // 紀錄拖拽起始的 X 座標
  const threshold = 150;  // 設定解鎖所需的拖拽距離（像素）
  let bloodDrips = [];    // 儲存正在掉落的血滴物件
  let pPoints = [];       // 儲存環境點雲的座標與屬性

  // --- 2. 核心初始化函式 ---
  function init() {
    // 設定解鎖層血跡畫布寬度（與 glow-line 同寬）
    bCanvas.width = $('.glow-line').width();
    bCanvas.height = 40;

    // 設定點雲畫布寬度（自動符合 CSS 方框容器大小）
    const rect = pCanvas.parentElement.getBoundingClientRect();
    pCanvas.width = rect.width;
    pCanvas.height = 280;

    // 初始化點雲數據
    initPointCloud();
  }

  // --- 3. 血跡視覺邏輯 ---

  /** 繪製橫跨整條線的靜態傷口痕跡 */
  function drawStaticBloodLine() {
    bCtx.beginPath();
    bCtx.strokeStyle = '#600000'; // 使用凝固般的深血紅
    bCtx.lineWidth = 3;
    bCtx.lineCap = 'round';
    bCtx.moveTo(0, 20);
    
    // 透過隨機偏移量 (Math.random) 營造出不規則的傷口裂痕感
    for(let i = 0; i <= bCanvas.width; i += 10) {
      bCtx.lineTo(i, 18 + Math.random() * 4);
    }
    bCtx.stroke();
  }

  /** 血跡動畫主迴圈：負責靜態底色與動態掉落珠 */
  function drawBlood() {
    bCtx.clearRect(0, 0, bCanvas.width, bCanvas.height);
    
    // 繪製靜態底部傷口線
    drawStaticBloodLine();

    // 繪製滑動時產生的動態掉落血珠
    bCtx.fillStyle = '#7a0000'; 
    bloodDrips.forEach((drip, index) => {
      bCtx.beginPath();
      bCtx.arc(drip.x, drip.y, drip.size, 0, Math.PI * 2);
      bCtx.fill();

      // 血滴物理性質：向下移動並隨時間縮小消失
      drip.y += drip.speed;
      drip.size *= 0.98; 

      // 移除肉眼看不見的細小血滴以優化效能
      if (drip.size < 0.1) bloodDrips.splice(index, 1);
    });
    requestAnimationFrame(drawBlood);
  }

  // --- 4. 互動與解鎖邏輯 ---

  // 滑鼠按下或手指觸碰：開啟拖拽狀態
  $('.unlock-container').on('mousedown touchstart', function(e) {
    isDragging = true;
    startX = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
  });

  // 移動中：處理視覺位移與血滴生成
  $(window).on('mousemove touchmove', function(e) {
    if (!isDragging) return;
    const x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
    const diff = Math.max(0, x - startX);

    if (diff < threshold) {
      // 視覺回饋：白線隨著手指位移
      $('.glow-line').css('transform', `translateX(${diff}px)`);
      
      // 互動特效：隨機在移動路徑上生成噴發血滴
      if (Math.random() > 0.4) { 
        bloodDrips.push({
          x: diff,
          y: 20,
          size: Math.random() * 3 + 2,
          speed: Math.random() * 0.8 + 0.4 
        });
      }
    } else {
      // 超過閾值：執行解鎖
      isDragging = false;
      unlock();
    }
  });

  // 釋放滑鼠或手指：若未達成解鎖則回彈
  $(window).on('mouseup touchend', () => {
    if (isDragging) {
      $('.glow-line').css('transform', 'translateX(0)');
    }
    isDragging = false;
  });

  /** 解鎖後轉場：切換新聞內容顯示 */
  function unlock() {
      $('#interaction-layer').addClass('fade-out');
      $('#news-container').addClass('visible');
      $('body').addClass('unlocked');
      $('html, body').css({
        'overflow-y': 'auto',
        'height': 'auto',
        'touch-action': 'pan-y'
      });

      // --- 新增：20秒後的「看我」觸發器 ---
      setTimeout(() => {
        $('p.c').addClass('highlight-active');
        // 可以在主控台留個紀錄方便你測試時確認（測試完可刪除）
        console.log("Triggered: Emotional paragraph highlight.");
      }, 20000); // 20000 毫秒 = 20 秒

      setTimeout(() => {
        $('#interaction-layer').css('display', 'none');
      }, 1500);
    }

  // --- 5. 新聞點雲與環境視覺 ---

  /** 初始化點雲數據：建立地平面與紅綠燈 */
  function initPointCloud() {
    pPoints = [];
    // 生成街道地平面點雲
    for (let x = -200; x <= 200; x += 18) {
      for (let z = 0; z <= 600; z += 18) {
        let color = "rgba(100,100,100,0.2)";
        // 在特定範圍內改變顏色，營造地景深度感
        if (z > 150 && z < 320 && Math.abs(x) < 160) color = "rgba(255,255,255,0.3)"; 
        pPoints.push({ x, y: -20, z, size: 1.2, color, isLight: false });
      }
    }
    // 加入紅綠燈結構（含燈柱與發光核心）
    const addTrafficLight = (lx, lz) => {
      for (let h = -20; h < 110; h += 6) {
        pPoints.push({ x: lx, y: h, z: lz, size: 2, color: "rgba(120,120,120,0.5)", isLight: false });
      }
      pPoints.push({ x: lx, y: 120, z: lz, size: 6, color: "red", isLight: true });
    };
    addTrafficLight(120, 100); 
  }

  /** 點雲渲染迴圈：負責 3D 投影與紅燈呼吸效果 */
  function loopPointCloud() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    const perspective = 400; // 透視距離係數
    
    // 計算紅色燈號的呼吸頻率 (明暗波動)
    const pulse = (Math.sin(Date.now() * 0.003) * 0.4) + 0.6;

    pPoints.forEach(p => {
      // 簡易 3D 轉 2D 投影公式
      const scale = perspective / (perspective + p.z);
      const x2d = p.x * scale + pCanvas.width / 2;
      const y2d = -p.y * scale + pCanvas.height / 1.6;

      if (p.isLight) {
        // 發光點特別處理：加入陰影光暈與呼吸透明度
        pCtx.save();
        pCtx.shadowBlur = 20 * pulse;
        pCtx.shadowColor = "red";
        pCtx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        pCtx.fillRect(x2d, y2d, p.size * scale * 2, p.size * scale * 2);
        pCtx.restore();
      } else {
        // 一般環境點
        pCtx.fillStyle = p.color;
        pCtx.fillRect(x2d, y2d, p.size * scale * 2, p.size * scale * 2);
      }
    });
    requestAnimationFrame(loopPointCloud);
  }

  // --- 6. 事件綁定與啟動 ---
  $(window).on('resize', init); // 視窗大小改變時重新計算寬度
  init();             // 執行初始化
  drawBlood();        // 啟動血跡繪製
  loopPointCloud();   // 啟動點雲渲染
});