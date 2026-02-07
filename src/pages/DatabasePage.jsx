import { useState, useEffect, useCallback } from 'react';

const TABS = [
  { id: 'stats', label: 'Statistik & Kesehatan' },
  { id: 'backup', label: 'Backup & Restore' },
  { id: 'maintenance', label: 'Pemeliharaan Data' },
  { id: 'export', label: 'Ekspor Data' },
];

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState('stats');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  // Stats
  const [stats, setStats] = useState(null);
  const [integrity, setIntegrity] = useState(null);

  // Backup
  const [backupHistory, setBackupHistory] = useState([]);

  // Maintenance
  const [vacuumResult, setVacuumResult] = useState(null);
  const [archiveMonths, setArchiveMonths] = useState(6);
  const [archivableCount, setArchivableCount] = useState(null);

  // Export
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState(null);
  const [hardResetConfirm, setHardResetConfirm] = useState('');

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await window.api.getDbStats();
      setStats(data);
    } catch (err) {
      showMessage('Gagal memuat statistik: ' + err.message, 'error');
    }
  }, [showMessage]);

  const loadBackupHistory = useCallback(async () => {
    try {
      const data = await window.api.dbGetBackupHistory();
      setBackupHistory(data);
    } catch (err) {
      showMessage('Gagal memuat riwayat backup: ' + err.message, 'error');
    }
  }, [showMessage]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'backup') loadBackupHistory();
  }, [activeTab, loadBackupHistory]);

  const confirmAction = (title, message, action, variant = 'danger') => {
    setConfirmModal({ title, message, action, variant });
  };

  const executeConfirm = async () => {
    if (!confirmModal) return;
    const action = confirmModal.action;
    setConfirmModal(null);
    setProcessing(true);
    try {
      await action();
    } catch (err) {
      showMessage('Error: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  // Stats actions
  const checkIntegrity = async () => {
    setProcessing(true);
    try {
      const result = await window.api.dbIntegrityCheck();
      setIntegrity(result);
    } catch (err) {
      showMessage('Gagal memeriksa integritas: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  // Backup actions
  const handleManualBackup = async () => {
    setProcessing(true);
    try {
      const result = await window.api.dbManualBackup();
      if (result.success) {
        showMessage('Backup berhasil disimpan ke: ' + result.path);
        loadStats();
      } else if (result.error !== 'Dibatalkan') {
        showMessage('Gagal backup: ' + result.error, 'error');
      }
    } catch (err) {
      showMessage('Gagal backup: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  const handleQuickBackup = async () => {
    setProcessing(true);
    try {
      const result = await window.api.dbCreateBackup();
      if (result.success) {
        showMessage('Backup cepat berhasil: ' + result.filename);
        loadStats();
        loadBackupHistory();
      } else {
        showMessage('Gagal backup: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showMessage('Gagal backup: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  const handleRestoreBackup = async () => {
    confirmAction('Restore Database', 'Data saat ini akan diganti dengan data dari file backup. Aplikasi akan restart setelah restore. Lanjutkan?', async () => {
      const result = await window.api.dbRestoreBackup();
      if (result.success) {
        showMessage('Restore berhasil. Aplikasi akan restart...');
      } else if (result.error !== 'Dibatalkan') {
        showMessage('Gagal restore: ' + result.error, 'error');
      }
    });
  };

  const handleRestoreFromHistory = (filePath) => {
    confirmAction('Restore dari Backup', 'Data saat ini akan diganti dengan data dari backup ini. Aplikasi akan restart. Lanjutkan?', async () => {
      const result = await window.api.dbRestoreFromHistory(filePath);
      if (result.success) {
        showMessage('Restore berhasil. Aplikasi akan restart...');
      } else {
        showMessage('Gagal restore: ' + result.error, 'error');
      }
    });
  };

  const handleDeleteBackup = (filePath, filename) => {
    confirmAction('Hapus Backup', `Hapus file backup "${filename}"? File tidak dapat dikembalikan.`, async () => {
      const result = await window.api.dbDeleteBackup(filePath);
      if (result.success) {
        showMessage('Backup berhasil dihapus');
        loadBackupHistory();
      } else {
        showMessage('Gagal menghapus: ' + result.error, 'error');
      }
    });
  };

  const handleSetBackupDir = async () => {
    try {
      const result = await window.api.dbSetBackupDir();
      if (result.success) {
        showMessage('Folder backup diubah ke: ' + result.path);
        loadStats();
        loadBackupHistory();
      }
    } catch (err) {
      showMessage('Gagal mengubah folder: ' + err.message, 'error');
    }
  };

  // Maintenance actions
  const handleVacuum = async () => {
    setProcessing(true);
    try {
      const result = await window.api.dbVacuum();
      if (result.success) {
        setVacuumResult(result);
        showMessage('Optimasi berhasil');
        loadStats();
      } else {
        showMessage('Gagal optimasi: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showMessage('Gagal optimasi: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  const handleClearVoided = () => {
    confirmAction('Hapus Transaksi Void', 'Semua transaksi void akan dihapus permanen. Backup otomatis akan dibuat sebelum penghapusan. Lanjutkan?', async () => {
      const result = await window.api.dbClearVoided();
      if (result.success) {
        showMessage(`${result.deleted} transaksi void berhasil dihapus`);
        loadStats();
      } else {
        showMessage('Gagal menghapus: ' + result.error, 'error');
      }
    });
  };

  const handleCheckArchivable = async () => {
    setProcessing(true);
    try {
      const result = await window.api.dbGetArchivableCount(archiveMonths);
      setArchivableCount(result);
    } catch (err) {
      showMessage('Gagal mengecek: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  const handleArchive = () => {
    confirmAction('Hapus Transaksi Lama', `${archivableCount?.count || 0} transaksi lebih lama dari ${archiveMonths} bulan akan dihapus permanen. Pastikan sudah export data di tab Ekspor. Backup otomatis akan dibuat. Lanjutkan?`, async () => {
      const result = await window.api.dbArchiveTransactions(archiveMonths);
      if (result.success) {
        showMessage(`${result.deleted} transaksi berhasil dihapus`);
        setArchivableCount(null);
        loadStats();
      } else {
        showMessage('Gagal menghapus: ' + result.error, 'error');
      }
    });
  };

  const handleResetSettings = () => {
    confirmAction('Reset Pengaturan', 'Semua pengaturan akan dikembalikan ke default. Data produk dan transaksi tidak terpengaruh. Backup otomatis akan dibuat. Lanjutkan?', async () => {
      const result = await window.api.dbResetSettings();
      if (result.success) {
        showMessage('Pengaturan berhasil direset ke default');
        loadStats();
      } else {
        showMessage('Gagal reset: ' + result.error, 'error');
      }
    });
  };

  const handleHardReset = () => {
    const storeName = stats?.lastBackupDate ? '' : '';
    setHardResetConfirm('');
    confirmAction('RESET SELURUH DATABASE', null, async () => {
      await window.api.dbHardReset();
    }, 'hard-reset');
  };

  // Export actions
  const handleExportExcel = async () => {
    setProcessing(true);
    try {
      const filters = {};
      if (exportDateFrom) filters.date_from = exportDateFrom;
      if (exportDateTo) filters.date_to = exportDateTo;
      const result = await window.api.dbExportTransactions(filters);
      if (result.success) {
        showMessage(`${result.count} transaksi berhasil diekspor ke: ${result.path}`);
      } else if (result.error !== 'Dibatalkan') {
        showMessage('Gagal ekspor: ' + result.error, 'error');
      }
    } catch (err) {
      showMessage('Gagal ekspor: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  const handleExportPdf = async () => {
    setProcessing(true);
    try {
      const result = await window.api.dbExportSummaryPdf();
      if (result.success) {
        showMessage('PDF berhasil disimpan ke: ' + result.path);
      } else if (result.error !== 'Dibatalkan') {
        showMessage('Gagal ekspor PDF: ' + result.error, 'error');
      }
    } catch (err) {
      showMessage('Gagal ekspor PDF: ' + err.message, 'error');
    }
    setProcessing(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Manajemen Database</h1>

      {/* Status message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Statistik & Kesehatan */}
      {activeTab === 'stats' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Statistik Database</h3>
              {stats ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-600">Tabel</th>
                      <th className="text-right py-2 text-gray-600">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Pengguna', stats.counts.users],
                      ['Kategori', stats.counts.categories],
                      ['Produk', stats.counts.products],
                      ['Transaksi', stats.counts.transactions],
                      ['Item Transaksi', stats.counts.transaction_items],
                      ['Pengaturan', stats.counts.settings],
                    ].map(([label, count]) => (
                      <tr key={label} className="border-b border-gray-100">
                        <td className="py-2">{label}</td>
                        <td className="py-2 text-right font-mono">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-sm">Memuat...</p>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Info Database</h3>
              {stats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ukuran File</span>
                    <span className="font-mono">{formatFileSize(stats.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Backup Terakhir</span>
                    <span>{stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleString('id-ID') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaksi Pertama</span>
                    <span>{stats.oldestTransaction || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaksi Terakhir</span>
                    <span>{stats.newestTransaction || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaksi Void</span>
                    <span className="font-mono">{stats.voidedTransactions}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Memuat...</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Pemeriksaan Kesehatan</h3>
            <div className="flex items-center gap-4">
              <button onClick={checkIntegrity} disabled={processing} className="btn-primary">
                {processing ? 'Memeriksa...' : 'Periksa Integritas'}
              </button>
              {integrity && (
                <span className={`text-sm font-medium ${integrity.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {integrity.ok ? 'OK - Database dalam kondisi baik' : 'ERROR: ' + integrity.result}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Backup & Restore */}
      {activeTab === 'backup' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Backup</h3>
              <div className="space-y-3">
                <button onClick={handleManualBackup} disabled={processing} className="btn-primary w-full">
                  {processing ? 'Memproses...' : 'Backup ke File...'}
                </button>
                <button onClick={handleQuickBackup} disabled={processing} className="btn-primary w-full" style={{ backgroundColor: '#059669' }}>
                  Backup Cepat
                </button>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Folder Backup</span>
                    <button onClick={handleSetBackupDir} className="text-sm text-primary-600 hover:underline">Ubah Folder</button>
                  </div>
                  <p className="text-xs text-gray-400 break-all">{stats?.autoBackupDir || 'Default (userData/backups/)'}</p>
                </div>
                {stats?.lastBackupDate && (
                  <div className="border-t pt-3 text-sm text-gray-600">
                    Backup terakhir: {new Date(stats.lastBackupDate).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Restore</h3>
              <p className="text-sm text-gray-600 mb-3">
                Restore database dari file backup. Data saat ini akan diganti sepenuhnya dengan data dari backup.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-700">
                  <strong>Perhatian:</strong> Aplikasi akan restart setelah restore. Backup otomatis dari data saat ini akan dibuat sebelum proses restore.
                </p>
              </div>
              <button onClick={handleRestoreBackup} disabled={processing} className="btn-primary w-full">
                Restore dari File...
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Riwayat Backup</h3>
            {backupHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-600">File</th>
                      <th className="text-left py-2 text-gray-600">Tanggal</th>
                      <th className="text-right py-2 text-gray-600">Ukuran</th>
                      <th className="text-right py-2 text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((b, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 font-mono text-xs">{b.filename}</td>
                        <td className="py-2">{new Date(b.date).toLocaleString('id-ID')}</td>
                        <td className="py-2 text-right font-mono">{formatFileSize(b.size)}</td>
                        <td className="py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleRestoreFromHistory(b.path)}
                              disabled={processing}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(b.path, b.filename)}
                              disabled={processing}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Belum ada riwayat backup</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Pemeliharaan Data */}
      {activeTab === 'maintenance' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Optimasi Database</h3>
              <p className="text-sm text-gray-600 mb-2">
                Mengompres dan mengoptimasi file database untuk mengurangi ukuran dan meningkatkan performa.
              </p>
              {stats && (
                <p className="text-sm text-gray-500 mb-3">Ukuran saat ini: <span className="font-mono">{formatFileSize(stats.fileSize)}</span></p>
              )}
              <button onClick={handleVacuum} disabled={processing} className="btn-primary">
                {processing ? 'Mengoptimasi...' : 'Optimasi (VACUUM)'}
              </button>
              {vacuumResult && (
                <div className="mt-3 text-sm bg-green-50 p-3 rounded-lg">
                  <p>Sebelum: <span className="font-mono">{formatFileSize(vacuumResult.sizeBefore)}</span></p>
                  <p>Sesudah: <span className="font-mono">{formatFileSize(vacuumResult.sizeAfter)}</span></p>
                  <p>Dihemat: <span className="font-mono">{formatFileSize(vacuumResult.sizeBefore - vacuumResult.sizeAfter)}</span></p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Hapus Transaksi Void</h3>
              <p className="text-sm text-gray-600 mb-2">
                Hapus permanen semua transaksi yang sudah di-void dari database.
              </p>
              {stats && (
                <p className="text-sm text-gray-500 mb-3">Transaksi void saat ini: <span className="font-mono">{stats.voidedTransactions}</span></p>
              )}
              <button
                onClick={handleClearVoided}
                disabled={processing || !stats?.voidedTransactions}
                className="btn-danger"
              >
                Hapus Transaksi Void
              </button>
              <p className="text-xs text-gray-400 mt-2">Backup otomatis dibuat sebelum penghapusan.</p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Arsipkan Transaksi Lama</h3>
              <p className="text-sm text-gray-600 mb-3">
                Hapus transaksi yang lebih lama dari jangka waktu tertentu. Sebaiknya ekspor data terlebih dahulu di tab Ekspor.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm text-gray-600">Lebih lama dari</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={archiveMonths}
                  onChange={e => { setArchiveMonths(Number(e.target.value)); setArchivableCount(null); }}
                  className="input w-20 text-center"
                />
                <span className="text-sm text-gray-600">bulan</span>
                <button onClick={handleCheckArchivable} disabled={processing} className="btn-primary text-sm">
                  Cek Jumlah
                </button>
              </div>
              {archivableCount !== null && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-yellow-700">
                    Ditemukan <strong>{archivableCount.count}</strong> transaksi sebelum {archivableCount.cutoffDate}
                  </p>
                </div>
              )}
              {archivableCount?.count > 0 && (
                <button onClick={handleArchive} disabled={processing} className="btn-danger">
                  Hapus dari Database
                </button>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Reset Pengaturan</h3>
              <p className="text-sm text-gray-600 mb-3">
                Kembalikan semua pengaturan ke nilai default. Data produk, transaksi, dan pengguna tidak terpengaruh.
              </p>
              <button onClick={handleResetSettings} disabled={processing} className="btn-danger">
                Reset ke Default
              </button>
              <p className="text-xs text-gray-400 mt-2">Backup otomatis dibuat sebelum reset.</p>
            </div>
          </div>

          <div className="card" style={{ borderColor: '#ef4444', borderWidth: '2px' }}>
            <h3 className="text-lg font-semibold text-red-600 mb-3">Hard Reset Database</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-700">
                <strong>PERINGATAN:</strong> Tindakan ini akan menghapus <strong>SEMUA</strong> data secara permanen, termasuk produk, transaksi, pengguna, dan pengaturan. Database akan dikembalikan ke kondisi awal seperti baru diinstal. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <button onClick={handleHardReset} disabled={processing} className="btn-danger">
              Reset Seluruh Database
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Ekspor Data */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Ekspor Transaksi</h3>
            <p className="text-sm text-gray-600 mb-3">
              Ekspor data transaksi ke file Excel (.xlsx) dengan 2 sheet: header transaksi dan detail item.
            </p>
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={exportDateFrom}
                  onChange={e => setExportDateFrom(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={exportDateTo}
                  onChange={e => setExportDateTo(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
            <button onClick={handleExportExcel} disabled={processing} className="btn-primary w-full">
              {processing ? 'Mengekspor...' : 'Ekspor Excel'}
            </button>
            <p className="text-xs text-gray-400 mt-2">Kosongkan tanggal untuk ekspor semua data.</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Ringkasan Database</h3>
            <p className="text-sm text-gray-600 mb-3">
              Ekspor ringkasan database ke file PDF A4, berisi statistik tabel, informasi database, pengaturan toko, dan status integritas.
            </p>
            <button onClick={handleExportPdf} disabled={processing} className="btn-primary w-full">
              {processing ? 'Mengekspor...' : 'Ekspor PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{confirmModal.title}</h3>
            {confirmModal.variant === 'hard-reset' ? (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-red-700">
                    <strong>SEMUA DATA</strong> akan dihapus permanen: produk, transaksi, pengguna, dan pengaturan. Database akan kembali ke kondisi awal. Backup otomatis akan dibuat sebelum reset.
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-2">Ketik <strong>RESET</strong> untuk konfirmasi:</p>
                <input
                  type="text"
                  value={hardResetConfirm}
                  onChange={e => setHardResetConfirm(e.target.value)}
                  className="input w-full mb-3"
                  placeholder='Ketik "RESET"'
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                    Batal
                  </button>
                  <button
                    onClick={executeConfirm}
                    disabled={hardResetConfirm !== 'RESET'}
                    className="btn-danger disabled:opacity-40"
                  >
                    Ya, Reset Database
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">{confirmModal.message}</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                    Batal
                  </button>
                  <button onClick={executeConfirm} className="btn-danger">
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
