import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    ShoppingCart,
    Lock,
    User as UserIcon,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [storeName, setStoreName] = useState('POS Cashier');

    useEffect(() => {
        (window as any).api.getSettings().then((s: any) => {
            if (s.store_name) setStoreName(s.store_name);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(username, password);
            if (!result.success) setError(result.error);
        } catch {
            setError('Login gagal. Coba lagi.');
        }
        setLoading(false);
    };

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUsername, setResetUsername] = useState('admin');
    const [masterKey, setMasterKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess('');

        if (!resetUsername || !masterKey || !newPassword) {
            setResetError('Semua kolom harus diisi');
            return;
        }

        try {
            const result = await (window as any).api.resetPasswordWithMasterKey(resetUsername, masterKey, newPassword);
            if (result.success) {
                setResetSuccess('Password berhasil direset. Silakan login dengan password baru.');
                setMasterKey('');
                setNewPassword('');
                setTimeout(() => {
                    setShowResetModal(false);
                    setResetSuccess('');
                }, 2000);
            } else {
                setResetError(result.error || 'Gagal mereset password');
            }
        } catch (err) {
            setResetError('Terjadi kesalahan sistem');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-none">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{storeName}</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">Masuk ke sistem</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="alert-adaptive-error mb-4">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="username"
                                    className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none shadow-inner"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan username"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none shadow-inner"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full py-6 text-lg font-semibold shadow-md">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-0">
                    <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                        <DialogTrigger asChild>
                            <Button variant="link" className="text-sm text-primary-600 hover:text-primary-700 font-medium h-auto p-0">
                                Lupa Password? Gunakan Master Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-gray-950 flex flex-col">
                            <DialogHeader className="p-6 border-b shrink-0 bg-gray-50 dark:bg-gray-900">
                                <DialogTitle className="text-xl font-black text-gray-900 dark:text-gray-100">Reset Password Admin</DialogTitle>
                                <DialogDescription className="text-gray-500 font-medium font-sans">
                                    Masukkan Master Key untuk mereset password akun.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleResetPassword} className="flex-1 overflow-y-auto min-h-0">
                                <div className="p-6 space-y-4">
                                    {resetError && (
                                        <div className="alert-adaptive-error">
                                            <AlertCircle className="w-4 h-4" />
                                            {resetError}
                                        </div>
                                    )}
                                    {resetSuccess && (
                                        <div className="alert-adaptive-success">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {resetSuccess}
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reset-username" className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Username Target</Label>
                                        <Input
                                            id="reset-username"
                                            value={resetUsername}
                                            onChange={e => setResetUsername(e.target.value)}
                                            placeholder="Contoh: admin"
                                            className="h-11 bg-gray-50 dark:bg-gray-900 border-none shadow-inner"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="master-key" className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Master Key</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="master-key"
                                                type="password"
                                                className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none shadow-inner"
                                                value={masterKey}
                                                onChange={e => setMasterKey(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="new-password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Password Baru</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="new-password"
                                                type="password"
                                                className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none shadow-inner"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Password baru"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 border-t bg-gray-50 dark:bg-gray-900 shrink-0 gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setShowResetModal(false)} className="flex-1 font-bold h-11">Batal</Button>
                                    <Button type="submit" className="flex-1 h-11 bg-gray-900 hover:bg-black font-black shadow-lg shadow-black/20 text-white uppercase tracking-tighter">
                                        Konfirmasi Reset
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <p className="text-center text-xs text-gray-400">
                        Default: admin / admin123
                    </p>
                </CardFooter >
            </Card >
        </div >
    );
}
