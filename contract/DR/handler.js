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
   if (payload.action === 'CREATE_ORDER') {
     return energytradestate.createorder(payload.data)
} else  if (payload.action === 'UPDATE_ORDER') {
     return energytradestate.updateorder(payload.data)
}
else  if (payload.action === 'CANCEL_ORDER') {
  return energytradestate.cancelorder(payload.data)
}
else  if (payload.action === 'ACCEPT_ORDER') {
  return energytradestate.acceptorder(payload.data)
}
else  if (payload.action === 'START_TRADE') {
  return energytradestate.starttrade(payload.data)
}
else  if (payload.action === 'END_TRADE') {
  return energytradestate.endtrade(payload.data)
}
else  if (payload.action === 'VALIDATE_TRADE') {
  return energytradestate.validatetrade(payload.data)
}
else  if (payload.action === 'CREATE_USER') {
  return energytradestate.createuser(payload.data)
}
else {
     throw  new InvalidTransaction(
       `Action must be CREATE_ORDER,UPDATE_ORDER,ACCEPT_ORDER,START_TRADE,END_TRADE not ${payload.action}`
     )
   }
 }
}

module.exports = EnergyTradeHandler;
