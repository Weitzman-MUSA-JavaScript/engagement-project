# Ground Truth Data Gathering for the Houston Grocery Gap Tool

Residents of Houston's food deserts map where they actually shop, which stores sell fresh food, and where they would like to see a new store. Then, planners and other admin users see all this data inside the grocery recruitment tool (see https://github.com/gbd2/dashboard-project/tree/main).


## Project Proposal

1. **The specific participants/community I want to engage are...** Residents of Harris County's 175 low income, low access tracts, especially the households without a car who shop at whatever is within walking distance or a bus ride. A second group is the people who work in those neighborhoods on food inequity: Houston Food Bank outreach staff, community health workers and church pantry volunteers, who might visit or hear from residents about corner stores and markets and know which ones stock fresh food.

2. **The contributions/input I am inviting them to make are...** Three kinds of input:
   - **Store checks:** Pick a store on the map and answer a short checklist: does it sell fresh produce, fresh meat or dairy, how prices compare to a supermarket, and whether it takes SNAP or WIC. Flag stores that have closed, and add food sources the federal data misses, such as pantries, farmers markets and church distributions.
   - **Where I shop:** Choose your neighborhood, the store you use most for groceries, how you get there, and how often you go.
   - **Where I'd want a store:** Drop a pin where a new store would help you and choose what kind (a supermarket, a small grocer or a farmers market).

3. **The participants will benefit from contributing their input by...** Getting a map of where fresh food can actually be found near them, which no official source has, since federal data counts any store that takes SNAP. Every store check makes that map better for their neighbors. Their requests will also be visible to the decisionmaker on where new stores will be put, and the public map shows how many neighbors have asked for a store in each area.

4. **The users that will use the collected data are...** users looking for fresh food and information about their local food environment. Further, from the planning perspective, the City of Houston and Harris County economic development staff, the council and commissioners court offices they report to, and food access partners such as the Houston Food Bank (same planners who use the Houston Grocery Gap decision support tool). They sign in to a planner view of that tool, where residents' input is layered over the existing maps.

5. **The collected data will benefit those users by...** Reducing uncertainty by using what residents report. Store checks give planners a third definition of food access, based on which stores actually sell fresh food, in place of the choice between USDA's "any SNAP store" (8 food desert tracts) and "grocery stores only" (175). Wanted-store pins add a resident demand factor to the site ranking. "Where I shop" shows how far people travel today and which stores they already use, which tests the plan step's assumption that a new store's sales mostly come from existing stores. Store checks also point to corner stores that already sell some fresh food and could join a healthy corner store program, a far cheaper option than a multimillion dollar supermarket incentive.

### Personas

- **Denise, 58, Sunnyside:** Doesn't drive. Takes two buses to a supermarket twice a month and fills in at the corner store and the dollar store. She knows which corner store keeps bananas and which never does, and she'd like that written down somewhere her neighbors can find it.
- **Marcus, 31, Houston Food Bank outreach coordinator:** Visits 15 to 20 corner stores and pantries a month across the east side. He fills out store checks on his phone between visits, and his reports carry the most store detail.
- **Priya, 25, City of Houston economic development analyst:** Uses the grocery gap tool to shortlist sites for recruitment incentives. She signs in to see where residents asked for stores, which corner stores already sell produce, and how far people in her shortlisted tracts travel to shop today.

### Build order

1. Store checks, readable and writable by anyone, saved in Cloud Firestore
2. Wanted-store pins
3. Where I shop
4. Planner sign-in and the overlays in the decision support tool
5. Moderation (planners can hide bad reports) and polish

For the demo, the planner view will be populated with contributions clearly labeled as samples.

## Overview

<!-- Provide a high-level overview of the application, how it works, and how users interact with the map and interface. -->

## Data & Citations

* **Reference Data:** Store locations, census tracts, food desert flags, Opportunity Zones, bus stops and city limits carry over from the Houston Grocery Gap decision support tool. Full citations to come.
* **Participant Contributed Data:** Store checks, where-I-shop trips and wanted-store pins, stored in Cloud Firestore. No names, emails or addresses are collected, and where-I-shop records are visible only to signed-in planners.

## Technical Details

Plain JavaScript and Leaflet, with Firebase (Cloud Firestore and Firebase Authentication) loaded from its CDN, so there is no necessary build step. Planners sign in with an account created in the Firebase console; there is no public sign-up. Firestore security rules let anyone add a contribution, let the public read store checks and wanted-store pins, and limit where-I-shop records to signed-in planners.
