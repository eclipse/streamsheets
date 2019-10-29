const ERROR = require('../errors');
const { requestinternallegacy } = require('./request');
const {	sheet: { getMachine } } = require('../../utils');
const Message = require('@cedalo/machine-core');


const kafkaquery = (sheet, ...terms) => {
	let error = terms.length < 4 && terms.length > 8 ? ERROR.ARGS : undefined;
	if (!error && sheet.isProcessing) {
		const machine = getMachine(sheet);
		error = ERROR.ifNot(machine, ERROR.NO_MACHINE);
		const [
			streamTerm,
			queryTerm,
			targetBoxTerm,
			timeoutTerm
		] = terms;
		const config = {
			type: 'QUERY',
			query: queryTerm && queryTerm.value,
			timeout: timeoutTerm && timeoutTerm.value
		};
		if (error) return error;
		return requestinternallegacy(kafkaquery.term, sheet, streamTerm, new Message(config), targetBoxTerm);
	}
	return error || true; // not processing, so its ok...
};

module.exports = kafkaquery;
