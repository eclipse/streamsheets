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
