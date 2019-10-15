# demo

A simple web-component demo to show case and ease development of Cedalo web-components.

## Installing
To install the demo app simply run following command in its root directory:
```bash
$ npm install
```

## Run demo
After installation run demo with
```bash
$ npm start
```
This will start a development server which listens on port 3010.  
Now point your browser to: `http//:localhost:3010`

## Web-Components used
* [stream-machine][streammachine] - to display a stream-machine
* [streamsheet-connection][streamsheetconnection] - to connect to one or more stream-machine(s)
* [streamsheet-subscribe][streamsheetconnection] - to subscribe to one or more stream-machine(s) to handle its messages


## Authors
* [**Cedalo AG**][cedalo]


## License
This project is licensed under the Eclipse Public License - see the [LICENSE][license] file for details.


[cedalo]: https://cedalo.com
[jest]: https://jestjs.io
[license]: ../../../LICENSE
[streammachine]: https://github.com/cedalo/streamsheets/packages/webcomponent/streammachine#readme
[streamsheetconnection]: https://github.com/cedalo/streamsheets/packages/webcomponent/streamsheet-connection#readme
