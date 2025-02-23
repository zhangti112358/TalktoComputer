// 定义前后端都使用的数据类型

type Statistics = {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
};

type StaticData = {
  totalStorage: number;
  cpuModel: string;
  totalMemoryGB: number;
};

// 定义前后端都使用的事件名和事件参数的类型 事件名:返回值
type EventPayloadMapping = {
  statistics: Statistics;
  getStaticData: StaticData;
  sendAudio: boolean;
};

type UnsubscribeFunction = () => void;

// 定义window对象的类型 前端可以调用window.electron.xxx 函数名:(参数)=>返回值
interface Window {
  electron: {
    ipcRenderer: {
      on: (channel: string, func: (...args: any[]) => void) => void
      once: (channel: string, func: (...args: any[]) => void) => void
      removeListener: (channel: string, func: (...args: any[]) => void) => void
    }
    subscribeStatistics: (
      callback: (statistics: Statistics) => void
    ) => UnsubscribeFunction;
    getStaticData: () => Promise<StaticData>;
    sendAudioData: (audioData: Buffer) => Promise<boolean>;
  };
}
