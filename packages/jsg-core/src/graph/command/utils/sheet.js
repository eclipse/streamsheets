// const getStreamSheetById = (id, machinegraph) => {
// 	let sheet;
// 	const container = machinegraph.getStreamSheetsContainer();
// 	container.enumerateStreamSheetContainers((sheetcontainer) => {
// 		const sheetId = sheetcontainer.getStreamSheetContainerAttributes().getSheetId().getValue();
// 		if (id === sheetId) {
// 			sheet = sheetcontainer.getStreamSheet();
// 		}
// 	});
// 	return sheet;
// };

const getSheetFromItem = (item) => {
	let sheet;
	if (item != null) sheet = item.isStreamSheet ? item : getSheetFromItem(item.getParent());
	return sheet;
};

const getStreamSheetId = (sheet) => {
	const sheetContainer = sheet && sheet.getStreamSheetContainer();
	return (sheetContainer) ?
		sheetContainer.getStreamSheetContainerAttributes().getSheetId().getValue() : undefined;
}

module.exports = {
	// getStreamSheetById,
	getSheetFromItem,
	getStreamSheetId
};
