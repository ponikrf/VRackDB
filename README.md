
VRackDB - This is an **embedded In Memory** database designed for storing time series (graphs). 

Features: 
 - Has a simple query format
 - Always returns data as a graph. 
 - Very easy to use
 - Very economical/very fast
 - Aggregation and data modifiers
 - Stores data in memory. If you close the program, the data will be lost
 - Reserves metric memory, subsequent addition of metric data does not increase memory consumption
 - Simple tool to track data and create alarm messages

Here are some examples of VRackDB applications:
 - Plotting a graph of a file download
 - Analyze application memory consumption
 - Diagnose latency of HTTP/API/WebScoket and other requests
 - Quantitative analysis of successful/unsuccessful operations per time interval 
 - SOC applications for computers and computer-based devices (multimeters, lab power supplies, etc.)
 - Data caching for fast graph display/analysis
 - Storage of time-based diagnostic information

For a **quick start** we recommend that you visit [our guide](https://github.com/ponikrf/VRackDB/wiki/EN%E2%80%90DOC%E2%80%90V3.0) 

[Русская версия](https://github.com/ponikrf/VRackDB/wiki/RU%E2%80%90README-V3.0)

A local version of the [guide is available](/docs/EN-Doc.md)

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


### Upgrade to version 3

If you are already using version 2, it is recommended that you check out [official guide](https://github.com/ponikrf/VRackDB/wiki/EN%E2%80%90DOC%E2%80%90V3.0) to upgrade to the new version.


Last changes
============

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

