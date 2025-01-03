
Table of Contents
===========
 - [Introduction](#introduction)
    - [What tasks does this base solve?](#what-tasks-does-this-base-solve)
 - [Migration from V2](#migration-from-v2)
 - [Guide](#guide)
    - [Installation](#installation)
    - [Getting Started](#getting-started)
    - [SingleDB](#singledb) - Each metric can have individual settings
        - [Initialization](#initialization)
        - [Data Write](#data-write)
        - [Modifiers](#modifiers)
        - [Data retrieval](#data-retrieval)
        - [Aggregation](#aggregation)
    - [SchemeDB](#schemedb) - Metrics accept customizations from the group they belong to
    - [Advanced Features](#advanced-features)
        - [Storage Optimization](#storage-optimization)
        - [Why Not Bigint](#why-not-bigint)
        - [Layer time work](#layer-time-work)
    - [Data Tracking](#data-tracking)
 - [How it works](#how-it-works)
    - [Layer](#layer)
        - [Layer vs Array](#layer-vs-array)
        - [Modifier records](#modifier-records)
    - [Collector](#collector)
        - [Data Recording](#data-recording)
        - [Advanced Data Retrieval](#advanced-data-retrieval)
    - [SingleDB](#singledb-1)
    - [Conclusion](#conclusion)

Introduction
============

VRackDB is an **In Memory** database designed for storing time series (graphs). The database is especially good at plotting graphs based on constantly arriving data.

Features: 
 - Very simple/economy/fast
 - Stores data in memory. If you close the program, the data will be lost
 - Always returns data as a graph 
 - Simple query format
 - Aggregation and data modifiers
 - Reserves metric memory, subsequent addition of metric data does not increase memory consumption
 - Supports seconds/milliseconds/microseconds

What tasks does this base solve?
-----------------------------

It is not always obvious how difficult it is to work with graphs until you try it yourself. Let's imagine that you need to generate a graph about your application's memory consumption. You would like to see dynamics on the small range and general trends on the large range.

If you will write the current memory state into an array:
 - Memory consumption will increase as a function of the number of iterations of the fetch;
 - The data will be  not  linear over time;
 - To get a graph for a particular period, you have to completely iterate through the array. Increasing the array results in loss of performance;
 - A normal informative graph typically holds between 120 and 1200 points. Increasing the number of points in the graph will make it too dense and uninformative. Therefore, it is necessary to simplify the graph in some way before displaying it.


All of the above problems are easily solved by VRackDB:
- Memory for a metric is reserved once, subsequent addition of this metric's data does not increase memory consumption;
- The data is always brought to a certain precision, which significantly reduces the problem of non-linearity in case of a high precision query;
- You don't need to go through all the data to get a graph for a certain period; 
- You can choose the interval you want the graph to be divided into. You can specify how many points per graph you want to get, regardless of the size of the period.

Even on such a simple task, many complex problems arise. To these problems can still be added the problem of aggregation, systematization of storage, searching, etc.

If you need to build graphs that don't make sense after the application is closed - VRackDB might be a good tool for you. 

Here are some examples of VRackDB applications:
 - Plotting a graph of a file download
 - Analyzing application memory consumption
 - Diagnose latency of HTTP/API/WebScoket and other requests
 - Quantitative analysis of successful/unsuccessful operations per time interval 
 - SOC applications for computers and computer-based devices (multimeters, lab power supplies, etc.)
 - Data caching for fast graph display/analysis
 - Storage of time-based diagnostic information

It is enough to try VRackDB to realize how practical and simple it is.

Migration from V2
=================

Important changes for fast migration from version 2.*

## Class Database

 - The Database class has been replaced by `SchemeDB`.
 - Metric tree handling has been removed from the `SchemeDB` class
 - Now you can use `MetricTree` separately from `SchemeDB` class. 
 - Initialization of the scheme now occurs with the use of named parameters:

```ts
// before
DB.scheme('connect', 'connect.*', '100ms:2m, 5s:30m', ...)

// after 
DB.scheme({
    name: 'connect', 
    pattern: 'connect.*', 
    retentions: '100ms:2m, 5s:30m'
})
```

## Class Collector

 - The `init` method now uses named parameters:

```ts
col.init({ name: 'metric.id', retentions: '10s:1h' })
```
 - The internal properties have been renamed (removed the `#` at the beginning)
 - All class properties are now defined as `protected`

## Class Layer

 - Creating a class now requires named parameters:

 ```ts
new Layer({ interval: 123, period: 22})
```

 - All class properties are now defined as `protected`
 - All class properties have been renamed, now the class has gotters added for each property

Guide
=====

Installation
-------------

Installation via npm:

```
# npm install -s vrack-db
```

Getting started
--------------

To get a better experience with metrics, you can use 2 classes **SingleDB** and **SchemeDB**. The difference of these classes is in the metrics storage system. **SingleDB** is used when you need to define customized settings for each metric. In **SchemeDB** you can create schemes/groups of metrics that will define settings for all metrics in the group. 


SingleDB
----------

### Initialization

```ts
import { SingleDB } from "vrack-db";
// OR
const { SingleDB } = require('vrack-db')

const SDB = new SingleDB()
```

You can create multiple instances of independent bases.

Adding a new metric:

```ts
SDB.metric({
    name: 'test.metric.1',
    retentions: '5s:10m, 1m:2h'
})
```

 - **name** _test.metric.1_ - Name of the metric (its identifier)
 - **retentions** _5s:10m, 1m:2h_ - Specifies the accuracy and size of the metrics retention period

 **name** must be unique. The string may contain the following characters `[a-zA-Z0-9._*]`.  Do not make long names. Example `boilers.{bid}.{metricid}`,`houses.{houseid}.{metricid}`, `memory.{memoryParam}`,`downloads.{fileid}`. 

**retentions** (`5s:10m, 1m:2h`) specifies the layer setting. Each comma value adds a layer with a specific precision and total period to the metric. 

A layer is a data store that allocates data within itself to memory locations. Each layer has a period (length) and is divided into intervals. Metrics are typically stored on multiple layers. For example, to store data for the last day with an accuracy of 5 seconds, you need to add a `5s:1d` layer. To store data with an accuracy of 1 minute one week - you need to add a `1m:1w` layer. The “retentions” setting for such a metric will look like this - `5s:1d, 1m:1w`. 

It is up to you to assess the distance and accuracy at which you want to store data for your tasks. 

Take into account that the layers do not follow each other, but are placed on top of each other. If your longest layer holds a year, anything longer than a year will be lost.

Values like `5s`, `10m`, `2h`, are intervals that can be decoded as `5 seconds`, `10 minutes`, `2 hours`. 

Here is the list of supported intervals:

- us - microseconds
- ms - milliseconds
- s - seconds
- m - minutes
- h - hours
- d - days
- w - weeks
- mon - months
- y - years

**Very important information** - to support milliseconds or microseconds, you must specify the appropriate interval class when initializing the metric. `IntervalMs` is for milliseconds, `IntervalUs` is for microseconds. Example:

```ts
const { SingleDB, IntervalMs } = require('vrack-db')

///....

SDB.metric({
    name: 'test.metric.1',
    retentions: '5s:10m, 1m:2h',
    CInterval: IntervalMs
})
```

The specified `CInterval` class defines the MTU of the metric - the minimal time unit. For the `Interval` class - MTU = second. This means that this class always works only with seconds (the default). The `IntervalMs` and `IntervalUs` classes work with milliseconds and microseconds as MTU respectively. 

**Further, all time references will be in MTU** For convenience, you can think of MTU = second. But for advanced use, you should realize that other time dimensions can be used as MTU.

If you try to write a metric without initialization, it will be created with default parameters - equivalent to the expression below:

```ts
SDB.metric({
    name: '{metricName}',
    retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
    CInterval: Interval
})
```

You will learn more about the initialization parameters later in the advanced tutorial.

The `destroy` method is used to delete a metric:

```ts
SDB.destroy('test.metric.1')
```

The existence check is the `has` method:

```ts
SDB.has('test.metric.1') // true or false
```

You can get the size of the metric by considering all layers in bytes:

```ts
SDB.size('test.metric.1') // size in bytes
```

### Data write

The metric data is recorded by its identifier:

```ts
SDB.write('test.metric.1', 1234.5678)
```

Where:

 - `test.metric.1` - The identifier of the metric
 - `1234.5678` - By default **the value for the metric is of type float(32bit)**. But this behavior can be changed, more details in the advanced tutorial.

By default, data is always written to the database from “now”.

With time:

```ts
SDB.write('test.metric.1',Math.rand(), 123456789)
```

The default time is `0`. If the value is `0`, the current time will be set to `now`. 
If you use abstract values to specify the time, they must start with a value > 0.

Note that all time calculations are in integers. You cannot use a floating point number as the time.

### Modifiers

Writing to the database is done by time index within each layer. This behavior is caused by the peculiarity of layer operation, which cannot store data more often than the layer's accuracy.

Each time data is written to a cell that already has relevant data for that interval - it is overwritten with new data. In order to compensate for some of the problems associated with this feature, you can apply different value modifiers when writing.

Specifying a value modifier:

```ts
SDB.write("test.metric.1", 1234.5678, 0, 'sum')
```

Here's a list of them:

 - **last** - Permanently overwrites the metric index value
 - **first** - Keeps the first metric value to be written.
 - **max** - Overwrites the value if the new value is greater than the old value
 - **min** - Overwrites the value if the new value is less than the old value
 - **avg** - Calculates the average value between the current value and the previous value
 - **sum** - Adds the current value to the past value.

**Default**, data is always written, **using the `last`** modifier.

### Data retrieval

```ts
SDB.read('test.metric.1', 'now-6h:now', '15m')
```

Where:

 - `test.metric.1` - The name of the metric
 - `now-6h:now` - Relative period
 - `15m` - Interval

Such a query will return all records for the last 6 hours with an accuracy of 15 minutes. Specifying `now` with a calculation (note `now-15m:now`) can only be used in the `SDB.read` method.

Example answer:


```json
{
   "relevant": true,
   "start": 1697826000,
   "end": 1697829600,
   "rows": [
      {
          "time": 1697826000,
          "value": 4.7855000495910645
      },
      {
          "time": 1697826300,
          "value": 4.797100067138672
      },
      ...
   ]
}
```

Since version 3.0.1 Added the ability to specify `start` and `end` in the relative period query - variables that will be replaced by the beginning and end of the metric respectively. 

```ts
SDB.read('test.metric.1', 'start:end', '15m')
```

Now there is no need to use the `readAll` method, but it has been left in for backward compatibility.

If the metric does not exist, the query will return all values equal to `null` and the flag `relevant: false`.

You can use the query method with an arbitrary period time.

```ts
const { SingleDB, Interval } = require('vrack-db')
// ...
// Interval.now() Return time in second
const start = Interval.now() - 1000 // начало = сейчас - 1000 секунд
const end = Interval.now()
SDB.readCustomRange("test.metric.1", start, end, '15m', 'avg')
```

It is recommended to use a simplified way of specifying the period. It is suitable for implementing presets specifying a certain accuracy and range of metric view.

Any interval is always converted to MTU, so if there is a need to specify an interval in MTU, it is easiest to generate a string with the interval and the desired number of MTU.

An example where we have an interval (precision) in an arbitrary number of seconds:


```ts
SDB.readCustomRange("test.metric.1", start, end, intervalInSec + 's', 'avg')
```

Sometimes it is more convenient to get always the same number of points, regardless of the period and specified accuracy. This behavior for the chart is more expected by the user. The user always sees the same number of points per chart, regardless of presets like `now-1d:now`, `now-1w:now`, `now-1mon:now`.

For this purpose, you can specify the number of points instead of the interval.

```ts
SDB.read('test.metric.1', 'now-6h:now', 300)
```

Keep in mind that the minimal value for an interval can be 1 MTU, which means that if the transmitted period cannot accommodate 300 points, the number of points will decrease proportionally to the size of the period. In any case, this behavior is considered conditionally safe and will not result in a request with a very large number of points per graph.

### Aggregation

Database read functions support several basic aggregation functions. The functions will be applied to a data set within period intervals. 

The `last` function is used by default.

The list of available functions is:
 
- **last** - Will return the last non `null` value, if all values are `null` - will return null
- **first** - Returns the first non `null` value, if all values are `null` - returns null.
- **max** - Returns the maximum value if all values are `null` - returns null
- **min** - Returns the minimum value if all values are `null` - returns null
- **avg** - Returns the average value if all values are `null` - return null
- **sum** - Returns the sum of values if all values are `null` - returns null
 
Example of use:

```ts
SDB.read('test.metric.1', 'now-6h:now', '15m','avg')
```

You can use the `MetricResult` class to apply the aggregation function to the results of a metrics query. This can be useful, for example, to get the maximum and minimum values in a sample.

```ts
const data = SDB.read('test.metric.1', 'now-6h:now', '15m','avg')
const dataMax = MetricResult.aggregate(data, 'max') // Retyrb number or null
```

SchemeDB
----------

The class for working with metrics `SchemeDB` is a direct descendant of the `SingleDB` class. The conceptual difference between these classes is that `SchemeDB` defines metrics settings according to predefined metrics schemas. 

Initialization proceeds in the same way:

```ts
import { SchemeDB } from "vrack-db";
// OR
const { SchemeDB } = require('vrack-db')

const SDB = new SchemeDB()
```

But it is not necessary to initialize each metric. We can create a scheme in which all metrics have the same parameters:

```ts
SDB.scheme({ 
    name:'test', 
    pattern:'test.name', 
    retentions: '5s:10m, 1m:2h'
})
```

 - **name** _test_ - The name of the pattern
 - **pattern** _test.name_ - All metrics with the name `test.name.*` will fall into the `test` group. 
 - **retentions** _5s:10m, 1m:2h_ - Specifies the precision and size of the metrics retention period.

**Name** must be unique. Try not to make it long. Example `boilers`,`houses`, `memory`,`downloads`. 

**Pattern** is written in small letters and uses the dot character '.' as the act separator. When you write a metric named `test.name.1` to the database, the database looks for a matching pattern and applies the pattern rules to it.

**Retentions** (`5s:10m, 1m:2h`) specifies the setting of the layers. Each comma value adds a layer with a specific precision and common period. Each metric in this schema will have exactly that layer setting.

If the metric name does not fit any pattern, the default pattern will be used:


```ts
{
    name: 'default',
    pattern: '*',
    retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1m, 1d:1y',
}
```

All the basic methods for getting and writing data look the same as in `SingleDB`. Class `SchemeDB` has additional methods for working with schemes:

 - **schemeMetrics** - Returns the name of the metrics in the schema
 - **schemeHas** - Checks if the schema exists
 - **schemeList** - Returns the list of schemes
 - **schemeSize** - Returns the size of the schema in bytes
 - **schemeDestroy** - Deletes the scheme (actually it just breaks the connection with the scheme, if someone else has a connection with it - the scheme will not be deleted from memory).


Advanced Features
------------------

### Storage Optimization

Layers support different storage to optimize data storage. By default, `Uint64` for time and `Float` for value storage are used.

These stores may not be particularly optimal if you want to store specific data. For example, for storing boolean values. 

You can specify specific value and time stores to optimize storage. 

For SingleDB:

```ts
SDB.metric({
    name: 'test.metric.1',
    retentions: '5s:10m, 1m:2h',
    vStorage: StorageTypes.Bit,     // (valueStorage) Can only store bit values - 1/0
    // tStorage: StorageTypes.Uint32   // (timeStorage) is not recommended, Uint64 is better
})
```

Now only bit values (0,1) can be used as values for the metric named `test.name.bit.1`. In memory, only 1 byte of memory will be allocated for every 8 metrics in this group, which is 32 times less than if the standard memory type had been used.

Most of the time, these optimizations don't matter, but can be useful on older devices like **orange pi zero** or in embedded devices where RAM is scarce.

One thing to keep in mind is that the time store must hold the desired index 100% of the time. For example, if we choose the type for the time store to be `Uint8` and try to write a value of 256, we will actually write a value of `0` to the timestamp, which will cause the `startTime` and `endTime` layer to be offset. This behavior can lead to data loss. Therefore, when selecting storage for a timestamp, we need to make sure that the values to be written always fit into that type. 

Naturally, only integer data types should be used for storing the time index. Otherwise it may lead to unpredictable consequences when rounding numbers to layer accuracy. 

The following types are supported:

 - Bit - Bit value 1 or 0
 - Double - Floating point number (64 bit size) 
 - Float - Floating point number (32 bit size)
 - Int8 - Integer up to 127 (can be negative)
 - Int16 - Integer up to 32,767 (can be negative)
 - Int32 - Integer up to 2,147,483,647 (can be negative)
 - Int64 - Integer up to 9,223,372,036,854,775,807 (can be negative)
 - Uint8 - Integer from 0 to 255
 - Uint16 - Integer from 0 to 65 535  
 - Uint32 - Integer from 0 to 294 967 295 
 - Uint64 - Integer from 0 to 18 446 744 073 709 551 615

 ### Why Not Bigint

 If you use `StorageTypes.Uint64` type to store time, you expect to get a number that will exceed the dimension of the standard `number` type - `bigint`. But in the end you always get the `number` type. This solution was made deliberately. The problem is that it is not convenient to work with `bigint` numbers in JS. It is not a primitive of `number` or `string` type, which JS skillfully converts on the fly. It is a separate type that constantly needs to be checked and, most importantly, it does not allow mathematical operations with `number`.

In fact, `bigint` cannot be used in `Math` and cannot be mixed in operations with any instances of `number`. Which negates any usability of this type. Either all operations must be performed in `bigint`, which will lead to performance degradation, or you must check everywhere what you got - `bigint` or `number`, which is quite inconvenient.

For the sake of convenience it was decided to leave only `number` type, which can hold **9,007,199,254,740,991**. This dimension is suitable even for storing time in microseconds. 

Perhaps in the future, if JS integrates `Bigint` better, it will be possible to change the behavior of the base, but for now you need to consider this fact when working with large numbers.

### Layer time work

If you are using a database for caching, you may run into the problem of getting data in a relative period. Simply put, you have taken old data and written it to the database. How do you find out the beginning and end of the graph?

You can use the methods to do this:

```ts
if ( SDB.has(test.metric)){
    const startedAt = SDB.start('test.metric')
    const endedAt = SDB.end('test.metric')
}
``` 

But it is better to use the method to get the whole graph:

```ts
// metric.id & points count
const result = SDB.readAll('test.metric', 300)
``` 

With this method you can easily build an “infinite” graph. 

In some situations it may be necessary to build an “infinite” graph. Such a graph collects, for example, 600 points, after which only modification of data inside the graph takes place. The data set in such a graph as if constantly compresses it, while the graph does not shift in time.

This can be used in multimeters and systems where it is necessary to follow the dynamics throughout the whole time of operation.

The high accuracy here is only important for the first set of values, then you can use a layer with lower accuracy. For example, we get data every second, let's add a layer `1s:10m`, it will take up about 8KB of memory and hold our 600 points. Next we need to add a layer to take the brunt of the load. While we have added a layer to store only 10 minutes, let's add a layer for 3 hours with the same number of points `18s:3h`. Then we can already add less and less precise layers, for example `2m:1d`, `1h:1mon`.

Of course, the graph will not be infinite and still after a month it will start to shift, but usually such amount of time is not required to collect time data of an infinite graph. More layers can be added to put more data if needed.

Data Tracking
-------------

Since version 2.1.0, the `Alerting` tool for tracking and creating alarm messages has been introduced. 

To use this tool, you need an already initialized `SingleDB` class, `SchemeDB` or its descendant . 

Initialization:

```ts
const AT = new Alerting(SDB)
```


The `Alerting` class itself requests data from the database using the settings defined in the `AlertQuery` class. 

Example of creating a query customization class that will request the average value every 5 seconds for the last 15 seconds:

```ts
const aQuery = new AlertQuery('5s', '1s', 'now-15s:now', 'avg')
```

 - **evaluateInterval** _5s_ - Interval at which data will be requested
 - **interval** _1s_ - Request Interval
 - **period** _now-15s:now_ - Relative period of the request
 - **func** _avg_ - Query aggregation function

The `BasicCondition` class is used to define conditions:

```ts
// level, condition type, params
const aConfig = new BasicCondition('danger',"outRange",[-5,5])
```


 - **level** _danger_ - Text representation of the danger level (user defined, will be reflected in the message). This field can be left blank to save memory
 - **type** _outRange_ - Type of status check.
 - **params** _[-5,5]_ - Parameters for the status check.

Available check types for `BasicCondition`:

 - **isAbove** - Value above parameter
 - **isBelow** - Value below the parameter
 - **isEqual** - Value equal to parameter
 - **outRange** - Out of parameter (requires 2 parameters)
 - **inRange** - Entry within parameter limits (requires 2 parameters)
 - **noValue** - If `null` value was obtained as a result of the query (does not require parameters)

 Now that the parameters are defined, you can assign them to the desired metric:


```ts
// path, query, config, id, additional
const watchId = AT.watch('test.name.2',aQuery, aConfig, '', {})
```

 - **path** _test.name.2_ - Path to the metric
 - **query** _aQuery_ - Instance of the `AlertQuery` query customization class
 - **config** _aConfig_ - Instance of the `BasicCondition` state checker customization class
 - **id** _''_ - Unique identifier. If you specify an empty string, it will be generated automatically.
 - **additional** _{}_ - Additional data that will be passed if the rule is violated

--------

You can assign the same query rules and settings to different metrics. **If you create new metrics for each tracking point, you may lose a lot more memory**

--------

You can assign multiple handlers to a single metric. To disable them, you must use a tracking ID that was either passed or received after generation:

```ts
AT.unwatch(watchId)
```

You must subscribe to receive condition trigger messages:

```ts
AT.addListener((alert) => { console.log(alert) })
```

If you violate a rule, you will receive a message like:

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

 * **id** - Tracking point identifier (specified in the `watch` function)
 * **value** - Query result for the metric
 * **status** - Message status
     * **created** - When the message was first received
     * **updated** - When the message is repeated more than once
     * **ok** - Message when data has stopped violating conditions
 * **count** - Number of violations
 * **timestamp** - Update time
 * **created** - Creation time
 * **condition** - Violated condition
 * **areas** - Condition Zones
 * **threshholds** - Threshold value
 * **additional** - Additional Tracking Point Information

Areas - zones, always specified from smaller to larger. For example, the zone from 3 to 5 is `[3,5]`.

Zones can start at minus infinity and end at infinity. In such a case, `null` will be specified instead of the value.

Such a tracking tool can help in building the same multimeters, power supplies, etc. devices that require simple settings to track their internal parameters.


How it works
===========

I suggest to first understand what we want to get. 

We need a database that will store, for example, CPU/SSD/GPU/Network performance metrics. We need to have the ability to look at recent actual data and less accurate history. We need to look at graph trends over large periods, e.g. 6 hours, 1 day, a week, a month. We should always get the same number of points on the chart regardless of the length of the selected period. All this should work as fast as possible.

Where you usually start - you take an array and add new values there. In general, if the data come steadily with a certain interval, we can display the latest actual data. But with less accurate history, serious problems arise - how to aggregate data? How to simplify data for their more compact storage? How to generate graphs for large periods? You need it to work very fast too.

Performance is an important part of building a graph. A large amount of data will take a large amount of time to generate. A large amount of data on a chart will cause the performance of the interface itself to suffer. A comfortable number of points per graph is usually less than 700. It would be logical to assume that we are not comfortable accessing an array that may have 20,000 points, or 200,000 points, for example.

Obviously, we need a different data storage system.

One example of a database that can handle our task is the file database that serves **Graphite** - **Whisper**. Whisper is a database similar in design and purpose to an RRD (round-robin-database). It provides fast and reliable storage of numerical data over time. Whisper allows higher resolution (seconds per point) recent data to degrade to lower resolution for long-term storage of historical data.

Here are the main problems with Whisper:

 - Heavily stresses the SSD, causing it to degrade quickly
 - Very poor portability, it is difficult to embed in other applications

Here are the main pros of Whisper:

 - Speed of writing data
 - Data retrieval speed
 - Fixed memory consumption, adding data to metrics does not increase memory consumption
 - Very good for trending data like CPU/SSD/GPU/Network performance metrics

 Whisper storage is based on the `round robin' algorithm, and the data warehouse - **Layer** - was created based on it.

Layer
-----

VRackDB uses the `Layer` class as a data store. When creating a new layer, we can specify its total size (period) and how much our period will be divided (interval).

In code, it can look like this:

```ts
const lay = new Layer({ interval: 2, period: 60 }) 
```

**The Layer counts the interval and period in MTU, but for convenience, seconds will be specified**

We have created a layer with an interval of 2 seconds and a period of 60 seconds. This layer cannot store data longer than the interval (2 seconds) and no longer than the period (1 minute).

To count the cells in this layer - divide the period by the interval (60/2=30), this layer cannot store more than 30 values.

If you look carefully, you will notice that after creating the layer, we know all its parameters and even its size. That's right - after a layer is created, it automatically reserves memory for all the values it can contain. The size of the occupied space will depend on the settings of storage types, period and interval.

By default, the `Uint64` type is used to store time and the `Float` type is used for data. Data is stored in binary form using `Buffer`. Why not just use an array of numbers to store time and data? The fact is that javaScript has no specific data types that have a specific size for storing numbers. In fact, any number in JavaScript is of type `number`, which is actually of size `Double`, which is a 64 bit floating point number. This means that there is no way to optimize memory storage, and even a single bit value of 0/1 will waste 8 bytes of memory data. Using buffers, on the other hand, allows you to store even bit values that will occupy only 1 byte instead of 512 bytes.

### Layer vs Array

What is the difference between a ring array and a layer? Let's try to understand it. 

To give an illustrative example, let's create another layer with a period of 100 seconds and an interval of 10 seconds. It will contain only 10 cells.

Now let's try to write a value with time index 155 into it, what will happen?

```ts
lay.write(155, 2.25)
```

First our layer will bring the time index (155) to the accuracy (interval) of the layer `( time - ( time % interval ) )`, the result of the calculation is 150. **The layer will always** bring the time index to the layer interval. This is the rationale behind the minimum interval a layer can store. If we try to write to a layer more often than the layer interval, the time index will always be driven to the interval, which in turn will result in the same number. 

For example, if we try to write multiple values to a layer with a time index less than the interval:

```ts
lay.write(151, 1.75)
lay.write(152, 6.53)
lay.write(153, 3.21)
lay.write(154, 2.25)
```

The layer will each time bring the time index to the interval precision (multiple of the interval) in this case `150` and each time overwrite the cell that refers to this time index. As a result, the value `2.25` will lie in the cell under the time index `150`.

This behavior may seem very strange, but it's fine, it's the way it should be.

And in which cell will the layer write our value? To the first cell? In order? How does the layer distribute the value among the cells? 

The index of the cell to be written is calculated based on the passed time index. In essence, no matter how large we pass the time index, it must be written to the cell. The time index can extend well beyond the period. 

Here is how the cell index is calculated in the layer:

```ts
    const coilIndex = Math.floor(this._cells + time / this._interval) % this._cells;
```

Where:
 - **coilIndex** - Cell Index
 - **time** - Time Index
 - **_cells** - Number of cells in the layer
 - **_interval** - Layer interval

This kind of formula can be seen quite often in programming. Every time `time` is incremented by more than `_interval` - the formula will return the next cell number in a circle - `1,2,3,4,5,6,7,8,9,9,10,1,2,3,4,5...`.

The cell index for the `150` value of this layer by this formula will be `5`.

Let's look at our cell layer now:

```
   1       2       3       4       5       6       7       8       9      10
| null |  null |  null |  null |  2.25 |  null |  null |  null |  null |  null |
| null |  null |  null |  null |   155 |  null |  null |  null |  null |  null |
```

Let us now try to write the value '2.45' for index 174:

```
   1       2       3       4       5       6       7       8       9      10
| null |  null |  null |  null |  2.25 |  null |  2.45 |  null |  null |  null |
| null |  null |  null |  null |   150 |  null |   170 |  null |  null |  null |
```

This is how a layer distributes values in memory. This means that unlike a ring array, which stores every value, a layer can actually hold much less data. But unlike a ring array, a layer stores data linearly over time. 

Now let's break down another point. Let's add the value 3.31 with index 267, this is what the layer memory will look like:

```
   1       2       3       4       5       6       7       8       9      10
| null |  null |  null |  null |  2.25 |  3.31 |  2.45 |  null |  null |  null |
| null |  null |  null |  null |   150 |   260 |   170 |  null |  null |  null |
```

Now it is not clear at all how we can get the data to be relevant. Now we have index 260 between indexes 150 and 170. If we just take the data in a row by cells, we will get nonsense instead of data. We need to get relevant data that matches our expectations by getting data in a row.

To solve the issue of relevance of the returned data, two values responsible for the beginning and end of the time indexes were introduced into the layer.

When we wrote the value with index 260, we had the end of the layer with the value 170, since 260 is greater than 170, it was overwritten. When the end of the layer is overwritten, the beginning of the layer is overwritten as well:

```ts
this.start = end - interval * (points - 1)
```

Now the beginning of the layer = 170 and the end = 260. 

Let's see how the layer gives data for a certain period. When we want to get data for a certain period, we have to pass the start and end. 

```ts
lay.read(150, 280) // from, to
```

The transmitted period will be trimmed to the layer boundaries, which will be equivalent:

```ts
lay.read(170, 260)
```

Then the layer calculates the index of the first cell (from) and starts reading them in a row.

Let's remember what the layer memory looks like at this point:

```
   1       2       3       4       5       6       7       8       9      10
| null |  null |  null |  null |  2.25 |  3.31 |  2.45 |  null |  null |  null |
| null |  null |  null |  null |   150 |   260 |   170 |  null |  null |  null |
```

Let's look at the step-by-step process of retrieving query data:


```
Calculate the cell for the time index 170 - 7
We take the time index from the cell itself - 170.
Is the index value between the start and end of the layer? - YES
The cell value is considered relevant and we write to the result array
We add one layer interval to 170 - 180 - cell 8.
We take the time index of the cell itself - null
We write the value null for time index 180 into the result array.
...
Calculate the cell for time index 250 - 5
Take the time index from the cell itself - 150.
Does the index value extend beyond the beginning or end of the layer? - NO
Write the value null to the result array for time index 250 (the data in this cell is no longer relevant).
Calculate the cell for time index 260 - 6
We take the time index from the cell itself - 260.
Is the index value between the start and end of the layer? - YES
The cell value is considered relevant and we write to the result array
```

The result of such a query would be:

```json
{
  "relevant":true,
  "start": 170,
  "end": 260,
  "rows": [
    { "time": 170, "value": 2.45 },
    { "time": 180, "value": null },
    { "time": 190, "value": null },
    ...,
    { "time": 250, "value": null },
    { "time": 260, "value": 3.31 }
  ]
}
```

Note - the layer truncated the `start` and `end` values in the returned result. This is done because it specifies the actual time period affected.

It would **always** be more convenient for us to think of the layer's memory as **last value forward**, because that's how the layer handles time-based data:


```
   7       8       9       10       1       2       3       4       5      6
| 2.45 |  null |  null |  null |  null |  null |  null |  null |  null |  3.31 |
| 170  |  null |  null |  null |  null |  null |  null |  null |  null |  260  |
```

As you can see from the example, we don't care about the layer's cell indices, we work directly with the time indices. The layer itself does all the work for us.

In practice, we can clearly see that a layer works quite differently from an array. A layer always knows where its data lies by time index, which means it doesn't need to search and analyze anything. The same applies to writing data. 

A layer, unlike a ring array, cannot store a value more frequently than a specified layer interval. When rounding the time index, the data will always end up in the same cell, overwriting the previous value. More precise layers or modifiers can be used to compensate for this problem.


### Modifier records

When writing data, we can apply a modifier to the cell value. The default modifier is the `last` function, which basically just overwrites the cell value to a new cell. But you can use different functions to achieve the desired result.

The modifier is used when, when writing to a cell, it turns out that there is already relevant data there. In this case, the cell value and the new value are taken and one of the functions is applied:

 - **last** - Writes last value
 - **first** - Leaves the first value to be recorded
 - **avg** - Calculates the average between the new value and the cell value, overwrites the result
 - **max** - Leaves the maximum.
 - **min** - Leaves the minimum
 - **sum** - Sums the values

 An example of writing a value with a function:

 ```ts
lay.write(177,3.23, 'avg')
```

## Collector

**Collector** deals with metrics initialization, all its methods operate only on metrics. It is the next level of VRackDB after the layer. Its work starts with initializing a metric, which may consist of multiple layers of different precision and length. **The main task of Collector** is to handle multiple layers per metric.

Example of creating a collector:

```ts
const col = new Collector()
```

An example of initializing a metric:

```ts
col.init( {name: 'test', retentions: '10s:1m' } ) 
```

 - **name** _test_ - Name of the metric (identifier). Further all operations with the metric are performed through its identifier
 - **retentions** _10s:1m_ - Describes layers, in this case one layer of size 10s:1m where 10s is 10 seconds (interval) and 1m is 1 minute (total period of the layer)

All operations in the database occur in MTUs. But it is not always convenient to specify a specific number of MTUs, for example, it is difficult to tell how many seconds there are in a week. To simplify the time specification, the interval format is used to specify the number and type of intervals. 

All types of intervals:
- us - microseconds
- ms - milliseconds
- s - seconds
- m - minutes
- h - hours
- d - days
- w - weeks
- mon - months
- y - years

You can specify multiple layers at once with different precision using commas, e.g. '10s:1m, 1m:6h, 1h:1w'

There are **2 rules** for adding layers:

 1. You cannot add a layer where the interval will be larger than the period, e.g. '1h:1m', because then, even 1 interval cannot fit into the total period.

 2. You cannot add a new layer with a smaller interval but a larger period than you already have. For example, it makes no sense to add a layer with parameters `10s:1y` and then add `1m:1y` since there is already a layer for the same total period but with a higher precision.

 When added, layers are sorted by the length of the affected time (period) - see `Layer.period`. `Layer.period`. They can be represented as an upside-down layer cake, aligned on the right side: 

```
          Direction of time        [last data]
>-------------------------------------->
Layers
                index 0
|-------|-------|-------|-------|-------|
                     index 1 
          |--|--|--|--|--|--|--|--|--|--|
                           index 2
                    |-|-|-|-|-|-|-|-|-|-|

<---------------------------------------<
          Lost data direction
```


It was mentioned above that it is better to represent layers with the latest time index data forward. In the diagram above, the layers are represented in this way. 

You can also notice that the less precise layers have cells affecting the cells of the more precise layers, from which you can infer that this storage method has some data redundancy. This is indeed the case. But this approach allows you to optimize the retrieval of less precise data without trying to count from more precise layers. Simply put, if there is already a layer of sufficient accuracy for a query - there is no need to go down a layer lower to analyze a more accurate layer.

When new data arrives for a given metric, the data is constantly shifting to the left. Those data that reach the left edge are lost (see `Lost data direction`). This diagram clearly shows that this metric will not be able to store data more frequently than the smallest interval of the layer and will not be able to store data longer than the longest period.

### Data Recording

The peculiarity of writing a value to a metric is that `Collector` writes to all layers simultaneously. This causes the data in layers with a small interval to shift rapidly, accumulating new accurate data, while layers with a large interval and a large period constantly overwrite the cell value, waiting for the rounded time index to move to another cell. 

In this way the data is distributed among all layers. This approach produces high accuracy at a small distance and low accuracy at a large distance. 

Of course we can make one layer of high accuracy for a large distance, but in practice it doesn't matter much. This approach will take up a lot of memory and the resulting accuracy will be redundant. 
So we need to strike a balance between accuracy and utility. 

When writing, `Collector` can also use modifiers for layers. It uses them for each layer. This behavior can cause a problem related to writing accumulative data - when. the `sum` modifier. See **Recording data** below.

```ts
col.write('test', 23.131)
```

To write a value to a metric we need to specify 2 parameters - name and value. Using `Collector` we don't need to specify a time index, but we can. By default the time from “now” is used.

### Advanced Data Retrieval

`Collector` provides a smarter data retrieval function, allowing all layers of the metric to be touched, and allowing arbitrary intervals and periods to be used for the query.

For example, you can request data that is not included in any of the layers at all, and then a response will be generated consisting of the specified intervals and `null` values. This is a useful behavior that allows you to not have to think about whether the data will be in the query or not, and always respond to the query result in the same way.

Another feature of Collector's data reading is the traversal of all data layers. 
You can query data with precision higher than the longest layer and less than the layer below, and for that response Collector will try to generate a response with maximum precision.

Similar work can be done across multiple layers, gradually getting more and more accurate data. 

An example of such work:

```ts
// Reuqest 
col.read('test', 1, 9, '1s')
/*
            Layer
                      2s:10s
|-----|-----|-----|-----|-----|
                      1s:4s
                  |--|--|--|--|
*/

// Response
{
    start: 1,
    end: 9,
    rows: [
        {time: 1, value: null}, 
        {time: 2, value: 2.5},    
        {time: 3, value: null},    
        {time: 4, value: 4.5},    
        {time: 5, value: null},
        {time: 6, value: 6.5},
        {time: 7, value: 7.5},    
        {time: 8, value: 8.5},    
        {time: 9, value: 9.5},    
    ]
}
```

From the example above we can see that if `Collector` cannot generate data with sufficient accuracy, it will take data from a layer with less accuracy. If the requested period goes beyond the layers - this data will be filled with `null`.

It was mentioned above that the `sum` modifier can cause a problem. This problem will only manifest itself when the request involves 2 layers of different precision, as from the example above. If we apply the `sum` function, on the layers with higher precision we will see small numbers, but more often. On layers with lower precision we will see big numbers, but less often. The sum of these numbers over a certain period of time will be equal, but on the graph it may look quite different from what you expect:

```
  Layer0      Layer1    
        14 |
    12  *  |
10  *      |
*          |
           | 5   5
           | * 4 * 4
           |   *   * 3
           |         *
```

**Please note that at layer junctions the data may not always be predictable**. This is because the rounding of intervals is not done with layer precision. Because of this, it is at layer junctions that you may get `null` instead of the value you expect.

You should use the `sum` modifier wisely. You can use layer-size intervals and periods to avoid such problems.

## SingleDB

`SingleDB` is the next level of abstraction, which simplifies working with `Collector`. For example, if you try to write data to a non-existent metric (which `Collector` does not allow), a new metric with default parameters will be created. Or when trying to read a non-existent metric, the result will be returned completely filled with `null` values. 

Working with `SingleDB` is less demanding and more convenient to use. Reading from the database allows to use string representation of period and interval, for example:

```ts
SDB.read('metric.id','now-6h:now', '15m', 'last')
```

A relative period like `now-6h:now` and an interval of `15m` makes it easy to create simple chart view presets. 

If desired, you can specify the number of points you want to see on the graph instead of a string interval:

```ts
SDB.read('metric.id','now-6h:now', 300, 'last')
```

The method that is responsible for generating the interval:

```ts
    static getIntervalOfFixedCount(start: number, end: number, count: number): number {
        let cnt = Math.floor(Math.abs(start - end) / count)
        if (isNaN(cnt) || cnt < 1) cnt = 1
        return cnt
    }
```

A very useful method is to get the entire graph:

```ts
readAll('metric.id', 300)
```

Using `Collector.start(name)` and `Collector.end(name)` the start and end of the entire graph is calculated, considering all layers. This is followed by a 300-point read to the graph.

## Conclusion

Only the main methods and basic functionality are listed here. You can see more details on the implementation directly in the code.

You should know the tool well to use it effectively. I hope this documentation will help you get closer to understanding this database and maybe implement something similar in your favorite language for your application. 

This database was developed by one person along with all the associated documentation. Due to lack of any feedback - it is very difficult to generate good documentation. I am always willing to make it better if you have any ideas or suggestions. 