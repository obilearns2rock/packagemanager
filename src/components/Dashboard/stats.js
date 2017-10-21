import React, { Component } from 'react';
import { connect } from 'react-redux';
import { upperCase, forEach, concat, last, map, sample } from 'lodash';
import { Segment, Image, Label, Button, Grid, Card, Dimmer, Icon, Header } from 'semantic-ui-react';
import axios from 'axios';
import renderHTML from 'react-render-html';

import {
  showModal, showFrame, showNotification, removePlatform
} from '../../actions';
import CreatePackage from '../Modals/CreatePackage';
import { DocCard } from '../Shared';

export class Stats extends Component {
  state = {
    stats: undefined
  }

  componentDidMount() {
    this.load();
  }

  load() {
    axios.get('stats.json')
      .then((res) => {
        this.setState({ stats: res.data });
      })
      .catch((err) => {
        console.log(err);
      })
  }

  render() {
    if (!this.state.stats) {
      return (
        <div style={styles.container2}>
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
    let advert = sample(this.state.stats.adverts);
    return (
      <div style={styles.container}>
        <Header dividing as='h2'>Investment Opportunities</Header>
        {
          map(this.state.stats.sections.cards, (card) => (
            <DocCard
              project={{
                thumb: card.image,
                name: card.name
              }}
              onClick={() => window.open(card.url, '_blank')}
            />
          ))
        }
        <Header dividing as='h2'>Tutorial Videos</Header>
        <Grid stackable padded centered columns={2}>
          {
            map(this.state.stats.sections.videos, (video) => (
              <Grid.Row centered>
                <Grid.Column width={6}>
                  <iframe width="480" height="360" src={video.url} frameborder="0" allowfullscreen></iframe>
                </Grid.Column>
                <Grid.Column width={6}>
                  {
                    map(video.description, (desc) => (
                      <div>
                        <Header as='h3'>{desc.title}</Header>
                        <p style={{ fontSize: 18 }}>{renderHTML(desc.body.join('\r\n'))}</p>
                      </div>
                    ))
                  }
                </Grid.Column>
                <Grid.Column width={4} textAlign='center'>
                  <a target='_blank' href={advert.url}>
                    <img src={advert.image} />
                  </a>
                </Grid.Column>
              </Grid.Row>
            ))
          }
        </Grid>
      </div>
    )
  }
}

const styles = {
  container: {
    padding: 10
  },
  container2: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '90vh'
  }
}

const mapStateToProps = (state) => {
  return {
    platforms: state.ui.platforms
  }
}

const VisibleStats = connect(mapStateToProps, {
  showModal, showFrame, showNotification
})(Stats);

export default VisibleStats;