import { AppSidebar } from "@/components/app-home-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// ... 替换选中的行:
// 输入key（隐藏具体值） 刷新余额按钮 余额显示
const ApiKeySection = () => {
  const [apiKey, setApiKey] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!apiKey) {
      return;
    }
    
    setLoading(true);
    try {
      // 这里需要实现实际的余额获取逻辑
      // 示例实现:
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBalance("$10.50"); // 模拟获取到的余额
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
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入您的 API Key" 
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
      // <Layout>
      //   <h2 className="text-lg font-semibold">App 1</h2>
      //   <p>App 1 的内容</p>
      //   {/* <p>${number1}</p> */}
      // </Layout>
      <ApiKeySection />
    );
}