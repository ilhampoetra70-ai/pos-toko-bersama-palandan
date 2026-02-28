const { app } = require('electron');
const database = require('./database');
const path = require('path');

console.log('App object:', app); // DEBUG: Check if app is defined

if (!app) {
    console.error('CRITICAL: Electron app object is undefined!');
    process.exit(1);
}

app.whenReady().then(async () => {
    try {
        console.log('Initializing database...');
        // We might need to mock app.getPath if it fails even here, due to some context issue?
        // But let's try invoking it.
        await database.initDatabase();

        const dateFrom = new Date().toISOString().slice(0, 10);
        const dateTo = new Date().toISOString().slice(0, 10);

        console.log(`Fetching comprehensive report for ${dateFrom} to ${dateTo}...`);

        const result = database.getComprehensiveReport(dateFrom, dateTo);

        console.log('Result length:', result ? Object.keys(result).length : 'null');
        console.log('Sales:', result?.sales ? 'OK' : 'NULL');
        console.log('Profit:', result?.profit ? 'OK' : 'NULL');
        console.log('Hourly:', result?.hourly ? `OK (${result.hourly.length})` : 'NULL');
        console.log('Bottom:', result?.bottomProducts ? `OK (${result.bottomProducts.length})` : 'NULL');
        console.log('TxLog:', result?.transactionLog ? `OK (${result.transactionLog.length})` : 'NULL');
        console.log('StockAudit:', result?.stockAudit ? `OK (${result.stockAudit.length})` : 'NULL');
        console.log('StockTrail:', result?.stockTrail ? `OK (${result.stockTrail.length})` : 'NULL');

    } catch (err) {
        console.error('CRASHED:', err);
    } finally {
        setTimeout(() => app.quit(), 1000);
    }
});
