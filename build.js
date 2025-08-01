const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const buildDate = new Date().toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
});

fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading index.html:', err);
        return;
    }

    const updatedContent = data.replace(
        /<p id="build-date"><!-- BUILD_DATE_PLACEHOLDER --><\/p>/,
        `<p id="build-date">${buildDate}</p>`
    );

    fs.writeFile(indexPath, updatedContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing index.html:', err);
            return;
        }
        console.log(`Build date ${buildDate} injected into index.html`);
    });
});
