import { useState, useEffect, memo } from 'react';
import {
    History,
    Search,
    Filter,
    Calendar,
    User,
    Package,
    RefreshCw,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Layout,
    Info,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
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

const EVENT_LABELS = {
    initial:    { label: 'Stok Awal',     color: 'bg-blue-100   text-blue-700   hover:bg-blue-100   dark:bg-blue-900/40   dark:text-blue-300   dark:hover:bg-blue-900/50   shadow-none' },
    sale:       { label: 'Penjualan',     color: 'bg-red-100    text-red-700    hover:bg-red-100    dark:bg-red-900/40    dark:text-red-300    dark:hover:bg-red-900/50    shadow-none' },
    restock:    { label: 'Restok',        color: 'bg-green-100  text-green-700  hover:bg-green-100  dark:bg-green-900/40  dark:text-green-300  dark:hover:bg-green-900/50  shadow-none' },
    adjustment: { label: 'Penyesuaian',   color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/50 shadow-none' },
    return:     { label: 'Retur',         color: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/50 shadow-none' },
    opname:     { label: 'Stock Opname',  color: 'bg-gray-100   text-gray-700   hover:bg-gray-100   dark:bg-gray-700/60   dark:text-gray-300   dark:hover:bg-gray-700/80   shadow-none' }
} as any;

export default memo(function StockTrailPage() {
    const [trails, setTrails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        product_id: '',
        event_type: '',
        user_id: '',
        date_from: '',
        date_to: '',
        search: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

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
        loadTrails();
    }, [filters]);

    const loadInitialData = async () => {
        try {
            const [prods, usrs] = await Promise.all([
                (window as any).api.getProducts(),
                (window as any).api.getUsers()
            ]);
            setProducts(prods || []);
            setUsers(usrs || []);
        } catch (err) {
            console.error('Failed to load initial data:', err);
        }
    };

    const loadTrails = async () => {
        setLoading(true);
        try {
            const activeFilters = {} as any;
            if (filters.product_id) activeFilters.product_id = parseInt(filters.product_id);
            if (filters.event_type) activeFilters.event_type = filters.event_type;
            if (filters.user_id) activeFilters.user_id = parseInt(filters.user_id);
            if (filters.date_from) activeFilters.date_from = filters.date_from;
            if (filters.date_to) activeFilters.date_to = filters.date_to + ' 23:59:59';
            if (filters.search) activeFilters.search = filters.search;

            const data = await (window as any).api.getStockTrailAll(activeFilters);
            setTrails(data || []);
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
            date_from: '',
            date_to: '',
            search: ''
        });
        setSearchTerm('');
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Audit Stok</h2>
                    <p className="text-sm text-gray-500 font-medium">Jejak logis setiap perubahan persediaan barang</p>
                </div>
                <Button onClick={() => loadTrails()} disabled={loading} className="gap-2 h-11 px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 font-bold">
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <History className="w-5 h-5" />}
                    Refresh Log
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cari Log</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                <Input
                                    className="pl-10 h-11 bg-gray-50/50 border-none shadow-inner"
                                    placeholder="Ketik nama produk atau catatan..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Produk</label>
                            <Select value={filters.product_id} onValueChange={val => setFilters(f => ({ ...f, product_id: val }))}>
                                <SelectTrigger className="h-11 bg-gray-50/50 border-none shadow-inner data-[state=open]:bg-white dark:data-[state=open]:bg-gray-900">
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jenis Event</label>
                            <Select value={filters.event_type} onValueChange={val => setFilters(f => ({ ...f, event_type: val }))}>
                                <SelectTrigger className="h-11 bg-gray-50/50 border-none shadow-inner data-[state=open]:bg-white dark:data-[state=open]:bg-gray-900">
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">User / Pelaksana</label>
                            <Select value={filters.user_id} onValueChange={val => setFilters(f => ({ ...f, user_id: val }))}>
                                <SelectTrigger className="h-11 bg-gray-50/50 border-none shadow-inner data-[state=open]:bg-white dark:data-[state=open]:bg-gray-900">
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dari</label>
                            <Input type="date" className="h-11 bg-gray-50/50 border-none shadow-inner" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sampai</label>
                            <Input type="date" className="h-11 bg-gray-50/50 border-none shadow-inner" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={clearFilters} variant="outline" className="flex-1 h-11 font-bold gap-2">
                                <RotateCcw className="w-4 h-4" /> Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <div className="h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-gray-50/80 dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-b-2">
                                <TableHead className="font-black text-[11px] uppercase tracking-widest py-4">Waktu</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest">Produk</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-center">Event</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-right">Alur Stok</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-right">Perubahan</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest">Oleh</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest">Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20">
                                        <div className="w-10 h-10 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm font-bold text-gray-500">Menganalisis riwayat stok...</p>
                                    </TableCell>
                                </TableRow>
                            ) : trails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-gray-400">
                                        <History className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                        <p className="font-bold text-lg">Tidak ada riwayat ditemukan</p>
                                    </TableCell>
                                </TableRow>
                            ) : trails.map((trail) => {
                                const eventInfo = EVENT_LABELS[trail.event_type] || { label: trail.event_type, color: 'bg-gray-100 text-gray-700' };
                                const isPositive = trail.quantity_change > 0;
                                return (
                                    <TableRow key={trail.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors h-14">
                                        <TableCell className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                            {formatDateTime(trail.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-black text-gray-900 dark:text-gray-100 line-clamp-1">{trail.product_name}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn("font-black text-[10px] uppercase h-5", eventInfo.color)}>
                                                {eventInfo.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2 text-xs font-sans">
                                                <span className="text-gray-400">{trail.quantity_before}</span>
                                                <ArrowRight className="w-3 h-3 text-gray-300" />
                                                <span className="font-black text-gray-900">{trail.quantity_after}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "inline-flex items-center gap-1 font-black px-2 py-0.5 rounded text-xs",
                                                isPositive
                                                    ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/40"
                                                    : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/40"
                                            )}>
                                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {isPositive ? '+' : ''}{trail.quantity_change}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">
                                                    {trail.user_name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{trail.user_name || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-xs text-gray-500 italic truncate" title={trail.notes}>
                                                {trail.notes || '-'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-gray-50/80 dark:bg-gray-900/80 p-4 border-t dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Layout className="w-4 h-4" /> Total Record: <span className="text-primary-600">{trails.length} Entri Log</span>
                    </div>
                </div>
            </Card>
        </div>
    );
});
