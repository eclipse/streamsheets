const { EVENTS } = require('./Constants');
const Connector = require('./Connector');
const ConsumerMixin = require('./ConsumerMixin');

const Consumer = ConsumerMixin(Connector);
Consumer.EVENTS = {
	...EVENTS.CONNECTOR,
	...EVENTS.CONSUMER
};

module.exports = Consumer;
