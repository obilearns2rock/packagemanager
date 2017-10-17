import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Input, Dropdown, Grid, Table, Header, Checkbox, Tab, Button } from 'semantic-ui-react';
import { map, set, last, get, forEach, sortBy } from 'lodash';

import { addPackage, removePackage, showNotification, showModal } from '../../actions';
import { Package } from '../../models';
import { dayMap } from '../../variables';
import CreatePackage from '../Modals/CreatePackage';

class PackageView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      platform: [],
      platformName: '',
      packages: [],
      newPackages: 0,
      calculateDate: Date.now(),
      balance: 0,
      rebuyEnabled: false,
      rebuyCount: 0,
      rebuyPlan: {
        max: 1,
        period: 'daily',
        periodDuration: 1
      }
    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        platform: this.props.platform,
        platformName: this.props.platformName
      }, () => {
        this.getData();
      })
    }, 1000);
  }

  componentWillReceiveProps(props) {
    this.setState({
      platform: props.platform,
      platformName: props.platformName
    }, () => {
      this.getData();
    })
  }

  setData(path, value) {
    let data = { ...this.state };
    set(data, path, value);
    this.setState(data, () => {
      this.getData();
    });
  }

  getActivePackages() {
    return this.state.packages.reduce((prev, curr) => {
      if (curr.isActive) {
        return prev + curr.quantity;
      } else {
        return prev;
      }
    }, 0);
  }

  getActiveDeposit() {
    return this.state.packages.reduce((prev, curr) => {
      if (curr.isActive) {
        return prev + curr.activeDeposit * curr.quantity;
      } else {
        return prev;
      }
    }, 0);
  }

  getPackages() {
    return map(this.state.platform, (x) => {
      console.log(x)
      return new Package(x.price, x.activeDeposit, x.quantity, x.percentage, x.percentagePeriod, x.duration, x.creationDate, x.runningDays);
    });
  }

  getStartDate() {
    let startDate = Date.now();
    forEach(this.state.platform, (x) => {
      let creationDate = new Date(x.creationDate).getTime();
      if (creationDate < startDate) {
        startDate = creationDate;
      }
    });
    return startDate;
  }

  canRebuy(startDate, currentDate, balance, price) {
    if (this.state.rebuyEnabled && balance >= price) {
      let start = new Date(startDate);
      let current = new Date(currentDate);
      let delta = (currentDate - startDate) / (24 * 60 * 60 * 1000);
      switch (this.state.rebuyPlan.period) {
        case 'weekly':
          return delta % (7 * this.state.rebuyPlan.periodDuration) === 0;
        case 'monthly':
          return current.getDate() === 1 && delta % (this.state.rebuyPlan.periodDuration * 28) >= 0;
        case 'daily':
        default:
          return delta % this.state.rebuyPlan.periodDuration === 0;
      }
    }
    return false;
  }

  /**
   * @returns {Array<Package>}
   */
  getData() {
    let startDate = this.getStartDate();
    let packages = this.getPackages();
    let runCount = this.state.calculateDate - startDate > 0 ? Math.round((this.state.calculateDate - startDate) / (24 * 60 * 60 * 1000)) : 0;
    let balance = 0;
    let newPackages = 0;
    let lastPackage = last(packages);
    for (var i = 0; i < runCount; i++) {
      // current date
      let currentDate = startDate + (i * 24 * 60 * 60 * 1000);
      // run active packages
      packages.filter((p) => p.isActive).forEach((p) => {
        if (currentDate > p.creationDate.getTime()) {
          let interest = p.run();
          balance += interest;
        }
      });
      // check if to rebuy
      if (this.canRebuy(startDate, currentDate, balance, lastPackage.price)) {
        let bought = 0;
        let oldBalance = balance;
        while (balance >= lastPackage.price && bought < this.state.rebuyPlan.max) {
          balance -= lastPackage.price;
          bought++;
        }
        let pkg = new Package(
          lastPackage.price,
          lastPackage.activeDeposit,
          bought,
          lastPackage.percentage,
          lastPackage.percentagePeriod,
          lastPackage.duration,
          currentDate,
          lastPackage.runningDays
        );
        newPackages += bought;
        pkg.info = `rebuy: ${oldBalance.toFixed(8)} => ${balance.toFixed(8)}, tt: ${newPackages}`;
        packages.push(
          pkg
        );
      }
    }
    this.setState({ balance, packages: sortBy(packages, 'creationDate'), newPackages });
  }

  table1() {
    return (
      <Table celled padded selectable compact striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell textAlign='center'>Creation Date</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Creation Day</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Info</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Qty</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Price</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Active</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>%</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Total Yield</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Duration</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Duration Left</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Running Days</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {
            map(this.state.packages, (x, i) => {
              return (
                <Table.Row key={i} negative={!x.isActive} positive={x.isActive}>
                  <Table.Cell textAlign='center'>
                    {x.creationDate.toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {dayMap[x.creationDate.getDay()]}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.info}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.quantity}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.price}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.activeDeposit}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.percentage}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.totalYield.toFixed(4)}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.duration}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.duration - x.durationCounter}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.runCounter}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.isActive ? 'Active' : 'InActive'}
                  </Table.Cell>
                </Table.Row>
              )
            })
          }
        </Table.Body>
      </Table>
    );
  }

  table2() {
    return (
      <Table celled padded selectable compact striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell textAlign='center'>Creation Date</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Creation Day</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Qty</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Price</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Active</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>%</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>% Period</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Duration</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Controls</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {
            map(this.getPackages(), (x, i) => {
              return (
                <Table.Row key={i} negative={!x.isActive} positive={x.isActive}>
                  <Table.Cell textAlign='center'>
                    {x.creationDate.toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {dayMap[x.creationDate.getDay()]}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.quantity}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.price}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.activeDeposit}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.percentage}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.percentagePeriod}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.duration}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    <Button size='mini' circular icon='trash' onClick={(e) => {
                      this.props.showNotification('Warning', 'Are you sure you want to delete this package', 'warning', {
                        action: {
                          label: 'Yes',
                          callback: () => {
                            this.props.removePackage(this.props.platformName, i);
                          }
                        }
                      });
                    }} />
                    <Button size='mini' circular icon='setting' onClick={(e) => {
                      this.props.showModal(
                        true,
                        <CreatePackage
                          platform={this.props.platformName}
                          package={x}
                          edit={i}
                          editMode
                          onDismiss={() => this.props.showModal(false)}
                        />,
                        { size: 'small', title: 'Edit Package' }
                      );
                    }} />
                  </Table.Cell>
                </Table.Row>
              )
            })
          }
        </Table.Body>
      </Table>
    );
  }

  panes() {
    return [
      { menuItem: 'Calculated Packages', render: () => <div style={{ maxHeight: '82vh', overflow: 'auto' }}>{this.table1()}</div> },
      { menuItem: 'Added Packages', render: () => <div style={{ maxHeight: '82vh', overflow: 'auto' }}>{this.table2()}</div> }
    ];
  }

  render() {
    return (
      <Grid padded stackable>
        <Grid.Row>
          <Grid.Column width={4}>
            <Header as='h4' dividing>Activity Details</Header>
            <Table celled padded selectable compact striped>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>Balance</Table.Cell>
                  <Table.Cell>{this.state.balance.toFixed(8)}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Active Deposit</Table.Cell>
                  <Table.Cell>{this.getActiveDeposit().toFixed(8)}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Active Packages</Table.Cell>
                  <Table.Cell>{this.getActivePackages()}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>New Packages</Table.Cell>
                  <Table.Cell>{this.state.newPackages}</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
            <Header as='h4' dividing>Run Time</Header>
            <label>Calculate To Date</label>
            <Input
              fluid
              placeholder='Calculate To Date'
              type='date'
              min={Date.now()}
              onChange={(e, { value }) => this.setData('calculateDate', new Date(value).getTime())}
            />
            <Header as='h4' dividing>
              Rebuy Calculator
              <Checkbox style={{ float: 'right' }} toggle onChange={(e, d) => this.setData('rebuyEnabled', d.checked)} />
            </Header>
            <label>Period</label>
            <Dropdown
              placeholder='Period'
              fluid
              selection
              defaultValue={this.state.rebuyPlan.period}
              options={
                map(['daily', 'weekly', 'monthly'], (x, i) => ({ key: x, text: x, value: x }))
              }
              onChange={(e, { value }) => this.setData('rebuyPlan.period', value)}
            />
            <br />
            <label>Period Duration</label>
            <Input
              fluid
              placeholder='Period Duration'
              type='number'
              defaultValue={this.state.rebuyPlan.periodDuration}
              onChange={(e, { value }) => this.setData('rebuyPlan.periodDuration', Number.parseInt(value))}
            />
            <br />
            <label>Maximum Packages</label>
            <Input
              fluid
              placeholder='Maximum Packages'
              type='number'
              defaultValue={this.state.rebuyPlan.max}
              onChange={(e, { value }) => this.setData('rebuyPlan.max', Number.parseInt(value))}
            />
          </Grid.Column>
          <Grid.Column width={12}>
            <Tab menu={{ secondary: true, pointing: true }} panes={this.panes()} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

const styles = {
  column: {
    height: '90vh',
    overflow: 'auto'
  },
  input: {
    margin: 5
  }
}

const mapStateToProps = (state, props) => {
  return {
    platform: state.ui.platforms[props.match.params.id],
    platformName: props.match.params.id
  }
}

const VisiblePackageView = connect(mapStateToProps, {
  showNotification, addPackage, removePackage, showModal
})(PackageView);

export default VisiblePackageView;