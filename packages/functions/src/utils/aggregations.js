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
const { isType } = require('@cedalo/machine-core');

const isNumber = (value) => isType.number(value);
const isNonZero = (value) => isType.number(value) && !!value;

const none = () => (value) => value;
const avg = () => {
	let sum = 0;
	let count = 0;
	return (value) => {
		if (isType.number(value)) {
			sum += value;
			count += 1;
		}
		return count > 0 ? sum / count : 0;
	};
};
const count = (predicate) => () => {
	let total = 0;
	return (value) => {
		total += predicate(value) ? 1 : 0;
		return total;
	};
};

const max = () => {
	// let maxval;
	let maxval = Number.MIN_SAFE_INTEGER;
	return (value) => {
		if (isType.number(value)) maxval = maxval != null ? Math.max(value, maxval) : value;
		// return maxval != null ? maxval : 0;
		return maxval;
	};
};
const min = () => {
	// let minval;
	let minval = Number.MAX_SAFE_INTEGER;
	return (value) => {
		if (isType.number(value)) minval = minval != null ? Math.min(value, minval) : value;
		// return minval != null ? minval : 0;
		return minval;
	};
};
const product = () => {
	let total = 1;
	return (value) => {
		if (isType.number(value)) total *= value;
		return total;
	};
};
const stdev = () => {
	let n = 0;
	let q1 = 0;
	let q2 = 0;
	let sq = 0;
	let derivation = 0;
	return (value) => {
		if (isType.number(value)) {
			n += 1;
			q1 += value;
			q2 += value ** 2;
			sq = q2 - q1 ** 2 / n;
			derivation = n > 1 ? Math.sqrt(Math.abs(sq / (n - 1))) : 0;
		}
		return derivation;
	};
};

const sum = () => {
	let total = 0;
	return (value) => {
		if (isType.number(value)) total += value;
		return total;
	};
};

const BY_NAME = {
	'none': none,
	'avg': avg,
	'count': count(isNumber),
	'counta': count(isNonZero),
	'max': max,
	'min': min,
	'product': product,
	'stdevs': stdev,
	'sum': sum
};
const BY_NUMBER = [none, avg, count(isNumber), count(isNonZero), max, min, product, stdev, undefined, sum];

const getMethodFactory = (nameOrNr) => isType.number(nameOrNr) ? BY_NUMBER[nameOrNr] : BY_NAME[nameOrNr];

const createMethod = (nameOrNr) => {
	const methodFab = getMethodFactory(nameOrNr);
	return methodFab ? methodFab() : undefined;
};
const hasMethod = (nameOrNr) => !!getMethodFactory(nameOrNr);

module.exports = {
	createMethod,
	getMethodFactory,
	hasMethod
};
