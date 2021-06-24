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
const RequestHandler = require('../messaging/RequestHandler');


const IPC_TIMEOUT = parseInt(process.env.IPC_TIMEOUT, 10) || 5 * 60 * 1000;

const DEF_OPTS = {
	timeout: IPC_TIMEOUT
};

class ChannelRequestHandler {
	// channel or task
	constructor(channel, options) {
		this.channel = channel;
		this.pending = new Map();
		this.options = Object.assign({}, DEF_OPTS, options);
		this.reqhandler = new RequestHandler(channel);
	}

	dispose() {
		this.reqhandler.dispose();
	}

	publish(msg) {
		if (msg) this.channel.send(msg);
	}

	// send a request to task: resolves with respond from task or rejects in case of error
	request(reqmsg = {}, timeout = this.options.timeout) {
		return this.reqhandler.request(reqmsg, timeout, () => {
			this.channel.send(reqmsg);
		});
	}
}

module.exports = ChannelRequestHandler;
