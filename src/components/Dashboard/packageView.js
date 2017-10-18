import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Input, Dropdown, Grid, Table, Header, Checkbox, Tab, Button, Accordion, Icon } from 'semantic-ui-react';
import { map, set, last, get, forEach, sortBy, merge } from 'lodash';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';

import { addPackage, removePackage, showNotification, showModal, setPlatformData } from '../../actions';
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
      bonus: 0.00,
      calculateDate: Date.now(),
      balance: 0,
      rebuyEnabled: false,
      rebuyCount: 0,
      rebuyPlan: {
        max: 1,
        period: 'daily',
        periodDuration: 1
      },
      withdrawn: 0,
      withdrawDetails: [],
      withdrawEnabled: false,
      withdrawPlan: {
        startDate: Date.now(),
        period: 'daily',
        periodDuration: 1,
        amountType: 'default',
        amount: 0,
      }
    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.componentWillReceiveProps(this.props);
    }, 1000)
  }

  componentWillReceiveProps(props) {
    this.setState(merge(this.state, {
      ...props.platformData,
      platform: props.platform,
      platformName: props.platformName
    }), () => {
      this.getData();
    })
  }

  setData(path, value) {
    this.props.setPlatformData(this.state.platformName, path, value);
  }

  getActivePackages() {
    return this.state.packages.reduce((prev, curr) => {
      if (curr.isActive && curr.runCounter > 0) {
        return prev + curr.quantity;
      } else {
        return prev;
      }
    }, 0);
  }

  getActiveDeposit() {
    return this.state.packages.reduce((prev, curr) => {
      if (curr.isActive && curr.runCounter > 0) {
        return prev + curr.activeDeposit * curr.quantity;
      } else {
        return prev;
      }
    }, 0);
  }

  getPackages() {
    return sortBy(map(this.state.platform, (x) => {
      return new Package(x.id, x.price, x.activeDeposit, x.quantity, x.percentage, x.percentagePeriod, x.duration, x.creationDate, x.runningDays);
    }), 'creationDate');
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
      let delta = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
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

  canWithdraw(currentDate, balance) {
    let startDate = this.state.withdrawPlan.startDate;
    if (this.state.withdrawEnabled && currentDate >= startDate) {
      let start = new Date(startDate);
      let current = new Date(currentDate);
      let delta = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
      // debugger 
      switch (this.state.withdrawPlan.period) {
        case 'weekly':
          return delta % (7 * this.state.withdrawPlan.periodDuration) === 0;
        case 'monthly':
          return current.getDate() === 1 && delta % (this.state.withdrawPlan.periodDuration * 28) >= 0;
        case 'daily':
        default:
          return delta % this.state.withdrawPlan.periodDuration === 0;
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
    let balance = this.state.bonus ? this.state.bonus : 0;
    let newPackages = 0;
    let withdrawn = 0;
    let withdrawDetails = [];
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
      if (lastPackage && this.canRebuy(startDate, currentDate, balance, lastPackage.price)) {
        let bought = 0;
        let oldBalance = balance;
        while (balance >= lastPackage.price && bought < this.state.rebuyPlan.max) {
          balance -= lastPackage.price;
          bought++;
        }
        let pkg = new Package(
          Date.now() + i,
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
      // check if to withdraw
      if (this.canWithdraw(currentDate, balance)) {
        let withdraw = 0;
        switch (this.state.withdrawPlan.amountType) {
          case 'percentage':
            withdraw = balance * this.state.withdrawPlan.amount / 100;
            break;
          case 'default':
          default:
            withdraw = this.state.withdrawPlan.amount
        }
        if (withdraw <= balance) {
          balance -= withdraw;
          withdrawn += withdraw;
          withdrawDetails.push({
            withdraw,
            balance,
            date: new Date(currentDate)
          });
        }
      }
    }
    this.setState({ balance, withdrawn, withdrawDetails, packages: sortBy(packages, 'creationDate'), newPackages });
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
            <Table.HeaderCell textAlign='center'>Duration Left</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Running Days</Table.HeaderCell>
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
                    {x.duration - x.durationCounter}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.runCounter}
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
                            this.props.removePackage(this.props.platformName, x.id);
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
                          edit={x.id}
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

  table3() {
    return (
      <Table celled padded selectable compact striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell textAlign='center'>Date</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Day</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Withdrew</Table.HeaderCell>
            <Table.HeaderCell textAlign='center'>Balance</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {
            map(this.state.withdrawDetails, (x, i) => {
              return (
                <Table.Row key={i}>
                  <Table.Cell textAlign='center'>
                    {x.date.toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {dayMap[x.date.getDay()]}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.withdraw.toFixed(8)}
                  </Table.Cell>
                  <Table.Cell textAlign='center'>
                    {x.balance.toFixed(8)}
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
      { menuItem: 'Calculated Packages', render: () => <div>{this.table1()}</div> },
      { menuItem: 'Added Packages', render: () => <div>{this.table2()}</div> },
      { menuItem: 'Withdraw Details', render: () => <div>{this.table3()}</div> }
    ];
  }

  render() {
    return (
      <Grid padded stackable divided>
        <Grid.Row>
          <Grid.Column width={4} textAlign='center'>
            <Header as='h4' dividing>Run Time</Header>
            <DayPicker
              month={new Date(this.state.calculateDate)}
              selectedDays={[new Date(this.state.calculateDate)]}
              onDayClick={(d) => this.setData('calculateDate', d.getTime())}
            />
          </Grid.Column>
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
                <Table.Row>
                  <Table.Cell>Withdrawn</Table.Cell>
                  <Table.Cell>{this.state.withdrawn.toFixed(8)}</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
            <label>Bonus Balance</label>
            <Input
              fluid
              placeholder='Bonus'
              type='number'
              value={this.state.bonus}
              onChange={(e, { value }) => this.setData('bonus', Number.parseFloat(value))}
            />
          </Grid.Column>
          <Grid.Column width={4}>
            <Header as='h4' dividing>
              Rebuy Calculator
              <Checkbox style={{ float: 'right' }} toggle checked={this.state.rebuyEnabled} onChange={(e, d) => this.setData('rebuyEnabled', d.checked)} />
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
              value={this.state.rebuyPlan.max}
              onChange={(e, { value }) => this.setData('rebuyPlan.max', Number.parseInt(value))}
            />
          </Grid.Column>
          <Grid.Column width={4}>
            <Header as='h4' dividing>
              Withdraw Calculator
              <Checkbox style={{ float: 'right' }} toggle checked={this.state.withdrawEnabled} onChange={(e, d) => this.setData('withdrawEnabled', d.checked)} />
            </Header>
            <Accordion defaultActiveIndex={0}
              panels={[
                {
                  title: (
                    <Accordion.Title key={0}>
                      <Icon name='calendar' />
                      Start On
                    </Accordion.Title>
                  ),
                  content: {
                    content: (
                      <DayPicker
                        month={new Date(this.state.withdrawPlan.startDate)}
                        selectedDays={[new Date(this.state.withdrawPlan.startDate)]}
                        onDayClick={(d) => this.setData('withdrawPlan.startDate', d.getTime())}
                      />
                    ),
                    key: 'content-0'
                  }
                },
                {
                  title: (
                    <Accordion.Title key={1}>
                      <Icon name='in cart' />
                      Withdraw Plan
                    </Accordion.Title>
                  ),
                  content: {
                    content: (
                      <div>
                        <label>Period</label>
                        <Dropdown
                          placeholder='Period'
                          fluid
                          selection
                          defaultValue={this.state.withdrawPlan.period}
                          options={
                            map(['daily', 'weekly', 'monthly'], (x, i) => ({ key: x, text: x, value: x }))
                          }
                          onChange={(e, { value }) => this.setData('withdrawPlan.period', value)}
                        />
                        <br />
                        <label>Period Duration</label>
                        <Input
                          fluid
                          placeholder='Period Duration'
                          type='number'
                          value={this.state.withdrawPlan.periodDuration}
                          onChange={(e, { value }) => this.setData('withdrawPlan.periodDuration', Number.parseInt(value))}
                        />
                        <br />
                        <label>Amount Type</label>
                        <Dropdown
                          placeholder='Amount Type'
                          fluid
                          selection
                          defaultValue={this.state.withdrawPlan.amountType}
                          options={
                            map(['default', 'percentage'], (x, i) => ({ key: x, text: x, value: x }))
                          }
                          onChange={(e, { value }) => this.setData('withdrawPlan.amountType', value)}
                        />
                        <br />
                        <label>Amount</label>
                        <Input
                          fluid
                          placeholder='Amount'
                          type='number'
                          value={this.state.withdrawPlan.amount}
                          onChange={(e, { value }) => this.setData('withdrawPlan.amount', Number.parseInt(value))}
                        />
                      </div>
                    ),
                    key: 'content-1'
                  }
                }
              ]}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Tab menu={{ secondary: true, pointing: true }} panes={this.panes()} />
          </Grid.Column>
        </Grid.Row>
      </Grid >
    );
  }
}

const styles = {
  input: {
    margin: 5
  }
}

const mapStateToProps = (state, props) => {
  return {
    platform: state.ui.platforms[props.match.params.id],
    platformData: state.ui.platformData[props.match.params.id],
    platformName: props.match.params.id
  }
}

const VisiblePackageView = connect(mapStateToProps, {
  showNotification, addPackage, removePackage, showModal, setPlatformData
})(PackageView);

export default VisiblePackageView;