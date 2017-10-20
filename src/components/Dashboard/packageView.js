import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Input, Dropdown, Grid, Table, Header, Checkbox, Tab, Button, Accordion, Icon } from 'semantic-ui-react';
import { map, set, last, get, forEach, sortBy, merge, omit, has, filter } from 'lodash';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import ReactTable from "react-table";
import "react-table/react-table.css";

import { addPackage, removePackage, updatePackage, showNotification, showModal, setPlatformData } from '../../actions';
import { Package } from '../../models';
import { dayMap } from '../../variables';
import CreatePackage from '../Modals/CreatePackage';

const getDefault = () => {
  return {
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
      startDate: Date.now(),
      stopDate: Date.now(),
      startDateActive: false,
      stopDateActive: false,
      totalActivePackageCount: 1,
      period: 'daily',
      periodDuration: 1
    },
    withdrawn: 0,
    withdrawDetails: [],
    withdrawEnabled: false,
    withdrawPlan: {
      startDate: Date.now(),
      stopDate: Date.now(),
      startDateActive: false,
      stopDateActive: false,
      period: 'daily',
      periodDuration: 1,
      amountType: 'default',
      minimum: 0,
      maximum: 0,
      amount: 0,
    }
  };
}

class PackageView extends Component {
  constructor(props) {
    super(props);
    this.state = getDefault();
  }

  componentDidMount() {
    setTimeout(() => {
      this.componentWillReceiveProps(this.props);
    }, 1000)
  }

  componentWillReceiveProps(props) {
    let state = {
      ...getDefault(),
      ...omit(props.platformData, ['withdrawPlan', 'rebuyPlan']),
      platform: props.platform,
      platformName: props.platformName
    }
    if (props.platformData && props.platformData.withdrawPlan) {
      state.withdrawPlan = { ...this.state.withdrawPlan, ...props.platformData.withdrawPlan };
    }
    if (props.platformData && props.platformData.rebuyPlan) {
      state.rebuyPlan = { ...this.state.rebuyPlan, ...props.platformData.rebuyPlan }
    }
    this.setState(state, () => {
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
      let pkg = new Package(x.id, x.price, x.activeDeposit, x.quantity, x.percentage, x.percentagePeriod, x.duration, x.creationDate, x.runningDays);
      if (has(x, 'enabled')) {
        pkg.enabled = x.enabled;
      }
      return pkg;
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
    let rebuyStartDate = this.state.rebuyPlan.startDate;
    let rebuyStopDate = this.state.rebuyPlan.stopDate;
    let rebuyStartDateBool = this.state.rebuyPlan.startDateActive ? currentDate > rebuyStartDate : true;
    let rebuyStopDateBool = this.state.rebuyPlan.stopDateActive ? currentDate < rebuyStopDate : true;
    if (this.state.rebuyEnabled && balance >= price && rebuyStartDateBool && rebuyStopDateBool) {
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
    let stopDate = this.state.withdrawPlan.stopDate;
    let startDateBool = this.state.withdrawPlan.startDateActive ? currentDate > startDate : true;
    let stopDateBool = this.state.withdrawPlan.stopDateActive ? currentDate < stopDate : true;
    if (this.state.withdrawEnabled && startDateBool && stopDateBool) {
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
      let active = packages.filter((p) => p.isActive && p.isEnabled)
      active.forEach((p) => {
        if (currentDate > p.creationDate.getTime()) {
          let interest = p.run();
          balance += interest;
        }
      });
      let activePackages = active.reduce((prev, curr) => {
        if (curr.isActive && curr.runCounter > 0) {
          return prev + curr.quantity;
        } else {
          return prev;
        }
      }, 0);
      // check if to rebuy
      if (lastPackage && this.canRebuy(startDate, currentDate, balance, lastPackage.price) && activePackages <= this.state.rebuyPlan.totalActivePackageCount) {
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
        // pkg.info = `rebuy: ${oldBalance.toFixed(8)} => ${balance.toFixed(8)}, tt: ${newPackages}`;
        pkg.info = {
          before: oldBalance.toFixed(8),
          after: balance.toFixed(8),
          totalPacks: newPackages
        }
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
        if (withdraw <= balance && withdraw >= this.state.withdrawPlan.minimum) {
          if (withdraw > this.state.withdrawPlan.maximum) {
            withdraw = this.state.withdrawPlan.maximum;
          }
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

  updatePackage(id, data) {
    this.props.updatePackage(this.state.platformName, id, data);
  }

  table1() {
    let columns = [
      {
        accessor: 'creationDate', Header: 'Created'
      },
      {
        accessor: 'creationDay', Header: 'Day'
      },
      {
        Header: 'Info',
        columns: [
          {
            accessor: d => {
              return d.info ? d.info.before : '';
            }, id: 'before', Header: 'Before'
          },
          {
            accessor: d => {
              return d.info ? d.info.after : '';
            }, id: 'after', Header: 'After'
          },
          {
            accessor: d => {
              return d.info ? d.info.totalPacks : '';
            }, id: 'totalPacks', Header: 'Packs'
          }
        ]
      },
      {
        accessor: 'quantity', Header: 'Qty'
      },
      {
        accessor: 'price', Header: 'Price'
      },
      {
        accessor: 'active', Header: 'Active'
      },
      {
        accessor: 'percentage', Header: '%'
      },
      {
        accessor: 'durationLeft', Header: 'Duration Left',
        Cell: row => (
          <div style={{ padding: 2, color: 'white', textAlign: 'center', borderRadius: 5, ...row.value === 0 ? { background: 'rgb(220, 40, 30)' } : { background: 'rgb(133, 204, 0)' } }}>
            {row.value}
          </div>
        )
      },
      {
        accessor: 'runningDays', Header: 'Running Days'
      },
    ]

    let data = map(filter(this.state.packages, x => x.isEnabled), (x) => {
      return {
        creationDate: x.creationDate.toLocaleDateString(),
        creationDay: dayMap[x.creationDate.getDay()],
        info: x.info,
        quantity: x.quantity,
        price: x.price,
        active: x.activeDeposit,
        percentage: x.percentage,
        durationLeft: x.duration - x.durationCounter,
        runningDays: x.runCounter
      }
    });

    return (
      <ReactTable
        data={data}
        columns={columns}
        defaultPageSize={10}
        className="-striped -highlight"
      />
    )
  }

  table2() {
    let columns = [
      {
        accessor: 'creationDate', Header: 'Created'
      },
      {
        accessor: 'creationDay', Header: 'Day'
      },
      {
        accessor: 'quantity', Header: 'Qty'
      },
      {
        accessor: 'price', Header: 'Price'
      },
      {
        accessor: 'active', Header: 'Active'
      },
      {
        accessor: 'percentage', Header: '%'
      },
      {
        accessor: 'percentagePeriod', Header: '% Period'
      },
      {
        accessor: 'duration', Header: 'Duration'
      },
      {
        accessor: 'package', Header: 'Enabled',
        Cell: row => (
          <Checkbox toggle checked={row.value.isEnabled} onChange={(e, d) => this.updatePackage(row.value.id, { enabled: d.checked })} />
        )
      },
      {
        accessor: 'package', Header: 'Controls',
        Cell: row => (
          <div style={{ textAlign: 'center' }} >
            <Button size='mini' circular icon='trash' onClick={(e) => {
              this.props.showNotification('Warning', 'Are you sure you want to delete this package ' + row.value.id, 'warning', {
                action: {
                  label: 'Yes',
                  callback: () => {
                    this.props.removePackage(this.props.platformName, row.value.id);
                  }
                }
              });
            }} />
            <Button size='mini' circular icon='setting' onClick={(e) => {
              this.props.showModal(
                true,
                <CreatePackage
                  platform={this.props.platformName}
                  package={row.value}
                  edit={row.value.id}
                  editMode
                  onDismiss={() => this.props.showModal(false)}
                />,
                { size: 'small', title: 'Edit Package' }
              );
            }} />
          </div>
        )
      }
    ]

    let data = map(this.getPackages(), (x) => {
      return {
        creationDate: x.creationDate.toLocaleDateString(),
        creationDay: dayMap[x.creationDate.getDay()],
        info: x.info,
        quantity: x.quantity,
        price: x.price,
        active: x.activeDeposit,
        percentage: x.percentage,
        percentagePeriod: x.percentagePeriod,
        duration: x.duration,
        package: x
      }
    });

    return (
      <ReactTable
        data={data}
        columns={columns}
        defaultPageSize={10}
        className="-striped -highlight"
      />
    );
  }

  table3() {
    let columns = [
      {
        accessor: 'date', Header: 'Date'
      },
      {
        accessor: 'day', Header: 'Day'
      },
      {
        accessor: 'withdrew', Header: 'Withdrew'
      },
      {
        accessor: 'balance', Header: 'Balance'
      }
    ]

    let data = map(this.state.withdrawDetails, (x) => {
      return {
        date: x.date.toLocaleDateString(),
        day: dayMap[x.date.getDay()],
        withdrew: x.withdraw.toFixed(8),
        balance: x.balance.toFixed(8)
      }
    });

    return (
      <ReactTable
        data={data}
        columns={columns}
        defaultPageSize={10}
        className="-striped -highlight"
      />
    );
  }

  panes() {
    return [
      { menuItem: 'Calculations', render: () => <div>{this.table1()}</div> },
      { menuItem: 'Created Packages', render: () => <div>{this.table2()}</div> },
      { menuItem: 'Withdrawals', render: () => <div>{this.table3()}</div> }
    ];
  }

  render() {
    return (
      <Grid style={{ padding: 10 }} padded stackable divided>
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
            <Header as='h4' dividing>Account Details</Header>
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
            <Accordion defaultActiveIndex={0}
              panels={[
                {
                  title: (
                    <Accordion.Title key={0}>
                      <Icon name='calendar' />
                      Start On
                      <Checkbox style={{ float: 'right' }} toggle checked={this.state.rebuyPlan.startDateActive} onChange={(e, d) => this.setData('rebuyPlan.startDateActive', d.checked)} />
                    </Accordion.Title>
                  ),
                  content: {
                    content: (
                      <DayPicker
                        month={new Date(this.state.rebuyPlan.startDate)}
                        selectedDays={[new Date(this.state.rebuyPlan.startDate)]}
                        onDayClick={(d) => this.setData('rebuyPlan.startDate', d.getTime())}
                      />
                    ),
                    key: 'content-0'
                  }
                },
                {
                  title: (
                    <Accordion.Title key={1}>
                      <Icon name='calendar' />
                      Stop On
                      <Checkbox style={{ float: 'right' }} toggle checked={this.state.rebuyPlan.stopDateActive} onChange={(e, d) => this.setData('rebuyPlan.stopDateActive', d.checked)} />
                    </Accordion.Title>
                  ),
                  content: {
                    content: (
                      <DayPicker
                        month={new Date(this.state.rebuyPlan.stopDate)}
                        selectedDays={[new Date(this.state.rebuyPlan.stopDate)]}
                        onDayClick={(d) => this.setData('rebuyPlan.stopDate', d.getTime())}
                      />
                    ),
                    key: 'content-1'
                  }
                },
                {
                  title: (
                    <Accordion.Title key={2}>
                      <Icon name='cart' />
                      Rebuy Plan
                    </Accordion.Title>
                  ),
                  content: {
                    content: (
                      <div>
                        <label>Total Active Package Count</label>
                        <Input
                          fluid
                          placeholder='Total Active Package Count'
                          type='number'
                          value={this.state.rebuyPlan.totalActivePackageCount}
                          onChange={(e, { value }) => this.setData('rebuyPlan.totalActivePackageCount', Number.parseInt(value))}
                        />
                        <br />
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
                          value={this.state.rebuyPlan.periodDuration}
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
                      </div>
                    ),
                    key: 'content-2'
                  }
                }
              ]}
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
                      <Checkbox style={{ float: 'right' }} toggle checked={this.state.withdrawPlan.startDateActive} onChange={(e, d) => this.setData('withdrawPlan.startDateActive', d.checked)} />
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
                      <Icon name='calendar' />
                      Stop On
                      <Checkbox style={{ float: 'right' }} toggle checked={this.state.withdrawPlan.stopDateActive} onChange={(e, d) => this.setData('withdrawPlan.stopDateActive', d.checked)} />
                    </Accordion.Title>
                  ),
                  content: {
                    content: (
                      <DayPicker
                        month={new Date(this.state.withdrawPlan.stopDate)}
                        selectedDays={[new Date(this.state.withdrawPlan.stopDate)]}
                        onDayClick={(d) => this.setData('withdrawPlan.stopDate', d.getTime())}
                      />
                    ),
                    key: 'content-1'
                  }
                },
                {
                  title: (
                    <Accordion.Title key={2}>
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
                        <label>Minimum</label>
                        <Input
                          fluid
                          placeholder='Minimum'
                          type='number'
                          value={this.state.withdrawPlan.minimum}
                          onChange={(e, { value }) => this.setData('withdrawPlan.minimum', Number.parseInt(value))}
                        />
                        <br />
                        <label>Maximum</label>
                        <Input
                          fluid
                          placeholder='Maximum'
                          type='number'
                          value={this.state.withdrawPlan.maximum}
                          onChange={(e, { value }) => this.setData('withdrawPlan.maximum', Number.parseInt(value))}
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
                    key: 'content-2'
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
  showNotification, addPackage, removePackage, updatePackage, showModal, setPlatformData
})(PackageView);

export default VisiblePackageView;