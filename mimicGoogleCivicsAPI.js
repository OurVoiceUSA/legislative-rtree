/*

* node node_modules/@babel/node/lib/_babel-node mimicGoogleCivicsAPI.js

*/

import LRTree from './index.js';
import fs from 'fs';

if (!process.argv[2] || !process.argv[3]) {
  console.warn("Usage: node node_modules/@babel/node/lib/_babel-node search-rtree.js LONGITUDE LATITUDE");
  process.exit(1);
}

var lng = parseFloat(process.argv[2]);
var lat = parseFloat(process.argv[3]);

if (isNaN(lng) || isNaN(lat)) {
  console.warn("Invalid parameter to longitude or latitude.");
  process.exit(1);
}

var tree = new LRTree();

doYerThang();

async function doYerThang() {

  let info = await tree.mimicGoogleCivicsAPI(lng, lat);

  console.log(JSON.stringify(info, null, 2));

  process.exit(0);
}
