// realtime-controller.js
import { db, ref, set, onValue } from './firebase-init.js';

// 1. 控制端使用的 function：更新目前應該在哪個頁面
export const sendNavigation = (pageName) => {
  const navRef = ref(db, 'navigation/currentPage');
  set(navRef, pageName)
    .then(() => console.log(`指令已發送：跳轉至 ${pageName}`))
    .catch((error) => console.error("發送失敗:", error));
};

// 2. 接收端使用的 function：監聽變動並執行跳轉
export const listenForNavigation = (callback) => {
  const navRef = ref(db, 'navigation/currentPage');
  onValue(navRef, (snapshot) => {
    const targetPage = snapshot.val();
    if (targetPage) {
      callback(targetPage);
    }
  });
};