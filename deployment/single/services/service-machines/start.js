const http = require('http');
const port = 8091;

const requestHandler = (request, response) => {
	response.end('Machine Service');
};

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
	if (error) {
		return console.error(error);
	}
	console.log(`Machine Service is listening on ${port}`);
});
