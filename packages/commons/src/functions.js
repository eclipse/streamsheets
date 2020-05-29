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
const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);
const compose = (...fns) => (val) => fns.reduceRight((res, fn) => fn(res), val);

module.exports = {
	compose,
	pipe
};
