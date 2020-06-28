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
  try{
var  address=makeAddress(value.buyerUserId+value.createdTS);
var stateEntriesSend = {}
  stateEntriesSend[address] = Buffer.from(JSON.stringify(value));
return  this.context.setState(stateEntriesSend, this.timeout).then((result)=> {     
console.log("Order Created", result)
}).catch(function(error) {
     console.error("Error While Creating Order", error)
   })
  }
  catch(err){
    console.error("Error while Creating order", error);
  }
 }


starttrade(value){
  try{
  const address = value.orderid;
    return this.context.getState([address], this.timeout).then(async (stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.buyerNetMeterReading_s= await this.getreadings(orderjdata.buyerUserId,orderjdata.buyerDevice,orderjdata.startTS);
    
    var sellers=orderjdata.sellers;
    for (i=0;i<sellers.length;i++){
     var seller= orderjdata.sellers[i];
     var netdata=await this.getreadings(seller.sellerId,"NET",orderjdata.startTS);
     seller.sellerMeterReadingsStart={"NET":netdata};
    }
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Trading Started", result)
    }).catch(function(error) {
      console.error("Error while setting up trade started", error)
        })
});
  }
  catch(err){
    console.error("Error while setting up trade started", error);
  }
}

 endtrade(value){
   try{
  const address = value.orderid;
    return this.context.getState([address], this.timeout).then(async (stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    orderjdata.buyerNetMeterReading_e=await this.getreadings(orderjdata.buyerUserId,orderjdata.buyerDevice,orderjdata.endTS);
    console.log("Calculating Seller's END Readings");
    for (i=0;i<sellers.length;i++){
      var seller= orderjdata.sellers[i];
      var netdata=await this.getreadings(seller.sellerId,"NET",orderjdata.endTS);
      seller.sellMeterReadingsEnd={"NET":netdata};
     }
    stateEntriesSend[address]= Buffer.from(JSON.stringify(orderjdata));
    return  this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
      console.log("Trading Completed", result)
    }).catch(function(error) {
      console.error("Error while setting up trade ending", error)
        })
});
   }
   catch(err){
    console.error("Error while setting up trade ending", error)
   }
}

validatetrade(value){
  try{
    const address = value.orderid;
    return this.context.getState([address], this.timeout).then((stateEntries)=> {
    var stateEntriesSend={}
    var orderdata=stateEntries[address].toString();
    var orderjdata=JSON.parse(orderdata)
    var b_start_reading=orderjdata.Buyer_METER_READING_S;
    var s_start_reading=orderjdata.Seller_METER_READING_S;
    var b_end_reading=orderjdata.Buyer_METER_READING_E;
    var s_end_reading=orderjdata.Seller_METER_READING_E;
    var p_consumed=b_end_reading-b_start_reading;
    var p_produced=s_end_reading-s_start_reading;
    var units=orderjdata.AMOUNT_OF_POWER;
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
  catch(err){
    console.error("Error While Validating Order", error);
  }
}

createuser(value){
  try{
  var  address=value.UserID;
var stateEntriesSend = {}
  stateEntriesSend[address] = Buffer.from(JSON.stringify(value));
return  this.context.setState(stateEntriesSend, this.timeout).then((result)=> {     
console.log("User Created", result)
}).catch(function(error) {
     console.error("Error While Creating User", error)
   })
  }
  catch(err){
    console.error("Error While Creating User", error);
  }
 }


 async getreadings(userid,deviceid,timestamp){
   var readings="";
   try{
  return this.context.getState([userid], this.timeout).then(async (stateEntries)=> {
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

console.log(meterid);
console.log(timestamp);
console.log(url);
var response = await  axios.post(url+'/agent/fetchTransactionData', {
    "meterId": meterid,
    "timestamp":timestamp
  });
console.log(response.data);
    readings=response.data.meterData[0].meterReading;
    return readings;
  
}).catch((error) => {
  readings= 0;
});
 
   }
   catch(err){
     console.log("Error While Fetching Readings")
     return 0;
     
   }
 }
 
}
const makeAddress = (x) => TP_NAMESPACE+ _hash(x)
module.exports = EnergyTradeState;
