const { run } = require('./server');

run((msg) => { console.log(JSON.stringify(msg, null, 2)); });
