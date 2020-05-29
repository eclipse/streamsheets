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
const { convert, functions: { pipe } } = require('@cedalo/commons');

const createRegEx = (searchstr, flags) => {
	searchstr = searchstr.replace(/(\(|\)|\[|\])/g, '\\$1');
	searchstr = searchstr.replace(/\*/g, '.*');
	searchstr = searchstr.replace(/~.(?=\*)/g, '\\');
	searchstr = searchstr.replace(/~(?=\*|\?)/g, '\\');
	searchstr = searchstr.replace(/(?<!\\)\?/g, '.');
	searchstr = searchstr.replace(/~~/g, '~');
	return new RegExp(`^${searchstr}$`, flags);
};

const compare = (fn) => pipe(convert.toNumber, (nr) => nr != null && fn(nr));

const greater = (pivot) => compare((nr) => nr > pivot);
const greaterThan = (pivot) => compare((nr) => nr >= pivot);
const less = (pivot) => compare((nr) => nr < pivot);
const lessThan = (pivot) => compare((nr) => nr <= pivot);

const match = (pivot) => {
	const regex = createRegEx(pivot, 'i');
	return (val) => regex.test(val);
};
const noMatch = (pivot) => {
	const _match = match(pivot);
	return (val) => !_match(val);
};

// THINK: if criterion string should behave as formula/expression using SheetParser maybe better!!
const criteria = new Map([
	['!=', noMatch],
	['<>', noMatch],
	['=', match],
	['==', match],
	['>', greater],
	['>=', greaterThan],
	['<', less],
	['<=', lessThan]
]);

const getCriterion = (str) => {
	let cutIndex = 2;
	let criterion = criteria.get(str.substring(0, cutIndex));
	cutIndex = criterion ? cutIndex : 1;
	criterion = criteria.get(str.substring(0, cutIndex));
	return criterion && str ? criterion(str.substring(cutIndex).trim()) : undefined;
};

// to use excel like criterion strings
class Criterion {
	static of(str) {
		return Criterion.ofComparison(str) || Criterion.ofMatch(str);
	}
	static ofMatch(str) {
		const criterion = str != null ? match(str.trim()) : undefined;
		return criterion ? new Criterion(criterion) : undefined;
	}
	static ofComparison(str) {
		const criterion = str != null ? getCriterion(str.trim()) : undefined;
		return criterion ? new Criterion(criterion) : undefined;
	}

	constructor(criterion) {
		this._criterion = criterion;
	}

	isFulFilledBy(val) {
		return this._criterion(val);
	}
}

module.exports = Criterion;
