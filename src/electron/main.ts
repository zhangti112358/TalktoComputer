import { app, BrowserWindow, globalShortcut, ipcMain, systemPreferences } from 'electron';
import { GlobalKeyboardListener } from "node-global-key-listener";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { ipcMainHandle, isDev, portDev } from './util.js'
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { pollResources, getStaticData } from './resourceManager.js';
import { im } from 'mathjs';
import { SiliconFlow, SiliconFlowKeyDefault } from './computer/siliconflow.js';
import { ContextReasoner } from './computer/reasoner.js';

import { VOICE_INPUT_SHORTCUT } from './define.js';

// 语音输入快捷键
const voiceInputShortcut = VOICE_INPUT_SHORTCUT;
const hasMicrophonePermission = systemPreferences.getMediaAccessStatus('microphone') === 'granted';


// 字符保存文件
async function saveTextToFile(text: string, filePath: string) {
      // 随便创建一个buffer保存，字符串转buffer
      const buffer = Buffer.from(text);
      await fs.promises.writeFile(filePath, buffer);
}

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

  const reasoner = new ContextReasoner();
  await reasoner.init();

  // ipcMainHandle('sendAudio', (audioData) => {
  //   return getStaticData();
  // });
  let siliconflow =  new SiliconFlow(SiliconFlowKeyDefault());
// 在 main.ts 中
  ipcMain.handle('sendAudio', async (event, audioData: Buffer) => {
    try {
      // debug 
      // const audioPath ='./audio.wav';
      // await fs.promises.writeFile(audioPath, audioData);
      // console.log('audioPath', audioPath);

      // 语音识别
      const result = await siliconflow.speechWavToText(audioData);
      console.log('result', result);

      // 判断需求并执行
      await reasoner.reason(result);

      return { success: true };
    } catch(err: any) {
      return { success: false, error: err.message };
    }
  });

});
