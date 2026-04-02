/**
 * TOTP Settings Component
 * Integrasi Google Authenticator untuk keamanan password reset
 * 
 * Features:
 * - Setup TOTP dengan QR code
 * - Backup codes management
 * - Disable TOTP
 * - Status monitoring
 */

import { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle2, Eye, EyeOff, Copy, RefreshCw, Power, ChevRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface TOTPStatus {
  enabled: boolean;
  enabledAt?: number;
  remainingBackupCodes: number;
}

interface TOTPSetupData {
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
}

interface TOTPSettingsProps {
  onMessage: (msg: string) => void;
}

export default function TOTPSettings({ onMessage }: TOTPSettingsProps) {
  const [status, setStatus] = useState<TOTPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [currentBackupCodes, setCurrentBackupCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const result = await window.api.getTOTPStatus();
      if (result.success) {
        setStatus(result.data);
      }
    } catch (err) {
      console.error('Failed to load TOTP status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setError('');
    setProcessing(true);
    try {
      const result = await window.api.generateTOTPSetup();
      if (result.success) {
        setSetupData(result.data);
        setShowSetupDialog(true);
        setShowCodes(false);
        setCopied(false);
      } else {
        setError(result.error || 'Gagal memulai setup TOTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Masukkan 6 digit kode verifikasi');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const result = await window.api.verifyAndEnableTOTP(verificationToken);
      if (result.success) {
        setShowSetupDialog(false);
        setSetupData(null);
        setVerificationToken('');
        onMessage('TOTP berhasil diaktifkan! Simpan backup codes dengan aman.');
        loadStatus();
        // Tampilkan backup codes setelah setup berhasil
        if (setupData?.backupCodes) {
          setCurrentBackupCodes(setupData.backupCodes);
          setShowBackupCodesDialog(true);
        }
      } else {
        setError(result.error || 'Verifikasi gagal. Pastikan kode benar dan waktu device tepat.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) {
      setError('Masukkan password untuk konfirmasi');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const result = await window.api.disableTOTP(disablePassword);
      if (result.success) {
        setShowDisableDialog(false);
        setDisablePassword('');
        onMessage('TOTP berhasil dinonaktifkan');
        loadStatus();
      } else {
        setError(result.error || 'Gagal menonaktifkan TOTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!regeneratePassword) {
      setError('Masukkan password untuk konfirmasi');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const result = await window.api.regenerateBackupCodes(regeneratePassword);
      if (result.success) {
        setNewBackupCodes(result.data.backupCodes);
        setRegeneratePassword('');
        setShowRegenerateDialog(false);
        loadStatus();
        // Tampilkan backup codes baru
        setCurrentBackupCodes(result.data.backupCodes);
        setShowBackupCodesDialog(true);
        onMessage('Backup codes berhasil diregenerate!');
      } else {
        setError(result.error || 'Gagal meregenerate backup codes');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setProcessing(false);
    }
  };

  const copyBackupCodes = () => {
    const codes = currentBackupCodes.join('\n');
    navigator.clipboard.writeText(codes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border",
        status?.enabled
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30"
          : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          status?.enabled
            ? "bg-green-100 dark:bg-green-900/30"
            : "bg-amber-100 dark:bg-amber-900/30"
        )}>
          {status?.enabled ? (
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "font-black",
            status?.enabled
              ? "text-green-800 dark:text-green-400"
              : "text-amber-800 dark:text-amber-400"
          )}>
            {status?.enabled ? 'TOTP Aktif' : 'TOTP Belum Diaktifkan'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {status?.enabled
              ? `Diaktifkan sejak ${formatDate(status.enabledAt)} • ${status.remainingBackupCodes} backup codes tersisa`
              : 'Aktifkan TOTP untuk keamanan password reset yang lebih baik'}
          </p>
        </div>
        {status?.enabled ? (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            Aktif
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            Nonaktif
          </Badge>
        )}
      </div>

      {/* Actions */}
      {!status?.enabled ? (
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30">
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              TOTP (Time-based One-Time Password) menggunakan Google Authenticator atau aplikasi serupa 
              untuk verifikasi dua langkah saat reset password.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleStartSetup}
            disabled={processing}
            className="w-full h-12 bg-primary hover:bg-primary/90 font-black gap-2"
          >
            {processing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
            {processing ? 'Memulai...' : 'Aktifkan TOTP Sekarang'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => setShowRegenerateDialog(true)}
            className="w-full h-11 font-bold gap-2 justify-start"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate Backup Codes
            <span className="ml-auto text-xs text-muted-foreground">
              {status.remainingBackupCodes} tersisa
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowDisableDialog(true)}
            className="w-full h-11 font-bold gap-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Power className="w-4 h-4" />
            Nonaktifkan TOTP
          </Button>
        </div>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Setup Google Authenticator
            </DialogTitle>
            <DialogDescription>
              Scan QR code dengan aplikasi Google Authenticator atau masukkan kode manual
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {setupData && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-inner">
                  <img
                    src={setupData.qrCode}
                    alt="TOTP QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Kode Manual</p>
                  <code className="px-3 py-1 bg-muted rounded-lg text-sm font-mono">
                    {setupData.manualEntryKey}
                  </code>
                </div>
              </div>

              <Separator />

              {/* Backup Codes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Backup Codes (Simpan dengan Aman!)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCodes(!showCodes)}
                    className="h-8"
                  >
                    {showCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-xl">
                  {setupData.backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="text-center py-2 px-3 bg-background rounded-lg text-sm font-mono"
                    >
                      {showCodes ? code : '••••-••••'}
                    </code>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  ⚠️ Backup codes hanya ditampilkan sekali. Simpan di tempat yang aman!
                </p>
              </div>

              <Separator />

              {/* Verification */}
              <div className="space-y-3">
                <p className="text-xs font-black">Verifikasi Setup</p>
                <p className="text-xs text-muted-foreground">
                  Masukkan 6 digit kode dari aplikasi Google Authenticator untuk mengaktifkan TOTP
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                  className="h-12 text-center text-2xl font-mono tracking-widest"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSetupDialog(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleVerifyAndEnable}
              disabled={processing || verificationToken.length !== 6}
              className="font-black"
            >
              {processing ? 'Memverifikasi...' : 'Aktifkan TOTP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black text-red-600">Nonaktifkan TOTP?</DialogTitle>
            <DialogDescription>
              Ini akan menonaktifkan verifikasi dua langkah. Masukkan password untuk konfirmasi.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password Anda"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="h-11"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={processing || !disablePassword}
            >
              {processing ? 'Memproses...' : 'Nonaktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">Regenerate Backup Codes?</DialogTitle>
            <DialogDescription>
              Backup codes lama akan dinonaktifkan. Masukkan password untuk konfirmasi.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password Anda"
              value={regeneratePassword}
              onChange={(e) => setRegeneratePassword(e.target.value)}
              className="h-11"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleRegenerateCodes}
              disabled={processing || !regeneratePassword}
            >
              {processing ? 'Memproses...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Key className="w-5 h-5" />
              Backup Codes Anda
            </DialogTitle>
            <DialogDescription>
              Simpan kode-kode ini di tempat yang aman. Kode hanya ditampilkan sekali!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded-xl">
              {currentBackupCodes.map((code, i) => (
                <code
                  key={i}
                  className="text-center py-3 px-3 bg-background rounded-lg text-lg font-mono font-bold"
                >
                  {code}
                </code>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={copyBackupCodes}
              className="w-full gap-2"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin Semua Kode'}
            </Button>

            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
                Setiap kode hanya dapat digunakan sekali. Jika habis, Anda perlu regenerate kode baru.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBackupCodesDialog(false)} className="w-full font-black">
              Saya Sudah Menyimpan Kode-kode Ini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
