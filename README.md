# Bangkok Community Ideas for Infill Development

Bangkok currently has an estimated 320 unfinished high-rise projects and 730,000 vacant housing and condominium units that can be utilized for something more meaningful to the community.

A brief title and one-line description of your project.


## Project Proposal

Complete the following guiding statements to define the purpose and audience for your participation tool:

1. **The specific participants/community I want to engage are...**
   <!-- Describe the specific participants or community members you want to invite to participate. Be more specific than "the general public". -->
   I am interested in getting the opinions of younger age groups (18-36). Thailand has an aging population structure, almost as bad as Japan's, so this group will be the ones who benefit from current planning the most. With their participation, this method of community engagement can provide developers with information on willingness to pay for different developments.

2. **The contributions/input I am inviting them to make are...**
   <!-- Describe what data, annotations, suggestions, or reports participants will contribute. -->
   Abandoned buildings data, current land use, and the zoning map will be used for the basemap for participants to better understand areas of growth opportunity. Participants will contribute by annotating and commenting on different ideas for the use of abandoned or blighted areas. They will also be able to upvote ideas and provide feedback.

3. **The participants will benefit from contributing their input by...**
   <!-- Explain how the participants themselves benefit from taking part. -->
   By directly showing their demands and their willingness to pay for different service developments, developers can use this information to build projects that are beneficial and wanted by the community. Some examples are repurposing high-rises into affordable housing, open park space, recreation areas, vertical farming, markets, etc.

4. **The users that will use the collected data are...**
   <!-- Identify who will use the resulting data (these could be the same as the contributors, or a different group such as planners, organizers, or dispatchers). -->
   Developers and planners can use this data as a way to asses the needs of the community. The former can directly use this data to estimate their customer base while the latter can use the data as community engagement to create more favorable zoning for such developments.

5. **The collected data will benefit those users by...**
   <!-- (Optional, if the users of the data are different from the participants contributing the input) Explain how the data will help those users make decisions or take action. -->
   Participate in more meaningful projects that lead to more sustainable growth and are more likely to be successful.

## Overview

<!-- Provide a high-level overview of the application, how it works, and how users interact with the map and interface. -->

The application will have a map dashboard with a side panel on the left, displaying some statistics such as the proportion of land use types and giving the user the option to view areas and individual buildings. The area option would allow users to search by area and provide an overview of abondoned buildings, economic opportunities, and population. Building view allows the users to click on buildings, get statistics such as the area (m^2) and distance to parks, parking lots, and other public services. There will be a search bar on the top for addresses and individual buildings, as well as areas.

## Data & Citations

<!-- List all data sources used by your application and include citations. -->

* **Reference Data:** <!-- Describe any reference layers (e.g. basemaps, boundaries, transit lines) and cite their sources. -->
   - ![Abandoned projects](http://www.unfinishedbuildings.org/bangkok.html)
   - ![Vacant housing](https://www.nationthailand.com/business/property/40057639)
   - OpenData Portals: ![Dateno](https://dateno.io/search?q=farm&size=n_10_n&filters%5B0%5D%5Bfield%5D=source.name&filters%5B0%5D%5Bvalues%5D%5B0%5D=Open%20Government%20Data%20of%20Thailand&filters%5B0%5D%5Btype%5D=any&filters%5B0%5D%5Bpersistent%5D=false), ![BMA](https://citydataportal.bangkok.go.th/cms/home), ![NSO](https://www.nso.go.th/nsoweb/nso/statistics_and_indicators#gsc.tab=0), ![GISTDA](https://opendata.gistda.or.th/), ![Census](https://gdcatalog.go.th/dataset/?organization=a71046a9-2f29-4edb-85f1-d9bfa23c5a03&res_format=GeoJSON)

* **Participant Contributed Data:** <!-- Describe the schema/structure of the data that participants generate or contribute. -->
GEOJSON files for each abanonded building/plot that contains all ideas, number of upvotes, and top 5 comments in the features section.

## Technical Details

<!-- Document key technical choices (e.g. Vanilla JS or Vue + Vite, Firebase/Firestore configuration, mapping libraries, external APIs, and instructions for running or deploying the project). -->
- MapLibre
- Vue + Vite
- Firestore