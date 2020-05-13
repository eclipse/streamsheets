const { State } = require('@cedalo/machine-core');


const setDisposeHandler = (sheet, term) => {
	term.dispose = () => {
		if (term._stateListener) sheet.machine.off('update', term._stateListener);
		const proto = Object.getPrototypeOf(term);
		if (proto) proto.dispose.call(term);
	};
};
const registerCallback = (sheet, term, callback) => {
	if (!term._stateListener) {
		setDisposeHandler(sheet, term);
		term._stateListener = (type, state) => {
			// DL-3309: reset values on start of a stopped machine
			if (type === 'state' && state.new === State.RUNNING && state.old === State.STOPPED) {
				callback();
			}
		};
		sheet.machine.on('update', term._stateListener);
	}
};
module.exports = {
	registerCallback
};
