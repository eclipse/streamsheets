# gateway-client

Client for accessing the gateway. It provides a set of several smaller APIs for managing different components of the Digital Landscape via the gateway component.

## Environment variables

* `GATEWAY_SOCKET_ENDPOINT`: Endpoint for the Web Socket communication.
* `GATEWAY_REST_ENDPOINT`: Endpoint for the REST via HTTP communication.
* `GATEWAY_JWT_TOKEN`: : JWT Token.

## Quick start

```
const client = new GatewayClient();
client.connect()
  .then(() => client.waitUntilAllServersAreConnected())
  .then(() => client.loadMachine('123456')
  .then((response) => {
    const machine = response.machineserver.machine;
    const graph = response.graphserver.graph;
  });
```

## API

The gateway client API is a set of several smaller APIs for managing different components of the Digital Landscape via the gateway component.

### Machine Definition API

API for managing the machine definitions in the repository. Internally this API uses the HTTP API provided by the gateway.

### Machine API

API for managing the machines on the machine server. Internally this API uses the HTTP Web Socket API provided by the gateway.

### Graph Definition API

API for managing the graph definitions in the repository. Internally this API uses gateway HTTP API provided by the gateway.

### Graph API

API for managing the graphs on the graph server. Internally this API uses the HTTP Web Socket API provided by the gateway.

### Administration API

API for managing adapters, streams and queues in the repository. Internally this API uses gateway HTTP API provided by the gateway.

### Low Level API

API for sending custom requests to the gateway.
