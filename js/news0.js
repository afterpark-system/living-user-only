import $ from "https://esm.sh/jquery";

$(function() {
  const $c = $('#c');
  const c = $c[0];
  const ctx = c.getContext('2d');
  const T = Math.PI * 2;
  
  let particles = [];
  let isMachineLit = false;      
  let isMachineFlashing = true;  
  let syncFlashAlpha = 0;        
  
  let state = "WAIT";             
  let dotIdx = 0;
  let isUnlocked = false; 
  
  const $txt = $('#news-text');
  const dots = ["・　　", "・・　", "・・・"];
  const finalTitle = '8歲童溪邊戲水失蹤\n家屬岸邊焦急守候';

  // --- 1. 粒子生成邏輯 --- 
  function createParticle(relX, relY, size, type = 'body') {
    particles.push({
      rx: relX, ry: relY, size: size, type: type, 
      prog: Math.random(), radius: Math.random() * 2 + 0.3, 
      alpha: type === 'slot' ? 0.2 : 0.6 
    });
  }

  const screenRelW = 0.85, screenRelH = 0.42;
  const screenRelX = (1 - screenRelW) / 2;
  const screenRelY = 0.12;

  for (let i = 0; i < 2200; i++) {
    const rx = Math.random(), ry = Math.random();
    const inScreen = rx > screenRelX && rx < screenRelX + screenRelW && ry > screenRelY && ry < screenRelY + screenRelH;
    if (!inScreen) createParticle(rx, ry, 1.2, 'body');
  }
  for (let i = 0; i < 450; i++) {
    const rx = screenRelX + Math.random() * screenRelW;
    const ry = screenRelY + Math.random() * screenRelH;
    const isBorder = rx < screenRelX + 0.02 || rx > screenRelX + screenRelW - 0.02 || ry < screenRelY + 0.02 || ry > screenRelY + screenRelH - 0.02;
    if (isBorder) createParticle(rx, ry, 1.3, 'border');
  }
  for (let i = 0; i < 500; i++) {
    createParticle(0.15 + Math.random() * 0.7, 0.72 + Math.random() * 0.18, 1.6, 'slot');
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  $(window).on('resize', resizeCanvas);
  resizeCanvas();

  // --- 2. 互動層邏輯 (即時推開感) ---
  $('.unlock-container').on('mousedown touchstart', function(e) {
    isDragging = true;
    startX = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
  });

  $(window).on('mousemove touchmove', function(e) {
    if (!isDragging || isUnlocked) return;
    let x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
    let diff = x - startX;
    
    if (diff > 0 && diff < threshold) {
      $('.glow-line').css('transform', `translateX(${diff}px)`);
      $('.unlock-container').css('opacity', 1 - (diff / threshold));
    }
    
    if (diff >= threshold) {
      isDragging = false;
      isUnlocked = true;
      unlockSequence();
    }
  });

  $(window).on('mouseup touchend', () => {
    if (isDragging && !isUnlocked) {
      gsap.to('.glow-line', { x: 0, duration: 0.3 });
      gsap.to('.unlock-container', { opacity: 1, duration: 0.3 });
    }
    isDragging = false;
  });

  function unlockSequence() {
    // 移除解鎖層
    gsap.to("#interaction-layer", {
      opacity: 0, duration: 1.5,
      onComplete: () => { $("#interaction-layer").hide(); }
    });

    // 強制重置主內容狀態
    $("#main-content").css({ 
      display: 'block', 
      opacity: 0,
      visibility: 'visible'
    });
    
    // 強制重繪，確保 10 秒動畫從 0 開始
    $("#main-content")[0].offsetHeight; 

    // 啟動 10 秒慢速淡入
    gsap.to("#main-content", { 
      opacity: 1, 
      duration: 10, 
      ease: "linear", // 改為線性，讓亮起速度均勻，不會開頭太快
      onStart: () => {
        // 重計點點開始時間
        window.waitStart = Date.now();
        runNewsSequence(); 
      } 
    });
  }

  // --- 3. 新聞序列控制 ---
  function runNewsSequence() {
    if (state === "WAIT") {
      $txt.text(dots[dotIdx]);
      dotIdx = (dotIdx + 1) % dots.length;
      
      if (!window.waitStart) window.waitStart = Date.now();
      
      // 點點跳動 10 秒（配合頁面浮現時長）
      if (Date.now() - window.waitStart > 10000) { 
        state = "END";
        
        gsap.fromTo($txt, 
          { opacity: 0, y: 5 }, 
          { 
            opacity: 1, 
            y: 0,
            duration: 4, 
            ease: "power1.inOut",
            onStart: () => {
              $txt.text(finalTitle).addClass('final');
              isMachineLit = true;      
              isMachineFlashing = false; 
            }
          }
        );
      } else {
        // 點點跳動速度
        setTimeout(runNewsSequence, 500);
      }
    }
  }

  // --- 4. 繪圖循環 (維持 RWD 加大尺寸) ---
  gsap.ticker.add(() => {
    if (!isUnlocked && !$("#main-content").is(":visible")) return;

    const cw = window.innerWidth, ch = window.innerHeight;
    ctx.clearRect(0, 0, cw, ch);

    const breath = Math.sin(Date.now() * 0.002) * 0.15 + 0.85;

    const mWidth = Math.min(cw * 0.48, 220); 
    const mHeight = mWidth * 2.2; 
    const mX = (cw - mWidth) / 2; 
    const mY = (ch * 0.70) - (mHeight / 2); 

    particles.forEach(p => {
      const px = mX + p.rx * mWidth, py = mY + p.ry * mHeight;
      const angle = p.prog * T;
      const x = px + Math.cos(angle) * p.radius;
      const y = py + Math.sin(angle) * p.radius;

      let alpha = p.alpha;
      if (p.type === 'body' || p.type === 'border') {
        alpha = p.alpha * breath; 
      } 
      else if (p.type === 'slot') {
        if (isMachineLit) {
          alpha = 1.0;
        } else if (isMachineFlashing) {
          const baseBreath = (Math.sin(Date.now() * 0.01) * 0.2 + 0.3);
          alpha = Math.max(baseBreath, syncFlashAlpha);
        }
      }

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, T);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
  });
});
