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
	const stats = { steps: 0, repeatsteps: 0 };
	const messages = { attached: 0, detached: 0 };
	const processedStepsMonitor = () => processedStepsMonitor.onProcessedStep();
	const stepsMonitor = () => {
		stepsMonitor.updateStats();
		stepsMonitor.onStep();
	}

	stepsMonitor.updateStats = () => {
		stats.steps = streamsheet.stats.steps;
		stats.repeatsteps = streamsheet.stats.repeatsteps;
	};
	stepsMonitor.onStep = () => {};
	processedStepsMonitor.onProcessedStep = () => {};

	// do not care that callback is never unregistered
	streamsheet.on('step', stepsMonitor);
	// streamsheet.on('willStep', willStepsMonitor);
	streamsheet.on('message_attached', () => { messages.attached += 1; });
	streamsheet.on('message_detached', () => { 
		messages.detached += 1; 
	});

	return {
		stats,
		messages,
		// isAtStep: (step) => {
		hasPassedStep: (step) => {
			return new Promise((resolve) => {
				if (stats.steps >= step) resolve();
				stepsMonitor.onStep = () => (streamsheet.stats.steps >= step ? resolve() : null);
			});
		},
		// DOES NOT WORK!!!
		hasProcessedStep: (step) => {
			return new Promise((resolve) => {
				if (streamsheet.stats.steps >= step) resolve();
				processedStepsMonitor.onProcessedStep = () => (streamsheet.stats.steps >= step ? resolve() : null);
			});
		},
		hasPassedRepeatStep: (step) => {
			return new Promise((resolve) => {
				if (stats.repeatsteps >= step) resolve();
				stepsMonitor.onStep = () => (streamsheet.stats.repeatsteps >= step ? resolve() : null);
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
