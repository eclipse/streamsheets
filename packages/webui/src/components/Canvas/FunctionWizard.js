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
/* eslint-disable react/forbid-prop-types */
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import { Field } from '@cedalo/sdk-streams';
import JSG from '@cedalo/jsg-ui';
import { CellRange, Expression, SetCellDataCommand, SheetReference } from '@cedalo/jsg-core';
import { FuncTerm, Locale } from '@cedalo/parser';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import { FieldComponent } from './FieldComponents';
import StreamWizard from "../Dashboard/StreamWizard";
import StreamSettings from "../Dashboard/StreamSettings";

const { CellEditor } = JSG;

const styles = {
	formControl: {
		margin: '8px',
		width: '95%'
		// paddingTop: '10px',
		// paddingBottom: '10px',
	},
	label: {
		padding: '8px'
	}
};

const streamUtils = {
	prefix: (str) => `|${str}`,
	unprefix: (str) => str.replace(/^\|/, '')
};

const paramTypeToFieldType = (type) => {
	switch (type.name) {
		case 'list':
			return Field.TYPES.SHEET_RANGE;
		case 'json':
			return Field.TYPES.SHEET_RANGE;
		case 'string':
			return Field.TYPES.SHEET_RANGE;
		case 'integer':
			return Field.TYPES.SHEET_RANGE;
		case 'number':
			return Field.TYPES.SHEET_RANGE;
		case 'boolean':
			return Field.TYPES.SHEET_RANGE;
		case 'enum':
			return Field.TYPES.SELECT;
		case 'union':
			return type.types.find((t) => ['list', 'json'].includes(t.name))
				? Field.TYPES.SHEET_RANGE
				: Field.TYPES.TEXT;
		default:
			return Field.TYPES.SHEET_RANGE;
	}
};

const compareArrays = (arr1, arr2) => {
	if (!arr1 || !arr2) return false;
	let result;
	arr1.forEach((e1) =>
		arr2.forEach((e2) => {
			if (Array.isArray(e1) && Array.isArray(e2) && e1.length > 1 && e2.length) {
				result = compareArrays(e1, e2);
			} else result = e1 === e2;
		})
	);
	return result;
};

const enumValuesToOptions = (type) => {
	if (type && type.name === 'enum') {
		return type.values.map((value) => ({ label: value, value }));
	}
	return undefined;
};

const findMainMessageField = (fields) => fields.find((field) => ['message', 'body'].includes(field.id));

const initMainMessageField = (fields, value) => {
	const field = findMainMessageField(fields);
	if (field) {
		field.value = value;
	}
};

const copyMainMessageFieldValue = (newFields, oldFields) => {
	const newField = findMainMessageField(newFields);
	const oldField = findMainMessageField(oldFields);
	if (newField && oldField) {
		newField.value = oldField.value;
	}
};

const isRequired = (param) => !(param.optional || param.defaultValue !== undefined);

const typeToTypeName = (type) => {
	let name = '';
	if (type) {
		if (type.name === 'union') {
			name = type.types.map((t) => t.name).join(' | ');
		} else if (type.name === 'list') {
			name = type.type.name === 'union' ? type.name : `${type.name}<${type.type.name}>`;
		} else {
			// eslint-disable-next-line
			name = type.name;
		}
	}
	return name.toUpperCase();
};

const functionParamToField = (param) => {
	const fieldType = param.type ? paramTypeToFieldType(param.type) : Field.TYPES.SHEET_RANGE;
	const options = enumValuesToOptions(param.type);
	const fieldDefinition = {
		id: param.id,
		label: param.label,
		// empty defaultValue to prevent adding it to function if nothing is specified for this parameter...
		defaultValue: '',
		type: fieldType,
		options,
		required: isRequired(param),
		help: param.description
	};
	const field = new Field(fieldDefinition);
	field.paramConfig = param;
	field.typeName = typeToTypeName(param.type);
	return field;
};

const getSelectedCell = (sheetViewItem) => {
	const point = sheetViewItem.getOwnSelection().getActiveCell();
	return (
		point &&
		sheetViewItem
			.getCells()
			.getDataProvider()
			.getRC(point.x, point.y)
	);
};

const getFuncTerm = (cell) => {
	const term = cell.getExpression() && cell.getExpression().getTerm();
	return term && term instanceof FuncTerm ? term : undefined;
};

const getFunctionName = (functions, cell) => {
	const term = getFuncTerm(cell);
	const functionName = term && term.getFuncId();
	return functions.includes(functionName) ? functionName : undefined;
};

const getDefaultFunction = (functions) => functions['MQTT.PUBLISH'] || functions[Object.keys(functions)[0]];

const getInitialFunction = (functions, functionName) => {
	const selectedFunction = functionName && functions[functionName];
	return selectedFunction || getDefaultFunction(functions);
};

const isJSONFunc = (term) => term.name === 'JSON';

const refFromJSONFunc = (term) => {
	const operand = term.params[0] && term.params[0].operand;
	return operand instanceof SheetReference && operand;
};

const initFieldValues = (paramTerms, fields, target) => {
	paramTerms.forEach((term, index) => {
		const sheetRefOperand =
			term.operand instanceof SheetReference ? term.operand : isJSONFunc(term) && refFromJSONFunc(term);
		if (sheetRefOperand) {
			fields[index].value = `=${sheetRefOperand.toString({ useName: true, item: target.item })}`;
		} else if (term instanceof FuncTerm) {
			fields[index].value = `=${term.toString()}`;
		} else {
			const { value } = term;
			fields[index].value = value !== null ? value.toString() : undefined;
		}
	});
};

const getDefaultStream = (streams) => {
	const connectors = streams.filter((connector) => !!connector.provider);
	const procuders = streams.filter(
		(producer) => producer.connector && connectors.map((c) => c.id).includes(producer.connector.id)
	);
	return procuders[0] || connectors[0] || streams[0];
};

const getInitalStream = (streams, streamName) => {
	const selectedStream = streamName && streams.find((stream) => stream.name === streamName);
	return selectedStream || getDefaultStream(streams);
};

const getStreamName = ({ params = [] }) => params.length ? streamUtils.unprefix(params[0].toString()) : '';

const isFormula = (formulaString, sheetItem) => formulaString[0] === '=' && !!sheetItem.parseTextToTerm(formulaString, false);

const isJSONParam = (type) =>
	type && (type.name === 'json' || (type.name === 'union' && type.types.find((t) => t.name === 'json')));

const isMultiCellRange = (rangeString, sheetItem) => {
	const range = CellRange.parse(rangeString, sheetItem);
	return range && !range.isSingleCell();
};

const getStreams = (providerIds, baseFunction, streams) => {
	const { consumers, producers, connectors } = streams;
	const relevantConnectors = connectors.filter((c) => providerIds.includes(c.provider.id));
	const connectorIds = relevantConnectors.map((c) => c.id);
	if (baseFunction === 'respond') {
		return consumers.filter((consumer) => connectorIds.includes(consumer.connector.id));
	}
	const relevantProducers = producers.filter((producer) => connectorIds.includes(producer.connector.id));
	return [...relevantProducers];
};

class FunctionWizard extends Component {
	static propTypes = {
		streams: PropTypes.object.isRequired,
		options: PropTypes.object.isRequired,
		locale: PropTypes.string.isRequired,
		hideFunctionWizard: PropTypes.func.isRequired,
		lastDefinedJSONRange: PropTypes.string
	};

	static defaultProps = {
		lastDefinedJSONRange: undefined
	};

	static getDerivedStateFromProps(props, state) {
		const prevProducers = state.allStreams.producers.map((p) => p.name);
		const producers = props.streams.producers.map((p) => p.name);
		if (!compareArrays(prevProducers, producers)) {
			const allStreams = { ...props.streams };
			const { providers, baseFunction } = state.selectedFunction;
			const streams = getStreams(providers, baseFunction, allStreams);
			return { ...state, streams };
		}
		return { ...state };
	}

	constructor(props) {
		super(props);
		const target = this.getTarget(props);
		if (target === undefined) {
			this.props.hideFunctionWizard();
			return;
		}
		const functions = this.getFunctions();
		const selectedCell = getSelectedCell(target.item);
		const selectedCellFunction = selectedCell && getFunctionName(Object.keys(functions), selectedCell);
		const selectedFunction = getInitialFunction(functions, selectedCellFunction);
		const allStreams = props.streams;
		const streams = this.getStreams(selectedFunction.providers, selectedFunction.config.baseFunction);
		const selectedCellStream = selectedCellFunction && getStreamName(getFuncTerm(selectedCell));
		const selectedStream = getInitalStream(streams, selectedCellStream);
		const fields = selectedFunction ? selectedFunction.config.parameters.map(functionParamToField) : [];
		if (selectedCellFunction) {
			const paramTerms = getFuncTerm(selectedCell).params.slice(1);
			initFieldValues(paramTerms, fields, target);
		}
		if (props.options.messageTerm) {
			initMainMessageField(fields, props.options.messageTerm);
		} else if (!selectedCellFunction && props.lastDefinedJSONRange) {
			initMainMessageField(fields, `=${props.lastDefinedJSONRange}`);
		}
		this.state = {
			functions,
			selectedFunction,
			streams,
			selectedStream,
			fields,
			target,
			allStreams,
			editStream: false,
			showStreamWizard: false,
			// selectedTextField: null,
		};
	}

	getTarget({ options, hideFunctionWizard }) {
		const { targetCell, sheetViewItem, sheetView } = options;
		if (targetCell && sheetViewItem) {
			return {
				ref: targetCell,
				item: sheetViewItem,
				sheetView
			};
		}
		const activeSheetView = graphManager.getActiveSheetView();
		if (activeSheetView === undefined) {
			hideFunctionWizard();
			return undefined;
		}
		const item = activeSheetView.getItem();
		const ref = item.getOwnSelection().activeCellToString();
		if (ref) {
			return {
				ref,
				item,
				sheetView: activeSheetView
			};
		}
		hideFunctionWizard();
		return undefined;
	}

	getFunctions = () => {
		const functionArrayArray = this.props.streams.providers.map((provider) =>
			provider.definition.functions
				.filter((f) => !f.deprecated)
				.map((f) => ({ provider: provider.id, config: f }))
		);
		const functions = [].concat(...functionArrayArray);
		const functionsByName = {};
		functions.forEach(({ provider, config }) => {
			functionsByName[config.name] = functionsByName[config.name] || {
				config,
				providers: []
			};
			functionsByName[config.name].providers.push(provider);
		});

		return functionsByName;
	};

	handleAddConsumer = () => {
		this.setState({
			showStreamWizard: true,
		})
	};

	handleEditConsumer = () => {
		this.setState({
			editStream: true,
			row: this.state.selected,
		})
	};

	onWizardClose = () => {
		this.setState({ showStreamWizard: false, editStream: false });
	};

	getStreams = (providerIds, baseFunction) => {
		const streams = this.state ? this.state.allStreams : this.props.streams;
		return getStreams(providerIds, baseFunction, streams);
	};

	handleCancel = () => this.close();

	close = () => {
		this.props.hideFunctionWizard();
	};

	handleConfirm = () => {
		// const validationError = validateRequired(this.state.fields);

		if (!this.state.target) {
			this.props.hideFunctionWizard();
			return;
		}
		const { item, ref, sheetView } = this.state.target;

		const separator = JSG.getParserLocaleSettings().separators.parameter;
		const quoted = (string) => `"${string}"`;

		const params = [this.state.selectedStream ? streamUtils.prefix(this.state.selectedStream.name) : ''].concat(
			this.state.fields.map((field) => {
				const { value } = field;
				const { type } = field.paramConfig;
				if (value == null || value === '') {
					return '';
				}
				if (isFormula(value, item)) {
					const formula = value.replace(/^=/, '');
					return isJSONParam(type) && isMultiCellRange(formula, item) ? `JSON(${formula})` : formula;
				}
				if (type && type.name === 'boolean') {
					// return !!value;
					return `${value}`.toLowerCase() === 'true';
				}
				return quoted(value);
			})
		);

		const paramsWithoutTrailingUndefined = params
			.reverse()
			.reduce((acc, param) => (param === '' && acc.length === 0 ? acc : [param, ...acc]), []);

		const expr = new Expression(
			0,
			`${this.state.selectedFunction.config.name}(${paramsWithoutTrailingUndefined.join(separator)})`
		);
		JSG.FormulaParser.context.separators = JSG.getParserLocaleSettings().separators;
		expr.evaluate(item);
		expr.correctFormula(item);
		JSG.FormulaParser.context.separators = Locale.EN.separators;
		const cmd = new SetCellDataCommand(item, ref, expr, false);

		graphManager.synchronizedExecute(cmd);
		sheetView.notify();
		this.close();
	};

	handleStreamChange = (event) => {
		this.setState({
			selectedStream: this.state.streams.find((stream) => stream.id === event.target.value)
		});
	};

	handleFunctionChange = (event) => {
		const selectedFunction = this.state.functions[event.target.value];
		const streams = this.getStreams(selectedFunction.providers, selectedFunction.config.baseFunction);
		let selectedStream;
		if (this.state.selectedStream) {
			selectedStream = streams.find((stream) => stream.id === this.state.selectedStream.id);
		}
		selectedStream = selectedStream || getInitalStream(streams);
		const fields = selectedFunction ? selectedFunction.config.parameters.map(functionParamToField) : [];
		copyMainMessageFieldValue(fields, this.state.fields);
		this.setState({
			selectedFunction,
			streams,
			selectedStream,
			fields
		});
	};

	handleFieldFocused = (field) => {
		if (field.type === Field.TYPES.SHEET_RANGE || field.type === Field.TYPES.SHEET_REF) {
			const cellEditor = CellEditor.getActiveCellEditor();
			if (cellEditor) {
				cellEditor.activateReferenceMode();
			}
		}
	};

	handleFieldChange = (fieldId, event) => {
		this.setState({
			fields: this.state.fields.map((field) => {
				if (field.id === fieldId) {
					if (field.type === Field.TYPES.CHECKBOX) {
						field.value = event.target.checked;
					} else {
						field.value = event.target.value;
					}
				}
				return field;
			})
		});
	};

	handleFieldBlur = (fieldId, event) => {
		this.setState({
			fields: this.state.fields.map((field) => {
				if (field.id === fieldId) {
					if (field.type === Field.TYPES.SHEET_RANGE) {
						field.value = event.target.textContent;
					}
				}
				return field;
			})
		});
	};

	handleKeyPressed = (event) => {
		switch (event.key) {
			case 'Enter':
				return this.handleConfirm();
			case 'Escape':
				CellEditor.deActivateCellEditor();
				graphManager.getGraph().markDirty();
				graphManager.redraw();
				return this.handleCancel();
			default:
		}
		return false;
	};

	render() {
		return (
			<Paper
				square
				elevation={0}
				style={{
					border: '1px solid grey',
					position: 'absolute',
					top: '-1px',
					right: '0px',
					width: '330px',
					height: '100%',
					overflowX: 'hidden',
					overflowY: 'auto',
					zIndex: '1250'
				}}
			>
				<AppBar
					elevation={0}
					style={{
						width: '100%',
						height: '48px',
						display: 'flex',
						backgroundColor: 'dimgrey',
						flexDirection: 'row',
						position: 'relative',
					}}
				>
					<Typography
						style={{
							padding: '12px 0px 12px 8px',
							display: 'inline-block',
							fontSize: '12pt',
							color: 'white',
						}}
					>
						Function Wizard
					</Typography>
				</AppBar>
				<Typography component="div" onKeyDown={this.handleKeyPressed}>
					<FormControl style={styles.formControl}>
						<InputLabel htmlFor="functionWizard.function">
							<FormattedMessage id="Function" defaultMessage="Function" />
						</InputLabel>
						<Select
							fullWidth
							input={<Input name="functionWizard.function" id="functionWizard.function" />}
							value={this.state.selectedFunction ? this.state.selectedFunction.config.name : ''}
							onChange={(event) => this.handleFunctionChange(event)}
						>
							{Object.keys(this.state.functions)
								.sort()
								.map((name) => (
									<MenuItem value={name} key={name}>
										{name}
									</MenuItem>
								))}
						</Select>
					</FormControl>
					<FormControl style={styles.formControl}>
						<InputLabel htmlFor="functionWizard.stream">
							<FormattedMessage id="Stream" defaultMessage="Stream" />
						</InputLabel>
						<Select
							fullWidth
							input={<Input name="functionWizard.stream" id="functionWizard.stream" />}
							value={this.state.selectedStream ? this.state.selectedStream.id : 'TEST'}
							onChange={(event) => this.handleStreamChange(event)}
						>
							{this.state.streams.map((stream) => (
								<MenuItem value={stream.id} key={stream.id}>
									{stream.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<div>
						<Button color="primary" onClick={this.handleAddConsumer} style={{ float: 'right' }}>
							<FormattedMessage id="DialogNew.AddProducer" defaultMessage="Add Producer" />
						</Button>
						<Button color="primary" onClick={this.handleEditConsumer} disabled={this.state.selectedStream === undefined} style={{ float: 'right' }}>
							<FormattedMessage id="DialogNew.EditProducer" defaultMessage="Edit Producer" />
						</Button>
					</div>
					{this.state.fields.map((field) => (
						<FieldComponent
							key={field.id}
							field={field}
							onChange={(event) => this.handleFieldChange(field.id, event)}
							onBlur={(event) => this.handleFieldBlur(field.id, event)}
							onFocus={(event) => this.handleFieldFocused(field, event)}
							value={field.value}
							locale={this.props.locale}
							styles={styles}
						/>
					))}
					<div>
						<Button color="primary" onClick={this.handleCancel} style={{ float: 'right' }}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button color="primary" onClick={this.handleConfirm} style={{ float: 'right' }} autoFocus>
							<FormattedMessage id="OK" defaultMessage="OK" />
						</Button>
					</div>
					{this.state.showStreamWizard ? (
						<StreamWizard
							onClose={this.onWizardClose}
							initialStep="connector"
							connector={undefined}
							type="producer"
							open={this.state.showStreamWizard}
							streams={this.props.streams}
						/>) : null}
					{this.state.editStream ? (
						<StreamSettings
							onClose={this.onWizardClose}
							stream={this.state.selectedStream}
							type="producer"
							open={this.state.editStream}
							streams={this.props.streams}
						/>) : null}
				</Typography>
			</Paper>
		);
	}
}

function mapStateToProps(state) {
	return {
		streams: state.streams,
		options: state.appState.functionWizard,
		locale: state.locales.locale,
		lastDefinedJSONRange: state.appState.lastDefinedJSONRange
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(FunctionWizard);
