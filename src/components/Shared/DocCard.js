import React, { Component } from 'react';
import { upperCase, forEach, concat, last } from 'lodash';
import { Segment, Image, Label, Button, Grid, Card, Dimmer, Icon } from 'semantic-ui-react';

import { siteUrl } from '../../variables';

export class DocCard extends Component {
  state = {
    highlighted: false
  }

  onDrop(files) {
    this.props.onDrop && this.props.onDrop(last(files));
  }

  render() {
    const { project, loading, onClick } = this.props;
    return (
      <Card style={styles.container}>
        <Dimmer.Dimmable
          blurring
          dimmed={this.state.highlighted}
          onMouseLeave={() => this.setState({ highlighted: false })}
          onMouseEnter={() => this.setState({ highlighted: true })}
          onClick={onClick}
        >
          <Dimmer active={this.state.highlighted || loading}>
            <p>
              {project.name}
            </p>
            {
              loading &&
              <Icon loading={loading} name='spinner' size='big' />
            }
          </Dimmer>
          <Image style={styles.thumb} src={project.thumb} />
        </Dimmer.Dimmable>
      </Card>
    )
  }
}

const styles = {
  container: {
    display: 'inline-block',
    margin: 15
  },
  thumb: {
    height: 180,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    cursor: 'pointer'
  },
  DnD: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 9999
  },
  DnDActive: {
    // border: `2px dashed solid blue`
  },
  DnDReject: {
    // border: `2px dashed solid red`
  }
}
