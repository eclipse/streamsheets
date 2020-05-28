/* eslint-disable no-console */
const http = require('http');

const port = 9000;

const requestHandler = (request, response) => {
	response.end('Web UI');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		console.error(error);
	} else {
		console.log(`Web UI is listening on ${port}`);
	}
});
