const { TransactionHandler } = require('sawtooth-sdk/processor/handler')
const { InvalidTransaction, InternalError } = require('sawtooth-sdk/processor/exceptions')
const cbor = require('cbor')
const EnergyTradeState = require('./state');
var { TP_FAMILY, TP_NAMESPACE } = require("./constants");

class EnergyTradeHandler extends TransactionHandler {
 constructor() {
   super(TP_FAMILY, ['1.0'], [TP_NAMESPACE])
 }

 apply(transactionProcessRequest, context) {
   let payload = cbor.decode(transactionProcessRequest.payload);
   let energytradestate = new EnergyTradeState(context);
   if (payload.action === 'CREATE_ORDER_DR') {
     return energytradestate.createorder_dr(payload.data)
} else  if (payload.action === 'UPDATE_ORDER_DR') {
     return energytradestate.updateorder_dr(payload.data)
}
else  if (payload.action === 'CANCEL_ORDER_DR') {
  return energytradestate.cancelorder_dr(payload.data)
}
else  if (payload.action === 'ACCEPT_ORDER_DR') {
  return energytradestate.acceptorder_dr(payload.data)
}
else  if (payload.action === 'START_TRADE_DR') {
  return energytradestate.starttrade_dr(payload.data)
}
else  if (payload.action === 'END_TRADE_DR') {
  return energytradestate.endtrade_dr(payload.data)
}
else  if (payload.action === 'VALIDATE_TRADE_DR') {
  return energytradestate.validatetrade_dr(payload.data)
}
else  if (payload.action === 'CREATE_USER_DR') {
  return energytradestate.createuser_dr(payload.data)
}
else {
     throw  new InvalidTransaction(
       `Action must be CREATE_ORDER_DR,UPDATE_ORDER_DR,ACCEPT_ORDER_DR,START_TRADE_DR,END_TRADE_DR not ${payload.action}`
     )
   }
 }
}

module.exports = EnergyTradeHandler;
