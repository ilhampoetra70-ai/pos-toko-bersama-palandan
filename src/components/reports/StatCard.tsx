import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, color }: any) {
    const iconColors: Record<string, string> = {
        blue: "text-blue-500",
        green: "text-green-500",
        orange: "text-orange-500",
        purple: "text-purple-500"
    };

    return (
        <Card className="bg-card text-card-foreground border border-border rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
                    <Icon className={cn("w-4 h-4 opacity-80", iconColors[color] || 'text-primary')} />
                </div>
                <div className={cn("text-2xl font-black tabular-nums tracking-tight", color === 'green' ? "text-green-600 dark:text-green-400" : "text-foreground")}>
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}
