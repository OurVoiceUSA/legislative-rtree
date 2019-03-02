import rbush from 'rbush';
import {ingeojson} from 'ourvoiceusa-sdk-js';

async function rtree2pip(bb, lng, lat) {
  let uri_base = 'https://raw.githubusercontent.com/OurVoiceUSA/districts/gh-pages/';
  let file;

  switch (bb.type) {
  case 'state':
    file = uri_base+'/states/'+bb.state+'/shape.geojson';
    break;
  case 'sldl':
  case 'sldu':
    file = uri_base+'/states/'+bb.state+'/'+bb.type+'/'+bb.name+'.geojson';
    break;
  case 'cd':
    file = uri_base+'/cds/2016/'+bb.name+'/shape.geojson';
    break;
  default:
    console.warn("Unknown district type");
    return false;
  }

  try {
    let res = await fetch(file);
    let geo = await res.json();
    if (geo.geometry) geo = geo.geometry;
    if (ingeojson(geo, lng, lat)) {
      return true;
    }
  } catch (e) {
    console.warn(e);
  }
  return false;
}

export default class App {
  constructor(props) {
    if (props && props.index)
      this.index = props.index;
    else
      this.index = './rtree.json';
  }

  _init = async () => {
    let res = await fetch(this.index);
    let rtree = await res.json();
    this.tree = rbush(9).fromJSON(rtree);
  }

  getDistricts = async (lng, lat) => {
    let districts = [];
    let prom = [];
    let bbs = [];

    if (!this.tree) await this._init();

    this.tree.search({
      minX: lng,
      minY: lat,
      maxX: lng,
      maxY: lat,
    }).forEach(bb => {
      bbs.push(bb);
      prom.push(rtree2pip(bb, lng, lat));
    });

    let ret = await Promise.all(prom);

    bbs.forEach((bb, idx) => {
      if (ret[idx]) {
        districts.push(bb);
      }
    });

    return districts;
  }

}
