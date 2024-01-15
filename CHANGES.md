Changes
=======

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