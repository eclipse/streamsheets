const ERROR = require('./errors');
const { getMachine } = require('./utils');
const runFunction = require('./_utils').runFunction;


// internal stream to handle webpage requests:
const WEBPAGE_STREAM = 'webpage_stream';
const getWebPageStream = machine => machine.namedCells.get(WEBPAGE_STREAM);

const valueOrError = term => term.value || ERROR.INVALID_PARAM;

const webpage = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(3)
		.mapNextArg(url => valueOrError(url))
		.mapNextArg(html => valueOrError(html))
		.mapNextArg(refresh => refresh.value)
		.addMappedArg(() => {
			const machine = getMachine(sheet);
			return machine ? (getWebPageStream(machine) || ERROR.NO_STREAM) : ERROR.NO_MACHINE;
		})
		.run((url, html, refresh, webpageStream) => webpageStream.request({ url, html, refresh }));


module.exports = webpage;
