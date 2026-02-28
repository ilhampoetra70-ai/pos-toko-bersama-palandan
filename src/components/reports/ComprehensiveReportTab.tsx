import React from 'react';
import { AlertCircle, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComprehensiveReport from './ComprehensiveReport';

export default function ComprehensiveReportTab({
    data,
    isLoading,
    isError,
    error,
    refetch,
    stockAuditData,
    stockTrailData
}: any) {
    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Gagal Memuat Laporan</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-6">Terjadi kesalahan saat mengambil data laporan lengkap.</p>
                <Button onClick={() => refetch()} variant="outline" className="border-red-200 text-red-800 hover:bg-red-100">
                    Coba Lagi
                </Button>
                {error && (
                    <pre className="mt-4 text-[10px] text-left overflow-auto max-w-lg p-2 bg-card/50 rounded text-red-800">
                        {String(error)}
                    </pre>
                )}
            </div>
        );
    }

    return (
        <ComprehensiveReport
            data={data}
            stockAuditData={stockAuditData}
            stockTrailData={stockTrailData}
        />
    );
}
