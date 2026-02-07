import { useEffect, useRef, useState } from 'react';

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const quaggaRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    try {
      const Quagga = (await import('@ericblade/quagga2')).default;
      quaggaRef.current = Quagga;

      Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader']
        },
        locate: true,
        frequency: 10
      }, (err) => {
        if (err) {
          setError('Tidak dapat mengakses kamera: ' + err.message);
          return;
        }
        Quagga.start();
        setScanning(true);
      });

      Quagga.onDetected((result) => {
        if (result?.codeResult?.code) {
          const code = result.codeResult.code;
          Quagga.stop();
          setScanning(false);
          onDetected(code);
        }
      });
    } catch (err) {
      setError('Gagal memuat scanner: ' + err.message);
    }
  };

  const stopScanner = () => {
    if (quaggaRef.current) {
      try { quaggaRef.current.stop(); } catch {}
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Scan Barcode</h3>
          <button onClick={() => { stopScanner(); onClose(); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
        ) : (
          <>
            <div ref={videoRef} className="w-full h-64 bg-black rounded-lg overflow-hidden relative">
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-1 bg-red-500 opacity-70 animate-pulse"></div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">Arahkan barcode ke kamera</p>
          </>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={() => { stopScanner(); onClose(); }} className="btn-secondary">Tutup</button>
        </div>
      </div>
    </div>
  );
}
