console.log("seed_places.mjs starting...");

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ====== CONFIG ======
const INPUT_FILE = process.argv[2] || "data/philly_restaurants_overpass.json";
const TABLE = "places";
const BATCH_SIZE = 500;

console.log("INPUT_FILE =", INPUT_FILE);
console.log("TABLE =", TABLE);

// ====== HELPERS ======
function buildAddress(tags) {
  const addr = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return addr.length ? addr.join(" ") : null;
}

// ----- Overpass JSON (elements) -----
function isValidOverpassElement(el) {
  const tags = el.tags || {};
  return (
    el &&
    el.type === "node" &&
    typeof el.lat === "number" &&
    typeof el.lon === "number" &&
    typeof tags.name === "string" &&
    tags.name.trim().length > 0
  );
}

function overpassElementToRow(el) {
  const tags = el.tags || {};
  const osm_id = `${el.type}/${el.id}`; // e.g., node/333786044

  return {
    osm_id,
    name: tags.name ?? null,
    lat: el.lat ?? null,
    lng: el.lon ?? null, // OSM uses lon; we store as lng
    cuisine: tags.cuisine ?? null,
    address: buildAddress(tags),
    raw_tags: tags, // jsonb column recommended
  };
}

// ----- GeoJSON (FeatureCollection/features) -----
function isValidGeojsonFeature(f) {
  const props = f?.properties || {};
  const tags = props.tags || props; // sometimes tags are nested; sometimes flattened
  const coords = f?.geometry?.coordinates;

  const hasPoint =
    f?.geometry?.type === "Point" &&
    Array.isArray(coords) &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number";

  const hasName = typeof tags.name === "string" && tags.name.trim().length > 0;

  // We need some kind of stable ID for upsert
  const osmIdCandidate =
    props.osm_id ||
    (props.type && props.id ? `${props.type}/${props.id}` : null) ||
    (props["@id"] ? String(props["@id"]) : null);

  return hasPoint && hasName && !!osmIdCandidate;
}

function geojsonFeatureToRow(f) {
  const props = f.properties || {};
  const tags = props.tags || props;
  const coords = f.geometry.coordinates;

  const lon = coords[0];
  const lat = coords[1];

  const osm_id =
    props.osm_id ||
    (props.type && props.id ? `${props.type}/${props.id}` : null) ||
    (props["@id"] ? String(props["@id"]) : null);

  return {
    osm_id,
    name: tags.name ?? null,
    lat,
    lng: lon,
    cuisine: tags.cuisine ?? null,
    address: buildAddress(tags),
    raw_tags: tags,
  };
}

// ====== MAIN ======
async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Has SUPABASE_URL?", !!url);
  console.log("Has SUPABASE_SERVICE_ROLE_KEY?", !!serviceKey);

  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  // Load file
  const raw = fs.readFileSync(path.resolve(INPUT_FILE), "utf-8");
  const data = JSON.parse(raw);

  console.log("Top-level keys:", Object.keys(data));
  console.log(
    "elements?",
    Array.isArray(data.elements),
    "features?",
    Array.isArray(data.features),
    "type:",
    data.type
  );

  // Detect format and build rows
  let rows = [];

  if (Array.isArray(data.elements)) {
    console.log("Detected Overpass JSON (elements).");
    console.log("elements length:", data.elements.length);

    rows = data.elements
      .filter(isValidOverpassElement)
      .map(overpassElementToRow)
      .filter((r) => r.osm_id);

  } else if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    console.log("Detected GeoJSON FeatureCollection (features).");
    console.log("features length:", data.features.length);

    rows = data.features
      .filter(isValidGeojsonFeature)
      .map(geojsonFeatureToRow)
      .filter((r) => r.osm_id);

  } else {
    console.error(
      "Unrecognized input format. Expected Overpass JSON (elements) or GeoJSON FeatureCollection (features)."
    );
    process.exit(1);
  }

  console.log("Prepared rows:", rows.length);
  console.log("Sample row:", rows[0]);

  if (rows.length === 0) {
    console.log("No rows matched validation rules. Nothing to import.");
    return;
  }

  console.log(
    `About to upsert into "${TABLE}" in batches of ${BATCH_SIZE}. Make sure osm_id is UNIQUE.`
  );

  // Upsert in batches
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from(TABLE)
      .upsert(batch, { onConflict: "osm_id" });

    if (error) {
      console.error("Upsert error:", error);
      process.exit(1);
    }

    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  console.log("✅ Done seeding places.");
}

// Run
main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
