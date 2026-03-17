import $ from "https://esm.sh/jquery";

$(document).ready(function() {
  // 1. 進入頁面後 0.5 秒開始淡入雲霧
  setTimeout(() => {
    $('.sky').addClass('show-mist');
  }, 500);
});