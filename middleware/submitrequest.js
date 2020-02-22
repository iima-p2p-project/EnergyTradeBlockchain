const { createContext, CryptoFactory } = require('sawtooth-sdk/signing')
const { createHash } = require('crypto')
const crypto=require('crypto');
const cbor = require('cbor')
const { protobuf } = require('sawtooth-sdk')
const request = require('request')



async function  sendRequest(payload,publickey,privatekey,callback) {

  var buf = new Buffer(privatekey,'hex');
  var privateKey={"privateKeyBytes":buf};
  var context = createContext('secp256k1')
  var signer = new CryptoFactory(context).newSigner(privateKey)
  console.log(signer.getPublicKey().asHex());

 const payloadBytes = cbor.encode(payload)
 const transactionHeaderBytes = protobuf.TransactionHeader.encode({
   familyName: 'ENERGYTRADING',
   familyVersion: '1.0',
   inputs: ['fe9d87'],
   outputs: ['fe9d87'],
   signerPublicKey: publickey, //signer.getPublicKey().asHex(),
   batcherPublicKey:publickey, //signer.getPublicKey().asHex(),
   dependencies: [],
   payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
   nonce: (new  Date()).toString()
 }).finish()

 const signature = signer.sign(transactionHeaderBytes)

 const transaction = protobuf.Transaction.create({
   header: transactionHeaderBytes,
   headerSignature: signature,
   payload: payloadBytes
 })

 const transactions = [transaction]

 const batchHeaderBytes = protobuf.BatchHeader.encode({
   signerPublicKey: publickey,// signer.getPublicKey().asHex(),
   transactionIds: transactions.map((txn) => txn.headerSignature),
 }).finish()

 headerSignature = signer.sign(batchHeaderBytes)

 const batch = protobuf.Batch.create({
   header: batchHeaderBytes,
   headerSignature: headerSignature,
   transactions: transactions
 })

 const batchListBytes = protobuf.BatchList.encode({
   batches: [batch]
 }).finish()

 request.post({
   url: 'http://localhost:8009/batches',
   body: batchListBytes,
   headers: { 'Content-Type': 'application/octet-stream' }
 }, (err, response) => {
  callback(err,response,signature);
 })
}

module.exports.sendRequest=sendRequest;
