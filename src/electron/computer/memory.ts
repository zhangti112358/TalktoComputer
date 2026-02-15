// 存储我的记忆

// 记忆类型
export enum MemoryType {
  SpokenWords     = '说话',
  TypedText       = '打字',
  SeenImage       = '图像',
  SeenText        = '文字',
  computerAction  = '计算机操作',
  responseText    = '文字回复',
  Other           = '其他'
};

// 一条记忆
export class MemoryStrand {
  id: number = 0;
  time: number = Date.now();
  type: MemoryType = MemoryType.Other;
  contentText: string = '';
  content: any = null;
};

// 记忆读写类
export class MemoryManager {
  // 记忆列表
  private memories: MemoryStrand[] = [];

  addSpokenWords(contentText: string) {
    this.add(MemoryType.SpokenWords, contentText);
  }

  addComputerAction(contentText: string) {
    this.add(MemoryType.computerAction, contentText);
  }

  add(type: MemoryType, contentText: string, content: any = null) {
    const memory = new MemoryStrand();
    memory.id = this.memories.length + 1;
    memory.type = type;
    memory.contentText = contentText;
    memory.content = content;
    this.memories.push(memory);
  }

  // 预留：将来用于根据语义检索相关的历史
  findRelatedMemories(query: string, limit: number): MemoryStrand[] {
    // 暂时先返回最近的，以后再写向量搜索
    return this.getMemory(limit);
  }

  getMemory(num: number = -1): MemoryStrand[] {
    let memories:MemoryStrand[] = [];
    if (num == -1) {
      // 返回所有记忆
      memories = this.memories;
    }
    else if (num > 0) {
      // 返回最近的num条记忆
      const start = Math.max(0, this.memories.length - num);
      const end = this.memories.length;
      memories = this.memories.slice(start, end);
    }
    return memories;
  }

  getMemoryText(num: number = -1): string[] {
    let textList: string[] = [];
    const memories = this.getMemory(num);
    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      textList.push(memory.contentText);
    }
    return textList;
  }

  getSpokenWords(num: number = -1): string[] {
    let spokenWords: string[] = [];
    const memories = this.getMemory(num);
    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      if (memory.type === MemoryType.SpokenWords) {
        spokenWords.push(memory.contentText);
      }
    }
    return spokenWords;
  }

  clearMemories() {
    this.memories = [];
  }
};

