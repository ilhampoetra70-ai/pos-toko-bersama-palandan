import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, color }: any) {
    const colors = {
        blue: "bg-blue-500 shadow-blue-500/20",
        green: "bg-green-500 shadow-green-500/20",
        orange: "bg-orange-500 shadow-orange-500/20",
        purple: "bg-purple-500 shadow-purple-500/20"
    } as any;

    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-900">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
