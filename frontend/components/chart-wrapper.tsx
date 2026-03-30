'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  height?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function ChartWrapper({
  title,
  description,
  icon: Icon,
  children,
  className = '',
  height = 'h-[300px]',
  emptyMessage = 'No data available',
  isEmpty = false,
}: ChartWrapperProps) {
  return (
    <Card className={`border-border/50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {Icon && (
            <Icon className="h-5 w-5 text-primary opacity-40" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className={`${height} flex items-center justify-center text-muted-foreground text-sm rounded-lg bg-secondary/20`}>
            {emptyMessage}
          </div>
        ) : (
          <div className={height}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
