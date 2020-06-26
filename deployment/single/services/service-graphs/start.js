/* eslint-disable no-console */
const http = require('http');

const port = 8090;

const requestHandler = (request, response) => {
	response.end('Graph Service');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		console.error(error);
	} else {
		console.log(`Graph Service is listening on ${port}`);
	}
});
