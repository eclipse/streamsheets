const inboxread = require('./inboxread');

const DATA = '[data]';

const inboxdata = (sheet, ...terms) => inboxread(DATA, sheet, ...terms);


module.exports = inboxdata;
