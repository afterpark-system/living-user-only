import $ from "https://esm.sh/jquery";

$(document).ready(function() {
  // 父親的未接來電訊息內容
  const messages = [
    "妹妹", "警察說妳在醫院", "妳在哪裡", "接電話好嗎", 
    "是詐騙嗎", "不要嚇我", "拜託⋯", "接一下電話"
  ];

  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  const threshold = 100; // 滑動超過 100px 則觸發故事

  // --- 1. RWD 網格避開重疊系統 ---
  // 建立虛擬網格，確保文字隨機出現但不會疊在一起
  let gridPool = [];
  const rows = 5; 
  const cols = 2; 

  function initGrids() {
    gridPool = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        gridPool.push({
          x: 15 + (c * 40) + (Math.random() * 10), // 限制橫向範圍
          y: 15 + (r * 15) + (Math.random() * 5)  // 限制縱向範圍
        });
      }
    }
    // 洗牌演算法：打亂座標順序
    for (let i = gridPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gridPool[i], gridPool[j]] = [gridPool[j], gridPool[i]];
    }
  }
  initGrids();

  // --- 2. 滑動互動邏輯 ---
  $('.unlock-container').on('mousedown touchstart', function(e) {
    isDragging = true;
    // 取得點擊起始點 (相容滑鼠與觸控)
    startX = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
  });

  $(window).on('mousemove touchmove', function(e) {
    if (!isDragging) return;
    let x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : 0);
    let diff = x - startX;

    // 滑動過程中的視覺回饋
    if (diff > 0 && diff < threshold) {
      $('.glow-line').css('transform', `translateX(${diff}px)`); // 線條跟著手動
      $('.unlock-container').css('opacity', 1 - (diff / threshold * 0.5));
    }
    
    // 超過門檻，觸發故事
    if (diff >= threshold) {
      isDragging = false;
      startStory();
    }
  });

  $(window).on('mouseup touchend', () => {
    // 如果沒滑到位就放手，重置位置
    if (isDragging) {
      $('.glow-line').css('transform', 'translateX(0)');
      $('.unlock-container').css('opacity', 1);
    }
    isDragging = false;
  });

  // --- 3. 故事播放邏輯 ---
  function startStory() {
    $('#interaction-layer').addClass('fade-out'); // 隱藏解鎖介面
    setTimeout(playNextMessage, 1500); // 留白 1.5 秒後開始顯示第一句
  }

  function playNextMessage() {
    // 當訊息播放完畢時
    if (currentIndex >= messages.length) {
      setTimeout(() => {
        $('.text-stream').addClass('final-vanish'); // 觸發全場消逝動畫
      }, 3000); // 最後一句播完，等 3 秒開始消失
      return; 
    }

    // 將舊文字加上類別（觸發 Sass 中的變暗效果）
    $('.floating-text').addClass('is-old');

    // 建立新的文字元素
    const $text = $('<div class="floating-text"></div>').text(messages[currentIndex]);
    
    // 從網格池中提取座標
    if (currentIndex >= gridPool.length) initGrids();
    const pos = gridPool[currentIndex];

    // RWD：手機端調整最大寬度
    const isMobile = $(window).width() < 600;
    
    $text.css({ 
      left: pos.x + '%', 
      top: pos.y + '%',
      maxWidth: isMobile ? '75%' : '450px'
    });
    
    $('.text-stream').append($text);

    // 文字進場：從模糊變清晰
    setTimeout(() => {
      $text.css({
        opacity: 1,
        filter: 'blur(0px)'
      });
    }, 50);

    currentIndex++;
    
    // 設定每 3 秒顯示下一句
    setTimeout(playNextMessage, 3000);
  }
});