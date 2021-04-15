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


module.exports = {
	// getStreamSheetById,
	getSheetFromItem
};
