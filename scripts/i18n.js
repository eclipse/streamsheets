const fs = require('fs');
const argv = require('yargs').argv;

const pathEN = argv.en;
const pathDE = argv.de;

const keysEN = Object.keys(JSON.parse(fs.readFileSync(pathEN)));
const keysDE = Object.keys(JSON.parse(fs.readFileSync(pathDE)));

const keys = (keys1, keys2) => keys1.filter(key => !keys2.includes(key));

const keysNotIncludedInEN = keys(keysDE, keysEN);
const keysNotIncludedInDE = keys(keysEN, keysDE);

console.log('Keys not included in EN file:')
console.log(keysNotIncludedInEN);

console.log('Keys not included in DE file:')
console.log(keysNotIncludedInDE);
