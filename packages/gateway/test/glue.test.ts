import glue from '../src/glue';
import { BaseUserApi, User } from '../src/user';
import { GlobalContext } from '../src/streamsheets';

describe('glue', () => {
	test('returns api and auth', async () => {
		const { api, auth } = glue({ rawApi: { user: BaseUserApi }, rawAuth: {} } as GlobalContext, {} as User);
		expect(api).toBeDefined();
		expect(api.user).toBeDefined();
		expect(auth).toBeDefined();
	});
});
