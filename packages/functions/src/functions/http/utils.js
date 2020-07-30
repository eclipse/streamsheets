const disableSheetUpdate = (sheet) => {
	const sheetOnUpdate = sheet.onUpdate;
	sheet.onUpdate = null;
	return sheetOnUpdate;
};
const enableSheetUpdate = (sheet, sheetOnUpdate) => {
	const machine = sheet.machine;
	if (sheetOnUpdate) {
		sheet.onUpdate = sheetOnUpdate;
	}
	if (machine && machine.state !== State.RUNNING) {
		sheet._notifyUpdate();
	}
};

const putKeyValuesToRange = (range, data) => {
	const sheet = range.sheet;
	const entries = Object.entries(data);
	let rowidx = 0;
	let colidx = -1;
	let newCell = null;
	let value = null;
	const onSheetUpdate = disableSheetUpdate(sheet);
	range.iterate((cell, index, nextcol) => {
		if (nextcol) {
			rowidx = 0;
			colidx += 1;
		}
		// fix colidx might be larger than available entries (DL-3764)
		if (colidx < entries.length) {
			const [key, values] = entries[colidx];
			if (rowidx === 0) value = key;
			else if (Array.isArray(values)) value = values[rowidx - 1];
			else if (rowidx === 1) value = values;
			else value = null;
			if (value != null) newCell = new Cell(value, Term.fromValue(value));
		}
		sheet.setCellAt(index, newCell);
		rowidx += 1;
		newCell = null;
	});
	enableSheetUpdate(sheet, onSheetUpdate);
};
// TODO: should be cell not range
const addHTTPResponseToCell = (response, range) => {
	let counter = 0;
	range.iterate((cell, index) => {
		if (counter === 0) {
			sheet.setCellAt(index, new Cell(response.data[path], Term.fromValue(response.data[path])));
		} else {
			sheet.setCellAt(index, undefined);
		}
		counter++;
	});
}

const addHTTPResponseToRange = async (response, range, context, error) => {
	const mimeType = response.headers['content-type'];
	const result = await parse(response.data, mimeType);
	putKeyValuesToRange(range, result.ast);
}

	addHTTPResponseToCell,
	addHTTPResponseToRange
