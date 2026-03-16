import $ from "https://esm.sh/jquery";

$(document).ready(function() {
  let isDragging = false;
  let startX = 0;
  const threshold = 150;

  // --- 1. 解鎖滑動邏輯 ---
  $('.unlock-container').on('mousedown touchstart', function(e) {
    isDragging = true;
    startX = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
  });

  $(window).on('mousemove touchmove', function(e) {
    if (!isDragging) return;
    let x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
    let diff = x - startX;
    
    if (diff > 0 && diff < threshold) {
      $('.glow-line').css('transform', `translateX(${diff}px)`);
      $('.unlock-container').css('opacity', 1 - (diff / threshold));
    }
    
    if (diff >= threshold) {
      isDragging = false;
      triggerStory();
    }
  });

  $(window).on('mouseup touchend', () => {
    if (isDragging) {
      $('.glow-line').css('transform', 'translateX(0)');
      $('.unlock-container').css('opacity', 1);
    }
    isDragging = false;
  });

  // --- 2. 核心故事觸發與換頁邏輯 ---
  function triggerStory() {
    $('.sky').addClass('show-mist');
    $('#interaction-layer').addClass('fade-out');
    
    // 【第一頁啟動】
    $('.page-1').addClass('start-anim');

    // --- 轉場時間軸設定 (可視情況微調) ---
    const toPage2Time = 26000; 
    const toPage3Time = toPage2Time + 22000; 
    const toPage4Time = toPage3Time + 12000; 

    // --- 換到第二頁 ---
    setTimeout(function() {
      $('.page-1').css('opacity', '0');
      $('.page-2').show().addClass('show-page');
      $('.page-2')[0].offsetHeight; 
      $('.page-2').css('opacity', '1').addClass('start-anim');
      setTimeout(() => { $('.page-1').hide(); }, 3000);
    }, toPage2Time);

    // --- 換到第三頁 ---
    setTimeout(function() {
      $('.page-2').css('opacity', '0');
      $('.page-3').show().addClass('show-page');
      $('.page-3')[0].offsetHeight;
      $('.page-3').css('opacity', '1');
      setTimeout(() => { $('.page-3').addClass('start-anim'); }, 100);
      setTimeout(() => { $('.page-2').hide(); }, 3000);
    }, toPage3Time);

// --- 換到第四頁 ---
setTimeout(function() {
  // 1. 讓第三頁淡出
  $('.page-3').css('opacity', '0');
  
  // 2. 讓第四頁顯示並淡入 (與 Page 3 邏輯完全一致)
  $('.page-4').show().addClass('show-page');
  $('.page-4')[0].offsetHeight; // 強制重繪
  $('.page-4').css('opacity', '1');
  
  // 3. 觸發文字出現 (start-anim 會移除 blur 並讓 opacity 變 1)
  setTimeout(() => { 
    $('.page-4').addClass('start-anim'); 
  }, 100);

  // 4. 只有「最後的發光」跟「全白」作為 Page 4 的延伸動作
  setTimeout(() => {
    $('.page-4 .message-block p').addClass('soul-glow');
    setTimeout(() => {
      $('#soul-white-out').addClass('active');
    }, 4000); 
  }, 4000); 

  // 5. 隱藏舊頁面
  setTimeout(() => { $('.page-3').hide(); }, 3000);
}, toPage3Time + 10000); // 這裡的 8000ms 就是第三頁停留的時間
  }
});
