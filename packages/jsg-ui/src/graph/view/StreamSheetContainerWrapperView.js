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
// import {default as JSG, FormatAttributes, TextFormatAttributes} from '@cedalo/jsg-core';

import NodeView from './NodeView';

export default class StreamSheetContainerWrapperView extends NodeView {

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);
		if (this.getItem()._tmpCont) {
			const view = this.getItem()._tmpCont.getView();
			view.drawSubViews(graphics);
		}
	}
}
