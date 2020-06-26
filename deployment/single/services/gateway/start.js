/* eslint-disable no-console */
const http = require('http');

const port = 8082;

const requestHandler = (request, response) => {
	response.end('Gateway');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		console.error(error);
	} else {
		console.log(`Gateway is listening on ${port}`);
	}
});
