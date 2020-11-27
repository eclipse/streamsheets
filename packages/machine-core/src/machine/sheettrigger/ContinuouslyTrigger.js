const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

class ContinuouslyTrigger extends AbstractStreamSheetTrigger {

	async step(manual) {
		const streamsheet = this._streamsheet;
		return streamsheet.sheet.startProcessing();
	}
	
	stop(retval) {
		const streamsheet = this._streamsheet;
		streamsheet.sheet.stopProcessing(retval);
	}
}
module.exports = ContinuouslyTrigger;
