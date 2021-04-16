/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import JSG from '@cedalo/jsg-ui';
import { graphManager } from '../../GraphManager';
import * as Actions from '../../actions/actions';

const { Notification, NotificationCenter } = JSG;

const sendNotification = (command, type, commandStack) => {
	// eslint-disable-next-line
	NotificationCenter.getInstance().send(
		new Notification(commandStack.STACK_CHANGED_NOTIFICATION, { command, type, commandStack })
	);
};

// const sendCmd = (graphWrapperORG) => (cmd, request, onError) => {
const sendCommand = (cmd, request, onError) => {
	const graphWrapper = graphManager.graphWrapper;
	Actions.sendCommand(graphWrapper.id, request, graphWrapper.machineId)
		.then((response) => cmd.handleResult(response.machineserver.result))
		.catch((err) => onError(err))
		// TODO: review => maybe not necessary if we improve communication...
		.finally(() => graphManager.redraw());
};
const isRequest = (cmd) => cmd && cmd.isRequest;
const popUndo = (stack) => (type, cmd) => () => {
	const oldsize = stack.undostack.length;
	stack.undostack.pop();
	if (stack.undostack.length !== oldsize) sendNotification(cmd, type, stack);
};
const popRedo = (stack) => (type, cmd) => () => {
	const oldsize = stack.redostack.length;
	stack.redostack.pop();
	if (stack.redostack.length !== oldsize) sendNotification(cmd, type, stack);
};
const handleError = (...fn) => (err) => {
	fn.forEach((f) => f(err));
};

const RequestCommandStack = (BaseStack) =>
	class extends BaseStack {
		constructor() {
			super();
			this.popRedo = popRedo(this);
			this.popUndo = popUndo(this);
		}

		execute(cmd) {
			super.execute(cmd);
			if (isRequest(cmd)) {
				const req = cmd.getExecuteRequest();
				sendCommand(cmd, req, handleError(cmd.handleError.bind(cmd), this.popUndo('execute', cmd)));
			}
		}
		redo() {
			const cmd = super.redo();
			if (isRequest(cmd)) {
				const req = cmd.getRedoRequest();
				sendCommand(cmd, req, handleError(cmd.handleError.bind(cmd), this.popUndo('redo', cmd)));
			}
			return cmd;
		}

		undo() {
			const cmd = super.undo();
			if (isRequest(cmd)) {
				const req = cmd.getUndoRequest();
				sendCommand(cmd, req, handleError(cmd.handleError.bind(cmd), this.popRedo('undo', cmd)));
			}
			return cmd;
		}
	};

export default RequestCommandStack;
