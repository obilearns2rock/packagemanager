import React, { Component } from 'react';
import { connect } from 'react-redux';
import { upperCase, forEach, concat, last } from 'lodash';
import { Segment, Image, Label, Button, Grid, Card, Dimmer, Icon, Header } from 'semantic-ui-react';

import {
  showModal, showFrame, showNotification
} from '../../actions';
import CreatePackage from '../Modals/CreatePackage';

export class Stats extends Component {
  render() {
    return (
      <div style={styles.container}>
        <Header as='h2' icon textAlign='center'>
          <Icon.Group size='large'>
            <Icon name='folder' />
          </Icon.Group>
          <Header.Content>
            <p>Create a new Package</p>
            <Button size='small'
              color='twitter'
              onClick={
                () => {
                  this.props.showModal(true, <CreatePackage onDismiss={() => this.props.showModal(false)} />, { size: 'small', title: 'Add New Package' });
                }
              }
            >
              Create Package
            </Button>
          </Header.Content>
        </Header>
      </div>
    )
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '90vh'
  }
}

const mapStateToProps = (state) => {
  return {

  }
}

const VisibleStats = connect(mapStateToProps, {
  showModal, showFrame, showNotification
})(Stats);

export default VisibleStats;