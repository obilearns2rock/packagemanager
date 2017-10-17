import React, { Component, PropTypes } from 'react';


export class CryptoChart extends Component {

  componentDidMount() {
    let baseUrl = "https://widgets.cryptocompare.com/";
    var appName = encodeURIComponent(window.location.hostname);
    if (appName == "") { appName = "local"; }
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    var theUrl = baseUrl + 'serve/v1/coin/multi?fsyms=BTC,BCH,ETH,XMR,LTC,DASH,ZEC,DOGE,BLK,PPC,STRAT,DGB&tsyms=USD,EUR,CNY,GBP';
    s.src = theUrl + (theUrl.indexOf("?") >= 0 ? "&" : "?") + "app=" + appName;
    this.refs.container.appendChild(s);
  }

  render() {
    return (
      <div id='cryptochart' ref='container'>

      </div>
    );
  }
}
