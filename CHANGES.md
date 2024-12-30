Changes
=======

update 3.0.0
------------

### SchemeDB

 - Added SchemeDB class - Replaced the old `Database` class.
 - Removed working with `MetricTree` (find method). Now you can use `MetricTree` without `SchemeDB`.
 - The `scheme` method now uses named parameters 
 - It is now possible to define the `CInterval` parameter in the `scheme` method, which controls the minimal time unit (note: seconds, milliseconds, microseconds).

### SingleDB

 - Added SingleDB class - The simplest class for working with metrics. Each metric in this class can have different settings from other metrics. This class is the parent of the `SchemeDB` class

### Database 

 - The class has been removed, now SchemeDB instead

### Layer 

 - General refactoring - converted to TypeScript style
 - Changed the initialization of the class. Named parameters are now used
 - Size method removed, and replaced with `Layer.length`.
 - All internal settings like `interval`, `period`, etc. are now read-only via “getters”.

### Collector

 - General refactoring - moved to TypeScript style
 - The init method now uses named parameters
 - Internal documentation update
 - `Collector` methods now use the `Interval` that was specified when the metric was created
 - Optimization of metrics settings storage
 - All class properties are now defined as protected
 - Added readFake method to retrieve irrelevant metrics
 - Added info method that returns additional information about the metric (size, first write, number of attempts to write to the metric).

### Interval

 - Updated internal documentation, comments now better answer the question about what methods do.
 - Added new concept of MTU - minimum time unit. MTU is a unit of time represented as an integer. For example, for the Interval class MTU = 1 second. For IntervalMs MTU = 1 millisecond, etc.
 - Internal interfaces are now exported for use inside other extensible classes like IntervalMs
 - Added getFactor() method which returns a time multiplier to get the MTU from the JS standard time. (Normally, JS uses milliseconds as the time. Factor to get MTU in Interval will be 0.001)
 - Added 2 more intervals to the standard interval set - ms and us - millisecond and microsecond respectively
 - Now if the result of interval conversion returns a fractional number - it will be rounded up.
 - Fixed a problem with the partOfPeriod method. Previously it could perform only one type of operation in one expression, e.g. calculate `1m+10m+1h` but if you needed to use both `+` and `-` it would cause an error.
 - Added IntervalMs & IntervalUs classes to calculate Ms and Us as MTUs


update 2.3.0
------------
 * Added method `Collector.writeCount(metricId)` which returns the number of records in the metric
 * Added method `Collector.start(metricId)` which returns the expected start of the metric graph
 * Added method `Collector.end(metricId)` which returns the expected end of the metric graph
 * Now the size for each metric is calculated in advance, and `Collector` returns a ready-made value. This greatly speeds up the calculation of the occupied space of metrics in the scheme
 * Added method `Database.readAll(metricId, precision, func)` Which returns data from the beginning of the metric record to the last record


update 2.2.3
------------
 * Fixes an issue where a non-existent value that was calculated by rounding was being captured. 


update 2.1.0
--------------------------
This update adds a simple tool for tracking data in the database and generating alarm messages.

 * Added `Alerting` class - for tracking data and generating alarm messages
 * Added `AlertQuery` class - for defining query settings
 * Added `BasicCondition` class - for defining the rule of alarm messages generation.
 * Added abstract `AlertCondtition` 
 * Added `isAggregateFunc` method to `MetricResult` class.
 * `Interval` class - removed unnecessary `console.log` class
 * Added alias for `Database` class

update 1.6.0
--------------------------
In this update, changes have been made to make the API easier to understand. The Collector class now works more explicitly with metrics. `Metric` has been removed from all method names

 - Changes to the Collector APi - read() now accepts seconds as the precision parameter.
 - The `Collector.hasMetric` method has been renamed to `Collector.has`.
 - The `Collector.initMetric` method has been renamed to `Collector.init`.
 - The `Collector.metricSize` method has been renamed to `Collector.size`.
 - Added `Collector.layers` method - returns layer settings and metric buffers
Now all methods in the class refer to a specific metric and require the metric name as the first argument.

1.5.0
--------------------------
 - Documentation fix
 - `Database.read` & `Database.readCustomRange` now support specifying the desired number of metrics instead of the precision interval.
 - Added `Interval.getIntervalOfFixedCount` method which returns the interval in seconds for a specified period to get a fixed metric count value.

1.3.3
-----
- Update documentation
- Add configuration metricTree to Database class

1.3.2
------
- All comment in english

1.3.0
-------
- Added classes for realizing different kinds of value and time storages
- It is now possible to specify the type of storage for collection and layer schema

1.2.0
-----

 - Added `MetricResult` class - Helper for processing the received results of metrics reads. It allows to aggregate the result of metric reads.
 - Now it is possible to apply aggregation function for functions of readings from the database
 - Added `MetricWrite` class - Helper for writing data to the database
 - Now for functions of writing to the database the possibility of applying the write modifier is available

 1.1.0
-----

 - Added data relevance flag in the database response, in case the metric does not exist but the response should be generated, the relevance flag will be set to `false` and for each interval will be set to `null`.

 - Added method `readCustomRange(name: string, start: number, end: number, precision: string)` to retrieve data for an arbitrary time period in seconds

 - Added `MetricTree` metric tree storage class. The `find` method is now available for the `Database` class to find metrics paths.