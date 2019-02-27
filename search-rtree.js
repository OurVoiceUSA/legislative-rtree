/*

* node node_modules/@babel/node/lib/_babel-node search-rtree.js

*/

import fs from 'fs';
import rbush from 'rbush';

var tree = rbush(9).fromJSON(JSON.parse(fs.readFileSync('./rtree.json')));

var result = tree.search({
    minX: -120,
    minY: 39,
    maxX: -120,
    maxY: 39,
});

console.log(result);

