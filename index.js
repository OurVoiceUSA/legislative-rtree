
import rbush from 'rbush';
import fetch from 'node-fetch';
import {asyncForEach,ingeojson} from 'ourvoiceusa-sdk-js';

export default class App {
  constructor(props) {
    if (props) {
      this.index = props.index;
    }
    if (!this.base_uri) this.base_uri = 'https://raw.githubusercontent.com/OurVoiceUSA/ocd-json/master/ocd-division/country/us';
    if (!this.index) this.index = this.base_uri+'/rtree.json';
  }

  async _init() {
    let rtree;
    if (typeof this.index === 'object') {
      rtree = this.index;
    } else {
      let res = await fetch(this.index);
      rtree = await res.json();
    }
    this.tree = rbush(9).fromJSON(rtree);
  }

  async getDistricts(lng, lat) {
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
      prom.push(this.rtree2pip(bb, lng, lat));
    });

    let ret = await Promise.all(prom);

    await asyncForEach(bbs, async(bb, idx) => {
      if (ret[idx]) {
        districts.push(bb);
        if (bb.subtree) {
          // call self to get subtree districts
          let tree = new App({index: this.base_uri+'/'+bb.subtree});
          let subd = await tree.getDistricts(lng, lat);
          districts = districts.concat(subd);
        }
      }
    });

    return districts;
  }

  async rtree2pip(bb, lng, lat) {
    let file;

    switch (bb.type) {
    case 'state':
      file = this.base_uri+'/state/'+bb.state.toLowerCase()+'/shape.geojson';
      break;
    case 'sldl':
    case 'sldu':
    case 'cd':
      file = this.base_uri+'/state/'+bb.state.toLowerCase()+'/'+bb.type+'/'+bb.name+'/shape.geojson';
      break;
    case 'place':
    case 'county':
      // TODO: for now, assume place bbox as place. Need to fetch geojson from repo when places are added to it
      return true;
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

}
