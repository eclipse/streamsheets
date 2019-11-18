const {	runFunction, sheet: { getInbox, getOutbox } } = require('../../utils');
const { jsonpath } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

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
		return !deleteMessage(msgId, box) ? Error.code.NO_MSG : undefined;
	}
	const msg = box && box.peek(msgId);
	const error = msg == null ? Error.code.NO_MSG : undefined;
	if (!error) {
		const func = funcname === 'INBOXMETADATA' ? msg.deleteMetaDataAt : msg.deleteDataAt;
		return !func.call(msg, path) ? Error.code.NO_MSG_DATA : undefined;
	}
	return error;
};


// we require INBOXDATA, INBOXMETADATA or OUTBOXDATA
const _delete = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(pathstr => pathstr.value)
		.reduce(pathstr => [jsonpath.parse(pathstr)])
		.addMappedArg(() => terms[0] && terms[0].func && terms[0].name)
		.addMappedArg((path, funcname) => (funcname.startsWith('OUTBOX')
			? getOutbox(sheet) || Error.code.OUTBOX
			: getInbox(sheet, path.shift()) || Error.code.NO_MSG))
		.run((path, funcname, box) => deleteFromMessageBox(box, path, funcname) || true);

module.exports = _delete;
