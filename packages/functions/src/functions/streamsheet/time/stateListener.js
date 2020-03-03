const { State } = require('@cedalo/machine-core');

const registerCallback = (sheet, term, callback) => {
	if (!term._stateListener) {
		term._stateListener = (type, state) => {
			// DL-3309: reset values on start of a stopped machine
			if (type === 'state' && state.new === State.RUNNING && state.old === State.STOPPED) {
				callback();
			}
		};
		sheet.machine.on('update', term._stateListener);
	}
};
const setDisposeHandler = (sheet, term) => {
	term.dispose = () => {
		if (term._stateListener) sheet.machine.off('update', term._stateListener);
		const proto = Object.getPrototypeOf(term);
		if (proto) proto.dispose();
	};
};

module.exports = {
	registerCallback,
	setDisposeHandler
};
