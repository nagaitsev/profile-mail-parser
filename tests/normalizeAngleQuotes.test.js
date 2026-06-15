const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

assert(scriptMatch, 'index.html should contain an inline script');

const context = {
    console,
    document: {
        getElementById() {
            return {
                checked: false,
                style: {},
                textContent: '',
                value: ''
            };
        }
    },
    fetch: async () => {
        throw new Error('fetch should not be called by quote normalization tests');
    },
    navigator: {},
    setTimeout() {}
};

vm.createContext(context);
vm.runInContext(`${scriptMatch[1]}; this.normalizeAngleQuotes = normalizeAngleQuotes;`, context);

assert.strictEqual(
    context.normalizeAngleQuotes('&quot;Аудио&quot;'),
    '«Аудио»'
);

assert.strictEqual(
    context.normalizeAngleQuotes('"Аудио"'),
    '«Аудио»'
);

console.log('normalizeAngleQuotes tests passed');
