module.exports = {
	en: 'Math',
	de: 'Mathematik',
	functions: {
		ABS: {
			en: { argumentList: 'Value', description: 'Returns the absolute value of a given number' },
			de: { argumentList: 'Zahl', description: 'Gibt den absoluten Betrag einer Zahl zurück' }
		},
		ARCCOS: {
			en: { argumentList: 'Value', description: 'Returns the arccosine value of the value' },
			de: { argumentList: 'Zahl', description: 'Gibt den Arkus Cosinus der Zahl zurück' }
		},
		ARCSIN: {
			en: { argumentList: 'Value', description: 'Returns the arcsine value of the value' },
			de: { argumentList: 'Zahl', description: 'Gibt den Arkus Sinus der Zahl zurück' }
		},
		ARCTAN: {
			en: { argumentList: 'Value', description: 'Returns the arctangent value of the value' },
			de: { argumentList: 'Zahl', description: 'Gibt den Arkus Tangens der Zahl zurück' }
		},
		ARCTAN2: {
			en: {
				argumentList: 'X,Y',
				description: 'Returns the arctangent value based on the given x and y coordinates'
			},
			de: {
				argumentList: 'X,Y',
				description: 'Gibt den Arkus Tangens basierend auf den übergebenen X und Y Koordinaten zurück'
			}
		},
		COS: {
			en: { argumentList: 'Angle', description: 'Returns the cosine value of the value' },
			de: { argumentList: 'Winkel', description: 'Gibt den Cosinus des Winkels zurück' }
		},
		DEGREES: {
			en: { argumentList: 'Radians', description: 'Converts radians to degrees' },
			de: { argumentList: 'Radian', description: 'Wandelt einen radialen Winkel in Grad um' }
		},
		EVEN: {
			en: { argumentList: 'Number', description: 'Returns the number rounded up to the nearest event integer' },
			de: { argumentList: 'Zahl', description: 'Rundet eine Zahl auf die nächste gerade Ganzzahl auf' }
		},
		FRAC: {
			en: { argumentList: 'Number', description: 'Returns the fractional part of a number value' },
			de: { argumentList: 'Zahl', description: 'Berechnet den Dezimalteil einer Zahl' }
		},
		INT: {
			en: { argumentList: 'Value', description: 'Rounds a number value down to its nearest integer' },
			de: { argumentList: 'Zahl', description: 'Rundet eine Zahl zu ihrer nächsten Ganzen Zahl ab' }
		},
		MOD: {
			en: {
				argumentList: 'Number, Divisor',
				description: 'Returns the remainder of given number after it was divided by specified divisor'
			},
			de: { argumentList: 'Zahl;Divisor', description: 'Gibt den Rest einer Division zurück' }
		},
		ODD: {
			en: { argumentList: 'Number', description: 'Returns the number rounded up to the nearest odd integer' },
			de: { argumentList: 'Zahl', description: 'Rundet eine Zahl auf die nächste ungerade Ganzzahl auf' }
		},
		PI: {
			en: { argumentList: '', description: 'Returns the value of PI' },
			de: { argumentList: '', description: 'Gibt den Wert PI zurück' }
		},
		POWER: {
			en: { argumentList: 'Value,Exponent', description: 'Returns the value of base to the power of exponent' },
			de: { argumentList: 'Zahl,Potenz', description: 'Gibt den Wert der Zahl potenziert zurück' }
		},
		RADIANS: {
			en: { argumentList: 'Degrees', description: 'Converts the degrees value to radians' },
			de: { argumentList: 'Grad', description: 'Konvertiert den Winkel in Radien' }
		},
		RANDBETWEEN: {
			en: { argumentList: 'Min,Max', description: 'Creates a random value within the interval' },
			de: { argumentList: 'Min,Max', description: 'Erzeugt einen Zufallswert innerhalb der gegebenen Werte' }
		},
		ROUND: {
			en: { argumentList: 'Value,Decimals', description: 'Rounds the value to the given decimals' },
			de: {
				argumentList: 'Wert,Nachkommastellen',
				description: 'Rundet den Wert auf die gegebene Anzahl an Nachkommastellen'
			}
		},
		SIGN: {
			en: { argumentList: 'Value', description: 'Returns the sign of given number' },
			de: { argumentList: 'Zahl', description: 'Liefert das Vorzeichen der angebenenen Zahl zurück' }
		},
		SIN: {
			en: { argumentList: 'Angle', description: 'Returns the sine value of the value' },
			de: { argumentList: 'Winkel', description: 'Gibt den Sinus der Zahl zurück' }
		},
		SQRT: {
			en: { argumentList: 'Value', description: 'Returns square root of the value' },
			de: { argumentList: 'Zahl', description: 'Gibt die Wurzel des Wertes zurück' }
		},
		SUM: {
			en: { argumentList: 'Range', description: 'Sums up all values in given range' },
			de: { argumentList: 'Bereich', description: 'Summiert die Zahlen im angegebenen Bereich auf' }
		},
		TAN: {
			en: { argumentList: 'Angle', description: 'Returns the tangent value of the value' },
			de: { argumentList: 'Winkel', description: 'Gibt den Tangens der Zahl zurück' }
		},
		TRUNC: {
			en: { argumentList: 'Value', description: 'Truncates a number to an integer' },
			de: { argumentList: 'Zahl', description: 'Schneidet die Nachkommastellen der angegebenen Zahl ab' }
		}
	}
};
