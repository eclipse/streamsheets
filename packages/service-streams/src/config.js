const { requireFile } = require('@cedalo/commons');
const CONFIG = require('../config');

const customConfig = () => (process.env.CONFIG && requireFile(process.env.CONFIG)) || {};

module.exports = Object.freeze({ ...CONFIG, ...customConfig() });
