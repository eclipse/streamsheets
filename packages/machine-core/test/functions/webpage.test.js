const { Machine } = require('../..');
const { WEBPAGE } = require('../../src/functions');
const ERROR = require('../../src/functions/errors');
const { Term } = require('@cedalo/parser');

let webpages = {};

// class WebpageStream {
// 	static NAME() {
// 		return 'webpage_stream';
// 	}
// 	request(request) {
// 		webpages[request.url] = request;
// 	}
// }

// class DSManager {
// 	getStreamProxyByName(name) {
// 		return name === WebpageStream.NAME() ? new WebpageStream() : undefined;
// 	}
// }

// class EmptyDSManager {
// 	getStream(/* type, name */) {
// 		return undefined;
// 	}
// }

beforeEach(() => {
	webpages = {};
});


describe.skip('webpage', () => {
	it('should send webpage request', () => {
		const machine = new Machine();
		const sheet = machine.streamsheets[0].sheet; // .load(SHEETS.SIMPLE);
		sheet.processor._isProcessing = true;
		const url = Term.fromString('test/test1');
		const html = Term.fromString('<html><body><h1>HELLO</h1></body></html>');
		const refresh = Term.fromNumber(4);
		expect(WEBPAGE(sheet, url, html, refresh)).toBe(true);
		const page = webpages['test/test1'];
		expect(page).toBeDefined();
		expect(page.url).toBe('test/test1');
		expect(page.html).toBe('<html><body><h1>HELLO</h1></body></html>');
		expect(page.refresh).toBe(4);
	});
	describe('error messages', () => {
		it(`should return with ${ERROR.ARGS} if number of parameters are wrong`, () => {
			expect(WEBPAGE()).toBe(ERROR.ARGS);
			const machine = new Machine();
			const sheet = machine.streamsheets[0].sheet;
			sheet.processor._isProcessing = true;
			expect(WEBPAGE(sheet)).toBe(ERROR.ARGS);
		});
		it(`should return with ${ERROR.NO_MACHINE} if machine could not be found`, () => {
			const machine = new Machine();
			const sheet = machine.streamsheets[0].sheet;
			sheet.processor._isProcessing = true;
			const url = Term.fromString('test/test1');
			const html = Term.fromString('<html></html>');
			const refresh = Term.fromNumber(4);
			sheet.streamsheet.machine = undefined;
			expect(WEBPAGE(sheet, url, html, refresh)).toBe(ERROR.NO_MACHINE);
		});
		it(`should return with ${ERROR.NO_STREAM} if stream could not be resolved`, () => {
			const machine = new Machine();
			const sheet = machine.streamsheets[0].sheet;
			sheet.processor._isProcessing = true;
			const url = Term.fromString('test/test1');
			const html = Term.fromString('<html></html>');
			const refresh = Term.fromNumber(4);
			expect(WEBPAGE(sheet, url, html, refresh)).toBe(ERROR.NO_STREAM);
		});
	});
});
