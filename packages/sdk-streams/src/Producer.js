const { EVENTS } = require('./Constants');
const Connector = require('./Connector');
const ProducerMixin = require('./ProducerMixin');

const Producer = ProducerMixin(Connector);
Producer.EVENTS = {
	...EVENTS.CONNECTOR,
	...EVENTS.PRODUCER
};

module.exports = Producer;
