import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, color }: any) {


    return (
        <Card className="bg-card text-card-foreground border border-border rounded-xl flex flex-col justify-between shadow-sm hover:shadow-lg transition-all relative overflow-hidden group/card">
            <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                <div className="flex items-end justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">{title}</span>
                    <div className="relative">
                        <div className="absolute inset-0 blur-lg opacity-20 rounded-full
                            transition-all duration-500 group-hover/card:opacity-40
                            group-hover/card:scale-150 bg-gradient-to-br
                            from-primary-400 to-primary-600" />
                        <div className="relative p-2 rounded-xl text-white shadow-md
                            bg-gradient-to-br from-primary-500 to-primary-700
                            transition-all duration-500 group-hover/card:scale-110
                            group-hover/card:rotate-6 border border-white/10">
                            <Icon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div className="text-2xl font-black tabular-nums tracking-tighter text-foreground">
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}
