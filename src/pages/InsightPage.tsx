import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Download, X, AlertCircle, Clock, ChevronRight, FolderOpen, Settings2, CheckCircle2, ChevronDown, ChevronUp, Globe, HardDrive, Eye, EyeOff, Loader2, Wifi, WifiOff } from 'lucide-react';
import { RetroSparkle, RetroRefresh, RetroTrash } from '../components/RetroIcons';
import { useAiStatus, useAiInsight } from '../lib/queries';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────
interface InsightData {
    paragraphs?: string[];   // format baru
    narrative?: string;      // format lama (backward compat)
    highlights: string[];
}

interface CacheResult {
    success: boolean;
    data?: InsightData;
    created_at?: string;
    from_cache?: boolean;
    status?: string;
}

interface ApiSettings {
    mode: 'local' | 'api';
    provider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
}

const PROVIDERS = [
    { id: 'groq', name: 'Groq', description: 'Gratis & sangat cepat', badge: 'GRATIS', badgeColor: 'green', defaultModel: 'llama-3.3-70b-versatile', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'], keyLink: 'https://console.groq.com/keys', keyLabel: 'Groq API Key', needsBaseUrl: false },
    { id: 'openai', name: 'OpenAI', description: 'GPT-4o Mini, akurat', badge: 'BERBAYAR', badgeColor: 'amber', defaultModel: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'], keyLink: 'https://platform.openai.com/api-keys', keyLabel: 'OpenAI API Key', needsBaseUrl: false },
    { id: 'openrouter', name: 'OpenRouter', description: 'Banyak model, ada gratis', badge: 'GRATIS+', badgeColor: 'blue', defaultModel: 'google/gemini-2.0-flash-exp:free', models: ['google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct:free', 'mistralai/mistral-7b-instruct:free'], keyLink: 'https://openrouter.ai/keys', keyLabel: 'OpenRouter API Key', needsBaseUrl: false },
    { id: 'gemini', name: 'Google Gemini', description: 'Gemini Flash gratis', badge: 'GRATIS', badgeColor: 'green', defaultModel: 'gemini-2.0-flash', models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'], keyLink: 'https://aistudio.google.com/apikey', keyLabel: 'Gemini API Key', needsBaseUrl: false },
    { id: 'custom', name: 'Custom (OpenAI-Compatible)', description: 'Ollama, LM Studio, dll', badge: 'LOKAL', badgeColor: 'gray', defaultModel: '', models: [], keyLink: null, keyLabel: 'API Key (opsional)', needsBaseUrl: true },
];

const badgeClasses: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    blue: 'bg-primary-100 dark:bg-primary/20 text-primary-700 dark:text-primary border-primary-200 dark:border-primary/40',
    gray: 'bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground border-border dark:border-border',
};

// ─── Sub-components ───────────────────────────────────────

function OnboardingDownloadCard({ onDownload, onBrowse, browseError }: { onDownload: () => void; onBrowse: () => void; browseError: string | null }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6">
            <div className="max-w-lg w-full bg-card dark:bg-background rounded-2xl border border-border dark:border-border p-8 shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-6 mx-auto">
                    <RetroSparkle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-foreground text-center mb-2">AI Insight Bisnis</h2>
                <p className="text-muted-foreground dark:text-muted-foreground text-center text-sm mb-6">Analisis otomatis data penjualan toko Anda menggunakan kecerdasan buatan.</p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                            <p className="font-medium">Membutuhkan model AI (~1.9 GB)</p>
                            <p>Atau gunakan API eksternal (Groq, OpenAI, dll) tanpa perlu download.</p>
                        </div>
                    </div>
                </div>
                {browseError && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-xs mb-4">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{browseError}</span>
                    </div>
                )}
                <div className="space-y-3">
                    <Button onClick={onDownload} className="w-full gap-2"><Download className="w-4 h-4" />Download Model Lokal (~1.9 GB)</Button>
                    <div className="relative flex items-center gap-3"><div className="flex-1 h-px bg-muted dark:bg-muted" /><span className="text-xs text-muted-foreground dark:text-muted-foreground">atau</span><div className="flex-1 h-px bg-muted dark:bg-muted" /></div>
                    <Button variant="outline" onClick={onBrowse} className="w-full gap-2"><FolderOpen className="w-4 h-4" />Pilih File Model Lokal (.gguf)</Button>
                </div>
            </div>
        </div>
    );
}

function DownloadProgressCard({ progress, downloadedMB, totalMB, onCancel }: { progress: number; downloadedMB: number; totalMB: number; onCancel: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6">
            <div className="max-w-lg w-full bg-card dark:bg-background rounded-2xl border border-border dark:border-border p-8 shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-6 mx-auto">
                    <Download className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-bounce" />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-foreground text-center mb-1">Mengunduh Model AI</h2>
                <p className="text-muted-foreground dark:text-muted-foreground text-center text-sm mb-6">{downloadedMB} MB / {totalMB} MB</p>
                <div className="w-full bg-muted dark:bg-card rounded-full h-3 mb-3 overflow-hidden">
                    <div className="bg-primary-500 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.max(2, progress)}%` }} />
                </div>
                <p className="text-center text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-6">{progress}%</p>
                <Button variant="outline" onClick={onCancel} className="w-full gap-2 text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400"><X className="w-4 h-4" />Batalkan Download</Button>
            </div>
        </div>
    );
}

function FailedCard({ errorMsg, onRetry, onBrowse }: { errorMsg: string; onRetry: () => void; onBrowse: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6">
            <div className="max-w-lg w-full bg-card dark:bg-background rounded-2xl border border-red-200 dark:border-red-800/50 p-8 shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-6 mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-foreground text-center mb-2">Download Gagal</h2>
                <p className="text-muted-foreground dark:text-muted-foreground text-center text-sm mb-6">{errorMsg || 'Terjadi kesalahan saat mengunduh model AI.'}</p>
                <div className="space-y-3">
                    <Button onClick={onRetry} className="w-full gap-2"><RetroRefresh className="w-4 h-4" />Coba Lagi</Button>
                    <Button variant="outline" onClick={onBrowse} className="w-full gap-2"><FolderOpen className="w-4 h-4" />Gunakan File Lokal</Button>
                </div>
            </div>
        </div>
    );
}

// ─── ModelSettingsPanel ───────────────────────────────────
function ModelSettingsPanel({ customModelPath, browseError, isChangingModel, aiMode, onBrowse, onClear }: {
    customModelPath: string | null; browseError: string | null; isChangingModel: boolean; aiMode: string; onBrowse: () => void; onClear: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'local' | 'api'>(aiMode === 'api' ? 'api' : 'local');
    const [justChanged, setJustChanged] = useState(false);
    const prevPathRef = useRef(customModelPath);
    const [apiSettings, setApiSettings] = useState<ApiSettings>({ mode: 'local', provider: 'groq', apiKey: '', model: '', baseUrl: '' });
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [openRouterModels, setOpenRouterModels] = useState<string[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    const fetchOpenRouterModels = useCallback(async (apiKey?: string) => {
        setFetchingModels(true);
        try {
            const headers: Record<string, string> = {};
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
            if (!res.ok) throw new Error('fetch failed');
            const data = await res.json();
            const freeModels: string[] = (data.data as { id: string }[])
                .filter(m => m.id.endsWith(':free'))
                .map(m => m.id)
                .sort();
            if (freeModels.length > 0) setOpenRouterModels(freeModels);
        } catch {
            // jaga list lama jika fetch gagal
        } finally {
            setFetchingModels(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        window.api.getAiApiSettings().then((s) => {
            if (s.success) {
                setApiSettings({ mode: s.mode as 'local' | 'api', provider: s.provider, apiKey: s.apiKey, model: s.model, baseUrl: s.baseUrl });
                setActiveTab(s.mode === 'api' ? 'api' : 'local');
                if (s.provider === 'openrouter') fetchOpenRouterModels(s.apiKey);
            }
        });
    }, [open, fetchOpenRouterModels]);

    useEffect(() => {
        if (open && apiSettings.provider === 'openrouter') {
            fetchOpenRouterModels(apiSettings.apiKey);
        }
    }, [apiSettings.provider, open, fetchOpenRouterModels]);

    useEffect(() => {
        if (!open) { prevPathRef.current = customModelPath; return; }
        if (prevPathRef.current !== customModelPath) { prevPathRef.current = customModelPath; setJustChanged(true); const t = setTimeout(() => setJustChanged(false), 3000); return () => clearTimeout(t); }
    }, [open, customModelPath]);

    const currentProvider = PROVIDERS.find(p => p.id === apiSettings.provider) || PROVIDERS[0];
    const handleProviderChange = (id: string) => { const preset = PROVIDERS.find(p => p.id === id)!; setApiSettings(s => ({ ...s, provider: id, model: preset.defaultModel, baseUrl: '' })); setTestResult(null); setApiError(null); };

    const handleSave = async () => {
        setSaving(true); setApiError(null); setSaveSuccess(false);
        const result = await window.api.saveAiApiSettings({ mode: activeTab, provider: apiSettings.provider, apiKey: apiSettings.apiKey, model: apiSettings.model || currentProvider.defaultModel, baseUrl: apiSettings.baseUrl });
        setSaving(false);
        if (result.success) { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); } else { setApiError(result.error ?? 'Gagal menyimpan.'); }
    };

    const handleTest = async () => {
        setTesting(true); setTestResult(null); setApiError(null);
        const result = await window.api.testAiApiConnection({ provider: apiSettings.provider, apiKey: apiSettings.apiKey, model: apiSettings.model || currentProvider.defaultModel, baseUrl: apiSettings.baseUrl });
        setTesting(false);
        setTestResult(result.success ? { ok: true, msg: 'Koneksi berhasil! API siap digunakan.' } : { ok: false, msg: result.error ?? 'Koneksi gagal.' });
    };

    const headerLabel = aiMode === 'api' ? `API: ${PROVIDERS.find(p => p.id === apiSettings.provider)?.name ?? apiSettings.provider}` : customModelPath ? (customModelPath.split(/[\\/]/).pop() ?? customModelPath) : 'Model Lokal (default)';

    return (
        <div className="bg-card dark:bg-background rounded-2xl border border-border dark:border-border overflow-hidden shadow-sm">
            <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-background dark:hover:bg-card/60 transition-colors text-left">
                <div className="flex items-center justify-center w-8 h-8 bg-muted dark:bg-card rounded-lg shrink-0"><Settings2 className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Pengaturan Model AI</p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate" title={headerLabel}>{headerLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {aiMode === 'api' && <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-primary dark:bg-primary/30 text-primary-foreground dark:text-primary-foreground rounded-full border border-primary dark:border-primary/50"><Globe className="w-2.5 h-2.5" />API</span>}
                    {aiMode === 'local' && customModelPath && <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/50">KUSTOM</span>}
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>
            {open && (
                <div className="border-t border-border dark:border-border">
                    <div className="flex border-b border-border dark:border-border">
                        {(['local', 'api'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'text-muted-foreground dark:text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground'}`}>
                                {tab === 'local' ? <><HardDrive className="w-4 h-4" />Model Lokal</> : <><Globe className="w-4 h-4" />API Eksternal</>}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'local' && (
                        <div className="px-5 py-4 space-y-4">
                            <div className={`flex items-start gap-3 p-3 rounded-xl ${customModelPath ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/40' : 'bg-background dark:bg-card/50 border border-border dark:border-border'}`}>
                                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${customModelPath ? 'text-green-500' : 'text-muted-foreground'}`} />
                                <div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-0.5">{customModelPath ? 'Model Kustom Aktif' : 'Model Default'}</p><p className="text-xs text-muted-foreground dark:text-muted-foreground break-all">{customModelPath ?? 'Model bawaan yang telah diunduh'}</p></div>
                            </div>
                            {justChanged && <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-lg text-xs"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Model berhasil diganti.</span></div>}
                            {browseError && <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-xs"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{browseError}</span></div>}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" onClick={onBrowse} disabled={isChangingModel} className="flex-1 gap-2 text-sm"><FolderOpen className="w-4 h-4" />{isChangingModel ? 'Memilih...' : customModelPath ? 'Ganti Model Lain' : 'Pilih File Model (.gguf)'}</Button>
                                {customModelPath && <Button variant="outline" onClick={onClear} disabled={isChangingModel} className="flex-1 gap-2 text-sm text-orange-600 hover:text-orange-700 hover:border-orange-300 dark:text-orange-400"><RetroTrash className="w-4 h-4" />Kembali ke Default</Button>}
                            </div>
                            {aiMode === 'api' && <Button onClick={async () => { await window.api.saveAiApiSettings({ mode: 'local', provider: apiSettings.provider, apiKey: apiSettings.apiKey, model: apiSettings.model, baseUrl: apiSettings.baseUrl }); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }} className="w-full gap-2"><HardDrive className="w-4 h-4" />Aktifkan Mode Lokal</Button>}
                            <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">File <span className="font-mono">.gguf</span> berjalan sepenuhnya di perangkat tanpa koneksi internet.</p>
                        </div>
                    )}
                    {activeTab === 'api' && (
                        <div className="px-5 py-4 space-y-4">
                            <div><p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-2">Provider</p>
                                <div className="grid grid-cols-1 gap-2">{PROVIDERS.map(p => (
                                    <button key={p.id} onClick={() => handleProviderChange(p.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${apiSettings.provider === p.id ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-border dark:border-border hover:border-border dark:hover:border-gray-600'}`}>
                                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground dark:text-foreground">{p.name}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClasses[p.badgeColor]}`}>{p.badge}</span></div><p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">{p.description}</p></div>
                                        {apiSettings.provider === p.id && <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />}
                                    </button>
                                ))}</div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">{currentProvider.keyLabel}{currentProvider.id !== 'custom' && <span className="text-red-400 ml-0.5">*</span>}</label>{currentProvider.keyLink && <a href={currentProvider.keyLink} target="_blank" rel="noreferrer" className="text-[11px] text-primary-500 hover:text-primary-600 dark:text-primary-400">Dapatkan API Key →</a>}</div>
                                <div className="relative"><input type={showKey ? 'text' : 'password'} value={apiSettings.apiKey} onChange={e => setApiSettings(s => ({ ...s, apiKey: e.target.value }))} placeholder={`Masukkan ${currentProvider.keyLabel}...`} className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" /><button onClick={() => setShowKey(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">Nama Model</label>
                                    {currentProvider.id === 'openrouter' && (
                                        <button onClick={() => fetchOpenRouterModels(apiSettings.apiKey)} disabled={fetchingModels} title="Refresh daftar model" className="flex items-center gap-1 text-[11px] text-primary-500 hover:text-primary-600 dark:text-primary-400 disabled:opacity-50">
                                            {fetchingModels ? <Loader2 className="w-3 h-3 animate-spin" /> : <RetroRefresh className="w-3 h-3" />}
                                            {fetchingModels ? 'Memuat...' : `Refresh${openRouterModels.length > 0 ? ` (${openRouterModels.length})` : ''}`}
                                        </button>
                                    )}
                                </div>
                                {currentProvider.id === 'openrouter' ? (
                                    <select value={apiSettings.model || currentProvider.defaultModel} onChange={e => setApiSettings(s => ({ ...s, model: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400">
                                        {(openRouterModels.length > 0 ? openRouterModels : currentProvider.models).map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                ) : currentProvider.models.length > 0 ? (
                                    <select value={apiSettings.model || currentProvider.defaultModel} onChange={e => setApiSettings(s => ({ ...s, model: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400">{currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                ) : (
                                    <input type="text" value={apiSettings.model} onChange={e => setApiSettings(s => ({ ...s, model: e.target.value }))} placeholder="Contoh: llama3, mistral..." className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" />
                                )}
                            </div>
                            {currentProvider.needsBaseUrl && (<div><label className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground block mb-1.5">Base URL <span className="text-red-400">*</span></label><input type="text" value={apiSettings.baseUrl} onChange={e => setApiSettings(s => ({ ...s, baseUrl: e.target.value }))} placeholder="http://localhost:11434/v1" className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" /><p className="text-[11px] text-muted-foreground mt-1">Ollama: <span className="font-mono">http://localhost:11434/v1</span> · LM Studio: <span className="font-mono">http://localhost:1234/v1</span></p></div>)}
                            {testResult && <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${testResult.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>{testResult.ok ? <Wifi className="w-3.5 h-3.5 shrink-0" /> : <WifiOff className="w-3.5 h-3.5 shrink-0" />}<span>{testResult.msg}</span></div>}
                            {apiError && <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-xs"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{apiError}</span></div>}
                            {saveSuccess && <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-lg text-xs"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Pengaturan disimpan. Mode API aktif.</span></div>}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleTest} disabled={testing || saving} className="flex-1 gap-2 text-sm">{testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}{testing ? 'Menguji...' : 'Test Koneksi'}</Button>
                                <Button onClick={handleSave} disabled={saving || testing} className="flex-1 gap-2 text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{saving ? 'Menyimpan...' : 'Simpan & Aktifkan'}</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Text Highlighter ─────────────────────────────────────
const HIGHLIGHT_RULES = [
    // Nominal rupiah: Rp 1.234.567 atau Rp 1,5 juta
    { pattern: 'Rp[\\s\\u00A0]?[\\d.,]+(?:\\s?(?:juta|ribu|miliar))?', cls: 'font-bold text-primary-700 dark:text-primary-400' },
    // Persentase: 12%, 3,5%
    { pattern: '\\b\\d+(?:[.,]\\d+)?%', cls: 'font-bold text-amber-600 dark:text-amber-400' },
    // Waktu: jam 10, pukul 14:00, jam 9-12, jam 08.00-12.00
    { pattern: '\\b(?:jam|pukul)\\s+\\d{1,2}(?:[.:]\\d{2})?(?:\\s*[-–]\\s*\\d{1,2}(?:[.:]\\d{2})?)?', cls: 'font-bold text-teal-600 dark:text-teal-400' },
    // Hari: Senin s.d. Minggu
    { pattern: '\\b(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\\b', cls: 'font-semibold text-indigo-600 dark:text-indigo-400' },
    // Kata mendesak
    { pattern: '\\b(?:segera|harus segera|sangat penting|kritis)\\b', cls: 'font-semibold text-orange-500 dark:text-orange-400' },
] as const;

function renderHighlighted(text: string) {
    const combined = new RegExp(HIGHLIGHT_RULES.map(r => `(${r.pattern})`).join('|'), 'gi');
    const nodes: (string | JSX.Element)[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = combined.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index));
        const ruleIdx = m.slice(1).findIndex(g => g !== undefined);
        nodes.push(<span key={k++} className={HIGHLIGHT_RULES[ruleIdx].cls}>{m[0]}</span>);
        last = m.index + m[0].length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

// ─── Narrative Insight Display ────────────────────────────
function NarrativeInsight({ data, days }: { data: InsightData; days: number }) {
    // Format baru: paragraphs[] langsung dari LLM (terpisah per elemen)
    // Format lama: narrative string — fallback split \n
    const finalParagraphs: string[] = (() => {
        if (data.paragraphs && data.paragraphs.length > 0) {
            return data.paragraphs.filter(p => p.trim());
        }
        const fallbackText = data.narrative || (data as any).summary || '';
        const byDouble = fallbackText.split(/\n{2,}/).filter((p: string) => p.trim());
        return byDouble.length > 1 ? byDouble : fallbackText.split(/\n/).filter((p: string) => p.trim());
    })();

    return (
        <div className="bg-card dark:bg-background rounded-2xl border border-border dark:border-border shadow-sm overflow-hidden">
            {/* Highlights strip */}
            {data.highlights && data.highlights.length > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800/30 px-6 py-4">
                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3">Sorotan Utama</p>
                    <ul className="space-y-2">
                        {data.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-primary-700 dark:text-primary-300">
                                <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-primary-400" />
                                <span className="font-medium leading-snug">{renderHighlighted(h)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {/* Narrative body */}
            <div className="px-6 py-6 space-y-4">
                {finalParagraphs.map((p: string, i: number) => {
                    // Dalam satu paragraf bisa ada \n tunggal sebagai baris baru
                    const lines = p.split('\n');
                    return (
                        <p key={i} className={`leading-7 text-muted-foreground dark:text-muted-foreground ${
                            i === 0
                                ? 'text-[15px] font-semibold text-foreground dark:text-foreground'
                                : 'text-sm'
                        }`}>
                            {lines.map((line, j) => (
                                <span key={j}>
                                    {renderHighlighted(line)}
                                    {j < lines.length - 1 && <br />}
                                </span>
                            ))}
                        </p>
                    );
                })}
            </div>
            {/* Footer: keterangan periode */}
            <div className="px-6 py-3 border-t border-border dark:border-border bg-background dark:bg-card/50">
                <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">
                    {(() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - days);
                        const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        return (
                            <>
                                Analisis berdasarkan data{' '}
                                <span className="font-semibold text-muted-foreground dark:text-muted-foreground">{days} hari terakhir</span>
                                {' '}
                                <span className="text-muted-foreground dark:text-muted-foreground">({fmt(start)} – {fmt(end)})</span>
                            </>
                        );
                    })()}
                </p>
            </div>
        </div>
    );
}

function GeneratingSkeleton() {
    return (
        <div className="bg-card dark:bg-background rounded-2xl border border-border dark:border-border p-6 animate-pulse">
            <div className="h-4 bg-muted dark:bg-muted rounded w-1/3 mb-6" />
            <div className="space-y-3">
                {[100, 95, 85, 100, 70, 90, 60, 80].map((w, i) => (
                    <div key={i} className="h-3 bg-muted dark:bg-card rounded" style={{ width: `${w}%` }} />
                ))}
            </div>
        </div>
    );
}

// ─── Time Range Options ───────────────────────────────────
const TIME_RANGES = [
    { label: '7 Hari', value: 7 },
    { label: '14 Hari', value: 14 },
    { label: '30 Hari', value: 30 },
    { label: '90 Hari', value: 90 },
];

// ─── Performance Presets Panel ────────────────────────────
const PRESET_OPTIONS = [
    { id: 'hemat', label: 'Hemat', desc: 'Penggunaan CPU minimal, untuk multitasking', cores: '25%', tokens: '512' },
    { id: 'seimbang', label: 'Seimbang', desc: 'Keseimbangan kecepatan dan penggunaan daya', cores: '50%', tokens: '1024' },
    { id: 'cepat', label: 'Cepat', desc: 'Lebih cepat, CPU digunakan lebih banyak', cores: '75%', tokens: '2048' },
];

function PerformancePresetsPanel() {
    const [open, setOpen] = useState(false);
    const [activePreset, setActivePreset] = useState('seimbang');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        window.api.getLlmPreset().then((p: string) => setActivePreset(p));
    }, [open]);

    const handleSelect = async (id: string) => {
        setSaving(true);
        await window.api.saveLlmPreset(id);
        setActivePreset(id);
        setSaving(false);
    };

    const activeOption = PRESET_OPTIONS.find(p => p.id === activePreset) ?? PRESET_OPTIONS[1];

    return (
        <div className="bg-card dark:bg-background rounded-2xl border border-border dark:border-border overflow-hidden shadow-sm">
            <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-background dark:hover:bg-card/60 transition-colors text-left">
                <div className="flex items-center justify-center w-8 h-8 bg-muted dark:bg-card rounded-lg shrink-0">
                    <Settings2 className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Performa LLM Lokal</p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">{activeOption.label} — {activeOption.cores} CPU, {activeOption.tokens} token</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground rounded-full border border-border dark:border-border">{activeOption.label.toUpperCase()}</span>
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>
            {open && (
                <div className="border-t border-border dark:border-border px-5 py-4 space-y-3">
                    {PRESET_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => handleSelect(opt.id)} disabled={saving}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${activePreset === opt.id ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-border dark:border-border hover:border-border dark:hover:border-gray-600'}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-semibold text-foreground dark:text-foreground">{opt.label}</span>
                                    <span className="text-[10px] text-muted-foreground dark:text-muted-foreground">{opt.cores} CPU · {opt.tokens} token</span>
                                </div>
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">{opt.desc}</p>
                            </div>
                            {activePreset === opt.id && <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />}
                        </button>
                    ))}
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground pt-1">Tidak berpengaruh pada mode API. Perubahan diterapkan pada analisis berikutnya.</p>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────
const InsightPage = memo(function InsightPage() {
    const { data: aiStatus, refetch: refetchStatus } = useAiStatus();
    const { mutate: generateInsight, isPending: isGenerating } = useAiInsight();
    const [insight, setInsight] = useState<CacheResult | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadedMB, setDownloadedMB] = useState(0);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [browseError, setBrowseError] = useState<string | null>(null);
    const [isChangingModel, setIsChangingModel] = useState(false);
    const [aiMode, setAiMode] = useState('local');
    const [selectedDays, setSelectedDays] = useState(30);
    const [autoGeneratingDays, setAutoGeneratingDays] = useState<Set<number>>(new Set());

    useEffect(() => { window.api.getAiApiSettings().then((s) => { if (s.success) setAiMode(s.mode); }); }, []);
    useEffect(() => { const u = window.api.onAiDownloadProgress((p) => { setDownloadProgress(p.percent); setDownloadedMB(p.downloadedMB); refetchStatus(); }); return u; }, [refetchStatus]);

    // Listener auto-generate: update indikator dan refresh cache jika periode aktif selesai
    useEffect(() => {
        const unsubGenerating = window.api.onAiAutoGenerating?.((d: { days: number }) => {
            setAutoGeneratingDays(prev => new Set(prev).add(d.days));
        });
        const unsubDone = window.api.onAiAutoGenerateDone?.((d: { days: number; success: boolean }) => {
            setAutoGeneratingDays(prev => { const next = new Set(prev); next.delete(d.days); return next; });
            if (d.success) {
                window.api.getAiInsightCache(d.days).then((r: CacheResult) => {
                    if (!r.success || !r.data) return;
                    const data = r.data as any;
                    if (!data.paragraphs && !data.narrative && data.summary) {
                        const parts = [data.summary];
                        if (data.stock_recommendations?.length) parts.push(data.stock_recommendations.join('. '));
                        if (data.slow_moving_recommendations?.length) parts.push(data.slow_moving_recommendations.join('. '));
                        if (data.operational_recommendations?.length) parts.push(data.operational_recommendations.join('. '));
                        data.paragraphs = parts; data.highlights = data.top_priorities || [];
                    }
                    if (!data.paragraphs && data.narrative) {
                        data.paragraphs = data.narrative.split(/\n+/).filter((p: string) => p.trim());
                    }
                    // Hanya update insight jika periode yang selesai = periode yang sedang ditampilkan
                    setSelectedDays(prev => { if (d.days === prev) setInsight(r); return prev; });
                });
            }
        });
        return () => { unsubGenerating?.(); unsubDone?.(); };
    }, []);
    useEffect(() => {
        window.api.getAiInsightCache(selectedDays).then((r: CacheResult) => {
            if (r.success && r.data) {
                const d = r.data as any;
                // Backward compat: format paling lama pakai summary + recommendations object
                if (!d.paragraphs && !d.narrative && d.summary) {
                    const parts = [d.summary];
                    if (d.stock_recommendations?.length) parts.push(d.stock_recommendations.join('. '));
                    if (d.slow_moving_recommendations?.length) parts.push(d.slow_moving_recommendations.join('. '));
                    if (d.operational_recommendations?.length) parts.push(d.operational_recommendations.join('. '));
                    d.paragraphs = parts;
                    d.highlights = d.top_priorities || [];
                }
                // Backward compat: format lama pakai narrative string tunggal
                if (!d.paragraphs && d.narrative) {
                    d.paragraphs = d.narrative.split(/\n+/).filter((p: string) => p.trim());
                }
                setInsight(r);
            } else {
                setInsight(null);
            }
        });
    }, [selectedDays]);

    const handleDownload = useCallback(() => { setBrowseError(null); window.api.startAiDownload().then(() => refetchStatus()); }, [refetchStatus]);
    const handleCancel = useCallback(() => { window.api.cancelAiDownload().then(() => refetchStatus()); }, [refetchStatus]);
    const handleBrowse = useCallback(() => { setBrowseError(null); setIsChangingModel(true); window.api.browseAiModelFile().then((r) => { setIsChangingModel(false); if (r.status === 'cancelled') return; if (!r.success) { setBrowseError(r.error ?? 'Gagal.'); return; } refetchStatus(); }); }, [refetchStatus]);
    const handleClearCustomPath = useCallback(() => { window.api.clearAiCustomModelPath().then(() => refetchStatus()); }, [refetchStatus]);

    const handleGenerate = useCallback((force = false) => {
        setGenerateError(null);
        generateInsight({ forceRefresh: force, days: selectedDays }, {
            onSuccess: (result: any) => {
                if (result.success) {
                    setInsight({ success: true, data: result.data, created_at: result.created_at ?? new Date().toISOString(), from_cache: result.from_cache ?? false });
                    window.api.getAiApiSettings().then((s) => { if (s.success) setAiMode(s.mode); });
                } else {
                    const errMap: Record<string, string> = {
                        not_ready: 'Model AI belum siap. Download model lokal atau aktifkan mode API.',
                        timeout: 'Proses analisis melebihi batas waktu. Coba lagi.',
                        api_error: `Kesalahan API: ${result.error}`,
                        inference_error: `Kesalahan inferensi: ${result.error}`,
                        unexpected_error: `Kesalahan: ${result.error}`,
                    };
                    setGenerateError(errMap[result.status] || result.error || 'Terjadi kesalahan.');
                }
            },
            onError: (err: Error) => { setGenerateError(err.message); },
        });
    }, [generateInsight, selectedDays]);

    const state = aiStatus?.state ?? 'not_downloaded';
    const customModelPath = aiStatus?.customModelPath ?? null;
    const effectiveState = aiMode === 'api' ? 'ready' : state;

    if (effectiveState === 'not_downloaded') return <OnboardingDownloadCard onDownload={handleDownload} onBrowse={handleBrowse} browseError={browseError} />;
    if (effectiveState === 'downloading') return <DownloadProgressCard progress={downloadProgress} downloadedMB={downloadedMB} totalMB={aiStatus?.totalMB ?? 1940} onCancel={handleCancel} />;
    if (effectiveState === 'failed') return <FailedCard errorMsg={aiStatus?.errorMsg ?? ''} onRetry={handleDownload} onBrowse={handleBrowse} />;

    return (
        <div className="space-y-4 max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl shrink-0"><RetroSparkle className="w-5 h-5 text-primary-600 dark:text-primary-400" /></div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-foreground dark:text-foreground">AI Insight Bisnis</h1>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {insight?.created_at && <p className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(insight.created_at).toLocaleString('id-ID')}</p>}
                            {insight?.from_cache && <span className="text-[10px] font-semibold px-2 py-0.5 bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground rounded-full border border-border dark:border-border">CACHE</span>}
                            {aiMode === 'api' && <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-primary/10 dark:bg-primary/30 text-primary-700 dark:text-primary-400 rounded-full border border-primary/20 dark:border-primary/50"><Globe className="w-2.5 h-2.5" />API</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    {!insight?.data && !isGenerating && <Button onClick={() => handleGenerate(false)} disabled={isGenerating} className="gap-2"><RetroSparkle className="w-4 h-4" />Generate Insight</Button>}
                    {insight?.data && <Button variant="outline" onClick={() => handleGenerate(true)} disabled={isGenerating} className="gap-2"><RetroRefresh className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />{isGenerating ? 'Menganalisis...' : 'Perbarui Insight'}</Button>}
                </div>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {TIME_RANGES.map(r => (
                    <button key={r.value}
                        onClick={() => { setSelectedDays(r.value); setInsight(null); setGenerateError(null); }}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${selectedDays === r.value
                            ? 'bg-primary-600 text-white dark:bg-primary-500'
                            : 'bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                            }`}>
                        {r.label}
                    </button>
                ))}
            </div>

            <ModelSettingsPanel customModelPath={customModelPath} browseError={browseError} isChangingModel={isChangingModel} aiMode={aiMode} onBrowse={handleBrowse} onClear={handleClearCustomPath} />
            {aiMode === 'local' && <PerformancePresetsPanel />}

            {autoGeneratingDays.has(selectedDays) && !isGenerating && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 rounded-xl text-sm text-primary-700 dark:text-primary-400">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>AI sedang memperbarui insight periode ini secara otomatis...</span>
                </div>
            )}
            {generateError && <div className="flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-sm"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{generateError}</span></div>}
            {isGenerating && <GeneratingSkeleton />}
            {!isGenerating && insight?.data && <NarrativeInsight data={insight.data} days={selectedDays} />}
            {!isGenerating && !insight?.data && !generateError && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <RetroSparkle className="w-12 h-12 text-muted-foreground dark:text-muted-foreground mb-4" />
                    <p className="text-muted-foreground dark:text-muted-foreground font-medium mb-2">Belum ada insight</p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">
                        {autoGeneratingDays.has(selectedDays)
                            ? 'AI sedang memproses data — insight akan muncul otomatis setelah selesai.'
                            : 'Klik "Generate Insight" untuk menganalisis data toko Anda.'}
                    </p>
                    <Button onClick={() => handleGenerate(false)} disabled={autoGeneratingDays.has(selectedDays)} className="gap-2"><RetroSparkle className="w-4 h-4" />Generate Insight</Button>
                </div>
            )}
        </div>
    );
});

export default InsightPage;
