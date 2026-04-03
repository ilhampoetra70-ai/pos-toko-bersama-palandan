import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HardDrive, Globe, Check, Wifi, WifiOff, Database, Cloud } from 'lucide-react';

interface AiOnboardingModalProps {
  isOpen: boolean;
  onSelectMode: (mode: 'local' | 'api') => void;
  onClose: () => void;
}

export function AiOnboardingModal({ isOpen, onSelectMode, onClose }: AiOnboardingModalProps) {
  const [selectedMode, setSelectedMode] = useState<'local' | 'api' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = async (mode: 'local' | 'api') => {
    setSelectedMode(mode);
    setIsProcessing(true);
    await onSelectMode(mode);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/20 p-6 border-b border-primary-200 dark:border-primary-800/50">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
              <span className="text-3xl">🤖</span>
              Selamat Datang di AI Insight
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              Pilih cara kerja AI analisis bisnis Anda. Keputusan ini dapat diubah kapan saja di pengaturan.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode Lokal Card */}
            <div
              onClick={() => !isProcessing && handleSelect('local')}
              className={`
                relative group cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300
                ${selectedMode === 'local' 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg shadow-blue-500/20' 
                  : 'border-border hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
                }
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                    ${selectedMode === 'local' ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}
                  `}>
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mode Lokal</h3>
                    <p className="text-xs text-muted-foreground">Model berjalan di perangkat</p>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Offline — tanpa internet</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Gratis (no API key)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Data tidak keluar perangkat</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Database className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Download ~1.9 GB pertama kali</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Perlu setup awal</span>
                  </div>
                </div>

                <Button 
                  className={`
                    w-full mt-4 gap-2 transition-all
                    ${selectedMode === 'local' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                    }
                  `}
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect('local');
                  }}
                >
                  {isProcessing && selectedMode === 'local' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Pilih Mode Lokal
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Mode API Card */}
            <div
              onClick={() => !isProcessing && handleSelect('api')}
              className={`
                relative group cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300
                ${selectedMode === 'api' 
                  ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/20' 
                  : 'border-border hover:border-green-300 hover:bg-green-50/30 dark:hover:bg-green-950/10'
                }
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                    ${selectedMode === 'api' ? 'bg-green-500 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}
                  `}>
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mode API Online</h3>
                    <p className="text-xs text-muted-foreground">Menggunakan API eksternal</p>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Instant setup — siap pakai</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Hemat storage (no download)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Model lebih update & powerful</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Wifi className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Perlu koneksi internet</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Perlu API key (Groq/OpenRouter)</span>
                  </div>
                </div>

                <Button 
                  className={`
                    w-full mt-4 gap-2 transition-all
                    ${selectedMode === 'api' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                    }
                  `}
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect('api');
                  }}
                >
                  {isProcessing && selectedMode === 'api' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Pilih Mode API
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-muted/50 dark:bg-muted/20 rounded-xl p-4 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">💡 Tips Memilih:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Mode Lokal</strong> cocok untuk toko dengan koneksi internet terbatas atau yang mengutamakan privasi data</li>
              <li><strong>Mode API</strong> cocok untuk instant setup dan model AI yang lebih update tanpa perlu download besar</li>
              <li>Anda dapat mengubah mode ini kapan saja di menu Pengaturan → AI Insight</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AiOnboardingModal;
