const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { app } = require('electron');

// ─── Constants ───────────────────────────────────────────
const MODEL_FILENAME = 'Qwen2.5-3B-Instruct-Q4_K_M.gguf';
const MODEL_URL = 'https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf';
const MODEL_URL_MIRROR = 'https://hf-mirror.com/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf';
const MODEL_SIZE_MB = 1940;
const MODEL_SHA256 = null; // Set to actual hash from HuggingFace model card when available

// Stall timeout: if no data received for 2 minutes, abort
const STALL_TIMEOUT_MS = 2 * 60 * 1000;

// ─── State ───────────────────────────────────────────────
// States: not_downloaded | downloading | validating | ready | failed
let downloadState = {
    state: 'not_downloaded',
    progressPercent: 0,
    downloadedMB: 0,
    totalMB: MODEL_SIZE_MB,
    errorMsg: null,
    customModelPath: null, // set if user pointed to an existing file
};

let activeRequest = null;
let activeWriteStream = null;

// ─── Custom Model Path ────────────────────────────────────
// Stored externally (from settings DB via main.js), set during init()
let _customModelPath = null;

function setCustomModelPath(filePath) {
    if (!filePath) {
        _customModelPath = null;
        downloadState.customModelPath = null;
        // Re-check default path
        _refreshStateFromDisk();
        return { success: true };
    }

    // Validate: file exists and is large enough to be a GGUF model
    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File tidak ditemukan: ' + filePath };
    }
    const stats = fs.statSync(filePath);
    if (stats.size < 100 * 1024 * 1024) { // < 100 MB — definitely not a valid GGUF
        return { success: false, error: 'File terlalu kecil, bukan model GGUF yang valid' };
    }

    _customModelPath = filePath;
    downloadState.customModelPath = filePath;
    downloadState.state = 'ready';
    downloadState.progressPercent = 100;
    console.log('[AI Download] Custom model path set:', filePath);
    return { success: true };
}

function getCustomModelPath() {
    return _customModelPath;
}

// ─── Path Helper ─────────────────────────────────────────
function getDefaultModelPath() {
    const userDataPath = app.getPath('userData');
    const modelsDir = path.join(userDataPath, 'models');
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
    }
    return path.join(modelsDir, MODEL_FILENAME);
}

function getModelPath() {
    if (_customModelPath && fs.existsSync(_customModelPath)) {
        return _customModelPath;
    }
    return getDefaultModelPath();
}

// ─── Status ──────────────────────────────────────────────
function getDownloadStatus() {
    return { ...downloadState };
}

// ─── Validation ──────────────────────────────────────────
function validateModel(filePath) {
    const target = filePath || getModelPath();
    if (!fs.existsSync(target)) return false;

    const stats = fs.statSync(target);
    if (stats.size < 1500 * 1024 * 1024) {
        console.log('[AI Download] File too small, likely incomplete:', stats.size);
        return false;
    }

    if (MODEL_SHA256) {
        try {
            const hash = crypto.createHash('sha256');
            const fileBuffer = fs.readFileSync(target);
            hash.update(fileBuffer);
            const digest = hash.digest('hex');
            if (digest !== MODEL_SHA256) {
                console.log('[AI Download] SHA256 mismatch');
                return false;
            }
        } catch (err) {
            console.error('[AI Download] SHA256 check failed:', err.message);
            return false;
        }
    }
    return true;
}

function isModelReady() {
    if (downloadState.state === 'ready') return true;

    const modelPath = getModelPath();
    if (fs.existsSync(modelPath) && validateModel(modelPath)) {
        downloadState.state = 'ready';
        downloadState.progressPercent = 100;
        return true;
    }
    return false;
}

// ─── Initialize State from Disk ──────────────────────────
function _refreshStateFromDisk() {
    // Custom path takes priority
    if (_customModelPath) {
        if (fs.existsSync(_customModelPath)) {
            downloadState.state = 'ready';
            downloadState.progressPercent = 100;
            downloadState.customModelPath = _customModelPath;
            console.log('[AI Download] Custom model path valid, ready:', _customModelPath);
            return;
        } else {
            console.warn('[AI Download] Custom model path missing:', _customModelPath);
            _customModelPath = null;
            downloadState.customModelPath = null;
        }
    }

    // Check default path
    const modelPath = getDefaultModelPath();
    if (fs.existsSync(modelPath)) {
        const stats = fs.statSync(modelPath);
        if (stats.size >= 1500 * 1024 * 1024) {
            downloadState.state = 'ready';
            downloadState.progressPercent = 100;
            console.log('[AI Download] Default model found on disk, ready');
        } else {
            const pct = Math.floor((stats.size / (MODEL_SIZE_MB * 1024 * 1024)) * 100);
            downloadState.state = 'not_downloaded';
            downloadState.progressPercent = pct;
            downloadState.downloadedMB = Math.floor(stats.size / 1024 / 1024);
            console.log(`[AI Download] Partial download found: ${downloadState.downloadedMB} MB (${pct}%)`);
        }
    } else {
        downloadState.state = 'not_downloaded';
        console.log('[AI Download] No model file found');
    }
}

// ─── HTTP Download with Range Resume ─────────────────────
function doRequest(url, headers, onData, onEnd, onError) {
    const protocol = url.startsWith('https') ? https : http;
    let stallTimer = null;
    let responseStarted = false;

    const clearStall = () => {
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
    };

    const resetStallTimer = (req) => {
        clearStall();
        stallTimer = setTimeout(() => {
            console.warn('[AI Download] Stall detected (no data for 2 min), aborting');
            req.destroy(new Error('Download terhenti — tidak ada data selama 2 menit'));
        }, STALL_TIMEOUT_MS);
    };

    const req = protocol.get(url, { headers }, (res) => {
        responseStarted = true;

        // ── Disable the connect timeout the moment we get any response ──
        // req.setTimeout only makes sense before streaming begins.
        // Keeping it active during a multi-GB download causes false timeouts
        // when the CDN naturally pauses between chunks.
        req.setTimeout(0);

        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            const location = res.headers['location'];
            if (!location) {
                clearStall();
                onError(new Error('Redirect tanpa location header'));
                return;
            }
            console.log('[AI Download] Redirect to:', location);
            clearStall();
            activeRequest = doRequest(location, headers, onData, onEnd, onError);
            return;
        }

        // ── HTTP 416: Range Not Satisfiable ──────────────────────────────
        // Means the byte offset we sent equals or exceeds the remote file size.
        // The partial file on disk is already as large as the server copy — signal
        // the caller so it can validate and decide whether to complete or restart.
        if (res.statusCode === 416) {
            clearStall();
            const err = new Error('HTTP 416');
            err.code = 'HTTP_416';
            onError(err);
            return;
        }

        if (res.statusCode !== 200 && res.statusCode !== 206) {
            clearStall();
            onError(new Error(`HTTP ${res.statusCode}`));
            return;
        }

        // Start stall detection once streaming begins
        resetStallTimer(req);

        res.on('data', (chunk) => {
            resetStallTimer(req); // reset on every chunk — never stall while data flows
            onData(chunk);
        });
        res.on('end', () => { clearStall(); onEnd(); });
        res.on('error', (err) => { clearStall(); onError(err); });
    });

    req.on('error', (err) => {
        if (!responseStarted) clearStall();
        onError(err);
    });

    // Connect timeout: only applies while waiting for the initial server response.
    // Automatically disabled above (req.setTimeout(0)) once response arrives.
    req.setTimeout(60000, () => {
        clearStall();
        req.destroy(new Error('Server tidak merespons dalam 60 detik'));
    });

    return req;
}

function startDownload(onProgress) {
    if (downloadState.state === 'downloading') {
        console.log('[AI Download] Already downloading');
        return;
    }
    if (downloadState.state === 'ready') {
        console.log('[AI Download] Model already ready');
        return;
    }

    const destPath = getDefaultModelPath();
    const existingSize = fs.existsSync(destPath) ? fs.statSync(destPath).size : 0;
    const headers = existingSize > 0 ? { 'Range': `bytes=${existingSize}-` } : {};

    downloadState.state = 'downloading';
    downloadState.errorMsg = null;
    downloadState.downloadedMB = Math.floor(existingSize / 1024 / 1024);

    if (existingSize > 0) {
        console.log(`[AI Download] Resuming from ${downloadState.downloadedMB} MB`);
    } else {
        console.log('[AI Download] Starting fresh download');
    }

    activeWriteStream = fs.createWriteStream(destPath, {
        flags: existingSize > 0 ? 'a' : 'w'
    });

    let downloadedBytes = existingSize;
    const totalBytes = MODEL_SIZE_MB * 1024 * 1024;

    const onData = (chunk) => {
        if (!activeWriteStream) return;
        activeWriteStream.write(chunk);
        downloadedBytes += chunk.length;
        const pct = Math.min(99, Math.floor((downloadedBytes / totalBytes) * 100));
        const dlMB = Math.floor(downloadedBytes / 1024 / 1024);
        downloadState.progressPercent = pct;
        downloadState.downloadedMB = dlMB;
        if (onProgress) {
            onProgress({ percent: pct, downloadedMB: dlMB, totalMB: MODEL_SIZE_MB });
        }
    };

    const onEnd = () => {
        if (!activeWriteStream) return; // was cancelled
        activeWriteStream.end(() => {
            activeWriteStream = null;
            activeRequest = null;
            downloadState.state = 'validating';
            console.log('[AI Download] Download complete, validating...');

            const isValid = validateModel(destPath);
            if (isValid) {
                downloadState.state = 'ready';
                downloadState.progressPercent = 100;
                console.log('[AI Download] Model validated and ready');
                if (onProgress) onProgress({ percent: 100, downloadedMB: MODEL_SIZE_MB, totalMB: MODEL_SIZE_MB });
            } else {
                downloadState.state = 'failed';
                downloadState.errorMsg = 'Validasi file gagal. File mungkin korup.';
                console.error('[AI Download] Validation failed');
            }
        });
    };

    // ── Handle 416 & generic errors ──────────────────────────
    const handle416 = () => {
        // HTTP 416: the Range offset we sent equals the remote file size.
        // The partial file on disk is already the right size — just validate it.
        if (activeWriteStream) { activeWriteStream.end(); activeWriteStream = null; }
        activeRequest = null;

        console.log('[AI Download] HTTP 416 — checking if file is already complete...');
        if (validateModel(destPath)) {
            console.log('[AI Download] File already complete and valid. Marking ready.');
            downloadState.state = 'ready';
            downloadState.progressPercent = 100;
            if (onProgress) onProgress({ percent: 100, downloadedMB: MODEL_SIZE_MB, totalMB: MODEL_SIZE_MB });
        } else {
            // File size matches server but content is invalid — delete and restart
            console.warn('[AI Download] 416 but file is invalid. Deleting and restarting...');
            try { fs.unlinkSync(destPath); } catch (e) { /* ignore */ }
            downloadedBytes = 0;
            downloadState.downloadedMB = 0;
            activeWriteStream = fs.createWriteStream(destPath, { flags: 'w' });
            activeRequest = doRequest(MODEL_URL, {}, onData, onEnd, onError);
        }
    };

    const onError = (err) => {
        if (err.code === 'HTTP_416') { handle416(); return; }

        console.error('[AI Download] Error:', err.message);
        if (activeWriteStream) { activeWriteStream.end(); activeWriteStream = null; }
        activeRequest = null;
        downloadState.state = 'failed';
        downloadState.errorMsg = err.message;
    };

    // ── Primary URL → mirror fallback ────────────────────────
    // Mirror fallback also handles 416 via the shared onError → handle416 path.
    console.log('[AI Download] Trying primary URL:', MODEL_URL);
    activeRequest = doRequest(MODEL_URL, headers, onData, onEnd, (err) => {
        if (err.code === 'HTTP_416') { handle416(); return; }

        console.warn('[AI Download] Primary URL failed:', err.message, '— trying mirror...');
        if (activeWriteStream) { activeWriteStream.end(); }
        const resumeSize = fs.existsSync(destPath) ? fs.statSync(destPath).size : 0;
        const mirrorHeaders = resumeSize > 0 ? { 'Range': `bytes=${resumeSize}-` } : {};
        activeWriteStream = fs.createWriteStream(destPath, { flags: resumeSize > 0 ? 'a' : 'w' });
        downloadedBytes = resumeSize;
        activeRequest = doRequest(MODEL_URL_MIRROR, mirrorHeaders, onData, onEnd, onError);
    });
}

// ─── Cancel ──────────────────────────────────────────────
function cancelDownload() {
    if (downloadState.state !== 'downloading') return;
    console.log('[AI Download] Cancelling download...');

    if (activeRequest) {
        try { activeRequest.destroy(); } catch (e) { /* ignore */ }
        activeRequest = null;
    }
    if (activeWriteStream) {
        activeWriteStream.end();
        activeWriteStream = null;
    }

    downloadState.state = 'not_downloaded';
    downloadState.errorMsg = null;
    console.log('[AI Download] Download cancelled');
}

// ─── Init ─────────────────────────────────────────────────
// customPath: value from settings DB (may be null/empty)
function init(customPath) {
    try {
        if (customPath) {
            _customModelPath = customPath;
            downloadState.customModelPath = customPath;
        }
        _refreshStateFromDisk();
    } catch (e) {
        console.error('[AI Download] Init error:', e.message);
    }
}

module.exports = {
    init,
    getModelPath,
    getDefaultModelPath,
    getCustomModelPath,
    setCustomModelPath,
    getDownloadStatus,
    startDownload,
    cancelDownload,
    validateModel,
    isModelReady,
};
