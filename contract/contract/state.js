var { _hash } = require("./lib");
var { TP_NAMESPACE } = require("./constants");


class EnergyTradeState {
 constructor(context) {
   this.context = context;
   this.timeout = 500;
   this.stateEntries = {};
 }

 
createorder(value) {
var  address=makeAddress(value.Seller_UserID+value.CREATED_TIMESTAMP);
var stateEntriesSend = {}
  stateEntriesSend[address] = Buffer.from(JSON.stringify(value));
return  this.context.setState(stateEntriesSend, this.timeout).then((result)=> {     
this.context.addEvent(
  'ENERGYTRADING/ORDERCREATED',
  [['orderid', result[0]]],
  null)
console.log("Order Created", result)
}).catch(function(error) {
     console.error("Error While Creating Order", error)
   })
 }

updateorder(value){
  const address = value.orderid;
  var updatedorder=value.newupdatedorderdata;
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    stateEntriesSend[address]= Buffer.from(JSON.stringify(updatedorder));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Order Updated", result)
    }).catch(function(error) {
      console.error("Error while updating order", error)
        })
});
}

acceptorder(value){
  const address = value.orderid;
  var accepteduserid=value.buyeruserid;
  var acceptestimestamp=value.buyeracctimestamp;
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.Buyer_UserID=accepteduserid;
    orderjdata.Accepted_TIMESTAMP=acceptestimestamp;
    orderjdata.ORDER_STATUS='ACCEPTED';
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Order Accepted", result)
    }).catch(function(error) {
      console.error("Error While Accepting Order", error)
        })
});
}


cancelorder(value){
  const address = value.orderid;
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.ORDER_STATUS='CANCELLED';
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Order Cancelled", result)
    }).catch(function(error) {
      console.error("Error While Cancelling Order", error)
        })
});
}


starttrade(value){
  const address = value.orderid;
  var tradestarttimestamp=value.trade_s_timestamp;
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.PROC_METER_READING_S= //Call Api with orderjdata.
    orderjdata.CONS_METER_READING_S=consmeterreadings;
    orderjdata.PROC_METER_READING_E=procmeterreadinge;
    orderjdata.CONS_METER_READING_E=consmeterreadinge;
    orderjdata.TRADE_S_TIMESTAMP=tradestarttimestamp;
    orderjdata.TRADE_STATUS='TRADING';
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Trading Started", result)
    }).catch(function(error) {
      console.error("Error while setting up trade started", error)
        })
});
}

endtrade(value){
  const address = value.orderid;
  var tradeendtimestamp=value.trade_e_timestamp;
  var procmeterreadinge=value.PROC_METER_READING_E
  var consmeterreadinge=value.CONS_METER_READING_E
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.PROC_METER_READING_E=procmeterreadinge;
    orderjdata.CONS_METER_READING_E=consmeterreadinge;
    orderjdata.TRADE_E_TIMESTAMP=tradeendtimestamp;
    orderjdata.TRADE_STATUS='TRADING_COMPLETED';
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Trading Completed", result)
    }).catch(function(error) {
      console.error("Error while setting up trade ending", error)
        })
});
}

validatetrade(value){
    const address = value.orderid;
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.ORDER_STATUS='VALIDATED';
    orderjdata.FINE=0;
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Order Validated", result)
    }).catch(function(error) {
      console.error("Error While Validating Order", error)
        })
});
}

createuser(value){
  var  address=makeAddress(value.UserID);
var stateEntriesSend = {}
  stateEntriesSend[address] = Buffer.from(JSON.stringify(value));
return  this.context.setState(stateEntriesSend, this.timeout).then((result)=> {     
console.log("User Created", result)
}).catch(function(error) {
     console.error("Error While Creating User", error)
   })
 }

}
const makeAddress = (x) => TP_NAMESPACE+ _hash(x)
module.exports = EnergyTradeState;
