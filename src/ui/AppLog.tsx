import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from 'react';

import { useGlobalState } from './globalState';

export function AppLog() {
  const { logList, setLogList } = useGlobalState();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 当日志列表更新时，自动滚动到顶部
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
    console.log('logList:', logList);
  }, [logList]);
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">运行结果</h2>
      <ScrollArea className="h-[300px]">
        <div ref={scrollRef} className="space-y-2 pr-3">
          {logList.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">暂无结果</p>
          ) : (
            // 使用 reverse() 的副本来反转列表，这样最新的日志显示在顶部
            [...logList].reverse().map((log, index) => (
              <Card key={index} className="shadow-sm">
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap break-words">{log}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}