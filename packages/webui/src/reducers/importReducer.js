import * as ActionTypes from '../constants/ActionTypes';

const defaultImportDataState = {
	showStartImportDialog: false,
	importData: null
};

export default function importDataReducer(state = defaultImportDataState, action) {
	switch (action.type) {
		case ActionTypes.SHOW_START_IMPORT:
			return {
				...state,
				showStartImportDialog: true
			};
		case ActionTypes.SHOW_IMPORT:
			return {
				...state,
				importData: action.data
			};
		case ActionTypes.HIDE_IMPORT_DIALOG:
			return defaultImportDataState;
		default:
			return state;
	}
}
