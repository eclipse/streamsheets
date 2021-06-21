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
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const remove = (index, arr) => arr.splice(index, 1)[0];

class ErrorHandler {
	constructor() {
		this._error = undefined;
		this._errorIndex = undefined;
		this._ignoreError = false;
	}

	set ignoreError(doIt) {
		this._ignoreError = doIt;
	}

	getError() {
		let error;
		if (!this._ignoreError && this._error) {
			error = this._error.isErrorInfo ? this._error : ErrorInfo.create(this._error);
			if (this._errorIndex != null) error = error.setParamIndex(this._errorIndex + 1);
		}
		return error;
	}

	hasError() {
		return this._error && !this._ignoreError;
	}

	update(res, index) {
		if (res && !this._error) {
			this._error = FunctionErrors.isError(res);
			this._errorIndex = index;
		}
		return this._error != null;
	}
}
class Runner {
	constructor(sheet, args) {
		this.sheet = sheet;
		// this.cell = fn && fn.term && fn.term.cell;
		// this.fnName = fn && fn.term && fn.term.name;
		// this.setFunctionName = setFunctionName(fn);
		// work on copy or not???
		this.args = args ? args.slice(0) : [];
		this.index = 0;
		this.prevArg = undefined;
		this.isEnabled = true;
		this.defReturnValue = true;
		this.mappedArgs = [];
		this.errorHandler = new ErrorHandler();
		this.errorHandler.update(FunctionErrors.ifNot(sheet, ERROR.ARGS));
	}

	ignoreError() {
		this.errorHandler.ignoreError = true;
		return this;
	}

	onSheetCalculation() {
		this.isEnabled = !this.errorHandler.hasError() && this.sheet.isProcessing;
		return this;
	}

	withArgCount(nr) {
		this.errorHandler.update(FunctionErrors.ifTrue(this.args.length !== nr, ERROR.ARGS));
		return this;
	}

	withMinArgs(min) {
		this.errorHandler.update(FunctionErrors.ifTrue(this.args.length < min, ERROR.ARGS));
		return this;
	}

	withMaxArgs(max) {
		this.errorHandler.update(FunctionErrors.ifTrue(this.args.length > max, ERROR.ARGS));
		return this;
	}

	// adds additional value which is passed to run(), eg: addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
	addMappedArg(fn) { // REVIEW!
		if (!this.errorHandler.hasError()) {
			const res = fn(...this.mappedArgs);
			this.errorHandler.update(res);
			this.mappedArgs.push(res);
		}
		return this;
	}

	mapNextArg(fn) {
		if (!this.errorHandler.hasError()) {
			const term = this.args.shift();
			// TODO: improve callback: pass (term.value, termIndex, ...mappedArgs?) 
			// 	=> to check for error in term.value before trigger callback!!
			const res = fn(term, ...this.mappedArgs);
			this.errorHandler.update(res, this.index);
			this.mappedArgs.push(res);
			this.index += 1;
			this.prevArg = term;
		}
		return this;
	}

	// review: actually not necessary since it can be done on mapNextArg()!
	remapPrevArg(fn) {
		if (!this.errorHandler.hasError()) {
			const term = this.prevArg;
			if (term) {
				const idx = this.index - 1;
				const lastRes = this.mappedArgs.pop();
				const res = fn(term, lastRes, ...this.mappedArgs);
				this.errorHandler.update(res, idx);
				this.mappedArgs.push(res);
			}
		}
		return this;
	}
	// under review:
	mapArgAt(idx, fn) {
		if (!this.errorHandler.hasError()) {
			const term = remove(idx, this.args);
			const res = fn(term, ...this.mappedArgs);
			this.errorHandler.update(res, idx);
			this.mappedArgs.push(res);
			this.index = idx;
		}
		return this;
	}
	mapRemaingingArgs(fn) {
		if (!this.errorHandler.hasError()) {
			const res = fn(this.args, ...this.mappedArgs);
			this.errorHandler.update(res);
			this.mappedArgs.push(res);
		}
		return this;
	}

	reduce(fn) {
		if (!this.errorHandler.hasError()) {
			const res = fn(...this.mappedArgs);
			this.errorHandler.update(res);
			this.mappedArgs = res;
		}
		return this;
	}

	// remove! better use beforeRun()
	validate(fn) {
		if (!this.errorHandler.hasError()) {
			this.errorHandler.update(fn(...this.mappedArgs));
		}
		return this;
	}
	// under review: name alternatives: apply, prepare, invoke, beforeRun
	beforeRun(fn) {
		if (!this.errorHandler.hasError()) {
			this.errorHandler.update(fn(...this.mappedArgs));
		}
		return this;
	}

	// tmp. => review and maybe combine with onSheetCalculation
	defaultReturnValue(fn) {
		this.defReturnValue = fn(...this.mappedArgs);
		this.defReturnValue = this.defReturnValue != null ? this.defReturnValue : true;
		return this;
	}

	run(fn) {
		const error = this.errorHandler.getError();
		if (error) {
			return error;
		}
		if (this.isEnabled) {
			const res = fn(...this.mappedArgs);
			if (FunctionErrors.isError(res)) {
				return res.isErrorInfo ? res : ErrorInfo.create(res);
			}
			return res;
		}
		return this.defReturnValue;
	}
}


module.exports = (sheet, terms, fn) => new Runner(sheet, terms, fn);
