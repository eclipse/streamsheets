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
const { convert, serialnumber: { ms2serial, serial2ms } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const { runFunction } = require('../../utils');

const ERROR = FunctionErrors.code;

const term2ms = (term) => {
	const value = convert.toNumber(term.value);
	return (value != null && value > -1) ? serial2ms(value) : -1;
};

const setCell = (target, valueTerm) => {
	const toOp = target.operand;
	const cp = new Cell();
	cp.term = valueTerm;
	toOp.sheet._doSetCellAt(toOp.index, cp);
};

// we assume changedAtTerm is only set by ourselves and only on change!
const signalChange = (period, delay, changedAtTerm) => {
	let doIt = false;
	const changedAt = term2ms(changedAtTerm);
	if (changedAt > -1) {
		const current = Date.now() - changedAt - delay;
		doIt = current >= 0 && (period < 1 || current <= period);
		// reset saved time if delay is reached and period is over...
		if (doIt && (period < 1 || current > period)) {
			setCell(changedAtTerm, Term.fromNumber(-1));
		}
	}
	return doIt;
};
// we assume term is only set by ourselves and only on change!
const signalIfChanged = (period, delay, term) => {
	let doIt = false;
	const changedAt = term.ms || -1;
	if (changedAt > -1) {
		const current = Date.now() - changedAt - delay;
		doIt = current >= 0 && (period < 1 || current <= period);
		// reset saved time if delay is reached and period is over...
		if (doIt && (period < 1 || current > period)) {
			term.ms = -1;
		}
	}
	return doIt;
};

/** @deprecated */
const detectchange = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(4)
		.withMaxArgs(5)
		.mapNextArg(newcond => convert.toBoolean(newcond.value, false))
		.mapNextArg(period => convert.toNumber(period.value, 0))
		.mapNextArg(condcell => (condcell.hasOperandOfType('CellReference') ? condcell : ERROR.INVALID_PARAM))
		.mapNextArg(timecell => (timecell.hasOperandOfType('CellReference') ? timecell : ERROR.INVALID_PARAM))
		.mapNextArg(delay => (delay != null ? convert.toNumber(delay.value, 0) : 0))
		.run((newcond, period, condcell, timecell, delay) => {
			const change = newcond && !convert.toBoolean(condcell.value, false);
			setCell(condcell, Term.fromBoolean(newcond));
			if (change) {
				setCell(timecell, Term.fromNumber(ms2serial(Date.now())));
			}
			return signalChange(period, delay, timecell);
		});

const edgeDetect = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((newcond) => convert.toBoolean(newcond.value, false))
		.mapNextArg((period) => (period != null ? convert.toNumber(period.value, 0) : 0))
		.mapNextArg((delay) => (delay != null ? convert.toNumber(delay.value, 0) : 0))
		.run((newcond, period, delay) => {
			const term = edgeDetect.term;
			const change = newcond && !term.lastcond;
			term.lastcond = newcond;
			if (change) term.ms = Date.now();
			return signalIfChanged(period, delay, term);
		});

module.exports = {
	/** @deprecated */
	DETECTCHANGE: detectchange,
	"EDGE.DETECT": edgeDetect
};
