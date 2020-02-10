const defaultState = {
	cellSelected: false,
	graphSelected: false,
	canUndo: false,
	canRedo: false,
};

export default function appReducer(state = defaultState, action) {
	switch (action.type) {
		case 'SET_JSG_STATE':
			return {
				...state,
				...action.data
			};
		default:
			return state;
	}
}
