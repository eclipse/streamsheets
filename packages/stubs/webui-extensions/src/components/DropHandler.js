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
// import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import { graphManager } from '@cedalo/webui/src/GraphManager';
import TimescaleImportHandler from './TimescaleImportHandler';
import { GraphUtils } from '@cedalo/jsg-core';
// import DropHandlerRegistry from './DropHandlerRegistry';
import TimescaleDropHandler from './handlers/TimescaleDropHandler';

// const handleMachineAction = (machineId = 'SkZV31LfXv') => (ev) => {
// 	// gatewayClient.sendMachineAction(machineId, {
// 	// 	// action unique type
// 	// 	type: 'timescale.import',
// 	// 	// action dependent data
// 	// });
// 	// const data = {
// 	// 	table: 'table123',
// 	// 	data: ev.target.result
// 	// }
// 	TimescaleImportHandler.handleDrop({ machineId, file });
// }
// const getSheetId = (sheetContainer) => sheetContainer.getStreamSheetContainerAttributes().getSheetId().getValue();
// const getMachineId = () => 'SkZV31LfXv';
// const toGraph = (graph) => (from) => {
// 	const bbox = from.getBoundingBox();
// 	GraphUtils.traverseItemUp(from, graph, (item) => {
// 		item.translateBoundingBoxToParent(bbox);
// 		return true;
// 	});
// 	return bbox;
// };
const getStreamSheets = () => {
	const sheets = [];
	const graph = graphManager.getGraph();
	const sheetsContainer = graph && graph.getStreamSheetsContainer();
	if (sheetsContainer) {
		sheetsContainer.enumerateStreamSheetContainers((sheet) => {
			sheets.push(sheet.getStreamSheet());
		});
	}
	return sheets;
	// => [StreamsheetContainer]
	// => StreamsheetContinaer.getStreamSheet()
	// => sheetId = 
};
// const getDropTarget = (sheets, target) => {
// 	const graph = graphManager.getGraph();
// 	const targets = sheets.filter((sheet) => true);
// 	return targets[0];
// };
const createDragContext = (sheetBounds) => ({
	sheetBounds
});
let dragContext = {};
// TODO: rename - (On)SheetDropHandler??
class DropHandler extends React.Component {

	handleDrop(files, ...params) {
		console.log(`remaining params: ${params.length}`);
		// only allow one file?
		const file = files[0];
		// const sheets = getSheets();
		// const target = getDropTarget(sheets, undefined);
		if (file) {
			const sheetId = undefined;
			const machineId = 'SkZV31LfXv';
			TimescaleImportHandler.handleDrop({ machineId, sheetId, file });

			// const reader = new FileReader();
			// reader.addEventListener('load', handleMachineAction('SkZV31LfXv'), false);
			// // base64 encoded:
			// reader.readAsDataURL(file);
			// // or use alternative:
			// // reader.readAsArrayBuffer(file);
			// // reader.readAsText(file);
			// // reader.readAsBinaryString(file);
		}
	}

	onDragEnter(/* event */) {
		// create possible drag targets
		const sheets = getStreamSheets();
		// const viewer = graphManager.getGraphViewer();
		// const traverseUp = toGraph(graphManager.getGraph());
		// const bounds = sheets.map((sheet) => {
		// 	const bbox = traverseUp(sheet);
		// 	viewer.translateToRoot(bbox.getTopLeft(),viewer.getGraphView());
		// 	return bbox;
		// });
		const bounds = sheets.map((sheet) =>
			GraphUtils.translateToCanvasRect(graphManager.getGraphEditor(), sheet)
		);
		dragContext = createDragContext(bounds);
	}
	// onDragLeave(event) {}
	onDragOver(event, ...params) {
		// TODO: check if we are inside streamsheet bounds
		// const loc
		// me.location.set(me.cs.deviceToLogX(me.location.x), me.cs.deviceToLogY(me.location.y));


		console.log(`remaining params: ${params.length}`);
		const pt = { x: event.clientX, y: event.clientY };
		const pt1 = { x: event.pageX, y: event.pageY };
		const pt2 = { x: event.screenX, y: event.screenY };
		const cs = graphManager.getGraphEditor().getCoordinateSystem();
		const pt3 = {
			x: cs.logToDeviceX(cs.deviceToLogX(event.clientX)),
			y: cs.logToDeviceY(cs.deviceToLogY(event.clientY))
		};
		// get first index of sheet which contains our point:
		if (dragContext.sheetBounds) {
			let index = -1;
			dragContext.sheetBounds.some((rect, idx) => {
				if (rect.containsPoint(pt)) { 
					index = idx;
					console.log('pt contained');
				}
				if (rect.containsPoint(pt1)) { 
					index = idx;
					console.log('pt1 contained');
				}
				if (rect.containsPoint(pt2)) { 
					index = idx;
					console.log('pt2 contained');
				}
				if (rect.containsPoint(pt3)) { 
					index = idx;
					console.log('pt3 contained');
				}
				return index < 0;
			});
			if (index < 0) {
				console.log(`DISABLE drop on sheet!`);
			// } else {
			// 	// enable drop...
			// 	console.log(`enable drop on sheet!`);
			}
		}
		// const target = getDropTarget(sheets, undefined);
		// event.pageX, event,pageY
		// event.clientX, event,clientY
		// event.screenX, event,screenY
		// TODO: check if we are over a sheet and if we have drophandler for it registered 
		// prevent drop => wrap in own state to track to prevent flickering!!!
		// this.setState({
		// 	isDragActive: false,
		// 	draggedFiles: []
		// });
	}

	render2() {
		// renders nothing....
		return this.props.children(this.state);
	}

	render() {
		const isDisabled = false;
		return (
			// TODO: check restriction:
			// <Restricted
			// 	all={['stream', 'machine.edit']}
			// >
			// <NotAllowed style={{ width: '100%', height: '100%' }}>{this.props.children}</NotAllowed>
			<div>
			<TimescaleDropHandler tables={[]} />
			<Dropzone
				disabled={isDisabled}
				disableClick={!this.props.enableClick}
				// accept="application/csv"
				onDropAccepted={this.handleDrop}
				onDragEnter={this.onDragEnter}
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
			</div>
		);
	}
}

export default DropHandler;
