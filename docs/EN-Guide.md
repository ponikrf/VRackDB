[[_TOC_]]

Installation
---------

Installation via npm:

```
# npm install -s vrack-db
```

Getting started
--------------

Initialization:

```ts
import { Database } from "vrack-db";
// OR
const { Database } = require('vrack-db')

// Create instance of Database
const DB = new Database()
```

You can create multiple instances of independent databases if needed.

Schematics
---------

Schemas determine how long and with what accuracy the data will be stored. The belonging of a metric to a schema is determined by its name.

Example of adding a schema:

```ts
DB.scheme('test', 'test.name', '5s:10m, 1m:2h')
```

 - **name** _test_ - The name of the pattern
 - **pattern** _test.name_ - All metrics with the name `test.name.*` will fall into the `test` group. 
 - **retentions** _5s:10m, 1m:2h_ - Specifies the precision and size of the metrics retention period.

**Name** must be unique. Try not to make it long. Example `boilers`,`houses`, `memory`,`downloads`. 

**Pattern** is written in small letters and uses the dot character '.' as the act separator. When you write a metric named `test.name.1` to the database, the database looks for a matching pattern and applies the pattern rules to it.

**Retentions** (`5s:10m, 1m:2h`) specifies the setting of the layers. Each comma value adds a layer with a specific precision and common period to the schema. 

What is a layer? A layer is a data store that allocates data within itself to memory locations, depending on the length of the layer and its precision. Metrics, on the other hand, are usually stored on multiple layers. For example, you want to store data for the last day with an accuracy of 5 seconds, you add `5s:1d` to the schema. You would also like to store data with an accuracy of 1 minute and a duration of a week - now the schema setting will look like `5s:1d, 1m:1w`. 

It is up to you to judge what precision and distance you want to store data for your application. 

Values like `5s`, `10m`, `2h` are intervals that can be decoded as `5 seconds`, `10 minutes`, `2 hours`. 

Here is a list of supported intervals:

- s - seconds
- m - minutes
- h - hours
- d - days
- w - weeks
- mon - months
- y - years

Intervals start with an integer followed immediately by the type of interval, e.g. `1m`, `10d`, `120s`, `1y`.

Keep in mind that layers do not follow each other, but are placed on top of each other. So if your longest layer holds a year, anything longer than a year you will lose.

If the name of the metric does not fit any pattern, the default pattern will be used:

```ts
{
    name: 'default',
    pattern: '*',
    retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1m, 1d:1y',
}
```

-----

**The default scheme is designed for about 120 values per layer. This is very low! Please **must** create your own storage schemes with higher precision per period.**

-----

Checking the existence of the circuit:
```ts
DB.schemeHas('schemeName') // return boolean
```

Get list of schema metrics:
```ts
DB.schemeMetrics('schemeName') // return ['test.name.metricid',...]
```

There is currently no way to obtain internal circuit settings. Making changes to them may have unintended consequences. Since you create schemas yourself, the best solution is to store (duplicate) schema settings outside the `Database` class or use class inheritance.

### Calculating the space occupied

You can find out in advance how much your metric will occupy in memory, for this purpose you can divide (it is better to do it in seconds) the period by the interval. The obtained value is the number of memory cells for this layer. Multiplying the obtained value by 12 will give you the size of the layer in bytes. Thus, you can estimate how much you want to store and with what accuracy. 

-----

**Don't forget! You pay with RAM for accuracy** 

-----

Getting the size for the metric (not recommended) using ``Collector``, for example:

```ts
DB.Collector.size('test.name'); 
```

But it's better to look at how much the whole schema and all the metrics within it take up:

```ts
DB.schemeSize('test')
```

Get a list of all schemas created so far:

```ts
DB.schemeList() // return ['default', 'test']
```

Free up memory by deleting the entire schema:
```ts
DB.schemeDestroy('test')
```

Data recording
-------------

Writing the metric to the database:

```ts
DB.write("test.name.metricid", 1234.5678)
```

Where:

 - `test.name.metricid` - The name of the metric, specified in the same way as patterns
 - `1234.5678` - **The value for the metric is of type float(32bit)**.

By default, data is always written to the database from `now`.

Specifying the time:

```ts
DB.write("test.name.metricid", 1234.5678, 123456789)
```

The default time is `0`. If the value is `0`, the current time will be set to `now`. 
If you use abstract values to specify the time, they must start with a value > 0.

Note that all calculations in the database are in seconds. You cannot use a floating-point number as a time index.

### Modifiers

Writing to the database is done by time index within each layer. This behavior is caused by a feature of the layer that cannot store data more often than the layer's accuracy. In order to compensate for some of the problems associated with this feature, you can apply different value modifiers on writes.

Specifying a value modifier:

```ts
DB.write("test.name.metricid", 1234.5678, 0, 'sum')
```

Here's a list of them:

 - **last** - Permanently overwrites the metric index value
 - **first** - Leaves the first metric value to be overwritten
 - **max** - Overwrites the value if the new value is greater than the old one.
 - **min** - Overwrites the value if the new value is less than the old value
 - **avg** - Calculates the average value between the current value and the previous value
 - **sum** - Adds the current value to the past value.

**Default**, data is always written **using the `last`** modifier. Please keep this in mind.


Data retrievals
----------------

Retrieving data using a simplified period record.

```ts
DB.read('test.name.metricid', 'now-6h:now', '15m')
```

Where:

 - `test.name.metricid` - The name of the metric
 - `now-6h:now` - Relative period
 - `15m` - Interval

Such a query will return all records for the last 6 hours with an accuracy of 15 minutes. Specifying `now` with a calculation (note `now-15m:now`) can only be used in the `Database.read` method.

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

If this metric has not been initialized, the query will return all values equal to `null` and a `relevant` flag equal to `false`.

You can use a query method specifying an arbitrary period time.

```ts
// Interval.now() Returns the time in seconds
const start = Interval.now() - 1000 // start = now - 1000 seconds
const end = Interval.now()
DB.readCustomRange("test.name.metricid", start, end, '15m', 'avg')
```

It is recommended to use a simplified way of specifying the period. It is suitable for implementing presets with a certain accuracy and range of metric view.

Any interval is always converted to seconds, so if there is a need to specify the interval in seconds, it is easiest to form a string with the interval and the required number of seconds.

```ts
DB.readCustomRange("test.name.metricid", start, end, intervalInSec + 's', 'avg')
```

Sometimes it is more convenient to get always the same number of points regardless of the period. This behavior for the chart is more expected for the user. The user always sees the same number of points per chart regardless of presets like 'now-1d:now', 'now-1w:now', 'now-1mon:now'.

For this purpose you can specify instead of interval - number of points.

```ts
DB.read('test.name.metricid', 'now-6h:now', 300)
```

Note that the minimum value for the interval can be 1s, which means that if the transmitted period does not contain 300 points, the number of points will be reduced proportionally to the size of the period. In any case, this behavior is considered conditionally safe and will not lead to a request with a very large number of points on the chart.

### Aggregation

The database read functions support several basic data aggregation functions. These functions will be applied to a data set within period intervals. 

The `last` function is used by default.

List of available functions:
 
- **last** - Will return the last non `null` value, if all values are `null` - will return null
- **first** - Returns the first non `null` value, if all values are `null` - returns null.
- **max** - Returns the maximum value if all values are `null` - returns null
- **min** - Returns the minimum value if all values are `null` - returns null
- **avg** - Returns the average value if all values are `null` - return null
- **sum** - Returns the sum of values if all values are `null` - returns null
 
Example of use:
```ts
DB.read('test.name.metricid', 'now-6h:now', '15m','avg')
```

You can use the `MetricResult` class to apply an aggregation function to the results of a metrics query. This can be useful, for example, to get the maximum and minimum values in a sample.

```ts
const data = DB.read('test.name.metricid', 'now-6h:now', '15m','avg')
const dataMax = MetricResult.aggregate(data, 'max') // Returns a number or null
```

Search for available metrics
-----------------------

If you are using the `Database` class, you can include a metrics tree. The metric tree allows you to search for metrics by mask. 

To enable the metric tree, you must specify the `metricTree: true` parameter when creating the `Database` class:

```ts
const DB = new Database({ metricTree:true })
```

For example if you want to find all metrics with the pattern `test.list.*`, you can get them using the `find` method of the `MetricTree` class:

```ts
 DB.MetricTree.find('test.list.*')
```

Such a query will return an array of paths/metrics:

```ts
[{
   leaf: true, // Is the path a finite path (false if the path is a list)
   name: 'name', // Act name
   path: 'test.list.name', // Full path
}]
```

The metrics tree is very expensive for memory usage, please keep this in mind. If you want to save memory, you can shorten the metrics name as much as possible. 

## Advanced features

### Schema Optimization

Schema optimization is more of an advanced feature. If you need to start working with the database right away, it is recommended to skip this item.

Layers support different storages to optimize data storage. The default storages used now are `Uint64` for time storage and `Float` for value storage.

Such storages may not be particularly optimal, for example, for storing Boolean values, or if numeric labels of small values are used as time stamps instead of real time.

To optimize storage, you can specify specific value and time storages. 

```ts
DB.scheme('test', 'test.name.bit', '10s:3h, 2m:1d, 30m:3mon, 1h:1y', StorageTypes.Bit, StorageTypes.Uint64)
```

Now only bit values (0,1) can be used as values for metrics named `test.name.bit.1`. Only 1 byte of memory will be allocated for every 8 metrics in this group, which is 32 times less than if the standard memory type was used.

It should be taken into account that the time storage must hold the required index 100%. For example, if we choose the type for the `Uint8` time store, and try to write a value of 256, we will actually write a value of 0 to the timestamp, which will cause the `startTime` and `endTime` layer to be offset. Such a bias can lead to data loss. Therefore, when selecting a storage for time, we need to make sure that the values to be written always fit into this type. 

Naturally, only integer data types should be used for storing the time index. Otherwise it can lead to unpredictable consequences when rounding numbers to the layer accuracy. 

The following types are supported:

 - Bit - Bit value 1 or 0
 - Double - Floating point number (64 bit size) 
 - Float - Floating point number (32 bit size)
 - Int8 - Integer up to 127 (can be negative)
 - Int16 - Integer up to 32,767 (can be negative)
 - Int32 - Integer up to 2,147,483,647 (may be negative)
 - Int64 - Integer up to 9,223,372,036,854,775,807 (can be negative)
 - Uint8 - Integer from 0 to 255
 - Uint16 - Integer from 0 to 65 535  
 - Uint32 - Integer from 0 to 294 967 295 
 - Uint64 - Integer from 0 to 18 446 744 073 709 551 615

### Working with layer time

If you are using a database to cache data, you may run into the problem of getting data in a relative period. Let's say you took old data and wrote it to the database. How do you know the beginning and end of the graph?

Since version 2.3.0 it is now possible to get the estimated start and end of the chart:

```ts
if ( DB.Collector.has(test.metric)){
    const startedAt = DB.Collector.start('test.metric')
    const endedAt = DB.Collector.end('test.metric')
}
``` 

Also, a special method has been added to get the entire graph:

```ts
// metric.id & points count
const result = DB.readAll('test.metric', 300)
``` 

With this method you can easily build an "infinite" graph. 

In some situations it may be necessary to build an "infinite" graph. Such a graph collects for example 600 points, after which only modification of data inside the graph takes place. The data set in such a graph as if constantly compresses it, and the graph does not shift in time.

High accuracy is important only for the first set of values, then you can use a layer with lower accuracy. For example, we get data every second, let's add a layer `1s:10m`, it will occupy about 8KB of memory and hold our 600 points. Next, we need to add a layer that would take the brunt of the storage over time. While we have added a layer to store only 10 minutes, let's add a layer for 3 hours with the same number of points `18s:3h`. Then we can add less and less precise layers, for example `2m:1d`, `1h:1mon`.


Of course, the graph will not be infinite and still in a month it will start to shift, but usually such amount of time is not required to collect time data of an infinite graph.

Alerting
-------------------

Since version 2.1.0, the `Alerting` tool is now available for tracking and creating alarm messages. 

To use this tool you need an already initialized `Database` class. 

Initialization:

```ts
const AT = new Alerting(DB)
```

The `Alerting` class itself requests data from the database using the settings defined in the `AlertQuery` class. 

Example of creating a query customization class that will query the average value every 5 seconds for the last 15 seconds:

```ts
const aQuery = new AlertQuery('5s', '1s', 'now-15s:now', 'avg')
```

 - **evaluateInterval** _5s_ - Interval at which the data will be requested
 - **interval** _1s_ - Request Interval
 - **period** _now-15s:now_ - Relative period of the request
 - **func** _avg_ - Query aggregation function

The `BasicCondition` class is used to define conditions:

```ts
// level, condition type, params
const aConfig = new BasicCondition('danger',"outRange",[-5,5])
```

 - **level** _danger_ - Text representation of the danger level (user defined, will be reflected in the message). This field can be left blank to save memory.
 - **type** _outRange_ - Type of status check
 - **params** _[-5,5]_ - Parameters for the status check.

Available check types for `BasicCondition`:

 - **isAbove** - Value above parameter
 - **isBelow** - Value below the parameter
 - **isEqual** - Value equal to the parameter,
 - **outRange** - Out of parameter (requires 2 parameters),
 - **inRange** - Entering the limits defined by the parameters (requires 2 parameters).
 - **noValue** - If the query results in a `null` value (requires no parameters).
 
Now that the parameters are defined, you can assign them to the desired metric:

```ts
// path, query, config, id, additional
AT.watch('test.name.2',aQuery, aConfig, '', {})
```

 - **path** _test.name.2_ - Path to the metric
 - **query** _aQuery_ - Instance of the `AlertQuery` query customization class
 - **config** _aConfig_ - Instance of the `BasicCondition` state checker customization class
 - **id** _''_ - Unique identifier. If you specify an empty string, it will be generated automatically.
 - **additional** _{}_ - Additional data that will be passed if the rule is violated.

--------

You can assign the same rules and query settings to different metrics. **If you create new metrics for each tracking point, you may lose a lot more memory**.

--------

You need to subscribe to receive triggered condition messages:

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

 * **id** - Tracking point identifier (specified in the `watch` function)
 * **value** - Query result for the metric
 * **status** - Message status
     * **created** - When the message was first received
     * **updated** - When the message is repeated more than once
     * **ok** - Message when data has stopped violating conditions
 * **count** - Number of violations
 * **timestamp** - Time of update.
 * **created** - Time of creation
 * **condition** - Violated condition
 * **areas** - Condition Zones
 * **threshholds** - Threshold value
 * **additional** - Additional Tracking Point Information

Areas - Zones are always specified from smaller to larger. For example the zone from 3 to 5 `[3,5]`.

Zones can start at minus infinity and end at infinity. In this case `null` will be specified instead of the value.