// helpers.js: вспомогательные функции

export function formatNumber(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    return n.toLocaleString('ru-RU');
}

export function shortNumber(n) {
    n = Number(n);
    if (isNaN(n)) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2).replace(/\.00$/, '') + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.00$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 2).replace(/\.00$/, '') + 'k';
    return String(n);
}

export function parseInputNumber(str) {
    if (typeof str !== 'string') str = String(str);
    str = str.trim().replace(/\s+/g, '').replace(',', '.').toLowerCase();
    if (str === '') return 0;
    let mult = 1;
    if (str.endsWith('kk')) { mult = 1_000_000; str = str.slice(0, -2); }
    else if (str.endsWith('k')) { mult = 1_000; str = str.slice(0, -1); }
    else if (str.endsWith('м') || str.endsWith('m')) { mult = 1_000_000; str = str.slice(0, -1); }
    else if (str.endsWith('т') || str.endsWith('t')) { mult = 1_000_000_000; str = str.slice(0, -1); }
    else if (str.endsWith('b')) { mult = 1_000_000_000; str = str.slice(0, -1); }
    let num = parseFloat(str);
    if (isNaN(num)) return 0;
    return Math.round(num * mult);
}

export function parseShortNumber(str) {
    if (!str || typeof str !== 'string') return 0;
    return parseInputNumber(str);
}
