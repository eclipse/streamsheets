const cp1252 = require('./cp1252');
const roman = require('./roman_mac');
const UniCodeMapper = require('./UniCodeMapper');

const mapper = {
	'cp1252': UniCodeMapper.of(cp1252),
	'roman': UniCodeMapper.of(roman),
};

// 
const getCodePage = (str) => {
	switch (str) {
		case 'ansi':
		case 'cp1252':
			return mapper.cp1252;
		case 'mac':
		case 'roman':
			return mapper.roman;
		default:
			return undefined;
	}
};

module.exports = {
	getCodePage
}