/*

* node node_modules/@babel/node/lib/_babel-node search-rtree.js

*/

import fs from 'fs';
import rbush from 'rbush';
import {ingeojson} from 'ourvoiceusa-sdk-js';

var tree = rbush(9).fromJSON(JSON.parse(fs.readFileSync('./rtree.json')));

var lng = -120;
var lat = 39;

tree.search({
  minX: lng,
  minY: lat,
  maxX: lng,
  maxY: lat,
}).forEach(bb => {
  if (rtree2pip(bb, lng, lat)) {
    console.log("You are located in "+bb.state+" "+bb.type+" "+bb.name);
  }
});

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

