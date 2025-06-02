import { useState, useEffect, ReactNode, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // 确保导入Switch组件
import { Label } from "@/components/ui/label"; // 确保导入Label组件
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { isEqual } from 'lodash';

import { useGlobalState } from './globalState';


// 表格项接口
export interface ReadOnlyItem {
  [key: string]: any;
  type: string;
  contentText: string;
}

interface ReadOnlyTableProps {
  data: ReadOnlyItem[];
  title?: string | ReactNode;
  header_type?: string;
  header_content?: string;
  emptyText?: string;
}

export function ReadOnlyTable({
  data,
  title,
  header_type = "类型",
  header_content = "内容",
  emptyText = "暂无数据",
}: ReadOnlyTableProps) {
  const columnHelper = createColumnHelper<ReadOnlyItem>();
  
  const columns = [
    columnHelper.accessor('type', {
      header: () => <div className="text-center min-w-[8em]">{header_type}</div>,
      cell: info => <div className="text-center px-2">{info.getValue()}</div>,
    }),
    columnHelper.accessor('contentText', {
      header: () => <div className="text-center">{header_content}</div>,
      cell: info => <div className="text-left px-2">{info.getValue()}</div>,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4 space-y-4">
      {title && (typeof title === 'string' ? 
        <h2 className="text-lg font-semibold">{title}</h2> : title)}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


export function AppMemory() {

  // 记忆存储
  const { memoryList, setMemoryList } = useGlobalState();

  return (
    <div className="space-y-8">

      <ReadOnlyTable
      data={memoryList}
      title="记忆列表"
      header_type="记忆类型"
      header_content="记忆内容"
      emptyText="暂无记忆数据"
    />
    </div>
  );
}