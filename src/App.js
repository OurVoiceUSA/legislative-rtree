import React, { Component } from 'react';
import rbush from 'rbush';
import {geolocated} from 'react-geolocated';
import {ingeojson} from 'ourvoiceusa-sdk-js';

function _browserLocation(props) {
  if (!props.isGeolocationAvailable || !props.isGeolocationEnabled)
    return {};
  if (props.coords)
    return {
      lng: props.coords.longitude,
      lat: props.coords.latitude
    };
  return {};
}

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

class App extends Component {

  constructor(props) {
    super(props);

    let perPage = localStorage.getItem('teamsperpage');
    if (!perPage) perPage = 5;

    this.state = {
      districts: [],
    };
  }

  componentDidMount() {
    this._loadData();
  }

  _loadData = async () => {
    let res = await fetch('./rtree.json');
    let rtree = await res.json();
    this.tree = rbush(9).fromJSON(rtree);

    let location = _browserLocation(this.props);
    let districts = [];
    let prom = [];
    let bbs = [];

    this.tree.search({
      minX: location.lng,
      minY: location.lat,
      maxX: location.lng,
      maxY: location.lat,
    }).forEach(bb => {
      bbs.push(bb);
      prom.push(rtree2pip(bb, location.lng, location.lat));
    });

    let ret = await Promise.all(prom);

    bbs.forEach((bb, idx) => {
      if (ret[idx]) {
        districts.push("You are located in "+bb.state+" "+bb.type+" "+bb.name);
      }
    });

    this.setState({districts});
  }

  render() {
    const {districts} = this.state;

    let location = _browserLocation(this.props);
    if (!location.lng || !location.lat) return (<div>Loading location from browser...</div>);

    return (
      <div>
        Location from your browser: {JSON.stringify(location)}
        <br />
        <br />
        Districts from your location: {districts.map((d, i) => (<District key={i} dist={d} />))}
      </div>
    );
  }
}

const District = props => {
  return (
    <div>
      {props.dist}
    </div>
  );
}

export default geolocated({
  positionOptions: {
    enableHighAccuracy: false,
  },
  userDecisionTimeout: 5000,
})(App);
