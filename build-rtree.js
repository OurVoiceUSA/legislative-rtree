/*
to run this script, do these one-time steps:

* npm install
* git clone https://github.com/OurVoiceUSA/districts.git

then:

* node node_modules/@babel/node/lib/_babel-node build-rtree.js

*/

import fs from 'fs';
import rbush from 'rbush';
import bbox from 'geojson-bbox';
import {asyncForEach} from 'ourvoiceusa-sdk-js';

var tree = rbush();

doYerThang();

async function doYerThang() {

  await asyncForEach(fs.readdirSync('./districts/states'), async (state) => {
    if (state === "kml") return;

    geojson2rtree('./districts/states/'+state+'/shape.geojson', state, 'state', state);

    try {
      await asyncForEach(fs.readdirSync('./districts/states/'+state+'/sldl/'), async (dist) => {
        geojson2rtree('./districts/states/'+state+'/sldl/'+dist, state, 'sldl', dist.replace('.geojson',''));
      });
    } catch (e) {
      console.warn(e);
    }

    try {
      await asyncForEach(fs.readdirSync('./districts/states/'+state+'/sldu/'), async (dist) => {
        geojson2rtree('./districts/states/'+state+'/sldu/'+dist, state, 'sldu', dist.replace('.geojson',''));
      });
    } catch (e) {
      console.warn(e);
    }

  });

  // this isn't in the districts ... yet
  try  {
    let us_cities = JSON.parse(fs.readFileSync('./us_cities.geojson'));

    await asyncForEach(us_cities.features, async (city) => {
      if (city.geometry) {
        geojson2rtree(city.geometry, city.properties.state, 'city', city.properties.city);
      }
    });
  } catch (e) {
    console.warn(e);
  }

  await asyncForEach(fs.readdirSync('./districts/cds/2016/'), async (cd) => {
    geojson2rtree('./districts/cds/2016/'+cd+'/shape.geojson', cd.split('-')[0], 'cd', cd);
  });

  fs.writeFileSync('./rtree.json', JSON.stringify(tree.toJSON()));

  process.exit(0);
}

function geojson2rtree(file, state, type, name) {
  try {
    let geo;
    if (typeof file === 'object')
      geo = file;
    else
      geo = JSON.parse(fs.readFileSync(file))
    if (geo.geometry) geo = geo.geometry;
    let bb = bbox(geo);
    tree.insert({minX: bb[0], minY: bb[1], maxX: bb[2], maxY: bb[3], state: state, type: type, name: name})
  } catch (e) {
    console.warn('Unable to process '+file);
    console.warn(e);
  }
}

