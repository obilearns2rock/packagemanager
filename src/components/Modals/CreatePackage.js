import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Input, Dropdown, Button } from 'semantic-ui-react';
import { map, keys, first, pick, get } from 'lodash';

import { addPackage, updatePackage, showNotification, addPlatform } from '../../actions';
import { dayMap } from '../../variables';

class CreatePackage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      platform: get(props, 'platform', ''),
      quantity: get(props, 'package.quantity', 1),
      price: get(props, 'package.price', 10),
      activeDeposit: get(props, 'package.activeDeposit', 10),
      percentage: get(props, 'package.percentage', 1),
      percentagePeriod: get(props, 'package.percentagePeriod', 'daily'),
      duration: get(props, 'package.duration', 140),
      creationDate: get(props, 'package.creationDate', Date.now()),
      runningDays: get(props, 'package.runningDays', [0, 1, 2, 3, 4, 5, 6])
    }
  }

  handleChange = (name, value) => {
    this.setState({ ...this.state, [name]: value });
  };

  handleAddition = (e, { value }) => {
    this.props.addPlatform(value);
  }

  getPackageData() {
    return pick(this.state, ['price', 'activeDeposit', 'percentage', 'percentagePeriod', 'quantity', 'duration', 'creationDate', 'runningDays']);
  }

  createPackage() {
    if (!this.state.platform) {
      this.props.showNotification('Package Info Missing', 'Please fill in all necessary details', 'warning');
      return;
    }
    this.props.addPackage(this.state.platform, this.getPackageData());
    this.props.onDismiss && this.props.onDismiss();
  }

  updatePackage() {
    if (!this.state.platform) {
      this.props.showNotification('Package Info Missing', 'Please fill in all necessary details', 'warning');
      return;
    }
    this.props.updatePackage(this.state.platform, this.props.edit, this.getPackageData());
    this.props.onDismiss && this.props.onDismiss();
  }

  render() {
    let platforms = map(this.props.platforms, (x) => {
      return { key: x, text: x, value: x };
    })
    return (
      <div>
        <label>Platform</label>
        <Dropdown
          options={platforms}
          placeholder='Choose Platform'
          search
          selection
          fluid
          allowAdditions
          defaultValue={this.state.platform}
          onAddItem={this.handleAddition}
          onChange={(e, { value }) => this.setState({ platform: value })}
        />
        <br />
        <label>Price</label>
        <Input
          fluid
          placeholder='Price'
          defaultValue={this.state.price}
          onChange={(e, { value }) => this.setState({ price: value })}
        />
        <br />
        <label>Active Deposit</label>
        <Input
          fluid
          placeholder='Active Deposit'
          defaultValue={this.state.activeDeposit}
          onChange={(e, { value }) => this.setState({ activeDeposit: value })}
        />
        <br />
        <label>Percentage Return %</label>
        <Input
          fluid
          placeholder='Percentage Returns'
          defaultValue={this.state.percentage}
          onChange={(e, { value }) => this.setState({ percentage: value })}
        />
        <br />
        <label>Percentage Period</label>
        <Dropdown
          placeholder='Percentage Period'
          fluid
          selection
          defaultValue={this.state.percentagePeriod}
          options={
            map(['daily', 'weekly', 'monthly'], (x, i) => ({ key: x, text: x, value: x }))
          }
          onChange={(e, { value }) => this.setState({ percentagePeriod: value })}
        />
        <br />
        <label>Duration</label>
        <Input
          fluid
          placeholder='Duration'
          defaultValue={this.state.duration}
          onChange={(e, { value }) => this.setState({ duration: value })}
        />
        <br />
        <label>Creation Date</label>
        <Input
          fluid
          placeholder='Creation Date'
          type='date'
          defaultValue={this.state.creationDate}
          onChange={(e, { value }) => this.setState({ creationDate: value })}
        />
        <br />
        <label>Active Week Days</label>
        <Dropdown
          placeholder='Running Days'
          fluid
          multiple
          selection
          defaultValue={this.state.runningDays}
          options={
            map(dayMap, (x, i) => ({ key: i, text: x, value: i }))
          }
          onChange={(e, { value }) => this.setState({ runningDays: value })}
        />
        <br />
        <label>Quantity</label>
        <Input
          fluid
          disabled={this.props.editMode}
          placeholder='Quantity'
          defaultValue={this.state.quantity}
          onChange={(e, { value }) => this.setState({ quantity: value })}
        />
        <br />
        {
          !this.props.editMode &&
          <Button fluid onClick={this.createPackage.bind(this)}>CREATE</Button>
        }
        {
          this.props.editMode &&
          <Button fluid onClick={this.updatePackage.bind(this)}>UPDATE</Button>
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    platforms: keys(state.ui.platforms)
  }
}

const VisibleCreatePackage = connect(mapStateToProps, {
  showNotification, addPackage, updatePackage, addPlatform
})(CreatePackage);

export default VisibleCreatePackage;