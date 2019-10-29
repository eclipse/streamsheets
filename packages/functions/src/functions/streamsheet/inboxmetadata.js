const inboxread = require('../../utils/inboxread');

const METADATA = '[metadata]';
const inboxmetadata = (sheet, ...terms) => inboxread(METADATA, sheet, ...terms);


module.exports = inboxmetadata;
