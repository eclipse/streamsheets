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
// observes the child process which runs a machine task...

const logger = require('../utils/logger').create({
	name: 'MachineTaskObserver'
});

class MachineTaskObserver {
	constructor(runner) {
		this.runner = runner;
		this.channel = runner.channel;
		this.handleClose = this.handleClose.bind(this);
		this.handleDisconnect = this.handleDisconnect.bind(this);
		this.handleError = this.handleError.bind(this);
		this.handleExit = this.handleExit.bind(this);
		this.channel.on('close', this.handleClose);
		this.channel.on('disconnect', this.handleDisconnect);
		this.channel.on('error', this.handleError);
		this.channel.on('exit', this.handleExit);
	}
	dispose() {
		this.channel.off('close', this.handleClose);
		this.channel.off('disconnect', this.handleDisconnect);
		this.channel.off('error', this.handleError);
		this.channel.off('exit', this.handleExit);
	}

	handleClose(code, signal) {
		// eslint-disable-next-line
		logger.info(
			`machine "${this.runner.name}(${
				this.runner.id
			}" closes with exit-code: ${code} and signal: ${signal}`
		);
		this.stopTask();
	}
	handleDisconnect() {
		logger.info(
			`machine "${this.runner.name}(${this.runner.id}" disconnects!`
		);
		this.stopTask();
	}
	handleError(err) {
		logger.info(
			`machine "${this.runner.name}(${this.runner.id}" has error: ${
				err.message
			}`
		);
		logger.error(err);
		this.stopTask();
	}
	handleExit(code, signal) {
		// eslint-disable-next-line
		logger.info(
			`machine "${this.runner.name}(${
				this.runner.id
			}" exits with exit-code: ${code} and signal: ${signal}`
		);
		this.stopTask();
	}
	stopTask() {
		this.channel.setActive(false);
		this.runner.dispose();
	}
}

module.exports = MachineTaskObserver;
