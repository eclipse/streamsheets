/* eslint-disable react/prop-types */
import { Field } from '@cedalo/sdk-streams';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import Button from '@material-ui/core/Button';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';
import Divider from '@material-ui/core/es/Divider/Divider';
import StreamHelper from '../../../helper/StreamHelper';
import styles from '../styles';
import { accessManager } from '../../../helper/AccessManager';

const { RESOURCE_ACTIONS } = accessManager;

class StreamForm extends Component {

	state = {
		showAdvanced: false,
	};

	get modelType() {
		const { model } = this.props;
		switch (model.className) {
			case 'ConsumerConfiguration':
				return 'consumer';
			case 'ProducerConfiguration':
				return 'producer';
			case 'ConnectorConfiguration':
				return 'connector';
			default:
				return '';
		}
	}

	toggleAdvanced = () => {
		this.setState({ showAdvanced: !this.state.showAdvanced });
	};

	isConnnector() {
		const { model } = this.props;
		return model.className === 'ConnectorConfiguration';
	}

	isConsumer() {
		const { model } = this.props;
		return model.className === 'ConsumerConfiguration';
	}

	render() {
		const {showAdvanced} = this.state;
		const canEdit = accessManager.can(this.modelType,
			RESOURCE_ACTIONS.EDIT);
		const disabled = this.props.disabled || !canEdit;
		const { fc, model } = this.props;
		if (!model) {
			return (
				<div className="loader">
					<FormattedMessage id="Admin.noConfiguration"
					                  defaultMessage="No configuration selected"/>
				</div>
			);
		}
		const provider = StreamHelper.getProviderForModel(model,
			this.props);
		if (!provider) {
			return (
				<div>
					<FormattedMessage id="Admin.noProvider"
					                  defaultMessage="No provider found!"/>
				</div>
			);
		}
		const providerField = new Field(
			{ id: 'provider.name', label: 'Provider' });
		return <div style={styles.container}>
			{!this.isConnnector() ? null : fc.getTextField(
				providerField, provider.name, true)}


			{fc.getComponents(model, disabled).main}

			<Divider/>

			{!this.state.showAdvanced ?
				<Button style={{marginTop:'15px', border: 'none'}} variant="outlined" size="small" fullWidth
				        onClick={this.toggleAdvanced}>
					<ExpandMore/>
					<FormattedMessage id="More" defaultMessage="More"/>
				</Button> :
				<Button style={{marginTop:'15px', border: 'none'}} variant="outlined" size="small" fullWidth
				      onClick={this.toggleAdvanced}>
					<ExpandLess/>
					<FormattedMessage id="Less" defaultMessage="Less"/>
				</Button>
			}

			{!showAdvanced ? null :
				fc.getComponents(model, disabled).advanced
			}

			{!showAdvanced ? null : [
				<Divider/>,
				fc.getSelect(
					new Field({
						id: 'mimeType',
						label: {
							en: 'Data Format',
							de: 'Datei Format',
						},
						options: [
							{
								label: 'Auto',
								value: 'auto',
							},
							{
								label: 'JSON',
								value: 'application/json',
							},
							{
								label: 'XML',
								value: 'application/xml',
							},
							{
								label: 'STRING',
								value: 'text/plain',
							},
						],
						defaultValue: 'auto',
					}),
					model.mimeType || 'auto', disabled
				),
				!this.isConsumer() ? null :  fc.getSelect(
						new Field({
							id: 'contentEncoding',
							label: {
								en: 'Content Encoding',
							},
							options: [
								{
									label: 'utf8',
									value: 'utf8',
								},
								{
									label: 'hex',
									value: 'hex',
								},
								{
									label: 'ascii',
									value: 'ascii',
								},
								{
									label: 'base64',
									value: 'base64',
								},
								{
									label: 'utf16le',
									value: 'utf16le',
								},
								{
									label: 'latin1',
									value: 'latin1',
								},
								{
									label: 'binary',
									value: 'binary',
								},
							],
							defaultValue: 'utf8',
						}),
						model.contentEncoding || 'utf8', disabled
				),
				/*
				!this.isConsumer() ? null : fc.getTextArea(
					new Field({
						id: 'filter',
						label: {
							en: 'Filter',
							de: 'Filter',
						},
					}),
					model.filter,
					disabled,
				),
				!this.isConsumer() ? null : fc.getTextArea(
					new Field({
						id: 'labelAttribute',
						label: {
							en: 'Label Attribute',
							de: 'Label Eigenschaft',
						},
					}),
					model.labelAttribute,
					disabled,
				),
				!this.isConsumer() ? null : fc.getTextArea(
					new Field({
						id: 'idAttribute',
						label: {
							en: 'ID Attribute',
							de: 'ID Eigenschaft',
						},
					}),
					model.idAttribute,
					disabled,
				),
				!this.isConsumer() ? null : fc.getNamedList(
					new Field({
						id: 'samplePayloads',
						label: {
							en: 'Sample Payloads',
							de: 'Beispieldaten',
						},
					}),
					model.samplePayloads,
					disabled,
				),
				*/
			]}
		</div>;
	}
}

export default StreamForm;
