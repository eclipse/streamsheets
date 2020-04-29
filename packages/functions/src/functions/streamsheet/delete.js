const {	runFunction, sheet: { getInbox, getOutbox } } = require('../../utils');
const { jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const clear = (box, id) => {
	const clearIt = id === '*';
	if (clearIt) {
		box.clear();
	}
	return clearIt;
};
const deleteMessage = (id, box) => (box ? (clear(box, id) || !!box.pop(id)) : false);

const deleteFromMessageBox = (box, path, funcname) => {
	const msgId = path.shift();
	if (funcname === 'INBOX' || funcname === 'OUTBOX') {
		return !deleteMessage(msgId, box) ? ERROR.NO_MSG : undefined;
	}
	const msg = box && box.peek(msgId);
	const error = msg == null ? ERROR.NO_MSG : undefined;
	if (!error) {
		const func = funcname === 'INBOXMETADATA' ? msg.deleteMetaDataAt : msg.deleteDataAt;
		return !func.call(msg, path) ? ERROR.NO_MSG_DATA : undefined;
	}
	return error;
};

const getFuncName = (term) => term.name ? term.name.toUpperCase() : '';

// we require INBOXDATA, INBOXMETADATA or OUTBOXDATA
const _delete = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(pathstr => pathstr.value)
		.reduce(pathstr => [jsonpath.parse(pathstr)])
		.addMappedArg(() => getFuncName(terms[0]))
		.addMappedArg((path, funcname) => (funcname.startsWith('OUTBOX')
			? getOutbox(sheet) || ERROR.OUTBOX
			: getInbox(sheet, path.shift()) || ERROR.NO_MSG))
		.run((path, funcname, box) => deleteFromMessageBox(box, path, funcname) || true);

module.exports = _delete;
