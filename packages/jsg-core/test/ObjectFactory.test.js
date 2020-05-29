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
const ObjectFactory = require('../src/ObjectFactory');

class Clazz1 {
	constructor() {
		this.name = 'Clazz1';
	}
}
class Clazz2 {
	constructor() {
		this.name = 'Clazz2';
	}
}
const classnameOf = (clazz) => clazz.constructor.name;
const isValid = (instance, name) => instance != null && classnameOf(instance) === name;
const validateCreate = (name, classname) => expect(isValid(ObjectFactory.create(name), classname)).toBeTruthy();

describe('ObjectFactory', () => {
	describe('create', () => {
		// to check against circular references we simply create ALL!!
		it('should create instance of all registered attribute classes', () => {
			validateCreate('Attribute', 'Attribute');
			validateCreate('AttributeList', 'AttributeList');
			validateCreate('BooleanAttribute', 'BooleanAttribute');
			validateCreate('NumberAttribute', 'NumberAttribute');
			validateCreate('StringAttribute', 'StringAttribute');
			validateCreate('CellAttributes', 'CellAttributes');
			validateCreate('CellFormatAttributes', 'CellFormatAttributes');
			validateCreate('CellTextFormatAttributes', 'CellTextFormatAttributes');
			validateCreate('EdgeAttributes', 'EdgeAttributes');
			validateCreate('FormatAttributes', 'FormatAttributes');
			validateCreate('TextFormatAttributes', 'TextFormatAttributes');
			validateCreate('HeaderAttributes', 'HeaderAttributes');
			validateCreate('ItemAttributes', 'ItemAttributes');
			validateCreate('TextNodeAttributes', 'TextNodeAttributes');
			validateCreate('LayoutAttributes', 'LayoutAttributes');
			validateCreate('ObjectAttribute', 'ObjectAttribute');
			validateCreate('MachineContainerAttributes', 'MachineContainerAttributes');
			validateCreate('StreamSheetContainerAttributes', 'StreamSheetContainerAttributes');
			validateCreate('JSG.graph.attr.Attribute', 'Attribute');
			validateCreate('JSG.graph.attr.AttributeList', 'AttributeList');
			validateCreate('JSG.graph.attr.BooleanAttribute', 'BooleanAttribute');
			validateCreate('JSG.graph.attr.EdgeAttributes', 'EdgeAttributes');
			validateCreate('JSG.graph.attr.FormatAttributes', 'FormatAttributes');
			validateCreate('JSG.graph.attr.ItemAttributes', 'ItemAttributes');
			validateCreate('JSG.graph.attr.NumberAttribute', 'NumberAttribute');
			validateCreate('JSG.graph.attr.ObjectAttribute', 'ObjectAttribute');
			validateCreate('JSG.graph.attr.StringAttribute', 'StringAttribute');
			validateCreate('JSG.graph.attr.TextFormatAttributes', 'TextFormatAttributes');
			validateCreate('JSG.graph.attr.TextNodeAttributes', 'TextNodeAttributes');
			validateCreate('JSG.BooleanAttribute', 'BooleanAttribute');
			validateCreate('JSG.CellAttributes', 'CellAttributes');
			validateCreate('JSG.CellFormatAttributes', 'CellFormatAttributes');
			validateCreate('JSG.CellTextFormatAttributes', 'CellTextFormatAttributes');
			validateCreate('JSG.FormatAttributes', 'FormatAttributes');
			validateCreate('JSG.TextFormatAttributes', 'TextFormatAttributes');
			validateCreate('JSG.HeaderAttributes', 'HeaderAttributes');
			validateCreate('JSG.ItemAttributes', 'ItemAttributes');
			validateCreate('JSG.MachineContainerAttributes', 'MachineContainerAttributes');
			validateCreate('JSG.StreamSheetContainerAttributes', 'StreamSheetContainerAttributes');
			validateCreate('JSG.NumberAttribute', 'NumberAttribute');
		});
		it('should create instance of all registered expression classes', () => {
			validateCreate('AttributeExpression', 'AttributeExpression');
			validateCreate('BooleanExpression', 'BooleanExpression');
			validateCreate('ConstExpression', 'ConstExpression');
			validateCreate('Expression', 'Expression');
			validateCreate('MapExpression', 'MapExpression');
			validateCreate('NumberExpression', 'NumberExpression');
			validateCreate('ObjectExpression', 'ObjectExpression');
			validateCreate('StringExpression', 'StringExpression');
			validateCreate('JSG.graph.expr.AttributeExpression', 'AttributeExpression');
			validateCreate('JSG.graph.expr.BooleanExpression', 'BooleanExpression');
			validateCreate('JSG.graph.expr.ConstExpression', 'ConstExpression');
			validateCreate('JSG.graph.expr.Expression', 'Expression');
			validateCreate('JSG.graph.expr.MapExpression', 'MapExpression');
			validateCreate('JSG.graph.expr.NumberExpression', 'NumberExpression');
			validateCreate('JSG.graph.expr.ObjectExpression', 'ObjectExpression');
			validateCreate('JSG.graph.expr.StringExpression', 'StringExpression');
		});
		it('should create instance of all registered constraint classes', () => {
			validateCreate('BooleanConstraint', 'BooleanConstraint');
			validateCreate('ExpressionConstraint', 'ExpressionConstraint');
			validateCreate('NumberConstraint', 'NumberConstraint');
			validateCreate('NumberRangeConstraint', 'NumberRangeConstraint');
			validateCreate('ObjectConstraint', 'ObjectConstraint');
			validateCreate('RangeConstraint', 'RangeConstraint');
			validateCreate('StringConstraint', 'StringConstraint');
			validateCreate('JSG.graph.expr.BooleanConstraint', 'BooleanConstraint');
			validateCreate('JSG.graph.expr.ExpressionConstraint', 'ExpressionConstraint');
			validateCreate('JSG.graph.expr.NumberConstraint', 'NumberConstraint');
			validateCreate('JSG.graph.expr.NumberRangeConstraint', 'NumberRangeConstraint');
			validateCreate('JSG.graph.expr.ObjectConstraint', 'ObjectConstraint');
			validateCreate('JSG.graph.expr.RangeConstraint', 'RangeConstraint');
			validateCreate('JSG.graph.expr.StringConstraint', 'StringConstraint');
		});
		it('should create instance of registered custom class', () => {
			ObjectFactory.register('Clazz1', Clazz1);
			ObjectFactory.register('Clazz2', Clazz2);
			validateCreate('Clazz1', 'Clazz1');
			validateCreate('Clazz2', 'Clazz2');
		});
		it('should return undefined if no class is registered for given name', () => {
			expect(ObjectFactory.create('Clazz3')).toBeUndefined();
			expect(ObjectFactory.create('clazz1')).toBeUndefined();
		});
	});
	describe('register', () => {
		it('should register custom class', () => {
			ObjectFactory.register('clazz1', Clazz1);
			validateCreate('clazz1', 'Clazz1');
		});
		it('should replace previously registered class for same name', () => {
			validateCreate('clazz1', 'Clazz1');
			ObjectFactory.register('clazz1', Clazz2);
			validateCreate('clazz1', 'Clazz2');
		});
	});
	describe('has', () => {
		it('should return true if a class is registered for given name', () => {
			expect(ObjectFactory.create('Attribute')).toBeTruthy();
			expect(ObjectFactory.create('JSG.graph.expr.NumberRangeConstraint')).toBeTruthy();
			expect(ObjectFactory.create('ObjectExpression')).toBeTruthy();
		});
		it('should return true for registered custom class', () => {
			expect(ObjectFactory.create('clazz1')).toBeTruthy();
			expect(ObjectFactory.create('Clazz1')).toBeTruthy();
			expect(ObjectFactory.create('Clazz2')).toBeTruthy();
		});
		it('should return false if no class is registered for given name', () => {
			expect(ObjectFactory.create('Attributes')).toBeFalsy();
			expect(ObjectFactory.create('JSG.graph.NumberRangeConstraint')).toBeFalsy();
			expect(ObjectFactory.create('ObjectExpressionator')).toBeFalsy();
			expect(ObjectFactory.create('claZZ1')).toBeFalsy();
			expect(ObjectFactory.create('Clazz3')).toBeFalsy();
			expect(ObjectFactory.create(undefined)).toBeFalsy();
		});
	});
});
