library(tidyverse)
library(dplyr)
library(sf)
library(jsonlite)


crashes <- st_read("https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/collision_crash_2018_2022/FeatureServer/0/query?where=crash_year%3D2022&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esri