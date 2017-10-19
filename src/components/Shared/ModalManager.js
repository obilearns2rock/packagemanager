import React, { Component, PropTypes } from 'react';
import { has } from 'lodash';
import { connect } from 'react-redux';

import {
  showModal
} from '../../actions';
import { colors } from '../../variables';
import { Button, Header, Icon, Image, Modal } from 'semantic-ui-react';

class ModalManager extends Component {

  onAccept() {
    const { props: { accept: { callback, closeOnAccept } }, showModal } = this.props;
    if (closeOnAccept) showModal(false);
    if (callback) callback();
  }

  onCancel() {
    const { props: { cancel: { callback } }, showModal } = this.props;
    showModal(false);
    if (callback) callback();
  }

  getActions() {
    const { props } = this.props;
    return has(props, 'accept') || has(props, 'cancel') ?
      (
        <Modal.Actions>
          {has(props, 'accept') && <Button onClick={this.onAccept.bind(this)}>{props.accept.label}</Button>}
          {has(props, 'cancel') && <Button onClick={this.onCancel.bind(this)}>{props.cancel.label}</Button>}
        </Modal.Actions>
      )
      :
      null;
  }

  render() {
    const { show, component, props, showModal } = this.props;
    if (!component) return null;
    return (
      <Modal className='animated slideInDown' size={props ? props.size : null} open={show} onClose={() => showModal(false)} basic={component.props.basic} closeIcon closeOnDimmerClick>
        {has(props, 'title') && <Modal.Header>{props.title}</Modal.Header>}
        <Modal.Content>
          {component}
        </Modal.Content>
        {this.getActions()}
      </Modal>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    show: state.ui.showModal,
    component: state.ui.currentModal,
    props: state.ui.currentModalProps
  }
}

export const VisibleModalManager = connect(mapStateToProps, {
  showModal
})(ModalManager);
