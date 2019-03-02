import React, { Component } from 'react';
import LRTree from './legislative-rtree';
import {geolocated} from 'react-geolocated';

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

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      districts: [],
    };
  }

  componentDidMount() {
    this._loadData();
  }

  _loadData = async () => {
    let tree = new LRTree();

    let location = _browserLocation(this.props);

    if (!location.lng) {
      setTimeout(() => this._loadData(), 500);
      return;
    }

    let districts = await tree.getDistricts(location.lng, location.lat);

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
      You are located in {props.dist.state} {props.dist.type} {props.dist.name}
    </div>
  );
}

export default geolocated({
  positionOptions: {
    enableHighAccuracy: false,
  },
  userDecisionTimeout: 5000,
})(App);
