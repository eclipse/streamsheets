# streamsheet-connection

This module defines web-components to connect and subscribe to one or more [stream-machines][streammachine].

### Prerequisites
## Installing
## Quick start
## Web-Components
Following web-components are currently defined by this module:
| tag | description |
| --- | --- |
| streamsheet-connection | connect to a streamsheets gateway |
| streamsheet-subscribe | subscribe to a stream-machine |
| streamsheet-login | (**WIP**) user, password and token handling for gateway login |

## API
### streamsheet-connection
The `<streamsheet-connection>` element supports following attributes:
| attribute | description |
| --- | --- |
| id | to identify and reference this connection |
| resturl | URL provided by gateway for rest requests |
| socketurl | URL provided by gateway for web-socket communication |
| user | (*optional*) user name for gateway login (will be replaced by **<streamsheet-login**>) |
| token | (*optional*) a jwt-token for gateway login (will be replaced by **<streamsheet-login**>) |
| password | (*optional*) user password for gateway login (will be replaced by **<streamsheet-login**>) |


### streamsheet-subscribe
The `<streamsheet-subscribe>` element supports following attributes:
| attribute | description |
| --- | --- |
| machines | a comma separated list of [stream-machine][streammachine] IDs to subscribe to |
| connection | (*optional*) ID of [streamsheet-connection](#streamsheet-connection) to use. Not necessary if this element is nested within streamsheet-connection (see [Usage](#Usage)) |
| syncsteps | (*optional*) specifies if machine steps should be sinced over all subscribed machines, i.e. one confirm message after all machine steps are handled, in contrast to confirm each step per machine. Default is **false**. |

### streamsheet-login
Currently under (heavy) development. Therefore no stable attributes available yet.

## Usage
### Connecting to an existing streamsheets gateway
``` html
<streamsheet-connection id="conn1" resturl="http://host:8080/api/rest" socketurl="ws://host:8080/socket">
</streamsheet-connection>
<!-- multiple connections to same or different gateways are allowed -->
<streamsheet-connection id="conn2" resturl="http://host:8080/api/rest" socketurl="ws://host:8080/socket">
</streamsheet-connection>
```
Passing user and password to connection:
``` html
<streamsheet-connection id="conn3" resturl="http://host:8080/api/rest" socketurl="ws://host:8080/socket" user="test" password="secret">
</streamsheet-connection>
```

### Subscribing to a specific machine
Assuming that a stream-machine with id `machine1` and a streamsheet-connection with id 'conn1' were defined already:
``` html
<streamsheet-subscribe machines="m1" connection="conn1"></streamsheet-subscribe>
```
If nested inside streamsheet-connection only machine id is required:
``` html
<streamsheet-connection id="conn1" resturl="http://host:8080/api/rest" socketurl="ws://host:8080/socket">
	<streamsheet-subscribe machines="m1"></streamsheet-subscribe>
</streamsheet-connection>
```
### Subscribing to multiples machines
To subscribe to multiple machines simply specify their IDs in a comma separated list (note that attribute `syncsteps` 
is set to `true`):
``` html
<streamsheet-connection id="conn1" resturl="http://host:8080/api/rest" socketurl="ws://host:8080/socket">
	<streamsheet-subscribe machines="m1, m2, m3" syncsteps="true"></streamsheet-subscribe>
</streamsheet-connection>
```
### Login
**TBD**
``` html
<!-- not available yet -->
<streamsheet-login id="login">
</streamsheet-login>
```

### Error handling
In case of an error a `CustomEvent` of type `error` is dispatched. It contains the actual error object in its `detail`
property. To get notified about those events it is required to register an error handler to the corresponding element:
``` js
// handle connection errors:
const conn1 = document.getElementById("conn1");
conn1.addEventListener('error', (ev) => handleConnectionError(ev.detail));
// handle subscribe errors:
const sub1 = document.getElementById("sub1");
sub1.addEventListener('error', (ev) => handleSubscribeError(ev.detail));
```
Errors on login are best handled like stated below:
``` js
const login = document.getElementById("login");
login
	.whenReady()
	.then(() => { /* handle login success */ })
	.catch(err => { /* handle login failure */ });
```



## Run Tests
All tests are written with [`jest`][jest]. They can be run with npm.
```bash
npm test
```


## Authors
* [**Cedalo AG**][cedalo]


## License
This project is licensed under the Eclipse Public License - see the [LICENSE][license] file for details.


[cedalo]: https://cedalo.com
[jest]: https://jestjs.io
[license]: ../../../LICENSE
[streammachine]: https://github.com/cedalo/streamsheets/packages/webcomponent/streammachine#readme
[streammachine]: https://github.com/cedalo/streamsheets/packages/webcomponent/streammachine#readme