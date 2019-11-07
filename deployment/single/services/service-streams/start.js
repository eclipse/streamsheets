const http = require('http');
const port = 8083;

const requestHandler = (request, response) => {
	response.end('Streams Service');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		return console.error(error);
	}
	console.log(`Streams Service is listening on ${port}`);
});
