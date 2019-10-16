const ERRORS = {
	TIMEOUT_ERROR: 'TIMEOUT_ERROR',
	INVALID_CONFIG: 'ERROR_INVALID_CONFIG',
	FAILEDTOCONNECT: 'FAILEDTOCONNECT',
	FAILEDTOINITIALIZE: 'FAILEDTOINITIALIZE',
	FAILEDTOTEST: 'FAILEDTOTEST',
	FAILEDTOPROVIDE: 'FAILEDTOPROVIDE'
};

const STREAM_TYPES = {
	CONNECTOR: 'connector',
	PRODUCER: 'producer',
	CONSUMER: 'consumer'
};

const EVENTS = {
	CONNECTOR: {
		ERROR: 'connector_error',
		WARNING: 'connector_warning',
		READY: 'ready',
		OFFLINE: 'offline',
		CONNECT: 'connect',
		CLOSE: 'close',
		DISPOSED: 'dispose',
		TEST: 'test',
		UPDATE: 'update',
		FEEDBACK: 'feedback',
		PERSIST: 'persist'
	},
	CONSUMER: {
		MESSAGE: 'message',
		RESPOND: 'respond'
	},
	PRODUCER: {
		PRODUCE: 'produce',
		REQUEST: 'request'
	}
};

module.exports = {
	ERRORS,
	STREAM_TYPES,
	EVENTS
};
