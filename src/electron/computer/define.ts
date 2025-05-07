// 程序名
export const APP_NAME = 'TalktoComputer';

// 快捷键 （快捷键冲突问题！ F4和office重复冲突，F3是搜索等）
export const VOICE_INPUT_SHORTCUT = 'F4';

// 语音录制
export const WAV_SAMPLE_RATE = 16000;
export const WAV_BITS_PER_SAMPLE = 16;
export const WAV_CHANNELS = 1;

// 文本发送类型
export enum sendTextType {
  siliconflowKey = 'siliconflowKey',
  getSiliconflowBalance = 'getSiliconflowBalance',
  getSiliconflowKey = 'getSiliconflowKey',
  getShortcutCommand = 'getShortcutCommand',
  updateShortcutCommand = 'updateShortcutCommand',
  updateTextAutoProcess = 'updateTextAutoProcess',
  openUrl = 'openUrl',
}


// 快捷指令相关的
export enum ShortcutCommandType {
  search    = '搜索',
  cmd       = '执行命令',
  software  = '软件',
  url       = '网页',
  path      = '文件',
  copyText  = '文本',
  steam     = 'steam',
}

// 快捷指令存储格式
export interface ShortcutCommand {
  name: string;
  type: ShortcutCommandType;
  value: string;
  embedding: number[];
}

// 对文本的默认处理
export interface TextAutoProcess {
  autoCopyFlag: boolean;
  autoPasteFlag: boolean;
  autoEnterFlag: boolean;
}
