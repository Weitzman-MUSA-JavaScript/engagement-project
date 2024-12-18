import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {languageOptions: { 
    globals: {
    ...globals.browser,
    mapboxgl: 'readonly',
    MapboxGeocoder: 'readonly',
    bootstrap: 'readonly',
  },
  },},
  pluginJs.configs.recommended,
];