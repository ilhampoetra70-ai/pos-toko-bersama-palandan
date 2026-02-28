import { useState, useEffect, memo } from 'react';
import { Search, Filter, Calendar, User, ArrowRight, TrendingDown, RotateCcw, Layout, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { RetroHistory, RetroBox, RetroRefresh, RetroMoney } from '../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDateTime } from '../utils/format';

const EVENT_LABELS = {
    initial: { label: 'Stok Awal', color: 'bg-primary/10 text-primary dark:text-primary border-primary dark:border-primary/50' },
    sale: { label: 'Penjualan', color: 'bg-red-500/10 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50' },
    restock: { label: 'Restok', color: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' },
    adjustment: { label: 'Penyesuaian', color: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' },
    return: { label: 'Retur', color: 'bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-900/50' },
    opname: { label: 'Stock Opname', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-900/50' }
} as any;

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default memo(function StockTrailPage() {
    const [trails, setTrails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        product_id: '',
        event_type: '',
        user_id: '',
        date_from: getTodayDate(),
        date_to: getTodayDate(),
        search: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;
    const [totalCount, setTotalCount] = useState(0);


    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadTrails(1);
    }, [filters]);


    const loadInitialData = async () => {
        try {
            const [prods, usrs] = await Promise.all([
                window.api.getProducts(),
                window.api.getUsers()
            ]);
            setProducts((prods as any)?.data || (Array.isArray(prods) ? prods : []));
            setUsers((usrs as any)?.data || (Array.isArray(usrs) ? usrs : []));
        } catch (err) {
            console.error('Failed to load initial data:', err);
        }
    };

    const loadTrails = async (pageNum: number = 1) => {
        setLoading(true);
        setPage(pageNum);
        try {
            const activeFilters = {} as any;
            if (filters.product_id) activeFilters.product_id = parseInt(filters.product_id);
            if (filters.event_type) activeFilters.event_type = filters.event_type;
            if (filters.user_id) activeFilters.user_id = parseInt(filters.user_id);
            if (filters.date_from) activeFilters.date_from = filters.date_from;
            if (filters.date_to) activeFilters.date_to = filters.date_to;
            if (filters.search) activeFilters.search = filters.search;

            activeFilters.limit = PAGE_SIZE;
            activeFilters.offset = (pageNum - 1) * PAGE_SIZE;

            const [data, count] = await Promise.all([
                window.api.getStockTrailAll(activeFilters),
                window.api.getStockTrailCount(activeFilters)
            ]);

            setTrails(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Failed to load trails:', err);
        } finally {
            setLoading(false);
        }
    };


    const clearFilters = () => {
        setFilters({
            product_id: '',
            event_type: '',
            user_id: '',
            date_from: getTodayDate(),
            date_to: getTodayDate(),
            search: ''
        });
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Audit Stok</h2>
                    <p className="text-sm text-muted-foreground font-medium">Jejak logis setiap perubahan persediaan barang</p>
                </div>
                <Button onClick={() => loadTrails()} disabled={loading} className="gap-2 h-11 px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 font-bold">
                    {loading ? <RetroRefresh className="w-5 h-5 animate-spin" /> : <RetroHistory className="w-5 h-5" />}
                    Refresh Log
                </Button>
            </div>

            <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Cari Log</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                                <Input
                                    className="pl-10 h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner"
                                    placeholder="Ketik nama produk atau catatan..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Produk</label>
                            <Select value={filters.product_id} onValueChange={val => setFilters(f => ({ ...f, product_id: val }))}>
                                <SelectTrigger className="h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                                    <SelectValue placeholder="Semua Produk" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Semua Produk</SelectItem>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Jenis Event</label>
                            <Select value={filters.event_type} onValueChange={val => setFilters(f => ({ ...f, event_type: val }))}>
                                <SelectTrigger className="h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                                    <SelectValue placeholder="Semua Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Semua Event</SelectItem>
                                    {Object.entries(EVENT_LABELS).map(([key, val]: any) => (
                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">User / Pelaksana</label>
                            <Select value={filters.user_id} onValueChange={val => setFilters(f => ({ ...f, user_id: val }))}>
                                <SelectTrigger className="h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                                    <SelectValue placeholder="Semua User" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Semua User</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Dari</label>
                            <Input type="date" className="h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Sampai</label>
                            <Input type="date" className="h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={clearFilters} variant="outline" className="flex-1 h-11 font-bold gap-2 border-transparent bg-muted/50 text-foreground hover:bg-muted transition-colors shadow-none text-xs uppercase tracking-widest">
                                <RotateCcw className="w-4 h-4" /> Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                <div className="h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                    <Table className="zebra-rows">
                        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-b border-border">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">Waktu</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Produk</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center text-muted-foreground">Event</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-right text-muted-foreground">Alur Stok</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-right text-muted-foreground">Perubahan</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Oleh</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20">
                                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm font-bold text-muted-foreground">Menganalisis riwayat stok...</p>
                                    </TableCell>
                                </TableRow>
                            ) : trails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                        <RetroHistory className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                        <p className="font-bold text-lg">Tidak ada riwayat ditemukan</p>
                                    </TableCell>
                                </TableRow>
                            ) : trails.map((trail) => {
                                const eventInfo = EVENT_LABELS[trail.event_type] || { label: trail.event_type, color: 'bg-muted text-muted-foreground' };
                                const isPositive = trail.quantity_change > 0;
                                return (
                                    <TableRow key={trail.id} className="hover:bg-muted/30 transition-colors h-14 border-b border-border">
                                        <TableCell className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                                            {formatDateTime(trail.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-black text-foreground line-clamp-1">{trail.product_name}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("font-black text-[9px] uppercase tracking-wide h-5 border", eventInfo.color)}>
                                                {eventInfo.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2 text-[11px] font-sans">
                                                <span className="text-muted-foreground">{trail.quantity_before}</span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                                                <span className="font-black text-foreground">{trail.quantity_after}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "inline-flex items-center gap-1 font-black px-2 py-0.5 rounded text-[11px] tabular-nums",
                                                isPositive
                                                    ? "text-emerald-800 bg-emerald-500/10 dark:text-emerald-400"
                                                    : "text-red-800 bg-red-500/10 dark:text-red-400"
                                            )}>
                                                {isPositive ? <RetroMoney className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {isPositive ? '+' : ''}{trail.quantity_change}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground uppercase">
                                                    {trail.user_name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-[11px] font-bold text-muted-foreground">{trail.user_name || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-[11px] text-muted-foreground italic truncate" title={trail.notes}>
                                                {trail.notes || '-'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-muted/50 p-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                        <Layout className="w-4 h-4" />
                        <span>
                            {totalCount === 0 ? 'Tidak ada data' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} dari ${totalCount} entri`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTrails(page - 1)}
                            disabled={page === 1 || loading}
                            className="h-8 px-3 font-bold"
                        >
                            ← Prev
                        </Button>
                        <span className="text-[11px] font-black text-muted-foreground px-2">
                            Hal. {page} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTrails(page + 1)}
                            disabled={page >= Math.ceil(totalCount / PAGE_SIZE) || loading}
                            className="h-8 px-3 font-bold"
                        >
                            Next →
                        </Button>
                    </div>
                </div>

            </Card>
        </div>
    );
});
