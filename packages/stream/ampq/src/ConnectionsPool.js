const amqplib = require('amqplib');

const connectionsMap = new Map();

const createConnection = async (url, socketOptions = {}) => {
	const id = `${url}`;
	if(connectionsMap.has(id)) {
		return connectionsMap.get(id);
	}
		const connection = await amqplib.connect(url, socketOptions);
		connectionsMap.set(id, connection);
		return connection;

}

const dropConnection = (url) => {
	const connection = connectionsMap.get(url);
	if(connection) {
		return connection.close();
	}
	return true;
}

module.exports = {
	createConnection,
	dropConnection
}
