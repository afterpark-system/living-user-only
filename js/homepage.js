import $ from "https://esm.sh/jquery";

$(function() {
  const $c = $('#c');
  const c = $c[0];
  const ctx = c.getContext('2d');
  const T = Math.PI * 2;
  
  let particles = [];
  const $txt = $('#news-text');
  
  // 【關鍵：填充全形空格】
  // 使用全形空格 "　" 填充，確保這三個字串的「總寬度」在視覺上是一模一樣的
  // 這樣左右括號就不會因為內容變多而移動
  const dots = ["・　　", "・・　", "・・・"]; 
  let dotIdx = 0;

  // --- 1. 粒子生成 --- 
  function createParticle(relX, relY, size, type = 'body') {
    particles.push({
      rx: relX, ry: relY, size: size, type: type, 
      prog: Math.random(), radius: Math.random() * 2 + 0.3, 
      alpha: type === 'slot' ? 0.3 : 0.6 
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

  // --- 2. 點點無限循環 ---
  function loopDots() {
    $txt.text(dots[dotIdx]);
    dotIdx = (dotIdx + 1) % dots.length;
    setTimeout(loopDots, 600);
  }

  // 【修正起始閃爍】
  // 一開始就填入包含空格的字串，讓括號直接定位在「最寬處」
  $txt.text(dots[0]); 
  dotIdx = 1; 
  loopDots();

  // --- 3. 繪圖循環 ---
  gsap.ticker.add(() => {
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
      } else if (p.type === 'slot') {
        alpha = (Math.sin(Date.now() * 0.005) * 0.2 + 0.3);
      }

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, T);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
  });
});