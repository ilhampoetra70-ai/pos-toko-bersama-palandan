import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useDbStats,
    useBackupHistory,
    useArchivableCount,
    useDatabaseMutation
} from '@/lib/queries';
import { ShieldCheck, Settings2, Download, HardDrive, Archive, FolderOpen, Check, X, ShieldAlert, Save, Zap } from 'lucide-react';
import { RetroDatabase, RetroHistory, RetroTrash, RetroRefresh, RetroReceipt, RetroAlert, RetroUsers, RetroBox, RetroCart } from '../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DatabasePage() {
    const [activeTab, setActiveTab] = useState('stats');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [archiveMonths, setArchiveMonths] = useState(6);
    const [confirmModal, setConfirmModal] = useState<{ title: string, message: string | null, action: () => void, variant: string } | null>(null);
    const [hardResetConfirm, setHardResetConfirm] = useState('');
    const [integrityResult, setIntegrityResult] = useState<any>(null);
    const { user } = useAuth();

    // Queries
    const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useDbStats();
    const { data: backupHistory = [], isLoading: isLoadingBackup } = useBackupHistory();
    const { data: archivableCount, isLoading: isLoadingArchivable, refetch: refetchArchivable } = useArchivableCount(archiveMonths);

    // Mutations
    const mutations = useDatabaseMutation();

    const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    }, []);

    const processing = mutations.vacuum.isPending ||
        mutations.clearVoided.isPending ||
        mutations.archive.isPending ||
        mutations.resetSettings.isPending ||
        mutations.createBackup.isPending ||
        mutations.deleteBackup.isPending;

    // Actions
    const handleVacuum = async () => {
        try {
            const result = await mutations.vacuum.mutateAsync(user?.id || 0);
            if (result.success) {
                showMessage(`Optimasi berhasil. Ukuran berkurang dari ${formatFileSize(result.sizeBefore)} menjadi ${formatFileSize(result.sizeAfter)}`);
            } else {
                showMessage('Gagal optimasi: ' + result.error, 'error');
            }
        } catch (err: any) {
            showMessage('Gagal optimasi: ' + err.message, 'error');
        }
    };

    const handleCreateBackup = async () => {
        try {
            const result = await mutations.createBackup.mutateAsync();
            if (result.success) {
                showMessage('Backup cepat berhasil: ' + result.filename);
            } else {
                showMessage('Gagal backup: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (err: any) {
            showMessage('Gagal backup: ' + err.message, 'error');
        }
    };

    const handleManualBackup = async () => {
        try {
            const result = await window.api.dbManualBackup();
            if (result.success) {
                showMessage('Backup berhasil disimpan ke: ' + result.path);
                refetchStats();
            } else if (result.error !== 'Dibatalkan') {
                showMessage('Gagal backup: ' + result.error, 'error');
            }
        } catch (err: any) {
            showMessage('Gagal backup: ' + err.message, 'error');
        }
    };

    const checkIntegrity = async () => {
        try {
            const result = await window.api.dbIntegrityCheck();
            setIntegrityResult(result);
            if (result.ok) showMessage('Database dalam kondisi prima');
            else showMessage('Database bermasalah: ' + result.result, 'error');
        } catch (err: any) {
            showMessage('Gagal memeriksa integritas: ' + err.message, 'error');
        }
    };

    const handleRestoreBackup = async () => {
        setConfirmModal({
            title: 'Restore Database',
            message: 'Data saat ini akan diganti sepenuhnya dengan data dari file backup. Aplikasi akan restart setelah restore. Lanjutkan?',
            variant: 'danger',
            action: async () => {
                const result = await window.api.dbRestoreBackup(user?.id || 0);
                if (result.success) showMessage('Restore berhasil. Aplikasi akan restart...');
                else if (result.error !== 'Dibatalkan') showMessage('Gagal restore: ' + result.error, 'error');
            }
        });
    };

    const handleResetDatabase = () => {
        setConfirmModal({
            title: 'RESET SELURUH DATABASE',
            message: null,
            variant: 'hard-reset',
            action: async () => {
                await window.api.dbHardReset(user?.id || 0);
            }
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Dialog open={!!confirmModal} onOpenChange={(open) => !open && setConfirmModal(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{confirmModal?.title}</DialogTitle>
                        <DialogDescription>
                            {confirmModal?.message || "Konfirmasikan tindakan kritis ini."}
                        </DialogDescription>
                    </DialogHeader>

                    {confirmModal?.variant === 'hard-reset' && (
                        <div className="space-y-4 py-4">
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                                    SEMUA DATA akan dihapus permanen: produk, transaksi, pengguna, dan pengaturan.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Ketik RESET untuk konfirmasi</p>
                                <Input
                                    value={hardResetConfirm}
                                    onChange={e => setHardResetConfirm(e.target.value.toUpperCase())}
                                    className="h-12 border-2 border-red-100 dark:border-red-900/30 font-black text-center text-red-600 tracking-[0.2em]"
                                    placeholder="RESET"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setConfirmModal(null)} className="font-bold">Batal</Button>
                        <Button
                            variant="destructive"
                            disabled={confirmModal?.variant === 'hard-reset' && hardResetConfirm !== 'RESET'}
                            onClick={() => {
                                confirmModal?.action();
                                setConfirmModal(null);
                                setHardResetConfirm('');
                            }}
                            className="font-black gap-2"
                        >
                            {confirmModal?.variant === 'hard-reset' ? <RetroTrash className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            Ya, Lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground dark:text-foreground tracking-tight">Manajemen Database</h2>
                    <p className="text-sm text-muted-foreground font-medium">Pemeliharaan, backup, dan ekspor data sistem</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <Badge className={cn(
                            "h-9 px-4 font-bold shadow-none animate-in fade-in slide-in-from-top-2 duration-300",
                            message.type === 'error' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                        )}>
                            {message.text}
                        </Badge>
                    )}
                    <Button variant="outline" onClick={() => refetchStats()} disabled={isLoadingStats} className="h-11 px-6 shadow-sm font-bold gap-2">
                        <RetroRefresh className={cn("w-4 h-4", isLoadingStats && "animate-spin")} /> Refresh Stats
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="stats" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted dark:bg-card p-1 h-14 rounded-2xl w-full sm:w-auto overflow-x-auto sm:overflow-visible flex-nowrap">
                    <TabsTrigger value="stats" className="font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl data-[state=active]:shadow-lg">Statistik</TabsTrigger>
                    <TabsTrigger value="backup" className="font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl data-[state=active]:shadow-lg">Backup & Restore</TabsTrigger>
                    <TabsTrigger value="maintenance" className="font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl data-[state=active]:shadow-lg">Pemeliharaan</TabsTrigger>
                    <TabsTrigger value="export" className="font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl data-[state=active]:shadow-lg">Ekspor</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="stats" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-card dark:bg-background">
                                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border h-16 flex flex-row items-center justify-between py-0">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Jumlah Record Data</CardTitle>
                                    <RetroDatabase className="w-5 h-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            {stats ? [
                                                { label: 'Total Pengguna', value: stats.counts.users, icon: <RetroUsers className="w-4 h-4 text-primary" /> },
                                                { label: 'Kategori Produk', value: stats.counts.categories, icon: <Archive className="w-4 h-4 text-purple-500" /> },
                                                { label: 'Daftar Produk', value: stats.counts.products, icon: <RetroBox className="w-4 h-4 text-emerald-500" /> },
                                                { label: 'Transaksi Selesai', value: stats.counts.transactions, icon: <RetroCart className="w-4 h-4 text-orange-500" /> },
                                                { label: 'Detil Item Terjual', value: stats.counts.transaction_items, icon: <RetroReceipt className="w-4 h-4 text-muted-foreground" /> },
                                                { label: 'Pengaturan Sistem', value: stats.counts.settings, icon: <Settings2 className="w-4 h-4 text-slate-400" /> },
                                            ].map((item, i) => (
                                                <TableRow key={i} className="hover:bg-muted/30 transition-colors h-14 border-b border-border">
                                                    <TableCell className="w-12 pl-6">{item.icon}</TableCell>
                                                    <TableCell className="font-black text-foreground dark:text-foreground">{item.label}</TableCell>
                                                    <TableCell className="text-right pr-8 font-black text-lg text-primary-600 dark:text-primary-400 font-mono tracking-tight">{item.value}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={3} className="text-center py-20 opacity-20"><RetroRefresh className="w-12 h-12 mx-auto animate-spin" /></TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="border-none shadow-sm bg-card dark:bg-background">
                                    <CardHeader className="h-16 flex flex-row items-center justify-between py-0 border-b dark:border-border">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Info Filesystem</CardTitle>
                                        <HardDrive className="w-5 h-5 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex justify-between items-end border-b pb-3 dark:border-border">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ukuran File DB</span>
                                            <span className="text-xl font-black font-mono">{stats ? formatFileSize(stats.fileSize) : '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b pb-3 dark:border-border">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Backup Terakhir</span>
                                            <span className="text-xs font-bold text-muted-foreground">{stats?.lastBackupDate ? formatDate(stats.lastBackupDate) : '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Transaksi Tertua</span>
                                            <span className="text-xs font-bold text-muted-foreground">{stats?.oldestTransaction || '-'}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-primary-600 text-white">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">Pemeriksaan Integritas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-6">
                                        <p className="text-xs font-bold mb-4 leading-relaxed opacity-80">Pastikan integritas database selalu terjaga untuk mencegah kehilangan data.</p>
                                        <Button
                                            onClick={checkIntegrity}
                                            disabled={processing}
                                            className="w-full bg-card text-primary-600 hover:bg-card/90 font-black h-11 shadow-lg"
                                        >
                                            {processing ? 'Memeriksa...' : 'Jalankan Integrity Check'}
                                        </Button>
                                    </CardContent>
                                    {integrityResult && (
                                        <CardFooter className="bg-primary-700/50 py-3 flex items-center justify-center gap-2">
                                            {integrityResult.ok ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                                            <span className="text-xs font-black uppercase tracking-widest">{integrityResult.ok ? 'DATABASE OK' : 'DATABASE BERMASALAH'}</span>
                                        </CardFooter>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="backup" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm bg-card dark:bg-background border-l-4 border-l-primary-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                                        <Download className="w-6 h-6 text-primary-600" /> Buat Cadangan
                                    </CardTitle>
                                    <CardDescription className="font-bold">Backup data secara berkala untuk keamanan jangka panjang.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Button onClick={handleCreateBackup} disabled={processing} className="h-14 bg-emerald-600 hover:bg-emerald-700 font-black text-lg gap-3">
                                            <Zap className="w-5 h-5" /> Backup Cepat
                                        </Button>
                                        <Button onClick={handleManualBackup} disabled={processing} variant="outline" className="h-14 border-2 font-black text-lg gap-3">
                                            <FolderOpen className="w-5 h-5" /> Simpan Ke...
                                        </Button>
                                    </div>
                                    <div className="pt-4 border-t dark:border-border space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Storage Path</span>
                                            <Button variant="ghost" size="sm" onClick={async () => await window.api.dbSetBackupDir()} className="h-7 text-[10px] font-black text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 uppercase tracking-widest">Ubah Lokasi</Button>
                                        </div>
                                        <p className="text-[10px] font-mono text-muted-foreground dark:text-muted-foreground truncate bg-background dark:bg-card/50 p-3 rounded-lg border dark:border-border">{stats?.autoBackupDir || 'Default (userData/backups/)'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-card dark:bg-background border-l-4 border-l-orange-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                                        <RetroRefresh className="w-6 h-6 text-orange-600" /> Pulihkan Data
                                    </CardTitle>
                                    <CardDescription className="font-bold">Ganti data saat ini dengan file backup yang sudah ada.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 flex gap-3">
                                        <RetroAlert className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400 leading-relaxed uppercase tracking-tight">Perhatian: Backup otomatis akan dibuat sebelum file ditimpa. Aplikasi akan restart.</p>
                                    </div>
                                    <Button onClick={handleRestoreBackup} disabled={processing} className="w-full h-14 bg-orange-600 hover:bg-orange-700 font-black text-lg gap-3 shadow-lg shadow-orange-600/20">
                                        <RetroHistory className="w-5 h-5" /> Pilih File Backup...
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden bg-card dark:bg-background mt-6">
                            <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border h-16 flex flex-row items-center justify-between py-0">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <RetroHistory className="w-4 h-4" /> Riwayat Pencadangan Lokal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table className="zebra-rows">
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <TableRow className="border-b border-border">
                                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground pl-10">NAMA FILE CADANGAN</TableHead>
                                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground text-center">TANGGAL DIBUAT</TableHead>
                                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground text-right">UKURAN</TableHead>
                                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground text-right pr-10">AKSI</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {backupHistory.length > 0 ? backupHistory.map((b: any, i: number) => (
                                            <TableRow key={i} className="hover:bg-muted/30 transition-colors h-14 border-b border-border group">
                                                <TableCell className="pl-10">
                                                    <span className="font-mono text-xs font-black text-muted-foreground dark:text-muted-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400">{b.filename}</span>
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-bold text-muted-foreground">{new Date(b.date).toLocaleString('id-ID')}</TableCell>
                                                <TableCell className="text-right font-mono text-xs font-bold">{formatFileSize(b.size)}</TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => handleRestoreBackupFromHistory(b.path)} disabled={processing} className="h-8 font-black text-[10px] uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30">RESTORE</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => mutations.deleteBackup.mutate({ path: b.path, userId: user?.id || 0 })} disabled={processing} className="h-8 font-black text-[10px] uppercase tracking-widest text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">HAPUS</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 font-bold">Belum ada riwayat backup lokal ditemukan.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="maintenance" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MaintenanceCard
                                title="Optimasi"
                                description="Kompres file database untuk mengecilkan ukuran dan performa lebih cepat."
                                icon={HardDrive}
                                label={stats ? formatFileSize(stats.fileSize) : 'Loading...'}
                                bottomLabel="Ukuran File Saat Ini"
                                action={handleVacuum}
                                btnText="Jalankan VACUUM"
                                processing={processing}
                            />

                            <MaintenanceCard
                                title="Void Cleanup"
                                description="Hapus permanen semua catatan transaksi yang sudah dibatalkan/void."
                                icon={RetroTrash}
                                label={stats?.voidedTransactions?.toString() || '0'}
                                bottomLabel="Transaksi Void Ditemukan"
                                action={() => mutations.clearVoided.mutate(user?.id || 0)}
                                btnText="Hapus Data Void"
                                processing={processing}
                                disabled={!stats?.voidedTransactions}
                                variant="danger"
                            />

                            <MaintenanceCard
                                title="Reset Settings"
                                description="Kembalikan semua konfigurasi ke awal tanpa menghapus produk/transaksi."
                                icon={Settings2}
                                action={() => mutations.resetSettings.mutate()}
                                btnText="Reset Ke Default"
                                processing={processing}
                                variant="danger"
                            />

                            <Card className="md:col-span-2 border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <Archive className="w-5 h-5 text-primary-600" /> Arsipkan Transaksi Lama
                                    </CardTitle>
                                    <CardDescription className="font-bold">Membantu performa dengan menghapus transaksi lama yang tidak aktif.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col sm:flex-row items-end gap-6 p-6 bg-background dark:bg-card/50 rounded-2xl border dark:border-border">
                                        <div className="space-y-2 flex-1">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Retensi Data (Bulan)</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={archiveMonths}
                                                onChange={e => setArchiveMonths(parseInt(e.target.value))}
                                                className="h-12 border-none bg-card dark:bg-card font-black text-lg focus-visible:ring-primary-500"
                                            />
                                        </div>
                                        <Button onClick={() => refetchArchivable()} disabled={isLoadingArchivable} variant="secondary" className="h-12 bg-card hover:bg-muted font-black px-6 shadow-sm border border-border">
                                            {isLoadingArchivable ? 'Menghitung...' : 'Cek Jumlah Transaksi'}
                                        </Button>
                                        <Button
                                            onClick={() => mutations.archive.mutate({ months: archiveMonths, userId: user?.id || 0 })}
                                            disabled={!archivableCount?.count || mutations.archive.isPending}
                                            variant="destructive"
                                            className="h-12 px-8 font-black gap-2 shadow-lg shadow-red-600/20"
                                        >
                                            <RetroTrash className="w-4 h-4" /> Hapus Permanen
                                        </Button>
                                    </div>
                                    {archivableCount != null && (
                                        <div className="px-6 flex items-center gap-3">
                                            <Badge className="bg-orange-500 font-black px-4 h-8 shadow-none">{archivableCount.count} TRANSAKSI</Badge>
                                            <span className="text-sm font-bold text-muted-foreground italic">Ditemukan data sebelum {archivableCount.cutoffDate}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-1 border-4 border-red-500/20 shadow-sm bg-card dark:bg-background">
                                <CardHeader>
                                    <CardTitle className="text-xl font-black text-red-600 uppercase flex items-center gap-2">
                                        <RetroAlert className="w-5 h-5" /> Hard Reset
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-6">
                                    <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-6">
                                        Hapus SELURUH database. Anda akan kehilangan semua data produk, stok, transaksi, user, dan settings secara permanen.
                                    </p>
                                    <Button onClick={handleResetDatabase} className="w-full bg-red-600 hover:bg-red-700 font-black h-12 uppercase tracking-widest">
                                        Reset Seluruh Database
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="export" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm bg-card dark:bg-background">
                                <CardHeader>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <Download className="w-6 h-6 text-primary-600" /> Ekspor Transaksi Excel
                                    </CardTitle>
                                    <CardDescription className="font-bold">Hasilkan file spreadsheet lengkap dengan detail item per transaksi.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Dari Tanggal</label>
                                            <Input type="date" className="h-11 font-bold border-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Sampai Tanggal</label>
                                            <Input type="date" className="h-11 font-bold border-border" />
                                        </div>
                                    </div>
                                    <Button className="w-full h-14 bg-foreground text-background hover:bg-black font-black text-lg gap-3">
                                        <Save className="w-5 h-5" /> Hasilkan File Excel (.xlsx)
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-card dark:bg-background">
                                <CardHeader>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <RetroReceipt className="w-6 h-6 text-red-600" /> Ringkasan Database PDF
                                    </CardTitle>
                                    <CardDescription className="font-bold">Laporan teknis lengkap berisi statistik, kesehatan, dan pengaturan sistem.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-10">
                                    <Button onClick={async () => await window.api.dbExportSummaryPdf()} className="w-full h-14 bg-red-600 hover:bg-red-700 font-black text-lg gap-3 shadow-lg shadow-red-600/20">
                                        <Download className="w-5 h-5" /> Export PDF Ringkasan
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );

    function formatDate(d: string) {
        return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function handleRestoreBackupFromHistory(path: string) {
        setConfirmModal({
            title: 'Restore Backup Lokal',
            message: 'Data saat ini akan diganti dengan file backup ini. Aplikasi akan restart setelah restore. Lanjutkan?',
            variant: 'danger',
            action: async () => {
                const result = await window.api.dbRestoreFromHistory(path, user?.id || 0);
                if (result.success) showMessage('Restore berhasil. Aplikasi akan restart...');
                else showMessage('Gagal restore: ' + result.error, 'error');
            }
        });
    }
}

function MaintenanceCard({ title, description, icon: Icon, label, bottomLabel, action, btnText, processing, disabled, variant }: any) {
    return (
        <Card className="border-none shadow-sm bg-card dark:bg-background flex flex-col justify-between">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary-500" /> {title}
                </CardTitle>
                <CardDescription className="font-bold text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center py-6">
                {label && (
                    <div className="text-center group">
                        <div className="text-3xl font-black text-primary-600 dark:text-primary-400 mb-1 font-mono tracking-tight group-hover:scale-110 transition-all">{label}</div>
                        <div className="text-[10px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">{bottomLabel}</div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0">
                <Button
                    onClick={action}
                    disabled={processing || disabled}
                    variant={variant || 'outline'}
                    className={cn(
                        "w-full font-black uppercase tracking-widest text-[10px] h-11",
                        !variant && "bg-background dark:bg-card hover:bg-muted dark:hover:bg-muted border-none shadow-sm"
                    )}
                >
                    {processing ? <RetroRefresh className="w-3 h-3 animate-spin mr-2" /> : null}
                    {btnText}
                </Button>
            </CardFooter>
        </Card>
    );
}
