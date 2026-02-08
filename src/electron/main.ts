import { app, BrowserWindow, globalShortcut, ipcMain, systemPreferences, Menu } from 'electron';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { ipcMainHandle, isDev, portDev } from './util.js'
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { pollResources, getStaticData } from './resourceManager.js';
import { ContextReasoner, ComputerExecutor, ShortcutCommandUtil } from './computer/reasoner.js';

import { VOICE_INPUT_SHORTCUT, sendTextType, MemoryTransfer } from './computer/define.js';

// 语音输入快捷键
const voiceInputShortcut = VOICE_INPUT_SHORTCUT;
const hasMicrophonePermission = systemPreferences.getMediaAccessStatus('microphone') === 'granted';

app.on('ready', async () =>  {
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1000,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
    }
  });


  // console.log('hasMicrophonePermission', hasMicrophonePermission);

  // 加载UI之前的操作
  ShortcutCommandUtil.init();


  if (isDev()){
    // 区分开发过程，实时加载代码修改
    // electron 启动界面，内容从端口读取 内容由React实时创建
    mainWindow.loadURL(`http://localhost:${portDev()}`);
  }
  else {
    // 加载UI 一个html页面
    Menu.setApplicationMenu(null);  // 设置菜单栏 为空
    mainWindow.loadFile(getUIPath());
  }

  // pollResources(mainWindow); // 资源监控（前后端交互示例）

  // 用ipcHandle 类型安全
  ipcMainHandle('getStaticData', () => {
    return getStaticData();
  });

  let voiceInputFlag = false;

  // 快捷键监听设置
  let keycode = UiohookKey.F4;
  if (VOICE_INPUT_SHORTCUT === 'F4') {
    keycode = UiohookKey.F4;
  }
  else {
    // 报错
    throw new Error('当前仅支持F4作为快捷键，扩展此处代码以支持更多快捷键');
  }


  // 这里的监听是系统级的，不需要窗口获得焦点
  uIOhook.on('keydown', (e) => {
    if (e.keycode === keycode) {
      if (!voiceInputFlag) {
        console.log('检测到后台F4按下');
        mainWindow.webContents.send('startRecording');
        voiceInputFlag = true;
      }
    }
  });

  uIOhook.on('keyup', (e) => {
    if (e.keycode === keycode) {
      console.log('检测到后台F4抬起');
      mainWindow.webContents.send('stopRecording');
      voiceInputFlag = false;
    }
  });

  // 必须启动
  uIOhook.start();

  const computerExecutor = new ComputerExecutor();
  computerExecutor.init();

  // 接受前端发送的音频数据
  ipcMainHandle('sendAudio', async (event, audioData: Buffer) => {
    try {
      const memoryList = await computerExecutor.executeAudio(audioData);

      // 结果发送前端
      // console.log('send memory');
      for (let i = 0; i < memoryList.length; i++) {
        const memory = memoryList[i];
        // console.log('send memory', memory.contentText);
        const memoryTransfer:MemoryTransfer = {
          type: memory.type,
          contentText: memory.contentText,
        }
        mainWindow.webContents.send('memory', JSON.stringify(memoryTransfer));
      }

      // 根据记忆主动对话
      // const activeChatResponse = await computerExecutor.activeChatRun();
      // mainWindow.webContents.send('activeChatResponse', activeChatResponse);

      return '';
    } catch(err: any) {
      return '运行错误';
    }
  });

  // 接受前端发送的文本数据
  ipcMainHandle('sendText', async (event, payload: { type: string, text: string }) => {
    const { type, text } = payload;
    console.log('sendText', type, text);
    
    try {
      // 根据不同的类型处理文本
      switch (type) {
        case sendTextType.siliconflowKey:
          await computerExecutor.initSiliconflowKey(text);
          return 'success';
        case sendTextType.getSiliconflowBalance:
          return await computerExecutor.getSiliconflowBalance();
        case sendTextType.getSiliconflowKey:
          return await computerExecutor.getSiliconflowKey();
        case sendTextType.updateShortcutCommand:
          return await computerExecutor.updateShortcutCommand(text);
        case sendTextType.getShortcutCommand:
          return await computerExecutor.getShortcutCommand();
        case sendTextType.updateTextAutoProcess:
          return await computerExecutor.updateTextAutoProcess(text);
        case sendTextType.openUrl:
          return await computerExecutor.openUrl(text);
        default:
          console.log('Unknown type', type);
          return 'error';
      }
    } catch(err: any) {
      return 'error';
    }
  });

  mainWindow.on('closed', () => {
    uIOhook.stop();
    app.quit();
  });
});

// 退出时关闭
app.on('window-all-closed', () => app.quit());