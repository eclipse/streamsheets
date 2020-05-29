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
const { runFunction, sheet: { getMachine } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const reachedEnd = (value, end, step) => (step < 0 ? value < end : value > end);

const counter = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg(start => convert.toNumber(start.value, ERROR.ARGS))
		.mapNextArg(step => convert.toNumber(step.value, ERROR.ARGS))
		.mapNextArg(end => end ? convert.toNumber(end.value) : null)
		.mapNextArg(reset => reset ? convert.toBoolean(reset.value, false) : false)
		.run((start, step, end, reset) => {
			let value;
			const currval = counter.term._currvalue;
			if (!reset && currval != null) {
				const nextValue = currval + step;
				// eslint-disable-next-line no-nested-ternary
				value = end == null ? nextValue : (reachedEnd(nextValue, end, step) ? currval : nextValue);
			}
			value = (reset || currval == null) ? start : value;
			counter.term._currvalue = value;
			return value;
		});

const getcycle = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.run((streamsheet) => streamsheet.stats.repeatsteps);

const getcycletime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.run(machine => machine.cycletime);
	
// return steps triggered on execute()
const repeatindex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.run((streamsheet) => streamsheet.stats.executesteps);

// machine steps
const getmachinestep = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(0)
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.run((machine) => machine.stats.steps);

// streamsheet steps
const getstep = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.run((streamsheet) => streamsheet.stats.steps);

const getmachinestepspersecond = (sheet, ...terms) =>
runFunction(sheet, terms)
	.withArgCount(0)
	.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
	.run((machine) => machine.stats.cyclesPerSecond);


module.exports = {
	COUNTER: counter,
	GETCYCLE: getcycle,
	GETCYCLETIME: getcycletime,
	GETEXECUTESTEP: repeatindex,
	GETMACHINESTEP: getmachinestep,
	GETMACHINESTEPSPERSECOND: getmachinestepspersecond,
	GETSTEP: getstep,
	REPEATINDEX: repeatindex
};
