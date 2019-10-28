const ARRAY = require('./array');
const BAR = require('./bar');
const colors = require('./colors');
const { copyvalues, movevalues, swapvalues } = require('./copymoveswapvalues');
const DELETE = require('./delete');
const DELETECELLS = require('./deletecells');
const detectchange = require('./detectchange');
const DICTIONARY = require('./dictionary');
const EXECUTE = require('./execute');
const FEEDINBOX = require('./feedinbox');
const GETCYCLETIME = require('./getcycletime');
const counters = require('./counters');
const GOTO = require('./goto');
const INBOX = require('./inbox');
const INBOXDATA = require('./inboxdata');
const INBOXJSON = require('./inboxjson');
const INBOXMETADATA = require('./inboxmetadata');
const JSON = require('./json');
const { loopcount, loopindex } = require('./loop');
const MAX = require('./max');
const MIN = require('./min');
const MSTOSERIAL = require('./mstoserial');
const OUTBOX = require('./outbox');
const {
	olapdblist,
	olapdbcreate,
	olapdbdelete,
	olapcubelist,
	olapcubecreate,
	olapcubedelete,
	olapdimlist,
	olapdimcreate,
	olapdimdelete,
	olapdimname,
	olapename,
	olapecreate,
	olapeconsolidate,
	olapedelete,
	olapedeleteall,
	olapdata,
	olapdatas,
	olapsetdata,
	olapslice,
	olapslicedelete,
	olapcubedimlist,
	olaplogin,
	olaplogout,
	olapserversave,
	select
} = require('./olap');
const OUTBOXDATA = require('./outboxdata');
const OUTBOXJSON = require('./outboxjson');
const PRODUCE = require('./produce');
const READ = require('./read');
const REFRESH = require('./refresh');
const { request, requestinfo } = require('./request');
const { respond } = require('./respond');
const RETURN = require('./return');
const SAVEDRAWING = require('./savedrawing');
const SERIALTOMS = require('./serialtoms');
const SETCYCLETIME = require('./setcycletime');
const SETPHASE = require('./setphase');
const SETVALUE = require('./setvalue');
const SPLIT = require('./split');
const {
	stackadd,
	stackdrop,
	stackfind,
	stackrotate,
	stacksort
} = require('./stack');
const timeaggregate = require('./timeaggregate');
const KAFKACOMMAND = require('./kafkacommand');
const KAFKAQUERY = require('./kafkaquery');
const SUBTREE = require('./subtree');
const SUM = require('./sum');
const WEBPAGE = require('./webpage');
const WRITE = require('./write');
const ERROR = require('./errors');
const excelfunctions = require('./excel');

module.exports = {
	...colors,
	...counters,
	...detectchange,
	...excelfunctions,
	ARRAY,
	BAR,
	COPYVALUES: copyvalues,
	DELETE,
	DELETECELLS,
	DICTIONARY,
	EXECUTE,
	FEEDINBOX,
	GETCYCLETIME,
	GOTO,
	INBOX,
	INBOXDATA,
	INBOXJSON,
	INBOXMETADATA,
	JSON,
	LOOPCOUNT: loopcount,
	LOOPINDEX: loopindex,
	MAX,
	MIN,
	MOVEVALUES: movevalues,
	MSTOSERIAL,
	OLAPDBLIST: olapdblist,
	OLAPDBCREATE: olapdbcreate,
	OLAPDBDELETE: olapdbdelete,
	OLAPDIMLIST: olapdimlist,
	OLAPDIMCREATE: olapdimcreate,
	OLAPDIMDELETE: olapdimdelete,
	OLAPDIMNAME: olapdimname,
	OLAPENAME: olapename,
	OLAPECREATE: olapecreate,
	OLAPECONSOLIDATE: olapeconsolidate,
	OLAPEDELETE: olapedelete,
	OLAPEDELETEALL: olapedeleteall,
	OLAPDATA: olapdata,
	OLAPDATAS: olapdatas,
	OLAPSETDATA: olapsetdata,
	OLAPSLICE: olapslice,
	OLAPSLICEDELETE: olapslicedelete,
	OLAPCUBELIST: olapcubelist,
	OLAPCUBECREATE: olapcubecreate,
	OLAPCUBEDELETE: olapcubedelete,
	OLAPCUBEDIMLIST: olapcubedimlist,
	OLAPLOGIN: olaplogin,
	OLAPLOGOUT: olaplogout,
	OLAPSERVERSAVE: olapserversave,
	OUTBOX,
	OUTBOXDATA,
	OUTBOXJSON,
	PRODUCE,
	READ,
	REFRESH,
	REQUEST: request,
	REQUESTINFO: requestinfo,
	RESPOND: respond,
	RETURN,
	SELECT: select,
	SAVEDRAWING,
	SERIALTOMS,
	SETCYCLETIME,
	SETPHASE,
	SETVALUE,
	SPLIT,
	STACKADD: stackadd,
	STACKDROP: stackdrop,
	STACKFIND: stackfind,
	STACKROTATE: stackrotate,
	STACKSORT: stacksort,
	SUBTREE,
	SUM,
	SWAPVALUES: swapvalues,
	TIMEAGGREGATE: timeaggregate,
	WEBPAGE,
	WRITE,
	KAFKACOMMAND,
	KAFKAQUERY,
	// currently deprecated functions, but in case old machines are loaded...
	STOP: () => ERROR.NAME,
	JSONKEY: () => ERROR.NAME,
	READJSON: () => ERROR.NAME,
	REMOVE: () => ERROR.NAME,
	STORE: () =>  ERROR.NAME,
	WRITEJSON: () => ERROR.NAME
};
