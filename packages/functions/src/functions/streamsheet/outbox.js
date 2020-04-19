const { runFunction } = require('../../utils');


// terms can be "", or "*", or "msg-id"
const outbox = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg((messageId) => (messageId ? messageId.value : ''))
		.run((messageId) => `[${messageId}]`);


module.exports = outbox;
