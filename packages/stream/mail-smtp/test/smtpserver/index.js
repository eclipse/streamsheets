const { run } = require('./server');

// eslint-disable-next-line no-console
run((msg) => { console.log(JSON.stringify(msg, null, 2)); });
