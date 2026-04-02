import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle2, Loader2, Key, Eye, EyeOff, Smartphone, Shield } from 'lucide-react';
import { RetroUsers, RetroSettings } from '../components/RetroIcons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [storeName, setStoreName] = useState('POS Cashier');
    const [isBouncing, setIsBouncing] = useState(false);

    useEffect(() => {
        // Fix for unclickable inputs: Radix UI overlays sometimes leave pointer-events:none on body 
        // if they are unmounted abruptly (e.g., via logout navigating to login page).
        // Radix uses data-scroll-locked to apply pointer-events: none !important via injected styles.
        document.body.removeAttribute('data-scroll-locked');
        document.documentElement.removeAttribute('data-scroll-locked');
        document.body.style.removeProperty('pointer-events');
        document.documentElement.style.removeProperty('pointer-events');

        const root = document.getElementById('root');
        if (root) {
            root.removeAttribute('aria-hidden');
            root.removeAttribute('data-aria-hidden');
            root.style.removeProperty('pointer-events');
        }

        window.api.getSettings().then((s: any) => {
            if (s.store_name) setStoreName(s.store_name);
        });
        const expiredMsg = sessionStorage.getItem('session_expired_msg');
        if (expiredMsg) {
            setError(expiredMsg);
            sessionStorage.removeItem('session_expired_msg');
        }
        
        // Check TOTP availability
        checkTOTPAvailability();
    }, []);
    
    // TOTP State
    const [totpAvailable, setTotpAvailable] = useState(false);
    const [checkingTOTP, setCheckingTOTP] = useState(true);

    const checkTOTPAvailability = async () => {
        try {
            const available = await window.api.isTOTPAvailable();
            setTotpAvailable(available);
        } catch (err) {
            console.error('Failed to check TOTP availability:', err);
            setTotpAvailable(false);
        } finally {
            setCheckingTOTP(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Trigger bounce animation
        setIsBouncing(false);
        setTimeout(() => setIsBouncing(true), 10);

        try {
            const result = await login(username, password);
            if (!result.success) setError(result.error);
        } catch {
            setError('Login gagal. Coba lagi.');
        }
        setLoading(false);
    };

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUsername, setResetUsername] = useState('admin');
    const [totpCode, setTotpCode] = useState('');
    const [masterKey, setMasterKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [usedBackupCode, setUsedBackupCode] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess('');
        setUsedBackupCode(false);

        if (!resetUsername || !newPassword) {
            setResetError('Username dan password baru harus diisi');
            return;
        }

        // Validasi berdasarkan metode yang tersedia
        if (totpAvailable && !totpCode) {
            setResetError('Masukkan kode TOTP dari Google Authenticator');
            return;
        }
        if (!totpAvailable && !masterKey) {
            setResetError('Masukkan Master Key');
            return;
        }

        setResetLoading(true);
        try {
            let result;
            if (totpAvailable) {
                // Gunakan TOTP
                result = await window.api.resetPasswordWithTOTP(resetUsername, totpCode, newPassword);
            } else {
                // Fallback ke Master Key
                result = await window.api.resetPasswordWithMasterKey(resetUsername, masterKey, newPassword);
            }
            
            if (result.success) {
                let successMsg = 'Password berhasil direset. Silakan login dengan password baru.';
                if (result.usedBackupCode) {
                    successMsg += ' (Backup code telah digunakan)';
                    setUsedBackupCode(true);
                }
                setResetSuccess(successMsg);
                setTotpCode('');
                setMasterKey('');
                setNewPassword('');
                setTimeout(() => {
                    setShowResetModal(false);
                    setResetSuccess('');
                    setUsedBackupCode(false);
                }, 3000);
            } else {
                setResetError(result.error || 'Gagal mereset password');
            }
        } catch (err) {
            setResetError('Terjadi kesalahan sistem');
        } finally {
            setResetLoading(false);
        }
    };

    const resetMethodLabel = totpAvailable ? 'TOTP/Backup Code' : 'Master Key';
    const resetMethodIcon = totpAvailable ? <Smartphone className="w-6 h-6 text-primary" /> : <Key className="w-6 h-6 text-primary" />;

    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex items-center justify-center p-4">
            {/* Custom Styles for Arcade & Rubber Hose */}
            <style>{`
                .hose-bg {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 0;
                    overflow: hidden;
                    opacity: 0.15;
                    pointer-events: none;
                }
                .noodle {
                    position: absolute;
                    fill: none;
                    stroke: hsl(var(--foreground));
                    stroke-width: 15;
                    stroke-linecap: round;
                }
                @keyframes wiggleHose {
                    0% { d: path("M-100,50 Q200,200 500,50 T1100,50"); }
                    50% { d: path("M-100,100 Q200,0 500,100 T1100,100"); }
                    100% { d: path("M-100,50 Q200,200 500,50 T1100,50"); }
                }
                @keyframes march {
                    0% { stroke-dashoffset: 100; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes floatSlow {
                    0%   { transform: translateY(0px) rotate(0deg); }
                    50%  { transform: translateY(-30px) rotate(5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .scanlines {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(
                        to bottom,
                        rgba(255,255,255,0),
                        rgba(255,255,255,0) 50%,
                        rgba(0,0,0,0.05) 50%,
                        rgba(0,0,0,0.05)
                    );
                    background-size: 100% 6px;
                    z-index: 10;
                    pointer-events: none;
                }
                .crt-flicker {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(192, 230, 230, 0.02);
                    opacity: 0.5;
                    z-index: 11;
                    pointer-events: none;
                    animation: flicker 0.15s infinite;
                }
                @keyframes flicker {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.6; }
                    100% { opacity: 0.4; }
                }
                .retro-shadow-box {
                    box-shadow: 12px 12px 0px hsl(var(--foreground));
                    animation: cardEntrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                .retro-shadow-btn {
                    box-shadow: 6px 6px 0px hsl(var(--foreground));
                }
                .retro-shadow-btn:active {
                    transform: translate(4px, 4px);
                    box-shadow: 2px 2px 0px hsl(var(--foreground));
                }
                @keyframes cardEntrance {
                    from { transform: translateY(100px) scale(0.8); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes insertCoin {
                    0%, 49% { opacity: 1; }
                    50%, 100% { opacity: 0; }
                }
                .animate-insert-coin {
                    animation: insertCoin 1s infinite;
                }
                .bounce-action {
                    animation: rubberHoseBounce 0.4s ease-in-out;
                }
                .input-arcade:focus + svg {
                    stroke: hsl(var(--primary));
                    animation: rubberHoseBounce 0.5s;
                }
            
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                    .crt-flicker { animation: none !important; }
                }
            `}</style>

            {/* CRT Overlay */}
            <div className="scanlines"></div>
            <div className="crt-flicker"></div>

            {/* Dynamic Background */}
            <div className="hose-bg">
                <svg width="100%" height="100%" preserveAspectRatio="none">
                    <path className="noodle" d="M-100,200 Q200,50 500,200 T1100,200 T1800,200" strokeDasharray="40 20" style={{ animation: 'wiggleHose 4s infinite alternate ease-in-out, march 1s linear infinite' }} />
                    <path className="noodle" d="M-100,600 Q200,750 500,600 T1100,600 T1800,600" strokeWidth="25" strokeDasharray="60 30" style={{ animation: 'wiggleHose 5s infinite alternate-reverse ease-in-out, march 2s linear infinite reverse' }} />
                    <path className="noodle" d="M-100,900 Q200,750 500,900 T1100,900 T1800,900" strokeDasharray="20 40" style={{ animation: 'wiggleHose 3s infinite alternate ease-in-out, march 1.5s linear infinite' }} />

                    {/* Floating pie eyes background */}
                    <g style={{ animation: 'floatSlow 4s infinite ease-in-out', transformOrigin: 'center' }}>
                        <svg x="20%" y="30%" overflow="visible">
                            <ellipse cx="0" cy="0" rx="10" ry="25" fill="hsl(var(--foreground))" />
                            <path d="M -8 -15 L 8 -15 L 0 0 Z" fill="hsl(var(--background))" />
                        </svg>
                        <svg x="25%" y="30%" overflow="visible">
                            <ellipse cx="0" cy="0" rx="10" ry="25" fill="hsl(var(--foreground))" />
                            <path d="M -8 -15 L 8 -15 L 0 0 Z" fill="hsl(var(--background))" />
                        </svg>
                    </g>
                    <g style={{ animation: 'floatSlow 5s infinite ease-in-out reverse', transformOrigin: 'center' }}>
                        <svg x="80%" y="70%" overflow="visible">
                            <ellipse cx="0" cy="0" rx="15" ry="35" fill="hsl(var(--foreground))" />
                            <path d="M -12 -20 L 12 -20 L 0 0 Z" fill="hsl(var(--background))" />
                        </svg>
                        <svg x="88%" y="70%" overflow="visible">
                            <ellipse cx="0" cy="0" rx="15" ry="35" fill="hsl(var(--foreground))" />
                            <path d="M -12 -20 L 12 -20 L 0 0 Z" fill="hsl(var(--background))" />
                        </svg>
                    </g>
                </svg>
            </div>

            {/* Login Centered */}
            <div className="relative z-[5] flex items-center justify-center w-full max-w-[420px]">
                <div className={`w-full bg-background border-[6px] border-foreground rounded-3xl p-10 relative retro-shadow-box transform-style-3d ${isBouncing ? 'bounce-action' : ''}`}>

                    {/* Glove decoration overlapping card */}
                    <svg className="absolute -top-[40px] -right-[30px] w-[100px] h-[100px] pointer-events-none" style={{ fill: 'none', strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round', stroke: 'hsl(var(--foreground))', animation: 'floatSlow 3s infinite ease-in-out' }} viewBox="0 0 100 100">
                        <path style={{ fill: 'hsl(var(--background))' }} d="M30 60 C20 60 15 50 15 40 C15 30 25 25 35 30 L40 33 C40 25 45 15 55 15 C65 15 70 25 70 35 L70 45 C75 40 85 40 90 48 C95 55 90 65 80 70 L40 85 C30 88 15 80 20 70 Z" />
                        <path style={{ fill: 'hsl(var(--background))' }} d="M10 70 C0 75 10 90 20 85 L35 80 C40 78 35 65 25 68 Z" />
                        <path style={{ fill: 'hsl(var(--background))' }} d="M22 83 C15 90 25 102 35 95 L48 88 C53 85 45 74 37 77 Z" />
                        <path d="M45 50 C40 55 35 65 30 75" />
                        <path d="M55 48 C52 55 50 65 48 75" />
                    </svg>

                    <div className="text-center space-y-0.5 mb-8">
                        <div className="text-[0.9rem] font-[900] uppercase tracking-[8px] text-foreground/60">
                            POS TOKO
                        </div>
                        <div className="text-[3.2rem] font-[900] uppercase tracking-[1px] text-primary leading-tight transform -rotate-1" style={{ textShadow: '4px 4px 0px hsl(var(--foreground))' }}>
                            {storeName}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="alert-adaptive-error w-full">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <div className="relative group">
                            <Label className="block font-[900] mb-2 uppercase tracking-[1px] text-[0.9rem] text-foreground">Username</Label>
                            <div className="relative flex items-center">
                                <Input
                                    id="username"
                                    className="input-arcade w-full py-4 pl-14 pr-4 h-auto text-[1.1rem] font-bold text-foreground bg-white dark:bg-card border-[4px] border-foreground rounded-xl outline-none transition-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:border-primary focus:shadow-[4px_4px_0_hsl(var(--foreground))] focus:-translate-x-1 focus:-translate-y-1"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan Username..."
                                    required
                                    autoFocus
                                />
                                <RetroUsers className="absolute left-4 w-7 h-7 text-foreground transition-all peer-focus:text-primary pointer-events-none" />
                            </div>
                        </div>

                        <div className="relative group">
                            <Label className="block font-[900] mb-2 uppercase tracking-[1px] text-[0.9rem] text-foreground">Password</Label>
                            <div className="relative flex items-center">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="input-arcade w-full py-4 pl-14 pr-14 h-auto text-[1.1rem] font-bold text-foreground bg-white dark:bg-card border-[4px] border-foreground rounded-xl outline-none transition-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:border-primary focus:shadow-[4px_4px_0_hsl(var(--foreground))] focus:-translate-x-1 focus:-translate-y-1"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan Password..."
                                    required
                                />
                                <RetroSettings className="absolute left-4 w-7 h-7 text-foreground transition-all peer-focus:text-primary pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 p-1 text-foreground hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-arcade w-full p-4 text-[1.4rem] font-[900] uppercase tracking-[2px] text-white bg-primary border-[4px] border-foreground rounded-xl cursor-pointer transition-all mt-2 retro-shadow-btn relative overflow-hidden"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin" /> LOADING...
                                </span>
                            ) : (
                                'MASUK'
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6 font-[900] text-secondary animate-insert-coin uppercase tracking-[2px]">
                        Selamat Bekerja!!!
                    </div>

                    <div className="mt-8 text-center">
                        <span
                            className="text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            onClick={() => {
                                setShowResetModal(true);
                                setResetError('');
                                setResetSuccess('');
                                setTotpCode('');
                                setMasterKey('');
                                setNewPassword('');
                            }}
                        >
                            {totpAvailable ? (
                                <>
                                    <Smartphone className="w-3 h-3" /> Reset dengan TOTP
                                </>
                            ) : (
                                <>
                                    <Key className="w-3 h-3" /> Reset dengan Master Key
                                </>
                            )}
                        </span>
                    </div>

                    {/* Reset Password Modal */}
                    <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-4 border-foreground rounded-2xl shadow-[8px_8px_0_hsl(var(--foreground))]">
                            <DialogHeader className="p-6 border-b-4 border-foreground shrink-0 bg-card">
                                <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                                    {resetMethodIcon}
                                    {totpAvailable ? 'Reset dengan TOTP' : 'Admin Override'}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-bold mt-2">
                                    {totpAvailable 
                                        ? 'Masukkan kode TOTP dari Google Authenticator atau backup code untuk mereset password.'
                                        : 'Masukkan Master Key untuk mereset password akun.'
                                    }
                                </DialogDescription>
                                {totpAvailable && (
                                    <Badge variant="outline" className="mt-2 w-fit bg-green-100 text-green-700 border-green-200">
                                        <Shield className="w-3 h-3 mr-1" /> TOTP Aktif
                                    </Badge>
                                )}
                            </DialogHeader>
                            <form onSubmit={handleResetPassword} className="flex-1 overflow-y-auto min-h-0">
                                <div className="p-6 space-y-5">
                                    {resetError && (
                                        <div className="alert-adaptive-error">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            {resetError}
                                        </div>
                                    )}
                                    {resetSuccess && (
                                        <div className={cn(
                                            "alert-adaptive-success",
                                            usedBackupCode && "bg-amber-50 border-amber-200 text-amber-800"
                                        )}>
                                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                            {resetSuccess}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1">Username Target</Label>
                                        <Input
                                            id="reset-username"
                                            value={resetUsername}
                                            onChange={e => setResetUsername(e.target.value)}
                                            placeholder="Contoh: admin"
                                            className="h-12 bg-white dark:bg-card border-2 border-foreground shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] font-bold text-lg"
                                            required
                                        />
                                    </div>
                                    
                                    {totpAvailable ? (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                                <Smartphone className="w-3 h-3" /> 
                                                Kode TOTP / Backup Code
                                            </Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={totpCode}
                                                onChange={e => setTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').toUpperCase())}
                                                placeholder="6 digit atau XXXX-XXXX"
                                                className="h-12 bg-white dark:bg-card border-2 border-foreground shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] font-bold text-lg text-center tracking-widest"
                                                required
                                            />
                                            <p className="text-[10px] text-muted-foreground px-1">
                                                Masukkan 6 digit dari Google Authenticator atau backup code (XXXX-XXXX)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1">Master Key</Label>
                                            <Input
                                                type="password"
                                                value={masterKey}
                                                onChange={e => setMasterKey(e.target.value)}
                                                placeholder="••••••••"
                                                className="h-12 bg-white dark:bg-card border-2 border-foreground shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] font-bold text-lg"
                                                required
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1">Password Baru</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Password baru"
                                            className="h-12 bg-white dark:bg-card border-2 border-foreground shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] font-bold text-lg"
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="p-6 border-t-4 border-foreground shrink-0 gap-3 bg-muted/50">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setShowResetModal(false)} 
                                        className="flex-1 font-black h-12 uppercase tracking-widest bg-white dark:bg-card border-2 border-foreground text-foreground hover:bg-muted"
                                        disabled={resetLoading}
                                    >
                                        Batal
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={resetLoading}
                                        className="flex-1 h-12 bg-primary border-2 border-foreground font-black text-white hover:bg-primary/90 uppercase tracking-widest shadow-[4px_4px_0_hsl(var(--foreground))] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                    >
                                        {resetLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
        </div>
    );
}
