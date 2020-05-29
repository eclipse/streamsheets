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
const Coordinate = require('../Coordinate');

/**
 * Helper Class to create dynamic shapes.
 *
 * @class ShapeBuilder
 * @since 2.0.0
 */
class ShapeBuilder {
	static ARC() {
		ShapeBuilder.arcHelper.call(this, 'arc');
	}

	static ARCCLOSED() {
		ShapeBuilder.arcHelper.call(this, 'arcclosed');
	}

	static PIE() {
		ShapeBuilder.arcHelper.call(this, 'pie');
	}

	static arcHelper(type) {
		const rsStart = this.getReshapeCoordinateAt(0);
		const rsEnd = this.getReshapeCoordinateAt(1);
		const start = rsStart.getX().getValue() * Math.PI * 2;
		const end = rsEnd.getX().getValue() * Math.PI * 2;

		ShapeBuilder.arcSetter.call(this, type, start, end);
	}

	static arcSetter(type, start, end) {
		if (end < start) {
			end += Math.PI * 2;
		}
		start = -start;
		end = -end;

		const shape = this.getShape();
		const coordinates = [];
		const cpToCoordinates = [];
		const cpFromCoordinates = [];
		const delta = end - start;

		let s;
		const segs = Math.ceil(Math.abs(delta) / (Math.PI / 2));
		const theta = delta / segs;
		const tanT2 = Math.tan(theta / 2);
		const alpha = (Math.sin(theta) * (Math.sqrt(4 + 3 * tanT2 * tanT2) - 1)) / 3;
		let cosine = Math.cos(start);
		let sine = Math.sin(start);

		cpFromCoordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine}`),
				shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine}`)
			)
		);
		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine}`),
				shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine}`)
			)
		);
		cpToCoordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine} + ${alpha} * -WIDTH / 2 * ${sine}`),
				shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine} + ${alpha} * HEIGHT / 2 * ${cosine}`)
			)
		);

		for (s = 0; s < segs; s += 1) {
			start += theta;
			cosine = Math.cos(start);
			sine = Math.sin(start);

			cpFromCoordinates.push(
				new Coordinate(
					shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine} - ${alpha} * -WIDTH / 2 * ${sine}`),
					shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine} - ${alpha} * HEIGHT / 2 * ${cosine}`)
				)
			);
			coordinates.push(
				new Coordinate(
					shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine}`),
					shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine}`)
				)
			);

			if (s === segs - 1) {
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine}`),
						shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine}`)
					)
				);
				if (type === 'pie') {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
				}
			} else {
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${cosine} + ${alpha} * -WIDTH / 2 * ${sine}`),
						shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${sine} + ${alpha} * HEIGHT / 2 * ${cosine}`)
					)
				);
			}
		}

		shape.disableNotification();

		shape.setCoordinates(coordinates);
		shape.setCpFromCoordinates(cpFromCoordinates);

		shape.enableNotification();

		shape.setCpToCoordinates(cpToCoordinates);
	}

	static MULTIPLY() {
		const shape = this.getShape();
		const coordinates = [];

		const rscoor = this.getReshapeCoordinateAt(0);
		const x = rscoor.getX().getValue();
		const y = rscoor.getY().getValue();
		const name = rscoor.getName().toUpperCase();

		const radius = '(MAX(WIDTH, HEIGHT) * 0.3)';
		const angleDiagonals = 'ARCTAN2(HEIGHT, WIDTH)';
		const angleOffsetPoints = `ARCSIN(BASE * MIN(WIDTH, HEIGHT) / 2 / ${radius})`;
		const yCenter = `BASE * MIN(WIDTH, HEIGHT) / 2 / COS(${angleDiagonals})`;
		const xCenter = `BASE * MIN(WIDTH, HEIGHT) / 2 / SIN(${angleDiagonals})`;

		coordinates.push(
			new Coordinate(shape._newExpression(0, `WIDTH / 2 + ${xCenter}`), shape._newExpression(0, 'HEIGHT / 2'))
		);

		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + COS(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 + SIN(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`)
			)
		);
		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + COS(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 + SIN(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`)
			)
		);

		coordinates.push(
			new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, `HEIGHT / 2 + ${yCenter}`))
		);

		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 - COS(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 + SIN(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`)
			)
		);
		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 - COS(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 + SIN(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`)
			)
		);

		coordinates.push(
			new Coordinate(shape._newExpression(0, `WIDTH / 2 - ${xCenter}`), shape._newExpression(0, 'HEIGHT / 2'))
		);

		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 - COS(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 - SIN(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`)
			)
		);
		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 - COS(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 - SIN(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`)
			)
		);

		coordinates.push(
			new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, `HEIGHT / 2 - ${yCenter}`))
		);

		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + COS(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 - SIN(${angleDiagonals} + ${angleOffsetPoints}) * ${radius}`)
			)
		);
		coordinates.push(
			new Coordinate(
				shape._newExpression(0, `WIDTH / 2 + COS(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`),
				shape._newExpression(0, `HEIGHT / 2 - SIN(${angleDiagonals} - ${angleOffsetPoints}) * ${radius}`)
			)
		);

		shape.setCoordinates(coordinates);
	}

	static CALLOUTLINE() {
		ShapeBuilder.calloutHelper.call(this, 'line');
	}

	static CALLOUT() {
		ShapeBuilder.calloutHelper.call(this, 'default');
	}

	static calloutHelper(type) {
		const shape = this.getShape();
		const coordinates = [];

		const rscoor = this.getReshapeCoordinateAt(0);
		const x = rscoor.getX().getValue();
		const y = rscoor.getY().getValue();
		const name = rscoor.getName().toUpperCase();

		if (y > 1 && -x < y - 1 && x - 1 < y - 1) {
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT')));
			if (x > 0.5) {
				if (type === 'line') {
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.75'), shape._newExpression(0, 'HEIGHT'))
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.75'), shape._newExpression(0, 'HEIGHT'))
					);
				} else {
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.85'), shape._newExpression(0, 'HEIGHT'))
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.65'), shape._newExpression(0, 'HEIGHT'))
					);
				}
			} else if (type === 'line') {
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.25'), shape._newExpression(0, 'HEIGHT'))
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.25'), shape._newExpression(0, 'HEIGHT'))
				);
			} else {
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.35'), shape._newExpression(0, 'HEIGHT'))
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.15'), shape._newExpression(0, 'HEIGHT'))
				);
			}
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
		} else if (y < 0 && ((x > 0 && x < 1) || (x > y && x - 1 < Math.abs(y)))) {
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			if (x > 0.5) {
				if (type === 'line') {
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.75'), shape._newExpression(0)));
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.75'), shape._newExpression(0)));
				} else {
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.65'), shape._newExpression(0)));
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.85'), shape._newExpression(0)));
				}
			} else if (type === 'line') {
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.25'), shape._newExpression(0)));
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.25'), shape._newExpression(0)));
			} else {
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.15'), shape._newExpression(0)));
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.35'), shape._newExpression(0)));
			}
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT')));
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
		} else if (x < 0 && ((y > 0 && y < 1) || -x > y - 1)) {
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT')));
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
			if (y > 0.5) {
				if (type === 'line') {
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.75')));
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.75')));
				} else {
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.85')));
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.65')));
				}
			} else if (type === 'line') {
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.25')));
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.25')));
			} else {
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.35')));
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.15')));
			}
		} else {
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			if (y > 0.5) {
				if (type === 'line') {
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.75'))
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.75'))
					);
				} else {
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.85'))
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.65'))
					);
				}
			} else if (type === 'line') {
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.25'))
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.25'))
				);
			} else {
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.35'))
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.15'))
				);
			}
			coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT')));
			coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
		}

		shape.setCoordinates(coordinates);
	}

	static CALLOUTROUNDRECTLINE() {
		ShapeBuilder.calloutRoundRectHelper.call(this, 'line');
	}

	static CALLOUTROUNDRECT() {
		ShapeBuilder.calloutRoundRectHelper.call(this, 'default');
	}

	static calloutRoundRectHelper(type) {
		const shape = this.getShape();
		const cpToCoordinates = [];
		const cpFromCoordinates = [];
		const coordinates = [];
		const rscoor = this.getReshapeCoordinateAt(0);
		const x = rscoor.getX().getValue();
		const y = rscoor.getY().getValue();
		const name = rscoor.getName().toUpperCase();

		// left top
		function leftTop() {
			cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'))
			);
			coordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'))
			);
			cpToCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2 * 0.45'))
			);

			cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2 * 0.45'), shape._newExpression(0))
			);
			coordinates.push(
				new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0))
			);
			cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0))
			);
		}

		// right top
		function rightTop() {
			cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0))
			);
			coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0))
			);
			cpToCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * 0.2 * 0.45'),
					shape._newExpression(0)
				)
			);

			cpFromCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH'),
					shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2 * 0.45')
				)
			);
			coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'))
			);
			cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'))
			);
		}

		function rightBottom() {
			// right bottom
			cpFromCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH'),
					shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * 0.2')
				)
			);
			coordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH'),
					shape._newExpression(0, 'HEIGHT - 0.2 * MIN(WIDTH, HEIGHT)')
				)
			);
			cpToCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH'),
					shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * 0.2 * 0.45')
				)
			);

			cpFromCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * 0.2 * 0.45'),
					shape._newExpression(0, 'HEIGHT')
				)
			);
			coordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * 0.2'),
					shape._newExpression(0, 'HEIGHT')
				)
			);
			cpToCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * 0.2'),
					shape._newExpression(0, 'HEIGHT')
				)
			);
		}

		function leftBottom() {
			// left bottom
			cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0, 'HEIGHT'))
			);
			coordinates.push(
				new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0, 'HEIGHT'))
			);
			cpToCoordinates.push(
				new Coordinate(
					shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2 * 0.45'),
					shape._newExpression(0, 'HEIGHT')
				)
			);

			cpFromCoordinates.push(
				new Coordinate(
					shape._newExpression(0),
					shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * 0.2 * 0.45')
				)
			);
			coordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * 0.2'))
			);
			cpToCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * 0.2'))
			);
		}

		if (y > 1 && -x < y - 1 && x - 1 < y - 1) {
			leftTop();
			rightTop();
			rightBottom();
			if (x > 0.5) {
				if (type === 'line') {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0, 'HEIGHT'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0, 'HEIGHT'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0, 'HEIGHT'))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0, 'HEIGHT'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0, 'HEIGHT'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0, 'HEIGHT'))
					);
				} else {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.8'), shape._newExpression(0, 'HEIGHT'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.8'), shape._newExpression(0, 'HEIGHT'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.8'), shape._newExpression(0, 'HEIGHT'))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.6'), shape._newExpression(0, 'HEIGHT'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.6'), shape._newExpression(0, 'HEIGHT'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.6'), shape._newExpression(0, 'HEIGHT'))
					);
				}
			} else if (type === 'line') {
				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0, 'HEIGHT'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0, 'HEIGHT'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0, 'HEIGHT'))
				);

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0, 'HEIGHT'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0, 'HEIGHT'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0, 'HEIGHT'))
				);
			} else {
				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.4'), shape._newExpression(0, 'HEIGHT'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.4'), shape._newExpression(0, 'HEIGHT'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.4'), shape._newExpression(0, 'HEIGHT'))
				);

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.2'), shape._newExpression(0, 'HEIGHT'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.2'), shape._newExpression(0, 'HEIGHT'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH * 0.2'), shape._newExpression(0, 'HEIGHT'))
				);
			}
			leftBottom();
		} else if (y < 0 && ((x > 0 && x < 1) || (x > y && x - 1 < Math.abs(y)))) {
			leftTop();
			if (x > 0.5) {
				if (type === 'line') {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0))
					);
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0)));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0))
					);
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0)));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.7'), shape._newExpression(0))
					);
				} else {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.6'), shape._newExpression(0))
					);
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.6'), shape._newExpression(0)));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.6'), shape._newExpression(0))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.8'), shape._newExpression(0))
					);
					coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.8'), shape._newExpression(0)));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.8'), shape._newExpression(0))
					);
				}
			} else if (type === 'line') {
				cpFromCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0)));
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0)));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0)));

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0)));
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0)));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.3'), shape._newExpression(0)));
			} else {
				cpFromCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.2'), shape._newExpression(0)));
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.2'), shape._newExpression(0)));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.2'), shape._newExpression(0)));

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.4'), shape._newExpression(0)));
				coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.4'), shape._newExpression(0)));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH * 0.4'), shape._newExpression(0)));
			}
			rightTop();
			rightBottom();
			leftBottom();
		} else if (x < 0 && ((y > 0 && y < 1) || -x > y - 1)) {
			leftTop();
			rightTop();
			rightBottom();
			leftBottom();
			if (y > 0.5) {
				if (type === 'line') {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.7')));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.7'))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.7')));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
				} else {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.8'))
					);
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.8')));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.8'))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.6'))
					);
					coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.6')));
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.6'))
					);
				}
			} else if (type === 'line') {
				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.3')));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.3')));

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.3')));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.3')));
			} else {
				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.4'))
				);
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.4')));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.4')));

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.2'))
				);
				coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.2')));
				cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.2')));
			}
		} else {
			leftTop();
			rightTop();
			if (y > 0.5) {
				if (type === 'line') {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.7'))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.7'))
					);
				} else {
					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.6'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.6'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.6'))
					);

					cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);
					cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH * ${name}X`),
							shape._newExpression(0, `HEIGHT * ${name}Y`)
						)
					);

					cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.8'))
					);
					coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.8'))
					);
					cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.8'))
					);
				}
			} else if (type === 'line') {
				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.3'))
				);

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.3'))
				);
			} else {
				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.2'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.2'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.2'))
				);

				cpFromCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);
				cpToCoordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH * ${name}X`),
						shape._newExpression(0, `HEIGHT * ${name}Y`)
					)
				);

				cpFromCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.4'))
				);
				coordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.4'))
				);
				cpToCoordinates.push(
					new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.4'))
				);
			}
			rightBottom();
			leftBottom();
		}

		shape.setCoordinates(coordinates);
		shape.setCpFromCoordinates(cpFromCoordinates);
		shape.setCpToCoordinates(cpToCoordinates);
	}

	static CALLOUTROUNDLINE() {
		ShapeBuilder.calloutRoundHelper.call(this, 'line');
	}

	static CALLOUTROUND() {
		ShapeBuilder.calloutRoundHelper.call(this, 'default');
	}

	static calloutRoundHelper(type) {
		const shape = this.getShape();
		const rscoor = this.getReshapeCoordinateAt(0);
		const x = rscoor.getX().getValue();
		const y = rscoor.getY().getValue();
		const name = rscoor.getName().toUpperCase();

		// get angle
		const angle = Math.atan2(-y + 0.5, x - 0.5);

		if (type === 'line') {
			ShapeBuilder.arcSetter.call(this, 'arc', angle, angle - 0.0001);
		} else {
			ShapeBuilder.arcSetter.call(this, 'arc', angle + 0.2, angle - 0.2);
		}

		// add callout point without notification
		shape
			.getCpFromCoordinates()
			.push(
				new Coordinate(
					shape._newExpression(0, `WIDTH * ${name}X`),
					shape._newExpression(0, `HEIGHT * ${name}Y`)
				)
			);
		shape
			.getCoordinates()
			.push(
				new Coordinate(
					shape._newExpression(0, `WIDTH * ${name}X`),
					shape._newExpression(0, `HEIGHT * ${name}Y`)
				)
			);
		shape
			.getCpToCoordinates()
			.push(
				new Coordinate(
					shape._newExpression(0, `WIDTH * ${name}X`),
					shape._newExpression(0, `HEIGHT * ${name}Y`)
				)
			);
		shape.evaluate();
		shape.refresh();
	}
}

module.exports = ShapeBuilder;
