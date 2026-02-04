import { uIOhook } from 'uiohook-napi';

// 监听按下事件
uIOhook.on('keydown', (event) => {
  console.log('按键按下:', event);
  // event 包含 keycode, rawcode 等信息
});

// 监听抬起事件
uIOhook.on('keyup', (event) => {
  console.log('按键抬起:', event);
});

// 启动监听
uIOhook.start();

// 建议在进程退出时停止监听
process.on('beforeExit', () => {
  uIOhook.stop();
});