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
	const stats = { steps: 0 };
	const monitor = (evtype) => {
		monitor.updateSteps(evtype);
		monitor.onStep(evtype);
	};
	monitor.onStep = () => {};
	// monitor.updateSteps = (evtype) => { if(evtype === 'step') stats.steps = machine.stats.steps; };
	monitor.updateSteps = () => { stats.steps = machine.stats.steps; };
	// do not care that callback is never unregistered
	machine.on('finishedStep', monitor);

	return {
		hasFinishedStep: (step) => {
			return new Promise((resolve) => {
				if (stats.steps >= step) resolve();
				monitor.onStep = () => (stats.steps >= step ? resolve() : null);
			});
		}
	};
};

const monitorStreamSheet = (streamsheet) => {
	const stats = { steps: 0, repeatsteps: 0, finishedsteps: 0 };
	const messages = { attached: 0, detached: 0 };

	const finishedStepsMonitor = () => {
		finishedStepsMonitor.updateFinishedSteps();
		finishedStepsMonitor.onFinishedStep();
	};
	finishedStepsMonitor.onFinishedStep = () => {};
	finishedStepsMonitor.updateFinishedSteps = () => { stats.finishedsteps += 1; };

	const stepsMonitor = () => {
		stepsMonitor.updateStats();
		stepsMonitor.onStep();
	};
	stepsMonitor.onStep = () => {};
	stepsMonitor.updateStats = () => {
		stats.steps = streamsheet.stats.steps;
		stats.repeatsteps = streamsheet.stats.repeatsteps;
	};

	// do not care that callback is never unregistered
	streamsheet.on('step', stepsMonitor);
	streamsheet.on('finishedStep', finishedStepsMonitor);
	streamsheet.on('message_attached', () => { messages.attached += 1; });
	streamsheet.on('message_detached', () => { messages.detached += 1; });

	return {
		stats,
		messages,
		reset: () => {
			stats.steps = 0;
			stats.repeatsteps = 0;
			stats.finishedsteps = 0;
		},
		hasFinishedStep: (step) => {
			return new Promise((resolve) => {
				if (stats.finishedsteps >= step) resolve();
				finishedStepsMonitor.onFinishedStep = () => {
					if (stats.finishedsteps >= step) {
						resolve();
					}
				}
			});
		},
		hasPassedRepeatStep: (step) => {
			return new Promise((resolve) => {
				if (stats.repeatsteps >= step) resolve();
				stepsMonitor.onStep = () => (streamsheet.stats.repeatsteps >= step ? resolve() : null);
			});
		}
	};
};

module.exports = {
	monitorMachine,
	monitorStreamSheet
};
