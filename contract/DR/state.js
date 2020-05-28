var {
  _hash
} = require("./lib");
var {
  TP_NAMESPACE
} = require("./constants");
var axios = require('axios');


class EnergyTradeState {
  constructor(context) {
    this.context = context;
    this.timeout = 500;
    this.stateEntries = {};
  }


  createorder(value) {
    try {
      var address = makeAddress(value.Seller_UserID + value.CREATED_TIMESTAMP);
      var stateEntriesSend = {}
      stateEntriesSend[address] = Buffer.from(JSON.stringify(value));
      return this.context.setState(stateEntriesSend, this.timeout).then((result) => {
        this.context.addEvent(
          'ENERGYTRADING/ORDERCREATED',
          [
            ['orderid', result[0]]
          ],
          null)
        console.log("Order Created", result)
      }).catch(function(error) {
        console.error("Error While Creating Order", error)
      })
    } catch (err) {
      console.error("Error while Creating order", error);
    }
  }

  updateorder(value) {
    try {
      const address = value.orderid;
      var updatedorder = value.newupdatedorderdata;
      return this.context.getState([address], this.timeout).then((stateEntries) => {
        var stateEntriesSend = {}
        stateEntriesSend[address] = Buffer.from(JSON.stringify(updatedorder));
        return this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
          console.log("Order Updated", result)
        }).catch(function(error) {
          console.error("Error while updating order", error)
        })
      });
    } catch (err) {
      console.error("Error while updating order", error);
    }
  }

  acceptorder(value) {
    try {
      const address = value.orderid;
      var accepteduserid = value.buyeruserid;
      var acceptestimestamp = value.buyeracctimestamp;
      return this.context.getState([address], this.timeout).then((stateEntries) => {
        var stateEntriesSend = {}
        var orderdata = stateEntries[address].toString();
        var orderjdata = JSON.parse(orderdata)
        orderjdata.Buyer_UserID = accepteduserid;
        orderjdata.Accepted_TIMESTAMP = acceptestimestamp;
        orderjdata.Buyer_DeviceID = value.buyer_deviceid;
        orderjdata.ORDER_STATUS = 'ACCEPTED';
        stateEntriesSend[address] = Buffer.from(JSON.stringify(orderjdata));
        return this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
          console.log("Order Accepted", result)
        }).catch(function(error) {
          console.error("Error While Accepting Order", error)
        })
      });
    } catch (err) {
      console.error("Error while Accepting  order", error);
    }
  }


  cancelorder(value) {
    try {
      const address = value.orderid;
      return this.context.getState([address], this.timeout).then((stateEntries) => {
        var stateEntriesSend = {}
        var orderdata = stateEntries[address].toString();
        var orderjdata = JSON.parse(orderdata)
        orderjdata.ORDER_STATUS = 'CANCELLED';
        stateEntriesSend[address] = Buffer.from(JSON.stringify(orderjdata));
        return this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
          console.log("Order Cancelled", result)
        }).catch(function(error) {
          console.error("Error While Cancelling Order", error)
        })
      });
    } catch (err) {
      console.error("Error while Cancelling  order", error);
    }
  }



  starttrade(value) {
    try {
      const address = value.orderid;
      var tradestarttimestamp = value.trade_s_timestamp;
      return this.context.getState([address], this.timeout).then(async (stateEntries) => {
        var stateEntriesSend = {}
        var orderdata = stateEntries[address].toString();
        var orderjdata = JSON.parse(orderdata)
        orderjdata.Seller_METER_READING_S = await this.getreadings(orderjdata.Seller_UserID, orderjdata.Seller_DeviceID, orderjdata.TIME_FROM);
        console.log(orderjdata.Seller_METER_READING_S);
        orderjdata.Buyer_METER_READING_S = await this.getreadings(orderjdata.Buyer_UserID, orderjdata.Buyer_DeviceID, orderjdata.TIME_FROM);
        console.log(orderjdata.Buyer_METER_READING_S);
        //orderjdata.PROC_METER_READING_E=procmeterreadinge;
        // orderjdata.CONS_METER_READING_E=consmeterreadinge;
        orderjdata.TRADE_S_TIMESTAMP = tradestarttimestamp;
        orderjdata.TRADE_STATUS = 'TRADING';
        stateEntriesSend[address] = Buffer.from(JSON.stringify(orderjdata));
        return this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
          console.log("Trading Started", result)
        }).catch(function(error) {
          console.error("Error while setting up trade started", error)
        })
      });
    } catch (err) {
      console.error("Error while setting up trade started", error);
    }
  }

  endtrade(value) {
    try {
      const address = value.orderid;
      var tradeendtimestamp = value.trade_e_timestamp;
      //var procmeterreadinge=value.PROC_METER_READING_E
      //var consmeterreadinge=value.CONS_METER_READING_E
      return this.context.getState([address], this.timeout).then(async (stateEntries) => {
        var stateEntriesSend = {}
        var orderdata = stateEntries[address].toString();
        var orderjdata = JSON.parse(orderdata)
        orderjdata.Seller_METER_READING_E = await this.getreadings(orderjdata.Seller_UserID, orderjdata.Seller_DeviceID, orderjdata.TIME_TO);
        console.log(orderjdata.Seller_METER_READING_S);
        orderjdata.Buyer_METER_READING_E = await this.getreadings(orderjdata.Buyer_UserID, orderjdata.Buyer_DeviceID, orderjdata.TIME_TO);
        console.log(orderjdata.Buyer_METER_READING_E);
        orderjdata.TRADE_E_TIMESTAMP = tradeendtimestamp;
        orderjdata.TRADE_STATUS = 'TRADING_COMPLETED';
        stateEntriesSend[address] = Buffer.from(JSON.stringify(orderjdata));
        return this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
          console.log("Trading Completed", result)
        }).catch(function(error) {
          console.error("Error while setting up trade ending", error)
        })
      });
    } catch (err) {
      console.error("Error while setting up trade ending", error)
    }
  }

  validatetrade(value) {
    try {
      const address = value.orderid;
      return this.context.getState([address], this.timeout).then((stateEntries) => {
        var stateEntriesSend = {}
        var orderdata = stateEntries[address].toString();
        var orderjdata = JSON.parse(orderdata)
        var b_start_reading = orderjdata.Buyer_METER_READING_S;
        var s_start_reading = orderjdata.Seller_METER_READING_S;
        var b_end_reading = orderjdata.Buyer_METER_READING_E;
        var s_end_reading = orderjdata.Seller_METER_READING_E;
        var p_consumed = b_end_reading - b_start_reading;
        var p_produced = s_end_reading - s_start_reading;
        var units = orderjdata.AMOUNT_OF_POWER;
        var B_Fine = 0;
        var S_Fine = 0;
        if (p_produced > units) {
          B_Fine = p_produced - units;
        } else if (p_consumed < units) {
          S_Fine = units - p_consumed;
        }
        orderjdata.ORDER_STATUS = 'VALIDATED';
        orderjdata.B_FINE = B_Fine;
        orderjdata.S_FINE = S_Fine;
        stateEntriesSend[address] = Buffer.from(JSON.stringify(orderjdata));
        return this.context.setState(stateEntriesSend, this.timeout).then(function(result) {
          console.log("Order Validated", result)
        }).catch(function(error) {
          console.error("Error While Validating Order", error)
        })
      });
    } catch (err) {
      console.error("Error While Validating Order", error);
    }
  }

  createuser(value) {
    try {
      var address = value.UserID;
      var stateEntriesSend = {}
      stateEntriesSend[address] = Buffer.from(JSON.stringify(value));
      return this.context.setState(stateEntriesSend, this.timeout).then((result) => {
        console.log("User Created", result)
      }).catch(function(error) {
        console.error("Error While Creating User", error)
      })
    } catch (err) {
      console.error("Error While Creating User", error);
    }
  }


  async getreadings(userid, deviceid, timestamp) {
    var readings = "";
    try {
      return this.context.getState([userid], this.timeout).then(async (stateEntries) => {
        var userdata = stateEntries[userid].toString();
        var userjdata = JSON.parse(userdata)
        var hwarr = userjdata.HWInfo;
        var url = userjdata.url;
        var meterid = "";
        for (var i = 0; i < hwarr.length; i++) {
          var obj = hwarr[i];
          if (obj.DeviceID == deviceid) {
            meterid = obj.MeterID;
            break;
          }
        }

        console.log(meterid);
        console.log(timestamp);
        console.log(url);
        var response = await axios.post(url + '/agent/fetchTransactionData', {
          "meterId": meterid,
          "timestamp": timestamp
        });
        console.log(response.data);
        readings = response.data.meterData[0].meterReading;
        return readings;

      }).catch((error) => {
        readings = 0;
      });

    } catch (err) {
      console.log("Error While Fetching Readings")
      return 0;

    }
  }

}
const makeAddress = (x) => TP_NAMESPACE + _hash(x)
module.exports = EnergyTradeState;