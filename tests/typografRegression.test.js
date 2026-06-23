const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function testWorkerEscapesXmlCharacters() {
    const workerPath = path.join(__dirname, '..', 'worker.js');
    const workerSource = fs.readFileSync(workerPath, 'utf8');

    let capturedRequestBody = null;

    class HeadersMock {
        constructor(initial = {}) {
            this.map = new Map(Object.entries(initial));
        }

        set(name, value) {
            this.map.set(name, value);
        }
    }

    class ResponseMock {
        constructor(body, init = {}) {
            this.body = body;
            this.status = init.status || 200;
            this.headers = new HeadersMock(init.headers || {});
            this.ok = this.status >= 200 && this.status < 300;
        }

        async text() {
            return this.body;
        }
    }

    const context = {
        console,
        addEventListener() {},
        Response: ResponseMock,
        fetch: async (url, options) => {
            capturedRequestBody = options.body;
            return {
                ok: true,
                status: 200,
                async text() {
                    return '<ProcessTextResult>OK</ProcessTextResult>';
                }
            };
        }
    };

    vm.createContext(context);
    vm.runInContext(`${workerSource}; this.handleRequest = handleRequest;`, context);

    await context.handleRequest({
        method: 'POST',
        url: 'https://example.test',
        async json() {
            return { text: 'A & B < C > D' };
        }
    });

    assert.ok(capturedRequestBody, 'worker should send a SOAP body to Typograf');
    assert.ok(
        capturedRequestBody.includes('A &amp; B &lt; C &gt; D'),
        'worker should escape XML-sensitive characters before calling Typograf'
    );
}

async function testNotifyPreservesTypografErrorMessage() {
    const indexPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

    assert(scriptMatch, 'index.html should contain an inline script');

    const elements = {
        markdownInput: { value: 'Текст с ошибкой', checked: false, style: {}, textContent: '' },
        useTypograf: { checked: true, style: {}, textContent: '', value: '' },
        copyMessage: { textContent: '', style: {} },
        htmlOutput: { textContent: '', style: {} }
    };

    const context = {
        console,
        document: {
            getElementById(id) {
                if (!elements[id]) {
                    throw new Error(`Unexpected element lookup: ${id}`);
                }
                return elements[id];
            }
        },
        fetch: async () => {
            throw new Error('network failed');
        },
        navigator: {},
        setTimeout() {}
    };

    vm.createContext(context);
    vm.runInContext(`${scriptMatch[1]}; this.notify = notify;`, context);

    await context.notify();

    assert.strictEqual(
        elements.copyMessage.textContent,
        'Ошибка Типографа. Обработка без него.',
        'notify should keep the Typograf error visible instead of overwriting it with success'
    );
}

(async () => {
    await testWorkerEscapesXmlCharacters();
    await testNotifyPreservesTypografErrorMessage();
    console.log('typograf regression tests passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
