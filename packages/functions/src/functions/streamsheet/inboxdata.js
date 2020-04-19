const inboxread = require('../../utils/inboxread');

const DATA = '[data]';

const inboxdata = (sheet, ...terms) => inboxread(DATA, sheet, ...terms);


module.exports = inboxdata;
