const StreamManager = require('../managers/StreamManager');

// deprecated!!
class MachineTaskStreams {
	constructor(channel) {
		this.channel = channel;
		this.onStreamChanged = this.onStreamChanged.bind(this);
		this.onStreamDeleted = this.onStreamDeleted.bind(this);
		StreamManager.on('streamChanged', this.onStreamChanged);
		StreamManager.on('streamDeleted', this.onStreamDeleted);
	}

	dispose() {
		StreamManager.off('streamChanged', this.onStreamChanged);
		StreamManager.off('streamDeleted', this.onStreamDeleted);
	}

	onStreamChanged(descriptor) {
		this.channel.send({ request: 'streamChanged', descriptor });
	}
	onStreamDeleted(descriptor) {
		this.channel.send({ request: 'streamDeleted', descriptor });
	}
}

module.exports = MachineTaskStreams;
