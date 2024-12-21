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
