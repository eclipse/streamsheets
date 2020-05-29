/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import { NumberFormatter } from '@cedalo/number-format';

const templates = {
	en: {
		Date: [
			{ t: 'dd\\.mm\\.yyyy' },
			{ t: 'dd\\.mm\\.yy' },
			{ t: 'd\\.m\\.yy' },
			{ t: 'yyyy-mm-dd' },
			{ t: 'd mmmm yyyy' },
		],
		Time: [
			{ t: 'h:mm' },
			{ t: 'hh:mm' },
			{ t: 'h:mm:ss' },
			{ t: 'hh:mm:ss' },
			{ t: 'h:mm AM/PM' },
			{ t: 'h:mm:ss AM/PM' },
			{ t: 'h:mm:ss.000' },
			{ t: 'mm:ss.000' },
			{ t: 'ss.000' },
		],
		Fraction: [
			{ t: '# ?/?' },
			{ t: '# ??/??' },
			{ t: '# ???/???' },
			{ t: '# ?/2' },
			{ t: '# ?/4' },
			{ t: '# ?/8' },
			{ t: '# ?/16' },
			{ t: '# ?/10' },
			{ t: '# ?/100' },
		],
	},
	'us': {
		Date: [
			{ t: 'm\\.d' },
			{ t: 'm\\.d\\.yy' },
			{ t: 'mm\\.dd\\.yy' },
			{ t: 'd-mmm' },
			{ t: 'd-mmm-yy' },
			{ t: 'mmm-yy' },
			{ t: 'mmmm-yy' },
			{ t: 'mmmm dd, yyyy' },
			{ t: 'm\\.d\\.yy h:mm AM/PM' },
			{ t: 'm\\.d\\.yy h:mm' },
			{ t: 'm\\.d\\.yyyy h:mm' },
			{ t: 'mmmmm' },
			{ t: 'mmmmm-d' },
			{ t: 'm\\.d\\.yyyy' },
			{ t: 'mm-mmm-yyyy' },
		],
		Time: [
			{ t: 'h:mm' },
			{ t: 'hh:mm' },
			{ t: 'h:mm:ss' },
			{ t: 'hh:mm:ss' },
			{ t: 'h:mm AM/PM' },
			{ t: 'h:mm:ss AM/PM' },
			{ t: 'h:mm:ss.000' },
			{ t: 'mm:ss.000' },
			{ t: 'ss.000' },
		],
		Fraction: [
			{ t: '# ?/?' },
			{ t: '# ??/??' },
			{ t: '# ???/???' },
			{ t: '# ?/2' },
			{ t: '# ?/4' },
			{ t: '# ?/8' },
			{ t: '# ?/16' },
			{ t: '# ?/10' },
			{ t: '# ?/100' },
		],
	},
	de: {
		Date: [
			{ t: 'dd\\.mm\\.yy' },
			{ t: 'dd\\. mmmm, yyyy' },
			{ t: 'd\\.m' },
			{ t: 'd\\.m\\.yy' },
			{ t: 'dd\\.mm\\.yy' },
			{ t: 'd\\. mmm' },
			{ t: 'd\\. mmm yy' },
			{ t: 'd\\. mmm yyyy' },
			{ t: 'mmm yy' },
			{ t: 'mmmm yy' },
			{ t: 'd\\. mmmm yyyy' },
			{ t: 'd\\.m\\.yy h:mm AM/PM' },
			{ t: 'd\\.m\\.yy h:mm' },
			{ t: 'd\\.m\\.yyyy h:mm' },
			{ t: 'mmmmm' },
			{ t: 'mmmmm yy' },
			{ t: 'd\\.m\\.yyyy' },
			{ t: 'd\\. mmm yyyy' },
		],
		Time: [
			{ t: 'h:mm' },
			{ t: 'hh:mm' },
			{ t: 'h:mm:ss' },
			{ t: 'hh:mm:ss' },
			{ t: 'h:mm AM/PM' },
			{ t: 'h:mm:ss AM/PM' },
			{ t: 'h:mm:ss.000' },
			{ t: 'mm:ss.000' },
			{ t: 'ss.000' },
		],
		Fraction: [
			{ t: '# ?/?' },
			{ t: '# ??/??' },
			{ t: '# ???/???' },
			{ t: '# ?/2' },
			{ t: '# ?/4' },
			{ t: '# ?/8' },
			{ t: '# ?/16' },
			{ t: '# ?/10' },
			{ t: '# ?/100' },
		],
	},
};

export default class NumberFormatTemplates {
	getTemplates(lang) {
		return templates[lang];
	}

	getNegativeNumberTemplates(thousands, decimals, color, value, type, currency, id) {
		const template = {};

		template.id = id;
		template.v = value;
		template.color = color;
		template.format = '';

		if (thousands) {
			template.format = '#,##';
		}

		template.format += '0';

		if (decimals) {
			template.format += '.';
			template.format += '0'.repeat(decimals);
		}

		// TODO currency symbol before number ($)
		if (currency) {
			template.format += ` ${currency}`;
		}

		switch (type) {
		case 1:
			template.format += `;[Red]${template.format}`;
			break;
		case 2:
			template.format += `_ ;-${template.format}`;
			break;
		case 3:
			template.format += `;[Red]-${template.format}`;
			break;
		default:
			break;
		}


		template.formattedvalue = NumberFormatter.formatNumber(template.format, value < 0 ? value : -value, 'number');

		return template;
	}

	getNumberTemplate(decimals, value, type, id) {
		const template = {};

		template.id = id;
		template.v = value;
		template.color = 'black';
		template.format = '';

		template.format += '0';

		if (decimals || type === 7) {
			template.format += '.';
			template.format += '0'.repeat(decimals);
		}

		switch (type) {
		case 5:
			template.format += '%';
			break;
		case 7:
			template.format += 'E+00';
			break;
		default:
			break;
		}


		template.formattedvalue = NumberFormatter.formatNumber(template.format, value < 0 ? value : -value, 'number');

		return template;
	}
}

export const numberFormatTemplates = new NumberFormatTemplates();
