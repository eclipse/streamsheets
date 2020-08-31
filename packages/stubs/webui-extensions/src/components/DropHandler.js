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
import React from 'react';
import Dropzone from 'react-dropzone';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';

// TODO: rename - OnSheetDropHandler??
class DropHandler extends React.Component {
	// eslint-disable-next-line
	handleDrop(files, param2, param3) {
		gatewayClient.sendMachineAction('SkZV31LfXv', {
			// action unique type
			type: 'timescale.import',
			// action dependent data
			data: {
				table: 'table123',
				data: 'csv stuff'
			}
		});
	}

	// onDragEnter(event) {}
	// onDragLeave(event) {}
	onDragOver(/* event */) {
		// TODO: check if we are over a sheet and if we have drophandler for it registered 
		// prevent drop => wrap in own state to track to prevent flickering!!!
		// this.setState({
		// 	isDragActive: false,
		// 	draggedFiles: []
		// });
	}

	render() {
		return (
			// TODO: check restriction:
			// <Restricted
			// 	all={['stream', 'machine.edit']}
			// >
			// <NotAllowed style={{ width: '100%', height: '100%' }}>{this.props.children}</NotAllowed>
			<Dropzone
				disableClick={!this.props.enableClick}
				// accept="application/csv"
				onDropAccepted={this.handleDrop}
				onDragOver={this.onDragOver}
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
									zIndex: 1
								}}
							>
								<ImportIcon
									style={{
										color: 'rgba(0, 0, 0, 0.7)',
										fontSize: '100pt'
									}}
								/>
							</div>
						) : null}
						{this.props.children}
					</div>
				)}
			</Dropzone>
		);
	}
}

export default DropHandler;
