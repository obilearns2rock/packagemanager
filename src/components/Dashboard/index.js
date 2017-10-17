import { connect } from 'react-redux';

import { showNotification } from '../../actions';
import { Dashboard } from './dashboard';

const mapStateToProps = (state) => {
  return {
    notification: state.ui.notification
  }
}

const VisibleDashboard = connect(mapStateToProps, {
  showNotification
})(Dashboard);

export default VisibleDashboard;
