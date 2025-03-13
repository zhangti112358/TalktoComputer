import { AppSidebar } from "@/components/app-home-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";


import { sendTextType } from '@/electron/computer/define';
import { useGlobalState } from './globalState';


// ... 替换选中的行:
// 输入key（隐藏具体值） 刷新余额按钮 余额显示
const ApiKeySection = () => {
  const {apiKey, setApiKey} = useGlobalState();
  const {balance, setBalance} = useGlobalState();
  const [loading, setLoading] = useState(false);


  // api key变化
  const handleApiKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
  };

  // 回车更新key
  const hadleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      try {
        // 调用保存 API Key 的函数
        await window.electron.sendTextData(sendTextType.siliconflowKey, apiKey);
        console.log('API Key 已保存');
        // 保存成功后，获取余额
        fetchBalance();
      } catch (error) {
        console.error('保存 API Key 失败:', error);
      }
    }
  }

  const fetchBalance = async () => {
    if (!apiKey) {
      return;
    }
    
    setLoading(true);
    try {
      // 这里需要实现实际的余额获取逻辑
      // 示例实现:
      const balance = await window.electron.sendTextData(sendTextType.getSiliconflowBalance, '');
      setBalance(balance); // 模拟获取到的余额
    } catch (error) {
      console.error("获取余额失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">硅基流动 API Key</Label>
            <div className="flex gap-2">
              <Input 
                id="apiKey"
                type="password" 
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e)}
                onKeyDown={(e) => hadleKeyDown(e)}
                placeholder="输入您的 Key 然后按回车"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchBalance} 
                disabled={loading || !apiKey}
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="sr-only">刷新余额</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">余额:</span>
            {loading ? (
              <span className="text-sm text-muted-foreground">加载中...</span>
            ) : balance ? (
              <span className="text-sm font-semibold">{balance}</span>
            ) : (
              <span className="text-sm text-muted-foreground">未获取余额</span>
            )}
          </div>

          
          {/* <div className="flex items-center gap-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://cloud.siliconflow.cn/i/hyRgBGdj', '_blank')}
              className="text-xs"
            >
              注册账号
            </Button>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

import { NAV_HEIGHT } from './Common.tsx';

/*

输入key（隐藏具体值） 刷新余额按钮 余额显示
*/

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar 
      style={{ 
        height: `calc(100vh - ${NAV_HEIGHT})`,
      }}
      />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}

export function AppHome() {
  // const [number1, setNumber1]     = useState(0);
  return (
      <ApiKeySection />
    );
}