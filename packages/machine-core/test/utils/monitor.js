/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const monitorMachine = (machine) => {
	const stepMonitor = (evtype) => stepMonitor.onStep(evtype);
	const monitor = (steps, resolve) => (evtype) => {
		if (evtype === 'step') steps -= 1;
		if (steps <= 0) resolve();
	};
	stepMonitor.onStep = () => {};
	// do not care that callback is never unregistered
	machine.on('update', stepMonitor);
	return {
		hasPassedStep: (step) => {
			return new Promise((resolve) => {
				stepMonitor.onStep = () => {
					if (machine.stats.steps >= step) resolve();
				};
			});
		},
		nextSteps: (steps = 1) =>
			new Promise((resolve) => {
				stepMonitor.onStep = monitor(steps, resolve);
			})
	};
};

const monitorStreamSheet = (streamsheet) => {
	const messages = { attached: 0, detached: 0 };
	const stepMonitor = () => stepMonitor.onStep();

	stepMonitor.onStep = () => {};
	// do not care that callback is never unregistered
	streamsheet.on('step', stepMonitor);
	streamsheet.on('message_attached', () => { messages.attached += 1; });
	streamsheet.on('message_detached', () => { messages.detached += 1; });

	return {
		messages,
		// isAtStep: (step) => {
		hasPassedStep: (step) => {
			return new Promise((resolve) => {
				stepMonitor.onStep = () => {
					if (streamsheet.stats.steps >= step && !streamsheet.trigger._stepId) resolve();
				};
			});			
		},
		hasPassedRepeatStep: (step) => {
			return new Promise((resolve) => {
				stepMonitor.onStep = () => {
					if (streamsheet.stats.repeatsteps >= step) resolve();
				};
			});
		}
		// nextSteps: (steps = 1) => {
		// 	lastCycleSteps = streamsheet.stats.steps;
		// 	return new Promise((resolve) => {
		// 		stepMonitor.onStep = monitorCycle(steps, resolve);
		// 	});
		// },
		// nextRepeatSteps: (steps = 1) => {
		// 	lastRepeatSteps = streamsheet.stats.repeatsteps;
		// 	return new Promise((resolve) => {
		// 		stepMonitor.onStep = monitorRepeat(steps, resolve);
		// 	});
		// }
	};
};

module.exports = {
	monitorMachine,
	monitorStreamSheet
};
