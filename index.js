
import rbush from 'rbush';
import fetch from 'node-fetch';
import {asyncForEach,ingeojson} from 'ourvoiceusa-sdk-js';

export default class App {
  constructor(props) {
    if (props) {
      this.index = props.index;
    }
    if (!this.base_uri) this.base_uri = 'https://raw.githubusercontent.com/OurVoiceUSA/ocd-json/master';
    if (!this.index) this.index = this.base_uri+'/ocd-division/country/us/rtree.json';
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
          let tree = new App({index: this.base_uri+'/ocd-division/country/us/'+bb.subtree});
          let subd = await tree.getDistricts(lng, lat);
          districts = districts.concat(subd);
        }
      }
    });

    return districts;
  }

  async mimicGoogleCivicsAPI(lng, lat) {
    let info = {
      kind: "civicinfo#representativeInfoResponse",
      status: "success",
      divisions: [],
      offices: [],
      officials: [],
    };

    let districts = await this.getDistricts(lng, lat);
    let promd = [];
    let promo = [];

    // fetch all the division.json and officials.json files
    districts.forEach(bb => {
      let url = this.base_uri+'/'+bb.div.replace(/:/g, '/');
      promd.push(fetch(url+'/division.json'));
      promo.push(fetch(url+'/officials.json'));
    });

    let resd = await Promise.all(promd);
    let reso = await Promise.all(promo);

    await asyncForEach(districts, async(d, idx) => {
      let division, officials;
      try {
        division = await resd[idx].json();
        officials = await reso[idx].json();
      } catch (e) {
        // got a non-200 status, skip
        return;
      }
      let obj = {};
      obj[d.div] = division;

      // TODO: add officeIndices
      info.divisions.push(obj);

      // TODO: add officeIndices
      info.offices = info.offices.concat(division.offices);

      info.officials = info.officials.concat(officials);
    });

    return info;
  }

  async rtree2pip(bb, lng, lat) {
    let file;

    switch (bb.type) {
    case 'state':
      file = this.base_uri+'/ocd-division/country/us/state/'+bb.state.toLowerCase()+'/shape.geojson';
      break;
    case 'sldl':
    case 'sldu':
    case 'cd':
      file = this.base_uri+'/ocd-division/country/us/state/'+bb.state.toLowerCase()+'/'+bb.type+'/'+bb.name+'/shape.geojson';
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
