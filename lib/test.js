"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Interval_1 = __importDefault(require("./Interval"));
const Layer_1 = __importDefault(require("./Layer"));
const Collector_1 = __importDefault(require("./Collector"));
const SchemeDB_1 = __importDefault(require("./SchemeDB"));
const LayerStorage_1 = __importStar(require("./LayerStorage/LayerStorage"));
const MetricResult_1 = __importDefault(require("./MetricResult"));
const MetricWrite_1 = __importDefault(require("./MetricWrite"));
const IntervalMs_1 = __importDefault(require("./IntervalMs"));
const SingleDB_1 = __importDefault(require("./SingleDB"));
ErrorManager_1.default.register('1234567891012', 'TEST_ERROR', 'Test error register');
// TEST new test error make - worked
// throw ErrorManager.make(new Error, 'TEST_ERROR', { add: 'test' })
console.log('ERRORS TEST: ');
const anyString = 'qwe';
const DB = new SchemeDB_1.default();
const errorTests = [
    { func: () => { new Layer_1.default({ interval: 123, period: 22 }); }, name: 'VDB_LAYER_SIZE' },
    { func: () => { new Layer_1.default({ interval: 1, period: 22.23 }); }, name: 'VDB_LAYER_INITIAL_DATA' },
    { func: () => { const a = new Layer_1.default({ interval: 1, period: 22 }); a.write(123, anyString); }, name: 'VDB_LAYER_VALUE' },
    { func: () => { const a = new Layer_1.default({ interval: 1, period: 22 }); a.write(anyString, 123); }, name: 'VDB_LAYER_TIME' },
    { func: () => { const a = new Layer_1.default({ interval: 1, period: 22 }); a.readCustomInterval(22, 123, anyString); }, name: 'VDB_LAYER_PRECISION' },
    { func: () => { const a = new Layer_1.default({ interval: 1, period: 22 }); a.readCustomInterval(125, 123, 1); }, name: 'VDB_LAYER_SECTION' },
    { func: () => { Interval_1.default.getIntervals(1, 5, 2.25); }, name: 'VDB_INTREVAL_PRECISION' },
    { func: () => { Interval_1.default.getIntervals(1, 5.25, 2); }, name: 'VDB_INTREVAL_TIME' },
    { func: () => { Interval_1.default.getIntervals(5, 1, 1); }, name: 'VDB_INTREVAL_SECTION' },
    { func: () => { Interval_1.default.period('now2s'); }, name: 'VDB_INTREVAL_PERIOD' },
    { func: () => { Interval_1.default.period('noww:now-2s'); }, name: 'VDB_INTREVAL_PARSE' },
    { func: () => { Interval_1.default.retentions('10s:1h, 1m1d'); }, name: 'VDB_INTREVAL_RETENTION' },
    { func: () => { LayerStorage_1.default.make(anyString, LayerStorage_1.StorageTypes.Bit, 10); }, name: 'VDB_LAYER_STORAGE_TYPE' },
    { func: () => { const col = new Collector_1.default(); col.init({ name: 'qwe!s', retentions: '10s:1h' }); }, name: 'VDB_COLLECTOR_METRIC_NAME' },
    { func: () => { const col = new Collector_1.default(); col.init({ name: 'qwe', retentions: '10s:1h' }); col.read('qwe22', 1, 10, 1); }, name: 'VDB_COLLECTOR_NOT_FOUND' },
    { func: () => { DB.scheme({ name: 'qwe!', pattern: 'qwe.test', retentions: '1s:10s' }); }, name: 'VDB_SCHEMETREE_NAME' },
    { func: () => { DB.scheme({ name: 'qwe', pattern: 'qw!e.test', retentions: '1s:10s' }); }, name: 'VDB_SCHEMETREE_SCHEME_PATTERN' },
    { func: () => { DB.schemeDestroy('default'); }, name: 'VDB_SCHEMETREE_SCHEME_SAFE' },
    { func: () => { DB.schemeDestroy('222'); }, name: 'VDB_SCHEMETREE_NOT_FOUND' },
    { func: () => { DB.scheme({ name: 'qwe', pattern: 'qwe.test', retentions: '1s:10s' }); DB.scheme({ name: 'qwe', pattern: 'qwe.test', retentions: '1s:10s' }); }, name: 'VDB_SCHEMETREE_SCHEME_DUBLICATE' },
    { func: () => { const s = DB.read('test', 'now-1h:now', 15); MetricResult_1.default.aggregate(s, 'www'); }, name: 'VDB_METRIC_AGGREGATE_TYPE' },
    { func: () => { MetricWrite_1.default.modify(1, 2, 'qqq'); }, name: 'VDB_METRIC_MODIFY_TYPE' },
];
for (const tf of errorTests) {
    if (ErrorManager_1.default.test(tf.func, tf.name)) {
        console.log(' [OK]\t', tf.name);
        continue;
    }
    console.log('!NOT OK!', tf.name);
}
console.log('LAY TEST: ');
const lay = new Layer_1.default({ interval: 10, period: 100 });
lay.write(10, 10);
lay.write(20, 20);
lay.write(30, 30);
lay.write(40, 40);
lay.write(50, 50);
const res = lay.readInterval(lay.startTime, lay.endTime);
console.table(res.rows);
// LAY TEST: 
// ┌─────────┬──────┬───────┐
// │ (index) │ time │ value │
// ├─────────┼──────┼───────┤
// │ 0       │ -40  │ 0     │
// │ 1       │ -30  │ 0     │
// │ 2       │ -20  │ 0     │
// │ 3       │ -10  │ 0     │
// │ 4       │ 0    │ 0     │
// │ 5       │ 10   │ 10    │
// │ 6       │ 20   │ 20    │
// │ 7       │ 30   │ 30    │
// │ 8       │ 40   │ 40    │
// │ 9       │ 50   │ 50    │
// └─────────┴──────┴───────┘
console.log('Collector TEST:');
const col = new Collector_1.default();
col.init({ name: 'test', retentions: '1s:5s, 2s:20s' });
for (let i = 1; i <= 9; i++) {
    col.write('test', i, i);
}
const res3 = col.read('test', 1, 9, 1, 'avg');
console.table(res3.rows);
col.clear('test');
const res4 = col.read('test', 1, 9, 1, 'avg');
console.table(res4.rows);
console.log('size: ', col.size('test'));
console.log('has: ', col.has('test'), col.has('test2'));
col.destroy('test');
// Collector TEST:
// ┌─────────┬──────┬───────┐
// │ (index) │ time │ value │
// ├─────────┼──────┼───────┤
// │ 0       │ 1    │ 1     │
// │ 1       │ 2    │ 3     │
// │ 2       │ 3    │ 3     │
// │ 3       │ 4    │ 5     │
// │ 4       │ 5    │ 5     │
// │ 5       │ 5    │ 5     │
// │ 6       │ 6    │ 6     │
// │ 7       │ 7    │ 7     │
// │ 8       │ 8    │ 8     │
// │ 9       │ 9    │ 9     │
// └─────────┴──────┴───────┘
// ┌─────────┬──────┬───────┐
// │ (index) │ time │ value │
// ├─────────┼──────┼───────┤
// │ 0       │ 1    │ 1     │
// │ 1       │ 2    │ 3     │
// │ 2       │ 3    │ 3     │
// │ 3       │ 4    │ 5     │
// │ 4       │ 5    │ 5     │
// │ 5       │ 5    │ null  │
// │ 6       │ 6    │ null  │
// │ 7       │ 7    │ null  │
// │ 8       │ 8    │ null  │
// │ 9       │ 9    │ null  │
// └─────────┴──────┴───────┘
// size:  180
// has:  true false
DB.scheme({ name: 'connect', pattern: 'connect.*', retentions: '100ms:2m, 5s:30m', CInterval: IntervalMs_1.default });
const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
setInterval(() => {
    DB.write('connect.1', random(1, 10));
}, 100);
setInterval(() => {
    // const res = DB.readAll("connect.1", 300)
    // console.table(res.rows)
}, 1000);
// {
//     id: 'e6db6f09abee',
//     value: -6.725531578063965,
//     status: 'updated',
//     count: 5,
//     timestamp: 1734020052,
//     created: 1734020032,
//     condition: {
//       level: 'danger',
//       id: '1aba3d3c98515',
//       type: 'outRange',
//       params: [ -5, 5 ]
//     },
//     areas: [ [ null, -5 ], [ 5, null ] ],
//     threshholds: [ -5, 5 ],
//     additional: {}
//   }
// setInterval(() => {
//     DB.write("test.name.2", Math.sin(Date.now() / 100000) * 10)
// }, 1000)
// const AT = new Alerting(DB)
// const aQuery = new AlertQuery('5s', '1s', 'now-15s:now', 'avg')
// const aConfig = new BasicCondition('danger',"outRange",[-5,5])
// AT.addListener((alert) => { console.log(alert) })
// AT.watch('test.name.2',aQuery, aConfig, '', {})
//  9,007,199,254,740,991
//  1,734,247,142,705,000
const CSingleDB = new SingleDB_1.default();
CSingleDB.metric({
    name: 'test.metric.1',
    retentions: '1ms:1m',
    CInterval: IntervalMs_1.default
});
setInterval(() => {
    CSingleDB.write('test.metric.1', random(10, 1000));
}, 1);
setInterval(() => {
    const res = CSingleDB.readAll("test.metric.1", 300);
    console.table(res.rows);
}, 1000);
