const { runFunction, sheet: { getInbox, getOutbox } } = require('../../utils');
const { convert, jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const keyFrom = (path, funcname) => {
	let key = path[path.length - 1];
	if (key == null) {
		// eslint-disable-next-line no-nested-ternary
		key = funcname === 'INBOXMETADATA'
			? 'Metadata'
			: funcname === 'INBOXDATA' || funcname === 'OUTBOXDATA' ? 'Data' : undefined;
	}
	return key;
};
const messageData = (message, path, funcname) => {
	if (message) {
		// path = path.length ? jsonpath.toString(path) : '';
		const func = funcname === 'INBOXMETADATA' ? message.getMetaDataAt : message.getDataAt;
		const data = func.call(message, path);
		return data != null ? data : ERROR.NO_MSG_DATA;
	}
	return ERROR.NO_MSG;
};

const dataFromMessage = (box, path, funcname) => {
	const msgId = path.shift();
	const message = box.peek(msgId);
	return funcname === 'INBOX' || funcname === 'OUTBOX'
		? message || ERROR.NO_MSG
		: messageData(message, path, funcname);
};

const withKey = (key, data) => {
	// TODO if we want to support returning complete message under its ID:
	// key = key != null ? key : (data.id || '');
	let json = data;
	if (key) {
		json = {};
		json[key] = data;
	}
	return json;
};

const subtree = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((term) => term.func && term.name && term.name.toUpperCase())
		.addMappedArg(() => terms[0].value)
		.mapNextArg((includeKey) => convert.toBoolean(includeKey && includeKey.value, false))
		.run((funcname, val, includeKey) => {
			const path = jsonpath.parse(val);
			const messagebox = funcname.startsWith('OUTBOX') ? getOutbox(sheet) : getInbox(sheet, path.shift());
			const data = dataFromMessage(messagebox, path, funcname);
			return includeKey ? withKey(keyFrom(path, funcname), data) : data;
		});


module.exports = subtree;
