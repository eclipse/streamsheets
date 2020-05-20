/* eslint-disable no-console */
const http = require('http');

const port = 8083;

const requestHandler = (request, response) => {
	response.end('Streams Service');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		console.error(error);
	} else {
		console.log(`Streams Service is listening on ${port}`);
	}
});
