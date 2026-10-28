# Project Name

Guess the budget! Estimate how Philadelphia General Fund money is distributed amongst each city department. 

## Project Proposal

Complete the following guiding statements to define the purpose and audience for your participation tool:

1. **The specific participants/community I want to engage are Philadelphia voters**

2. **I am inviting them to contribute their estimate of how they think the Philadelphia general fund budget is divided**

3. **The participants will benefit from contributing their input by seeing where their estimates were accurate and inaccurate and they will see the aggregated estimates from other Philadelphia voters and how their estimate compares to others.** 

4. **The users that will use the collected data are both Philadelphia voters and elected Philadelphia decision makers.** 

5. **For voters, it can visualize how the budget is allocated. For decision makers, it can inform them on how well they are doing at clearly communicating the budget process to their constituency**


## Overview

The interface will allow the user to input what percent of the general fund budget they think the City spends on each department. It will have a corresponding pie chart that changes each time they input a percentage into the boxes associated with each department. It will calculate the total amount of money in dollars depending on the percent they input. 

They will submit their guess and the next page will tell them how correct they were. It will show the actual numbers in three different visuals: a pie chart, a steam graph, and a bar chart. They can toggle between each visualization. In addition to their estimate and the actual budget distribution, it will have category for what the average Philadelphia voter thinks. This will be the data collection element of the assignment. The tool will store all of the data that each voter submits and average it into one data set. It will be displayed next to "your guess" and "actual distribution" as "average Philadelphia voter's guess."

I will qualify this last statement by sharing where the aggregate data comes from. 

## Data & Citations

I am planning to use these sources: 

*City of Philadelphia, FY2027 Proposed Operating Budget. Data compiled by Aaron Couch, phila-budget-site (acouch, GitHub). https://github.com/acouch/phila-budget-site
*Budget data from OpenDataPhilly http://opendataphilly.org/

## Technical Details

I plan to just use Vanilla JS, but want to explore Vite. I will not be using mapping libraries because I am not going to map any data as it is irrelevant to the goal of the tool. I will, instead, be using D3 to visualize and compare the various data sets. I'll be pulling data from OpenDataPhilly with an API. 

