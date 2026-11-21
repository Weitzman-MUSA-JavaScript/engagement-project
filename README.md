# Community Safety Sessions - a safety planning pilot
## Project by Jamie Song, MPH for MUSA 6110, Professor Mjumbe Poe

This participatory mapping project is a pilot mockup for safety planning focus groups to be held across the City of Philadelphia.

## Project Proposal

Complete the following guiding statements to define the purpose and audience for your participation tool:

1. **The specific participants/community I want to engage are...**
   Community members in Philadelphia, primarily community and organizational leadership with developed knowledge bases about their local areas, who will be recruited to attend focus group sessions in their neighborhoods through a collaboration between the Philadelphia Department of Public Health, the University of Pennsylvania, and neighborhood community organizations.

2. **The contributions/input I am inviting them to make are...**
   Ideas for improving safety, locations where safety could be improved, community assets that will help with safety planning.

3. **The participants will benefit from contributing their input by...**
   Engaging with each other's ideas, developing further knowledge about their communities and viewpoints expressed by fellow community members, making contributions that could positively impact their own communities.

4. **The users that will use the collected data are...**
   Community members themselves who can use the collected data to advocate for change, along with their councilmembers' offices; city planners and public health officials who can collaborate to implement changes to improve safety; university faculty and staff who can study the collected data and share with colleagues, as well as use the data to generate hypotheses.

## Overview

Community Safety Sessions is an interactive mapping application for sharing place-specific safety concerns, community assets, and improvement ideas. The current implementation is a working development mockup of the proposed focus-group tool.

The application follows this participation workflow:

1. **Contribute independently:** Start a practice session and describe a place before viewing other participants' input. Locate it by clicking the map, searching for a Philadelphia address, intersection, or listed landmark, entering coordinates, or describing the place without a map point.
2. **Describe what matters:** Choose a safety concern, community asset, or improvement idea; write a description; and optionally add a topic and time context, such as after dark or on the way to school. Save the contribution to shared storage. A return code allows participants to resume their practice identity and edit or withdraw their own contributions.
3. **Review and respond:** Choose to enter review, then browse existing contributions through a map, list, or table, and filter by session, topic, contribution type, text, or whether a place has a map point. Responses record similar or different experiences for concerns and assets, or support for improvement ideas, with an unsure option and optional explanation.
4. **Discuss places together:** Group review presents contributions one at a time alongside aerial imagery or a street map, with manual navigation and an optional external Street View link. Contributions and current-version responses can also be downloaded in JSON or CSV format during review.

The current build contains fictional starting examples and saves new entries as demo records. Real focus-group collection and participant usability testing remain future pilot work. The collected data support discussion of experiences and ideas.

## Data & Citations

### Reference data

- **Street basemap:** [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- **Philadelphia boundary:** City of Philadelphia, [City Limits dataset](https://opendataphilly.org/datasets/city-limits/)
- **Address and intersection lookup:** City of Philadelphia, [Philly Composite Locator](https://citygeo-geocoder-pub.databridge.phila.gov/arcgis/rest/services/Geocoders/Philly_Composite_Locator/GeocodeServer)
- **Group-review aerial imagery:** Pennsylvania Emergency Management Agency (PEMA), [2021–2023 imagery service hosted by Pennsylvania Spatial Data Access (PASDA)](https://imagery.pasda.psu.edu/arcgis/rest/services/PEMAImagery2021_2023cache/MapServer)
- **Optional street-level context:** [Google Maps Street View](https://developers.google.com/maps/documentation/urls/get-started#street-view-action)

### Participant-contributed data

Each contribution stores a stable identifier, version, source session, contribution type, topic, place label, description, optional time context, creation/update timestamps, and participation-phase metadata. A mapped location is a GeoJSON Point using WGS84 coordinates in longitude/latitude order. Location source and precision are recorded. Descriptions without a point have null geometry and remain available in the list and review views.

Responses are stored separately and linked to the contribution identifier, its version, the responding session, and a practice identity. Each response contains a structured choice, question identifier, optional comment, and timing information. One saved response is allowed per practice identity, contribution version, and responding session; it can be updated or removed. Return codes authorize access to a participant's practice records but do not verify a unique person.

Review-phase exports cover all available sessions regardless of the current view filters. They include contributions and responses to current versions; contribution records retain demo/example flags. Withdrawn contributions, earlier-version responses, return codes, identity hashes, and free-text response comments are excluded. Participants should leave identifying details out of practice entries; visibility, retention, moderation, and return-of-findings arrangements must be finalized before real collection.

## Technical Details

The application uses vanilla HTML, CSS, and JavaScript modules. A custom map component combines raster basemap tiles, SVG boundary graphics, and interactive point controls. The map uses Web Mercator for display while storing contribution coordinates in WGS84 longitude/latitude. The list and forms provide a way to contribute and review without manipulating the map.

The frontend communicates with a shared-data API. Local development uses Node.js 24 or later and its built-in SQLite module; the hosted development version runs a Cloudflare Worker with a Cloudflare D1 database through Sites. Server-side validation checks submitted fields, Philadelphia point locations, record ownership, and contribution versions. Database migrations are stored in `site/drizzle/`. The application has no third-party runtime package dependencies; development tools include ESLint, Stylelint, and axe-core.
