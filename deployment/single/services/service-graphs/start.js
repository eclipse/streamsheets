const http = require('http');
const port = 8090;

const requestHandler = (request, response) => {
	response.end('Graph Service');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		return console.error(error);
	}
	console.log(`Graph Service is listening on ${port}`);
});
