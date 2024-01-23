
VRack DB 
========

VRackDB - This is an **In Memory** database designed for storing time series (graphs). 

Features: 
 - Has a simple query format
 - Always returns data as a graph. 
 - Very easy to use
 - Very economical/very fast
 - Aggregation and data modifiers
 - Stores data in memory. If you close the program, the data will be lost
 - Reserves metric memory, subsequent addition of metric data does not increase memory consumption

**Important** The project has moved. Github is more friendly for public open source projects.

For a **quick start** we recommend that you visit [our guide](https://github.com/ponikrf/VRackDB/wiki/Guide) or check [how it works](https://github.com/ponikrf/VRackDB/wiki/How-It-Works)

[RUSSIAN VERSION](/docs/RU-README.md)

A local version of the [guide is available](/docs/EN-Guide.md)

What problem does this base solve?
===============================

It's not always obvious how difficult working with charts really is until you try it yourself. If you get new data all the time, you can try to solve the storage problem with an array. In this case, a lot of problems arise - non-linearity of data, data management, aggregation, obtaining data from an arbitrary segment of the graph. 

More details on problem solving can be found in [introduction](https://github.com/ponikrf/VRackDB/wiki/Introduction)

Motivation
===========

In some situations, a simple database to store metrics with a simple query language is sorely lacking. For a general example, the Carbon + Whisper database was taken and a very simple in memort database was made using its analogy. 

**Why an in memory database?** There are many tools that can be used to store metrics that store data optimized on disk. Such variants are not suitable when SD card is used as storage or there is no possibility to deploy a complex product. Sometimes it is necessary to embed the database into the application itself to display graphs that have no meaning after the application is closed. Such applications usually provide an opportunity to evaluate the rationality of saving the graph, and if a person needs it, the graph is saved in another format, and the data from memory are cleared after closing the application.

Support
=======
The easiest way to support me or a project is to [Donationalerts](https://donationalerts.com/r/imerzytip). In the donation, be sure to specify the project you want to support and the changes you would like to see to improve it. This will allow me to spend 1 hour of my time for every ~10$ donation. Each donation will be included in the next build of this project, it will also be read on my private stream.

Additional information
--------------

Even if I haven't made changes to the project for a long time, it doesn't mean that the project is dead. You can write to ponik_rf@mail.ru, I will try to respond as soon as possible.

Latest update 2.2.1
--------------------------

 * **Interval.parseInterval** - You can now use a string with a number as an argument.
 * **Interval.period** - You can now use a numeric representation for the start or end of a period.


Installation
---------

```
# npm install -s vrack-db
```

Uses
-------------

[Simrrdb](https://gitlab.com/ponik_rf/simrrdb) - Example project that uses this database to temporarily store metrics and display them in Grafana

It is recommended that you read the [official guide](https://github.com/ponikrf/VRackDB/wiki/Guide ) or check [how it works](https://github.com/ponikrf/VRackDB/wiki/How-It-Works)


The following are brief examples and descriptions of the use of `Database`.
### Schemes 

Database supports different schemas for storing metrics. The format of schemas is similar to the Carbon + Whisper format.

Adding a new schema:


```ts
import { Database } from "vrack-db";
const DB = new Database()

DB.scheme('test', 'test.name', '5s:10m, 1m:2h')
```


In the example above, we created a `test` schema, for which we specified the `test.name` pattern and specified the accuracy and duration for storing metrics.

Let's break it down in order:

- `test` - The name of the scheme
 - `test.name` - All metrics with the name `test.name.*` will fall into the group test.
 - `5s:10m, 1m:2h` - Specifies the precision and size of the metric storage period. In this case, storage with a precision of 5 seconds for a total period of 10 minutes, with a precision of 1 minute storage period of 2 hours.

### Writing the metric to the database

```ts
DB.write("test.name.metricid", 1234.5678)
```

 - `test.name` - The name of the metric is specified in the same way as patterns, in small letters, the acts are separated by dots.
 - `1234.5678` - **The value for the metric is of type float(32bit)**.

**It is not recommended to make long names for metrics. Take into account that the name for a metric also takes up memory space.** For example, if the name of a metric takes 10 characters (10 bytes), then 1024 metrics will take 10kB of memory (actually more).

Indication of time:

```ts
DB.write("test.name.metricid", 1234.5678, 123456789)
```

By default, the value `0` is passed as the time parameter. If the value is `0`, the current time will be set to `now`. 
For this reason, if you use abstract values to specify the time, they must start with a value > 0.

Specifying a value modifier:

```ts
DB.write("test.name.metricid", 1234.5678, 0, 'sum')
```

### Reading Records

```ts
const res = DB.read("test.name.metricid",'now-1h:now', '5s')
console.table(res.rows)
```

- `test.name` - Name of the recorded metric
- `now-1h:now` - Period for receiving the metric
- `5s` - Accuracy with which to generate the response

There is **data aggregation capability** available for read functions - see [official guide](https://github.com/ponikrf/VRackDB/wiki/Guide )


----

**Please note that all calculations in the database are in seconds**

----


You can also use `readCustomRange` to get data for an arbitrary period.

```ts
const dbRes = DB.readCustomRange('test.name.metricid', start, end, `5s`)
```

You can use `read` and `readCustomRange` of the `Database` class to retrieve a specific number of metrics regardless of the period.

For example:

```ts
// Returns a maximum of 100 metrics for this period
 const dbRes = DB.readCustomRange('target', start, end, 100)
```

An example for a general practical understanding of how a database works:

```ts
import { Database } from "vrack-db";

const DB = new Database()

DB.scheme('test', 'test.name', '5s:10m, 1m:2h, 15m:1d')

setInterval(()=>{
    DB.write("test.name.metricid", process.memoryUsage().heapTotal /1024 / 1024)
}, 1000)

setInterval(()=>{
    const res = DB.read("test.name.metricid",'now-1h:now', '5s')
    console.table(res.rows)
}, 5000)
```

Data Tracking
-------------------

Version 2.1.0 adds a small tool for data tracking. (see the guide for more details)

Initialization:

```ts
const AT = new Alerting(DB)
```

The query for the data is defined using the `AlertQuery` class:

```ts
// getting interval, data interval, period, func
const aQuery = new AlertQuery('5s', '1s', 'now-15s:now', 'avg')
```

The `BasicCondition` class is used to define the bounds:

```ts
// level, condition type, params
const aConfig = new BasicCondition('danger',"outRange",[-5,5])
```

You need to start tracking the right metric with the right parameters:

```ts
// metric path, query, config, id, additional
AT.watch('test.name.2',aQuery, aConfig, '', {})
```

To receive messages when a value violates a rule, you can subscribe to receive a message:

```ts
AT.addListener((alert) => { console.log(alert) })
```

If you violate a rule, you will receive a message such as:


```ts
{
  id: '24cf92b9066b5',
  value: 7.50190642674764,
  status: 'updated',
  count: 36,
  timestamp: 1702377145,
  created: 1702377145,
  condition: {
    level: 'danger',
    id: '6633a39c10328',
    type: 'outRange',
    params: [ -5, 5 ]
  },
  areas: [ [ null, -5 ], [ 5, null ] ],
  threshholds: [ -5, 5 ],
  additional: {}
}
```