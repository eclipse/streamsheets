const RequestHandler = require('../messaging/RequestHandler');


const DEF_OPTS = {
	timeout: 20000
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
