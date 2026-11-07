# Philadelphia Microclimate Experience Map

A participatory map for sharing how heat, cold, and wind feel in different places around Philadelphia.

## Project Proposal

1. **The specific participants/community I want to engage are...**

   People who walk, bike, or wait for public transportation in Philadelphia and experience outdoor conditions as part of their daily outdoor trips. 

2. **The contributions/input I am inviting them to make are...**

   Participants can select a location on a map and share how warm or cold and/or how windy it felt (categories like warm, cold, hot, etc.), when they experienced it (time, month, season ), how they were traveling (walk, bike, stand), and any optional addtional comments about the place.

3. **The participants will benefit from contributing their input by...**

   Sharing local experiences and seeing observations from other people. These observations can help participants become aware of places where people have experienced heat, cold, or wind during particular times and seasons. Also, these perception data can be used to validate the micro-climate model's result like UTCI map.

4. **The users that will use the collected data are...**

   Philadelphia walkers, cyclists, and transit riders exploring others' experiences, as well as community organizations or planners interested in understanding where people report uncomfortable outdoor conditions. Also for micro-climate researchers to validate their models.

5. **The collected data will benefit those users by...**

   Providing place-based observations that can help people explore patterns and identify locations for further investigation. Help researcher to improve their models.

## Overview

The proposed application will display participant observations on a map centered on Philadelphia. A participant can choose a location, fill in an observation form, and submit a report. After submission, the application will confirm the result and make saved observations available for others to explore. Selecting an observation will show its details, including when it was experienced.

The first version will focus on selecting a location, submitting an observation, saving it, and viewing saved observations after a reload. Filtering by temperature feeling or wind is a possible later addition. The interface should work on mobile and desktop and provide accessible ways to navigate and complete the form; the exact location-selection method remains to be designed.

## Data & Citations

### Reference data

The map will need a basemap and may use a Philadelphia boundary or other contextual layers. Providers and datasets have not yet been selected. 

### Participant-contributed data

Each observation is planned to contain:

| Field | Description |
| --- | --- |
| Location | Map-selected coordinates in the Philadelphia area. |
| Temperature feeling | Hot, comfortable, or cold, if reported. |
| Wind feeling | Low, moderate, or strong, if reported. |
| Observation date and time | When the experience occurred, including year and month; this may differ from submission time. |
| Travel mode | For example, walking, biking, waiting for transit, or other. |
| Comments | Optional context, such as a lack of shade or wind between buildings. |

Participants should be able to report temperature feeling, wind feeling, or both. The exact form requirements and data format will be refined during design. Participant observations will be identified and described as such in the interface; attribution and data-sharing language will be determined before launch.

## Technical Details

The application and technical stack have not yet been implemented or finalized. Possible choices include Vanilla JavaScript or Vue with Vite for the interface, Leaflet for the map, and Firestore for shared persistence. Firestore's `getDocs` or `onSnapshot` could be used to retrieve observations; real-time updates are an option, not a requirement for the first version.

The implementation should validate submissions, provide success and error feedback, and preserve reports across reloads. Running and deployment instructions, selected services, and any configuration requirements will be documented here once established.
