const fs = require('fs');
const path = require('path');

function processCSV(filename, destName) {
    if (!fs.existsSync(filename)) return;
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.trim().split('\n').slice(1);
    const result = [];
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 6) {
            // Date parsing (e.g. 2017-09-01 05:30)
            const timeStr = parts[0].trim();
            const time = new Date(timeStr.length > 10 ? timeStr : timeStr + " 00:00:00").getTime();
            result.push([
                time,
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3]),
                parseFloat(parts[4]),
                parseFloat(parts[5])
            ]);
        }
    }
    fs.writeFileSync(path.join(__dirname, destName), JSON.stringify(result));
    console.log('Processed', destName);
}

processCSV(path.join(__dirname, 'btc-usdt_15m', '15m_BTCUSDT.csv'), 'BTCUSDT_15m.json');
processCSV(path.join(__dirname, 'btc-usdt_5m', 'BTCUSDT_5m_2017-09-01_to_2025-09-23.csv'), 'BTCUSDT_5m.json');

// The ETH one is a parquet file which is hard to parse in raw Node.js without tools.
// If it's too hard, we just rely on synthetic mode for now...
