# Purpose -------------------------------------------------------------------------------------
# Read SEPTA's GTFS feeds pre- and post-cuts and export needed subsets of data as geojson files.

# Preliminaries -------------------------------------------------------------------------------

library(tidyverse)
library(tidylog)
library(janitor)
library(tidytransit)
library(sf)

# Set path relative to location of this script
setwd(dirname(this.path::this.dir()))

data_dir <- str_c(getwd(), "/data")

# Arrivals data -----------------------------------------------------------------------------

arrivals_pre_raw <- data.table::fread(str_c(data_dir, "raw", "arrivals_data", "stop_observations_week1.csv", sep = "/")) %>% 
  clean_names()

arrivals_post_raw <- data.table::fread(str_c(data_dir, "raw", "arrivals_data", "stop_observations_week2.csv", sep = "/")) %>% 
  clean_names()

# Check which route/stop combinations are present in both data
stops_pre <- arrivals_pre_raw %>% 
  distinct(route_id, stop_id, stop_name)

stops_post <- arrivals_post_raw %>% 
  distinct(route_id, stop_id, stop_name)

stops_good <- inner_join(stops_pre, stops_post)

# inner_join: added no columns
# > rows only in stops_pre  (1,430)
# > rows only in stops_post (  154)
# > matched rows             6,809
# >                         =======
# > rows total               6,809

# Get arrival times for routes/stops which were served both pre- and post-cuts
arrivals_filtered_pre <- arrivals_pre_raw %>% 
  # filter: removed 161,960 rows (7%), 2,069,834 rows remaining
  filter(route_id %in% stops_good$route_id) %>% 
  # filter: removed 28,827 rows (1%), 2,041,007 rows remaining
  filter(stop_id %in% stops_good$stop_id) %>% 
  mutate(period = "before_cuts")

arrivals_filtered_post <- arrivals_post_raw %>% 
  # filter: no rows removed
  filter(route_id %in% stops_good$route_id) %>% 
  # filter: removed 20,020 rows (1%), 1,830,552 rows remaining
  filter(stop_id %in% stops_good$stop_id) %>% 
  mutate(period = "during_cuts")

arrivals_ready <- arrivals_filtered_pre %>% 
  bind_rows(arrivals_filtered_post) %>% 
  mutate(day_of_week = wday(service_date, label = TRUE)) %>% 
  mutate(week_period = if_else(day_of_week %in% c("Sat", "Sun"), "Weekend", "Weekday")) %>% 
  mutate(arrival_hour = as.numeric(str_extract(observed_time, "^\\d{2}"))) %>% 
  mutate(time_of_day = 
           case_when(arrival_hour <= 6  ~ "Early morning (00:00 to 6:59)",
                     arrival_hour <= 9  ~ "Morning rush (07:00 to 9:59)",
                     arrival_hour <= 14 ~ "Midday (10:00 to 14:59)",
                     arrival_hour <= 18 ~ "Afternoon rush (15:00 to 18:59)",
                     arrival_hour <= 23 ~ "Evening (19:00 to 23:59)")) %>% 
  mutate(time_of_day = 
           fct_relevel(time_of_day,
                       "Early morning (00:00 to 6:59)",
                       "Morning rush (07:00 to 9:59)",
                       "Midday (10:00 to 14:59)",
                       "Afternoon rush (15:00 to 18:59)",
                       "Evening (19:00 to 23:59)"))

# Directions often have multiple headsigns; pick the most common per direction
directions <- arrivals_ready %>% 
  count(route_id, direction_id, trip_headsign) %>% 
  arrange(route_id, direction_id, desc(n)) %>% 
  slice_max(order_by = n, by = c(route_id, direction_id), with_ties = FALSE)

# Clean order of routes
routes_order <- gtools::mixedsort(unique(arrivals_ready$route_id))
  
# Aggregate number of arrivals
arrivals_aggregated <- arrivals_ready %>% 
  mutate(stop_id = as.character(stop_id)) %>% 
  group_by(period, route_id, direction_id, week_period, stop_id, stop_name, gtfs_stop_sequence, time_of_day) %>% 
  summarize(arrivals = n()) %>% 
  ungroup() %>% 
  # Join prototypical direction headsigns
  left_join(directions %>% select(-n)) %>% 
  # Normalize counts to be arrivals per day
  mutate(arrivals = if_else(week_period == "Weekday", arrivals / 5, arrivals / 2)) %>% 
  # Pivot periods to top
  pivot_wider(names_from = period,
              values_from = arrivals,
              names_prefix = "arrivals_",
              values_fill = 0) %>% 
  # Remove rows with no arrivals
  # filter: removed 1,759 rows (3%), 64,820 rows remaining
  filter(arrivals_during_cuts > 0 & arrivals_before_cuts > 0) %>% 
  # Percentage loss
  mutate(percent_change = (arrivals_during_cuts / arrivals_before_cuts) - 1) %>% 
  mutate(percent_change = round(percent_change, 2)) %>% 
  # Average waiting time
  mutate(time_numerator =
           case_when(time_of_day == "Early morning (00:00 to 6:59)" ~ 420,
                     time_of_day == "Morning rush (07:00 to 9:59)" ~ 180,
                     time_of_day == "Midday (10:00 to 14:59)" ~ 300,
                     time_of_day == "Afternoon rush (15:00 to 18:59)" ~ 240, 
                     time_of_day == "Evening (19:00 to 23:59)" ~ 300)) %>% 
  mutate(headway_before_cuts = time_numerator / arrivals_before_cuts) %>% 
  mutate(headway_during_cuts = time_numerator / arrivals_during_cuts) %>% 
  mutate(expected_wait_time_difference = (headway_during_cuts - headway_before_cuts) / 2) %>% 
  mutate(expected_wait_time_difference = round(expected_wait_time_difference, 1)) %>% 
  # Order and select
  mutate(route_id = fct_relevel(route_id, routes_order)) %>% 
  arrange(route_id, week_period, time_of_day, trip_headsign, gtfs_stop_sequence) %>% 
  select(route_id, week_period, time_of_day, trip_headsign, stop_id, stop_name,
         arrivals_before_cuts, arrivals_during_cuts, 
         percent_change, expected_wait_time_difference)
  
# Post-cut network data --------------------------------------------------------------------------------

network_raw <- read_gtfs(str_c(data_dir, "raw", "septa_cut", "google_bus.zip", sep = "/"))

# Read shapes and stops as sf objects for mapping
network_sf <- gtfs_as_sf(network_raw)

# Route linestrings
network_geometry <- network_sf[["shapes"]]

network_trips <- network_raw[["trips"]]

network_stop_times <- network_raw[["stop_times"]]

network_stops <- network_raw[["stops"]] %>% 
  select(stop_id, stop_lat, stop_lon) %>% 
  st_as_sf(coords = c("stop_lon", "stop_lat"), crs = "EPSG:4326")

# Collate data --------------------------------------------------------------------------------

# Associate linestrings with route numbers
network_routes_mapping <- network_geometry %>% 
  left_join(network_trips %>% distinct(shape_id, route_id)) %>% 
  # Only routes in arrivals data
  filter(route_id %in% arrivals_aggregated$route_id)

# Arrivals data with stop coords
arrivals_export <- inner_join(arrivals_aggregated, network_stops)
  
# Export --------------------------------------------------------------------------------------

st_write(network_routes_mapping, 
         str_c(data_dir, "/septa_routes.json"), 
         driver = "GeoJSON")

st_write(arrivals_export, 
         str_c(data_dir, "/arrivals_and_stops.json"), 
         driver = "GeoJSON")


