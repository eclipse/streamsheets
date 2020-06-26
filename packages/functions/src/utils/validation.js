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
const { getMachine } = require('./sheet');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

class Chain {

	constructor(sheet, args) {
		this.sheet = sheet;
		this.args = args;
		this.error = null;
		this.context = {};
		this.mappedArgs = [];
	}

	withMachine() {
		if (!this.context.sheet) this.withSheet();
		if (!this.error) {
			const machine = getMachine(this.sheet);
			this.error = FunctionErrors.ifNot(machine, ERROR.NO_MACHINE);
			this.context.machine = machine;
		}
		return this;
	}

	withArgs(numberOfArgs, argMappings, vararg = false) {
		if (!this.error) {
			this.error = FunctionErrors.ifTrue(this.args.length < numberOfArgs, ERROR.ARGS);
			this.context.args = this.args;
			if (Array.isArray(argMappings)) {
				argMappings.forEach((name, index) => {
					if (!vararg || index < argMappings.length - 1) {
						this.context[name] = this.args[index];
					} else {
						this.context[name] = this.args.slice(index);
					}
				});
			}
		}
		return this;
	}

	withSheet() {
		if (!this.error) {
			this.context.sheet = this.sheet;
			this.error = FunctionErrors.ifNot(this.sheet, ERROR.ARGS);
		}
		return this;
	}

	with(f) {
		if (this.context.isProcessing === false || this.error) {
			return this;
		}
		const result = f(this.context, ...this.mappedArgs);
		this.error = FunctionErrors.isError(result);
		this.mappedArgs.push(result);
		return this;
	}

	check(f) {
		if (this.context.isProcessing === false || this.error) {
			return this;
		}
		const result = f(this.context, ...this.mappedArgs);
		this.error = FunctionErrors.isError(result);
		return this;
	}

	run(f) {
		if (this.context.isProcessing === false || this.error) {
			return this.error || true;
		}
		return f(this.context, ...this.mappedArgs);
	}

	isProcessing() {
		if (!this.context.sheet) this.withSheet();
		if (!this.error) {
			this.context.isProcessing = this.sheet.isProcessing;
		}
		return this;
	}

	withStream(at, errorToReturn, type) {
		if (!this.context.machine) this.withMachine();
		if (!this.context.args) this.withArgs(at + 1);
		if (!this.error) {
			const term = this.args[at];
			if(term && term.value && term.value.type === type) {
				if(term.value.state === 'connected'){
					this.context.streamId = term.value.id;
				} else {
					this.error = ERROR.DISCONNECTED;
				}
			} else {
				this.error = errorToReturn;
			}
		}
		return this;
	}

	withProducer(at = 0) {
		return this.withStream(at, ERROR.NO_PRODUCER, 'producer');
	}

	withConsumer(at = 0) {
		return this.withStream(at, ERROR.NO_CONSUMER, 'stream');
	}
}

const ensure = (sheet, args) => new Chain(sheet, args);

module.exports = { ensure };
