import { default as JSG } from '@cedalo/jsg-core';
import Feedback from './Feedback';

/**
 * A Feedback instance for Port items.
 *
 * @class PortFeedback
 * @extends Feedback
 * @param {Port} fbItem The Port item this feedback is based on.
 * @param {View} fbView The View used to represent this feedback.
 * @param {Port} orgItem The original Port model associated to this feedback.
 * @constructor
 */
class PortFeedback extends Feedback {
	init() {
		super.init();
	}
}

export default PortFeedback;
