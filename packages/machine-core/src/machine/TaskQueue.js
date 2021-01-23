/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const createQueue = () => {
	const fns = [];
	const pending = [];
	const notify = () => {
		if (fns.length < 1) {
			// console.log('RESOLVE TASK QUEUE: ', pending.length);
			pending.forEach((resolve) => resolve());
			pending.length = 0;
		}
	};
	const nextTick = () => {
		process.nextTick(() => {
			const entry = fns[0];
			if (entry) {
				const { fn, args = [] } = entry;
				fns.splice(0, 1);
				try {
					fn(...args);
				} catch (err) {
					/* currently ignore */
				}
			}
			notify();
		});
	};

	return {
		// not actually required...
		reset() {
			fns.length = 0;
			pending.length = 0;
		},
		schedule(fn, ...args) {
			fns.push({ fn, args });
			nextTick();
		},
		done() {
			// console.log('PENDING FUNCTIONS ',fns.length);
			if (fns.length) {
				return new Promise((resolve /* , reject */) => pending.push(resolve));
			}
			return Promise.resolve();
		}
	};
};
// const TaskQueue = createQueue();
module.exports = createQueue();
