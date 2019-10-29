// const SheetIndex = require('../../machine/SheetIndex');
const ERROR = require('../functions/errors');
const jsonpath = require('./jsonpath');
const {
	isBoxFuncTerm,
	isInboxTerm,
	isInboxDataTerm,
	isInboxMetaDataTerm,
	isOutboxTerm,
	isOutboxDataTerm
} = require('./terms');
const { Cell, CellReference, Message, SheetRange } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');


// sheet: default sheet to use if CellReference must be created
const getCellFromTermIndex = (term, sheet) => {
	let cell;
	if (term.hasOperandOfType('CellRangeReference')) {
		const range = term.operand.range;
		cell = ERROR.isError(range) || range.sheet.cellAt(range.start);
	} else {
		// eslint-disable-next-line
		term.value; // we need to get value to ensure a possible cell-index is set...
		cell = term.cellIndex != null ? sheet.cellAt(term.cellIndex) : undefined;
	}
	return cell;
};
const getCellFromTerm = (term, sheet) => {
	let cell;
	if (term) {
		cell = term.hasOperandOfType('CellReference') ? term.operand.target : getCellFromTermIndex(term, sheet);
	}
	return cell;
};


const createCellRangeFromIndex = (index, sheet) => {
	const cellrange = index && SheetRange.fromStartEnd(index, index);
	if (cellrange) cellrange.sheet = sheet;
	return cellrange;
};
const createCellRangeFromCellReference = (term) => {
	const cellref = term.operand;
	return term.hasOperandOfType('CellReference') && cellref
		? createCellRangeFromIndex(cellref.index, cellref.sheet)
		: undefined;
};
const getCellRangeFromTerm = (term, sheet, strict) => {
	let range;
	if (term) {
		// we need to get value to ensure cell index is set...
		const value = term.value;
		// cannot simply return error here!! will prevent overriding an error-cell!!!
		// range = ERROR.isError(value) || ((value instanceof SheetRange) && value);
		range = (value instanceof SheetRange) && value;
		if (!range && !strict) {
			range = createCellRangeFromCellReference(term)
				|| (term.cellIndex ? createCellRangeFromIndex(term.cellIndex, sheet) : undefined);
		}
	}
	return range;
};

const getCellRangesFromTerm = (term, sheet, strict) => {
	const ranges = [];
	if (term) {
		const value = term.value;
		// did we get an array of values...
		if (Array.isArray(value)) {
			value.forEach(((val) => {
				const range = (val instanceof SheetRange) && val;
				if (range) ranges.push(range);
			}));
		} else {
			const range = getCellRangeFromTerm(term, sheet, strict);
			if (range) ranges.push(range);
		}
	}
	return ranges;
};


// const getCellsFromTerm = (term, sheet) => {
// 	let list = term ? [] : undefined;
// 	if (list) {
// 		const params = term.isList ? term.params : [term];
// 		params.some((param) => {
// 			const range = getCellRangeFromTerm(param, sheet);
// 			if (!ERROR.isError(range)) {
// 				range.iterate(cell => cell && list.push(cell));
// 				return false;
// 			}
// 			list = range;
// 			return true;
// 		});
// 	}
// 	return list;
// };
const getCellReferencesFromTerm = (term, sheet) => {
	let refs = term ? [] : undefined;
	if (refs) {
		const params = term.isList ? term.params : [term];
		params.some((param) => {
			const range = getCellRangeFromTerm(param, sheet);
			if (ERROR.isError(range)) {
				refs = range;
				return true;
			}
			const rangesheet = range && range.sheet;
			if (rangesheet) {
				range.iterate((cell, index) => {
					if (index) refs.push(new CellReference(index.copy(), rangesheet));
				});
			}
			return false;
		});
	}
	return refs;
};


const toStaticCell = cell => (cell != null ? new Cell(cell.value, Term.fromValue(cell.value)) : undefined);

const cellFromFunc = (func) => {
	const funcTerm = func.term;
	return funcTerm && funcTerm.cell;
};

const getMachine = (sheet) => sheet.streamsheet && sheet.streamsheet.machine;

const getStreamSheetByName = (name, sheet) => {
	if (name) {
		const machine = getMachine(sheet);
		return machine && machine.getStreamSheetByName(name);
	}
	return sheet.streamsheet;
};

const getStreamSheet = (term, sheet) => {
	const name = term ? term.value : '';
	return getStreamSheetByName(name, sheet);
};

// how to handle metatdata? => inside payload (message.data object) or additional or as an own metadata property...
const getMessagesFromBox = (box, includeMetaData) =>
	box.messages.map((message) => {
		const msg = message.data;
		if (includeMetaData) {
			Object.assign(msg, message.metadata);
		}
		return msg;
	});

const getOutboxMessage = (id, machine) => machine.outbox && machine.outbox.peek(id);

const getOutbox = (sheet) => {
	const machine = getMachine(sheet);
	return machine && machine.outbox;
};
const getInbox = (sheet, streamsheetName) => {
	const streamsheet = getStreamSheetByName(streamsheetName, sheet);
	return streamsheet ? streamsheet.inbox : undefined;
};

const getInboxMessage = (streamsheetName, messageId, machine) => {
	const streamsheet = machine.getStreamSheetByName(streamsheetName);
	return streamsheet ? streamsheet.inbox.peek(messageId) : undefined;
};

const getInboxOrOutboxMessage = (path, machine) => {
	let message;
	// first check if we reference an outbox message...
	if (path.length === 1) {
		message = getOutboxMessage(path[0], machine);
	}
	return message || getInboxMessage(path[0], path[1], machine);
};
	
const createMessageFromValue = (value) => {
	let message;
	if (value != null) {
		message = ERROR.isError(value) || new Message(typeof value === 'object' ? Object.assign({}, value) : { value });
	}
	return message;
};
// term can be simple cell-ref, DICTIONARY, ARRAY, inbox, outbox message...
const createMessageFromTerm = (term, machine) => {
	let message;
	const value = term.value;
	const path = jsonpath.parse(value);
	if (path.length) {
		message = getInboxOrOutboxMessage(path, machine);
		// we need to copy, because MessageHandler & StreamSheet compare messages via ===
		return message ? message.copy() : undefined;
	}
	return createMessageFromValue(value);
};

const getLocale = (sheet) => {
	const machine = getMachine(sheet);
	const locale = machine && machine.locale;
	return locale || 'en';
};

const messageFromInbox = (sheet, term) => {
	const [streamsheetName, msgId] = jsonpath.parse(term.value);
	const inbox = getInbox(sheet, streamsheetName);
	return inbox.peek(msgId);
};

const messageFromOutbox = (machine, term) => {
	const [msgId] = jsonpath.parse(term.value);
	return machine.outbox.peek(msgId);
};

const messageFromBox = (machine, sheet, term, requireMessageData = true) => {
	let message;
	if (isInboxTerm(term)) {
		const inboxMessage = messageFromInbox(sheet, term);
		message = inboxMessage ? { metadata: inboxMessage.metadata, data: inboxMessage.data } : ERROR.NO_MSG;
	} else if (isOutboxTerm(term)) {
		const outboxMessage = messageFromOutbox(machine, term);
		message = outboxMessage ? outboxMessage.data : ERROR.NO_MSG;
	} else if (isOutboxDataTerm(term)) {
		const [, ...path] = jsonpath.parse(term.value);
		const outboxMessage = messageFromOutbox(machine, term);
		message = outboxMessage ? jsonpath.query(path, outboxMessage.data) : ERROR.NO_MSG;
	} else if (isInboxDataTerm(term)) {
		const [, , ...path] = jsonpath.parse(term.value);
		const inboxMessage = messageFromInbox(sheet, term);
		message = inboxMessage ? jsonpath.query(path, inboxMessage.data) : ERROR.NO_MSG;
	} else if (isInboxMetaDataTerm(term)) {
		const [, , ...path] = jsonpath.parse(term.value);
		const inboxMessage = messageFromInbox(sheet, term);
		message = inboxMessage ? jsonpath.query(path, inboxMessage.metadata) : ERROR.NO_MSG;
	}
	if (requireMessageData && (message === null || message === undefined)) {
		return ERROR.NO_MSG_DATA;
	}
	return message;
};

const messageFromBoxOrValue = (machine, sheet, term, requireMessageData = true) => {
	if (isBoxFuncTerm(term)) {
		return messageFromBox(machine, sheet, term, requireMessageData);
	}
	return term.value;
};

module.exports = {
	cellFromFunc,
	createMessageFromValue,
	createMessageFromTerm,
	getCellFromTerm,
	// getCellsFromTerm,
	getCellRangeFromTerm,
	getCellRangesFromTerm,
	getCellReferencesFromTerm,
	toStaticCell,
	getInbox,
	getLocale,
	getMachine,
	getMessagesFromBox,
	getOutbox,
	getStreamSheet,
	getStreamSheetByName,
	messageFromBoxOrValue
};
