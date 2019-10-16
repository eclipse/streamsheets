const logger = store => next => (action) => {
	window.DLDEBUG = window.DLDEBUG || localStorage.getItem('DLDEBUG');
	if (window.DLDEBUG) {
		console.log({
			actionType: action && action.type,
			action,
			state: store.getState(),
		});
	}
	if (action) {
		next(action);
	}
};

export default logger;
