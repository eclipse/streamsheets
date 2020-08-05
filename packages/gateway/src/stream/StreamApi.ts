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
import { FunctionObject, PartialApply1All } from '../common';
import { ID, RequestContext, Scope } from '../streamsheets';
import { Stream, StreamCommandRequest } from './types';
import { StreamValidationResult } from './StreamRepositoryProxy';

export interface StreamApi extends FunctionObject {
	findById(context: RequestContext, scope: Scope, id: ID): Promise<Stream | null>;
	findByName(context: RequestContext, scope: Scope, name: string): Promise<Stream | null>;
	findAllStreams(context: RequestContext, scope: Scope): Promise<Array<Stream>>;
	executeStreamCommand(context: RequestContext, scope: Scope, command: StreamCommandRequest['cmd']): Promise<any>;
	saveStream(context: RequestContext, scope: Scope, stream: Stream): Promise<any>;
	deleteStream(context: RequestContext, scope: Scope, id: ID): Promise<any>;
	reloadStreams(context: RequestContext, scope: Scope, streams: ID[]): Promise<any>;
	handleStreamEvent(context: RequestContext, event: any): Promise<any | null>;
	validateStream(context: RequestContext, provider: string, type: string, config: object): Promise<StreamValidationResult>;
}
export type StreamApiApplied = PartialApply1All<StreamApi>;

export const StreamApi: StreamApi = {
	findAllStreams: async ({ auth, streamRepo }: RequestContext, scope: Scope) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return [];
		}
		const streams: Stream[] = await streamRepo.findAllStreams();
		const streamsInScope = streams.filter(
			(stream) => auth.isInScope(scope, stream) || stream.className === 'ProviderConfiguration'
		);
		return streamsInScope;
	},
	findByName: async ({ auth, streamRepo }, scope: Scope, name: string) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		const streams = await streamRepo.findByName(name);
		if (!streams) {
			return null;
		}
		const [stream] = streams.filter((s: Stream) => auth.isInScope(scope, s));
		return stream || null;
	},
	providers: async ({ auth, streamRepo }, scope: Scope) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return [];
		}
		const providers = streamRepo.providers();
		return providers;
	},
	findById: async ({ auth, streamRepo }, scope: Scope, id: ID) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		const stream = await streamRepo.findById(id);
		if (!stream) {
			return null;
		}
		return auth.isInScope(scope, stream) ? stream : null;
	},
	executeStreamCommand: async ({ auth, streamRepo }, scope, command) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		const stream = await streamRepo.findById(command.streamId);
		if (!stream || !auth.isInScope(scope, stream)) {
			return null;
		}
		const result = await streamRepo.executeStreamCommand(command);
		return result;
	},
	saveStream: async ({ auth, streamRepo }, scope: Scope, stream: Stream) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		stream.scope = scope;
		const result = await streamRepo.saveStream(stream);
		return result;
	},
	deleteStream: async ({ auth, streamRepo }, scope: Scope, id: ID) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		const stream = await streamRepo.findById(id);
		if (!stream || !auth.isInScope(scope, stream)) {
			return null;
		}
		const result = await streamRepo.deleteStream(id);
		return result;
	},
	reloadStreams: async ({ auth, streamRepo }, scope: Scope, toReload) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		const streams: Stream[] = await streamRepo.findAllStreams();
		const allowedToReload = streams
			.filter((stream) => auth.isInScope(scope, stream) && toReload.includes(stream.name))
			.map((stream) => stream.id);
		if (streams.length > 0) {
			await streamRepo.reloadStreams(allowedToReload);
		}
	},
	validateStream: async ({ streamRepo }, provider: string, type: string, config: object) => {
		const result = await streamRepo.validateStream(provider, type, config);
		return result;
	},
	handleStreamEvent: async ({ actor, auth }: RequestContext, event: any): Promise<any | null> => event
};
