const http = require('http');
const port = 8082;

const requestHandler = (request, response) => {
	response.end('Gateway');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		return console.error(error);
	}
	console.log(`Gateway is listening on ${port}`);
});
