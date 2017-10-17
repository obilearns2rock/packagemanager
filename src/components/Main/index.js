import { connect } from 'react-redux';
import { Main } from './main';

const mapStateToProps = (state) => {
  return {
    notification: state.ui.notification
  }
}

const VisibleMain = connect(mapStateToProps, {})(Main);

export default VisibleMain;
