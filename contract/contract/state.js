var { _hash } = require("./lib");
var { TP_NAMESPACE } = require("./constants");
var axios= require('axios');


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
    orderjdata.Buyer_DeviceID=value.buyer_deviceid;
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
    return this.context.getState([address], this.timeout).then(async (stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.Seller_METER_READING_S= await getreadings(orderjdata.Seller_UserID,orderjdata.Seller_DeviceID,orderjdata.TIME_FROM);
    orderjdata.Buyer_METER_READING_S=await getreadings(orderjdata.Buyer_UserID,orderjdata.Buyer_DeviceID,orderjdata.TIME_FROM);
    //orderjdata.PROC_METER_READING_E=procmeterreadinge;
   // orderjdata.CONS_METER_READING_E=consmeterreadinge;
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
  //var procmeterreadinge=value.PROC_METER_READING_E
  //var consmeterreadinge=value.CONS_METER_READING_E
    return this.context.getState([address], this.timeout).then(async (stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.Seller_METER_READING_E=await getreadings(orderjdata.Seller_UserID,orderjdata.Seller_DeviceID,orderjdata.TIME_TO);
    orderjdata.Buyer_METER_READING_E=await getreadings(orderjdata.Buyer_UserID,orderjdata.Buyer_DeviceID,orderjdata.TIME_TO);
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
    var b_start_reading=orderjdata.Buyer_METER_READING_S;
    var s_start_reading=orderjdata.Seller_METER_READING_S;
    var b_end_reading=orderjdata.Buyer_METER_READING_E;
    var s_end_reading=orderjdata.Seller_METER_READING_E;
    var p_consumed=b_start_reading-b_end_reading;
    var p_produced=s_start_reading-s_end_reading;
    var units=orderjdata.units;
    var B_Fine=0;
    var S_Fine=0;
    if (p_produced>units){
        B_Fine=p_produced-units;
    }
    else if (p_consumed<units){
      S_Fine=units-p_consumed;
    }
    orderjdata.ORDER_STATUS='VALIDATED';
    orderjdata.B_FINE=B_Fine;
    orderjdata.S_FINE=S_Fine;
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


 async getreadings(userid,deviceid,timestamp){
   var readings="";

  this.context.getState([userid], this.timeout).then((stateEntries)=> {
    var userdata=stateEntries[userid].toString();
    var userjdata=JSON.parse(userdata)
    var hwarr=userjdata.HWInfo;
    var url=userjdata.url;
    var meterid="";
    for(var i = 0; i < hwarr.length; i++) {
      var obj = hwarr[i];
      if (obj.DeviceID==deviceid){
           meterid=obj.MeterID;
           break;
      }
  }

  axios.post(url+'/agent/fetchTransactionData', {
    "meterid": meterid,
    "timestamp":timestamp
  })
  .then((response) => {
    readings=response.data.readings;
  }).catch((error) => {
    readings= 0;
  });
  
}).catch((error) => {
  readings= 0;
});
return readings;    
 }
 

}
const makeAddress = (x) => TP_NAMESPACE+ _hash(x)
module.exports = EnergyTradeState;
