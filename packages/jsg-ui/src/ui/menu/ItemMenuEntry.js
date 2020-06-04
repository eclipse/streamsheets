/* global document */

export default class ItemMenuEntry {
	constructor() {
		// string unique identifier
		this.id = undefined;
		// string unique identifier to group entries
		this.group = undefined;
		// html element which represents entry
		this.element = undefined;
	}

	createIcon(url) {
		const icon = document.createElement('img');
		// icon.id = id;
		icon.src = url;
		return icon;
	}

	// called by MenuProvider to check if entry is currently visible for given item...
	// used to hide/show/filter entries...
	isVisible(item) {
		return true;
	}

	// called by MenuProvider to pass event to this entry. should return <code>true</code> if event was handled...
	onEvent(event, item, editor) {
		return false;
	}

	// utility method to select given item...
	select(item, editor) {
		if (item) {
			const selprovider = editor.getSelectionProvider();
			const graphcontroller = editor.getGraphViewer().getGraphController();
			const controller = graphcontroller.getControllerByModelId(item.getId());
			if (controller) {
				selprovider.setSelection([controller]);
			}
		}
	}
};
