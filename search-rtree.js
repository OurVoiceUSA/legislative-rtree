/*

* node node_modules/@babel/node/lib/_babel-node search-rtree.js

*/

import fs from 'fs';
import rbush from 'rbush';
import {ingeojson} from 'ourvoiceusa-sdk-js';

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

var tree = rbush(9).fromJSON(JSON.parse(fs.readFileSync('./rtree.json')));

var found = 0;

tree.search({
  minX: lng,
  minY: lat,
  maxX: lng,
  maxY: lat,
}).forEach(bb => {
  if (rtree2pip(bb, lng, lat)) {
    console.log("You are located in "+bb.state+" "+bb.type+" "+bb.name);
    found++;
  }
});

if (found === 0) console.warn("Not found in rtree index.");

function rtree2pip(bb, lng, lat) {
  let file;
  switch (bb.type) {
  case 'state':
    file = './districts/states/'+bb.state+'/shape.geojson';
    break;
  case 'sldl':
  case 'sldu':
    file = './districts/states/'+bb.state+'/'+bb.type+'/'+bb.name+'.geojson';
    break;
  case 'cd':
    file = './districts/cds/2016/'+bb.name+'/shape.geojson';
    break;
  default:
    console.warn("Unknown district type");
    return false;
  }

  try {
    let geo = JSON.parse(fs.readFileSync(file))
    if (geo.geometry) geo = geo.geometry;
    if (ingeojson(geo, lng, lat)) {
      return true;
    }
  } catch (e) {
    console.warn(e);
  }
  return false;
}

