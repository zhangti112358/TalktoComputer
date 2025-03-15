import { app, BrowserWindow, globalShortcut, ipcMain, systemPreferences } from 'electron';
import { GlobalKeyboardListener } from "node-global-key-listener";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { ipcMainHandle, isDev, portDev } from './util.js'
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { pollResources, getStaticData } from './resourceManager.js';
import { ContextReasoner, ComputerExecutor } from './computer/reasoner.js';

import { VOICE_INPUT_SHORTCUT, sendTextType } from './computer/define.js';

// 语音输入快捷键
const voiceInputShortcut = VOICE_INPUT_SHORTCUT;
const hasMicrophonePermission = systemPreferences.getMediaAccessStatus('microphone') === 'granted';

app.on('ready', async () =>  {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    }
  });

  // console.log('hasMicrophonePermission', hasMicrophonePermission);

  if (isDev()){
    // 区分开发过程，实时加载代码修改
    // electron 启动界面，内容从端口读取 内容由React实时创建
    mainWindow.loadURL(`http://localhost:${portDev()}`);
  }
  else {
    // 加载UI 一个html页面
    mainWindow.loadFile(getUIPath());
  }

  // pollResources(mainWindow); // 资源监控（前后端交互示例）

  // 用ipcHandle 类型安全
  ipcMainHandle('getStaticData', () => {
    return getStaticData();
  });

  // 当按下快捷键时，开始语音输入
  let voiceInputFlag = false;
  const v = new GlobalKeyboardListener();
  // 监听快捷键
  v.addListener(function (e, down) {
    // console.log(`Key pressed: ${e.name}, state: ${e.state}`);
    if (e.name === voiceInputShortcut) {
      // 如果已经按下，等待抬起停止
      if (voiceInputFlag) {
        if (e.state === 'UP'){
          mainWindow.webContents.send('stopRecording');
          voiceInputFlag = false;
        }
      }
      // 如果没有按下，等待按下操作
      else {
        if (e.state === 'DOWN'){
          mainWindow.webContents.send('startRecording');
          voiceInputFlag = true;
        }
      }
    }
  });

  const computerExecutor = new ComputerExecutor();
  computerExecutor.init();

  // 接受前端发送的音频数据
  ipcMainHandle('sendAudio', async (event, audioData: Buffer) => {
    try {
      const result = await computerExecutor.executeAudio(audioData);

      // 结果发送前端
      console.log('send log');
      mainWindow.webContents.send('log', result);
      return result || '';
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
        default:
          console.log('Unknown type', type);
          return 'error';
      }
    } catch(err: any) {
      return 'error';
    }
  });
});
