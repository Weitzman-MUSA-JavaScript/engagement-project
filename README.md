## Introduction

Due to a structural funding shortfall, SEPTA (the transit agency for the Philadelphia area) was forced to enact significant service cuts in the summer of 2025. The service cuts lasted two weeks, starting August 24. Though the cuts were reversed after the agency shifted funds from its capital budget to its operating budget, the underlying funding shortfall still remains, and similar cuts may return if a long-term funding agreement is not enacted by the Pennsylvania legislature.

## Purpose

This online tool is intended to help SEPTA riders (or potential SEPTA riders) understand what the day-to-day impacts of these service cuts were. The tool, based on actual service data rather than scheduled trips, allows users to select specific trips (for example, their commuting trips) to see how bus service to their own stop at particular times of day were impacted by the service cuts.

This tool focuses specifically on reduced bus service. Though the media and riders (understandably) paid much attention to the 32 eliminated and 19 shortened bus routes, as well as the threat of elimination for several Regional Rail lines, the degradation in service for routes which still existed—and continued to serve hundreds of thousands of riders—received less attention. This tool alleviates this information gap by quantifying the actual decrease in service as well as estimating the amount of time lost to riders because of the service cuts.

## Data and methods

The underlying data are real-time bus arrival data collected by SEPTA (and generously shared with the author). The data include arrival times for 41 bus routes which continued operations during the service cuts; these routes include high, medium, and low ridership routes, as well as a mix of urban and suburban routes. The time period of the data spans the week immediately before the cuts (August 17-23), as well as the first week of the cuts (August August 24-30).

The number of bus arrivals both before and during the cuts is calculated at each stop, separately for each route, each direction, day of the week (weekday vs weekend), and time of day. (The count is normalized by day of week, so that the values are comparable for weekdays and weekends. Further, any trip with a bus arrival count of zero either before or during the cuts is excluded from comparison.) Based on these counts, the percentage difference during the cuts vs before the cuts is calculated. 

The estimates of waiting times are calculated by dividing the number of minutes in the time window by the number of arrivals, and dividing this value by two. For example, if 3 buses arrived at the stop during the morning rush period (7-10 am), the average waiting time would be 30 minutes (i.e., with a frequency of one bus per hour, if you arrive at a random time the expected value of of your waiting time would be 30 minutes). The difference in waiting time due to the cuts is simply the waiting time during the cuts minus the waiting time before the cuts.


