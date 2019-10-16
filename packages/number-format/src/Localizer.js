const days = require('./language/daysofweek');
const months = require('./language/months');
const separators = require('./language/separators');

module.exports = class Localizer {
	static init(culture) {
		Localizer._culture = culture;
	}

	static getDefaultCulture() {
		return 'en';
	}

	static getCulture() {
		if (Localizer._culture) {
			return Localizer._culture;
		}
		return this.getDefaultCulture();
	}

	static getDaysOfWeekShort() {
		const culture = this.getCulture();
		const daysOfWeekShort = days.getDaysOfWeekShort(culture);
		return daysOfWeekShort;
	}

	static getDaysOfWeekLong() {
		const culture = this.getCulture();
		const daysOfWeekLong = days.getDaysOfWeekLong(culture);
		return daysOfWeekLong;
	}

	static getDaysOfWeek() {
		const daysOfWeekShort = this.getDaysOfWeekShort();
		const daysOfWeekLong = this.getDaysOfWeekLong();
		const daysOfWeek = [];
		for (let i = 0; i < 7; i += 1) {
			const temp = [];
			temp.push(daysOfWeekShort[i], daysOfWeekLong[i]);
			daysOfWeek.push(temp);
		}
		return daysOfWeek;
	}

	static getMonthsOfYearShort() {
		const culture = this.getCulture();
		const monthsOfYearShort = months.getMonthsOfYearShort(culture);
		return monthsOfYearShort;
	}

	static getMonthsOfYearLong() {
		const culture = this.getCulture();
		const monthsOfYearLong = months.getMonthsOfYearLong(culture);
		return monthsOfYearLong;
	}

	static getMonthsOfYear() {
		const monthsOfYearShort = this.getMonthsOfYearShort();
		const monthsOfYearLong = this.getMonthsOfYearLong();
		const monthsOfYear = [];
		for (let i = 0; i < 12; i += 1) {
			const temp = [];
			temp.push(monthsOfYearShort[i].charAt(0), monthsOfYearShort[i], monthsOfYearLong[i]);
			monthsOfYear.push(temp);
		}
		return monthsOfYear;
	}

	static getDecimalSeparator() {
		const culture = this.getCulture();
		const decimalSeparator = separators.getDecimalSeparator(culture);
		return decimalSeparator;
	}

	static getThousandSeparator() {
		const culture = this.getCulture();
		const thousandSeparator = separators.getThousandSeparator(culture);
		return thousandSeparator;
	}

	static getLocalizedNumber(number) {
		const decimalSeparator = this.getDecimalSeparator();
		const thousandSeparator = this.getThousandSeparator();
		return this.prepareLocalizedNumber(number, decimalSeparator, thousandSeparator);
	}

	static prepareLocalizedNumber(number, newDecimalSeparator, newThousandSeparator) {
		let numberDiffDecimalSep = number.replace(/\./g, ';');
		numberDiffDecimalSep = numberDiffDecimalSep.replace(/,/g, newThousandSeparator);
		return numberDiffDecimalSep.replace(/;/g, newDecimalSeparator);
	}
};
