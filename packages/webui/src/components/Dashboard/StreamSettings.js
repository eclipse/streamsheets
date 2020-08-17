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
import { Field } from '@cedalo/sdk-streams';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import AdminConstants from '../../constants/AdminConstants';
import gatewayClient from '../../helper/GatewayClient';
import StreamHelper from '../../helper/StreamHelper';
import StreamFieldComponents from './StreamFieldComponents';

const VALIDATION_QUERY = `
	query ValidateStream($provider: String!, $type: String!, $streamConfig: JSON!) {
		validateStream(provider: $provider, type: $type, streamConfig: $streamConfig) {
			valid
			fieldErrors
			fieldUpdates
		}
	}
`;

/**
 * usage: validate('@cedalo/stream-mqtt', 'consumer', {topic: 'test'});
 */
const validate = async (provider, type, streamConfig) => {
	try {
		const { validateStream } = await gatewayClient.graphql(VALIDATION_QUERY, { provider, type, streamConfig });
		return validateStream;
	} catch (error) {
		console.error(error);
	}
	return { valid: true, fieldErrors: {}, fieldUpdates: {} };
};

const styles = () => ({
	progress: {
		width: '60%'
	}
});

const StreamSettingsTitle = (props) => {
	const className = props.stream ? props.stream.className : '';
	switch (className) {
		case 'ConnectorConfiguration':
			return <FormattedMessage id="Stream.SettingsTitle.Connector" defaultMessage="Connector Settings" />;
		case 'ProducerConfiguration':
			return <FormattedMessage id="Stream.SettingsTitle.Producer" defaultMessage="Producer Settings" />;
		case 'ConsumerConfiguration':
			return <FormattedMessage id="Stream.SettingsTitle.Consumer" defaultMessage="Consumer Settings" />;
		default:
			return <FormattedMessage id="Stream.SettingsTitle" defaultMessage="Stream Settings" />;
	}
};

class StreamSettings extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		canEdit: PropTypes.bool
	};

	static defaultProps = {
		canEdit: true
	};

	constructor(props) {
		super(props);
		this.nameRef = React.createRef();
		this.ERROR_MESSAGES = {
			DUPLICATE: this.props.intl.formatMessage({
				id: 'Admin.duplicateName',
				defaultMessage: 'Name already taken, please select unique name'
			}),
			EMPTY: this.props.intl.formatMessage({
				id: 'Admin.emptyName',
				defaultMessage: 'Name cannot be empty'
			})
		};
		this.state = {
			stream: undefined,
			error: '',
			fieldErrors: undefined,
			showAdvanced: false
		};
	}

	static getDerivedStateFromProps(props, state) {
		if (state.stream === undefined && props.stream) {
			const config = StreamHelper.getInstanceFromObject(props.stream, props.streams);
			return { ...state, stream: config };
		}
		return { ...state };
	}

	componentDidUpdate() {
		if (this.nameRef && this.start) {
			this.nameRef.selectionStart = this.start;
			this.nameRef.selectionEnd = this.start;
		}
	}

	reset = () => {
		this.setState({
			error: '',
			fieldErrors: undefined,
			stream: undefined,
			showAdvanced: false
		});
	};

	handleNameChange = (event) => {
		event.preventDefault();

		const newValue = StreamSettings.onUpdateName(event.target.value);
		this.start = event.target.selectionStart;
		const error = this.validateName(newValue);

		this.state.stream.name = newValue;

		this.setState({
			stream: this.state.stream,
			error
		});
	};

	static onUpdateName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

	handleDescriptionChange = (event) => {
		event.preventDefault();

		this.state.stream.description = event.target.value;

		this.setState({
			stream: this.state.stream
		});
	};

	isNameUnique = (name) => {
		const equalName = (s) => s.name.toLowerCase() === name.toLowerCase();
		const { consumers, producers, connectors } = this.props.streams;
		return !consumers.some(equalName) && !producers.some(equalName) && !connectors.some(equalName);
	};

	validateName = (name) => {
		if (!name || name.length < 1) {
			return this.ERROR_MESSAGES.EMPTY;
		}
		if (!this.isNameUnique(name)) {
			return this.ERROR_MESSAGES.DUPLICATE;
		}
		return '';
	};

	handleCancel = () => {
		this.reset();
		this.props.onClose();
	};

	handleClose = () => {
		const model = this.state.stream;
		const provider = this.getProvider();

		if (provider) {
			validate(provider.id, this.props.type, model.toJSON()).then((result) => {
				if (result.valid) {
					Object.entries(result.fieldUpdates).forEach(([key, value]) => model.setFieldValue(key, value));
					this.setState({ fieldErrors: undefined });
					this.props.saveConfiguration(model);
					this.reset();
					this.props.onClose();
				} else {
					this.setState({ fieldErrors: result.fieldErrors });
					console.log(result);
				}
			});
		}
	};

	getProvider() {
		if (this.state.stream === undefined) {
			return undefined;
		}
		return this.props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration].find(
			(p) => p.id === this.state.stream.provider.id
		);
	}

	getProviderInfo() {
		const provider = this.getProvider();

		return provider ? `Provider: ${provider ? provider.name : ''}` : '';
	}

	getStreamFields(fc, advanced) {
		if (!this.props.stream) {
			// no selection
			return <div />;
		}

		return advanced
			? fc.getComponents(this.state.stream, !this.props.canEdit).advanced
			: fc.getComponents(this.state.stream, !this.props.canEdit).main;
	}

	getConnectorFields(fc) {
		if (this.state.stream.className === 'ConnectorConfiguration') {
			return null;
		}

		const alternatives = StreamHelper.getBaseAlternatives(this.props.streams, this.state.stream);

		return (
			<div style={{ width: 'calc(100% - 150px)' }}>
				{fc.getSelect(
					new Field({
						id: 'connector.id',
						label: {
							en: 'Connector',
							de: 'Konnektor'
						},
						options: alternatives
					}),
					this.state.stream.connector.id,
					!this.props.canEdit
				)}
			</div>
		);
	}

	toggleAdvanced = () => {
		this.setState({ showAdvanced: !this.state.showAdvanced });
	};

	onUpdateConfiguration = (config) => {
		this.setState({ stream: config });
	};

	render() {
		const { open, canEdit, onClose } = this.props;
		if (!open) {
			return <div />;
		}
		const { error, stream, fieldErrors } = this.state;

		const modelProps = {
			locale: this.props.intl.locale,
			handleChange: this.onUpdateConfiguration,
			...this.props
		};

		const fc = new StreamFieldComponents(modelProps, fieldErrors);

		return (
			<Dialog open={open} onClose={onClose} maxWidth={false}>
				<DialogTitle>
					<StreamSettingsTitle stream={this.state.stream} />
				</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						minWidth: '600px'
					}}
				>
					<div>
						<Typography style={{ fontSize: '0.85rem', marginTop: '16px' }}>
							{this.getProviderInfo()}
						</Typography>
						{this.getConnectorFields(fc)}
					</div>
					<div>
						<TextField
							style={{
								width: '30%',
								marginRight: '20px'
							}}
							inputRef={(el) => {
								this.nameRef = el;
							}}
							label={<FormattedMessage id="Stream.Name" defaultMessage="Name" />}
							id="name"
							name="name"
							disabled={!this.props.canEdit}
							margin="normal"
							value={stream.name}
							onChange={this.handleNameChange}
							error={typeof error === 'string' && error.length > 0}
							helperText={error}
						/>
						<TextField
							style={{
								width: '66%'
							}}
							label={<FormattedMessage id="Stream.Description" defaultMessage="Description" />}
							id="description"
							name="description"
							disabled={!this.props.canEdit}
							multiline
							margin="normal"
							value={stream.description}
							onChange={this.handleDescriptionChange}
						/>
					</div>
					{fc.getCheckBox(
						new Field({
							id: 'disabled',
							label: {
								en: 'Disabled',
								de: 'Deaktiviert'
							}
						}),
						this.state.stream.disabled || !canEdit
					)}
					<div>
						{this.getStreamFields(fc, false)}
						{/* eslint-disable-next-line no-nested-ternary */}
						{this.state.showAdvanced ? (
							<Button
								style={{ marginTop: '15px', border: 'none' }}
								variant="outlined"
								size="small"
								fullWidth
								onClick={this.toggleAdvanced}
							>
								<ExpandLess />
								<FormattedMessage
									id="Stream.HideExtendedSettings"
									defaultMessage="Hide Extended Settings"
								/>
							</Button>
						) : (
							<Button
								style={{ marginTop: '15px', border: 'none' }}
								variant="outlined"
								size="small"
								fullWidth
								onClick={this.toggleAdvanced}
							>
								<ExpandMore />
								<FormattedMessage
									id="Stream.ShowExtendedSettings"
									defaultMessage="Show Extended Settings"
								/>
							</Button>
						)}
						{this.state.showAdvanced ? this.getStreamFields(fc, true) : null}
					</div>
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={() => this.handleCancel()}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button color="primary" size="small" onClick={this.handleClose} disabled={false}>
						<FormattedMessage id="OK" defaultMessage="OK" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(
	withStyles(styles, { withTheme: true })(
		connect(
			null,
			mapDispatchToProps
		)(StreamSettings)
	)
);
