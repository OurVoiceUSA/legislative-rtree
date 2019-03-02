/*

* node node_modules/@babel/node/lib/_babel-node search-rtree.js

*/

import LRTree from './index.js';

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

var tree = new LRTree({index: 'https://raw.githubusercontent.com/OurVoiceUSA/legislative-rtree/master/rtree.json'});

doYerThang();

async function doYerThang() {

  let districts = await tree.getDistricts(lng, lat);

  districts.forEach(bb => {
    console.log("You are located in "+bb.state+" "+bb.type+" "+bb.name);
  });

  process.exit(0);
}
