library(tidyverse)
library(dplyr)
library(sf)
library(jsonlite)


crashes <- st_read("https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/collision_crash_2018_2022/FeatureServer/0/query?where=crash_year%3D2022&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=") # nolint

investigations <- read_csv("https://phl.carto.com/api/v2/sql?filename=car_ped_stops&format=csv&skipfields=cartodb_id,the_geom,the_geom_webmercator&q=SELECT%20*,%20ST_Y(the_geom)%20AS%20lat,%20ST_X(the_geom)%20AS%20lng%20FROM%20car_ped_stops%20WHERE%20datetimeoccur%20%3E=%20%272022-01-01%27%20AND%20datetimeoccur%20%3C%20%272023-01-01%27") %>% # nolint: line_length_linter.
  st_as_sf(coords = c('lng', 'lat')) %>% # nolint
  st_set_crs("EPSG: 4326")

#https://walk.dvrpc.org/help/glossary/
ramps <- st_read("https://arcgis.dvrpc.org/portal/rest/services/Transportation/pedestriannetwork_points/FeatureServer/0/query?where=county%20%3D%20'PHILADELPHIA'&outFields=*&outSR=4326&f=json") # nolint
write_json(ramps, "/Users/amysolano/Documents/GitHub/engagement-project/data/ramps.json")


sidewalks <- st_read("https://arcgis.dvrpc.org/portal/rest/services/Transportation/pedestriannetwork_lines/FeatureServer/0/query?where=county%20%3D%20'PHILADELPHIA'&outFields=line_type,material,material_o,feat_type,raised,width,captured,state,county,muni,community,ped_sig,Shape__Length,vertchange,cracking,cross_slope,fix_obstr,veg,over_obj,buff_zone,st_light,tree,cond_date&outSR=4326&f=json") # nolint
write_json(sidewalks, "/Users/amysolano/Documents/GitHub/engagement-project/data/sidewalks.json") # nolint


ped_crashes <- crashes %>%
  filter(ped_count > 0)
# percent of all crashes: 0.1528969
write_json(ped_crashes, "/Users/amysolano/Documents/GitHub/engagement-project/data/ped_crashes.json")

investigations <- investigations %>%
  mutate(mvc_code = as.numeric(gsub("\\D", "", investigations$mvc_code)),
         mvc_reason = toupper(mvc_reason)) %>%
  filter(stoptype == "vehicle" &
           point_x > -76 &
           str_detect(mvc_reason, "RED|SPEED|SIGN|PEDESTRIAN|SIDEWALK|CROSSWALK|DISREGARD|PARKING|PARKED|BIKE|CROSS WALK|TURN|BUS|CURB|MPH")) %>% # nolint
  drop_na(mvc_code) %>%
  select(objectid, districtoccur, age, mvc_reason, geometry)

ped_inves <- investigations %>%
  filter(str_detect(mvc_reason,
  "PEDESTRIAN|SIDEWALK|CROSSWALK|BIKE")) # nolint
write_json(ped_inves, "/Users/amysolano/Documents/GitHub/engagement-project/data/ped_inv.json")

`%notin%` <- Negate(`%in%`)
ppa_csv <- read_csv("https://phl.carto.com/api/v2/sql?filename=parking_violations&format=csv&skipfields=cartodb_id,the_geom,the_geom_webmercator&q=SELECT%20*%20FROM%20parking_violations%20WHERE%20issue_datetime%20%3E=%20%272017-07-01%27%20AND%20issue_datetime%20%3C%20%272018-01-01%27") %>% # nolint
  drop_na(c('lon','lat')) %>%
  filter(anon_ticket_number %notin% c(8543657,9256982,8973963, 8973261) & str_detect(violation_desc, # nolint
                    "BLOCKING|CORNER|CROSSWALK|HP|SIDEWALK|INTERSECTION")) %>% # nolint
  mutate(violation = case_when(
    violation_desc == "BLOCKING DRIVEWAY" | violation_desc == "BLOCKING DRIVEWAY CC" ~ "BLOCKING DRIVEWAY", # nolint
    violation_desc == "CORNER CLEARANCE" | violation_desc == "CORNER CLEARANCE  CC" ~ "CORNER CLEARANCE", # nolint
    violation_desc == "COUNTERFEIT HP PERM" | violation_desc == "FRAUD PARK HP SPACE" | # nolint
      violation_desc == "HP RAMP BLOCKED" | violation_desc == "HP RESERVED SPACE" ~ "HANDICAP VIOLATION", # nolint
    violation_desc == "CROSSWALK" | violation_desc == "CROSSWALK    CC" ~ "CROSSWALK", # nolint
    violation_desc == "SIDEWALK" | violation_desc == "SIDEWALK   CC" ~ "SIDEWALK", # nolint
    violation_desc == "INTERSECTION   CC" | violation_desc == "STOP IN INTERSECTION " ~ "INTERSECTION" # nolint
    )) %>%
  drop_na(violation) %>% 
            filter(violation %in% c("CROSSWALK","CORNER CLEARANCE","SIDEWALK")) %>% # nolint
  select(location, violation_desc, lon, lat, violation)

write.csv(ppa_csv,"/Users/amysolano/Documents/GitHub/engagement-project/data/ppa.csv", row.names = FALSE)
write_json(ppa_csv, "/Users/amysolano/Documents/GitHub/engagement-project/data/ppa.json")
 # nolint
