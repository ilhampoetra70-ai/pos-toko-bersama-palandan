import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
    onDetected: (code: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(false);
    const quaggaRef = useRef<any>(null);

    useEffect(() => {
        startScanner();
        return () => stopScanner();
    }, []);

    const startScanner = async () => {
        try {
            const Quagga = (await import('@ericblade/quagga2')).default;
            quaggaRef.current = Quagga;

            // First, get actual camera stream to ensure proper dimensions
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            // Get actual video track settings
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            const width = settings.width || 640;
            const height = settings.height || 480;

            // Stop the test stream
            stream.getTracks().forEach(t => t.stop());

            Quagga.init({
                inputStream: {
                    type: 'LiveStream',
                    target: videoRef.current || undefined,
                    constraints: {
                        facingMode: 'environment',
                        width: { min: 320, ideal: width, max: 1920 },
                        height: { min: 240, ideal: height, max: 1080 }
                    },
                    area: { // Define scan area to improve performance
                        top: '20%',
                        right: '10%',
                        left: '10%',
                        bottom: '20%'
                    }
                },
                decoder: {
                    readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader'] as any[]
                },
                locate: true,
                frequency: 10
            }, (err: any) => {
                if (err) {
                    console.error('Quagga init error:', err);
                    setError('Tidak dapat mengakses kamera: ' + (err.message || 'Pastikan kamera tersedia'));
                    return;
                }
                Quagga.start();
                setScanning(true);
            });

            Quagga.onDetected((result: any) => {
                if (result?.codeResult?.code) {
                    const code = result.codeResult.code;
                    Quagga.stop();
                    setScanning(false);
                    onDetected(code);
                }
            });
        } catch (err: any) {
            console.error('Scanner error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Akses kamera ditolak. Mohon izinkan akses kamera.');
            } else if (err.name === 'NotFoundError') {
                setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
            } else {
                setError('Gagal memuat scanner: ' + (err.message || 'Error tidak diketahui'));
            }
        }
    };

    const stopScanner = () => {
        if (quaggaRef.current) {
            try { quaggaRef.current.stop(); } catch { }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-card dark:bg-background rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-black text-xl text-foreground dark:text-foreground uppercase tracking-tight">Scan Barcode</h3>
                        <p className="text-xs text-muted-foreground font-medium">Gunakan kamera untuk mendeteksi barcode</p>
                    </div>
                    <button
                        onClick={() => { stopScanner(); onClose(); }}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error ? (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <div className="space-y-1">
                            <p className="text-sm font-black text-red-700 dark:text-red-400 capitalize">Kamera Error</p>
                            <p className="text-xs font-bold text-red-600 dark:text-red-500/70">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative group">
                            <div
                                ref={videoRef}
                                className="w-full aspect-[4/3] bg-black rounded-3xl overflow-hidden relative shadow-inner border-4 border-border dark:border-gray-900"
                            >
                                {!scanning && !error && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground text-background/80">
                                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Inisialisasi Kamera...</p>
                                    </div>
                                )}
                                {scanning && (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <div className="w-3/4 h-1 bg-red-500 opacity-60 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce"></div>
                                        </div>
                                        {/* Targeting Box */}
                                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                                            <div className="w-full h-full border-2 border-white/30 rounded-lg"></div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-border">
                                <Camera className="w-3 h-3 text-primary-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Live Scanner Active</span>
                            </div>
                        </div>

                        <div className="text-center px-4">
                            <p className="text-xs font-bold text-muted-foreground dark:text-muted-foreground leading-relaxed uppercase tracking-tight">
                                Posisikan barcode di dalam kotak pemindaian.<br />
                                Pastikan cahaya cukup terang dan tidak silau.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-8 border-t dark:border-border pt-6">
                    <Button
                        variant="outline"
                        onClick={() => { stopScanner(); onClose(); }}
                        className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-background dark:bg-background border-none shadow-sm"
                    >
                        Batal & Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}
