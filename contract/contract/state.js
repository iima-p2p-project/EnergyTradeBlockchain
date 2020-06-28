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
    orderjdata.eventStatus = "TRADE_STARTED";
    var sellers=orderjdata.sellers;
    for (var i=0;i<sellers.length;i++){
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
    orderjdata.eventStatus = "TRADE_ENDED";
    console.log("Calculating Seller's END Readings");
    var sellers=orderjdata.sellers;
    for (var i=0;i<sellers.length;i++){
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
    var b_start_reading=orderjdata.buyerNetMeterReading_s;
    var b_end_reading=orderjdata.buyerNetMeterReading_e;
    var p_consumed=b_end_reading-b_start_reading;
    var units=orderjdata.plannedQuantity;

    var B_Fine = 0;

    var p_consumed = b_end_reading - b_start_reading;
    console.log('p_consumed: ' + p_consumed);
    var p_produced = s_end_reading - s_start_reading;
    console.log('p_produced: ' + p_produced);



    var sellers=orderjdata.sellers;
    for ( var i=0;i<sellers.length;i++){
      var seller= orderjdata.sellers[i];
      console.log("Seller reading" + seller.sellerMeterReadingsStart[0]);
      var p_produced = seller.sellerMeterReadingsStart[0] - seller.sellMeterReadingsEnd[0];
      var units = seller.committedPower;
      var S_Fine = 0;


if (!(isNaN(p_consumed)) && !(isNaN(p_produced))) {

      try {
        if (p_produced < units) {
          // shortfall = unit - p_produced
          S_Fine = (units - p_produced) * (orderjdata.price + 2.5);
          console.log('shortfall S_Fine' + S_Fine);
        } else if (p_produced > units) {
          //  oversupply = p_produced - units
          S_Fine = (p_produced - units) * (2.5);
          console.log('oversupply S_Fine' + S_Fine);

        }

        // else if (p_consumed > units) {
        //   //  overConsumption = p_consumed - units
        //   B_Fine = (p_consumed - units) * 2.5;
        //   console.log('overConsumption B_Fine' + B_Fine);
        // }

      } catch (e) {
        console.log(e);
      };

    } else {
      console.log('Redings are of unsupported formate');
      B_Fine = 9999;
      S_Fine = 9999;

    }

    seller.sellerFine = S_Fine;



    } //forloop

    if (p_consumed > units) {
      //  overConsumption = p_consumed - units
      B_Fine = (p_consumed - units) * 2.5;
      console.log('overConsumption B_Fine' + B_Fine);
    }


    orderjdata.eventStatus='VALIDATED';
    orderjdata.buyerFine=B_Fine;
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
