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
import ImportIcon from '@material-ui/icons/CloudDownload';
import PropTypes from 'prop-types';
import React from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { NotAllowed, Restricted } from '../HelperComponent/Restricted';

const convertLegacyFormat = (json) => ({
	machines: [json.data],
	streams: [],
});

class ImportDropzone extends React.Component {
	static propTypes = {
		children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
		showErrorDialog: PropTypes.func.isRequired,
		showImportDialog: PropTypes.func.isRequired,
		enableClick: PropTypes.bool,
	};

	static defaultProps = {
		children: null,
		enableClick: false,
	};

	handleImport = (acceptedFiles) => {
		if (acceptedFiles.length === 1) {
			const fileReader = new FileReader();
			fileReader.onload = (event) => {
				const { result } = event.target;
				try {
					const parsedResult = JSON.parse(result);
					if (parsedResult.machines) {
						this.props.showImportDialog(parsedResult);
					} else if (parsedResult.data.machine) {
						// Import legacy format
						this.props.showImportDialog(convertLegacyFormat(parsedResult));
					} else {
						throw new Error('Invalid import file');
					}
				} catch (e) {
					this.props.showErrorDialog('Import.Error.InvalidFile.Title', 'Import.Error.InvalidFile.Message');
				}
			};
			fileReader.readAsText(acceptedFiles[0]);
		} else if (acceptedFiles.length > 1) {
			// Only one file at a time can be imported
			this.props.showErrorDialog('Import.Error.OnlyOneFile.Title', 'Import.Error.OnlyOneFile.Message');
		}
	};

	render() {
		return (
			<Restricted
				all={['stream', 'machine.edit']}
			>
				<NotAllowed style={{ width: '100%', height: '100%' }}>{this.props.children}</NotAllowed>
				<Dropzone
					disableClick={!this.props.enableClick}
					accept="application/json"
					onDropAccepted={this.handleImport}
					style={{ width: '100%', height: '100%' }}
				>
					{({ isDragAccept }) => (
						<div style={{ width: '100%', height: '100%' }}>
							{isDragAccept ? (
								<div
									style={{
										position: 'absolute',
										width: '100%',
										height: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: 'rgba(255, 255, 255, 0.3)',
										zIndex: 1,
									}}
								>
									<ImportIcon
										style={{
											color: 'rgba(0, 0, 0, 0.7)',
											fontSize: '100pt',
										}}
									/>
								</div>
							) : null}
							{this.props.children}
						</div>
					)}
				</Dropzone>
			</Restricted>
		);
	}
}

function mapStateToProps() {
	return {};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(ImportDropzone);
