const { createContext, CryptoFactory } = require('sawtooth-sdk/signing')



createUser=()=>{
var context = createContext('secp256k1')
var privateKey = context.newRandomPrivateKey();
var signer = new CryptoFactory(context).newSigner(privateKey)

    var user={};
    user['publickey']=signer.getPublicKey().asHex();
    user['privatekey']=privateKey.privateKeyBytes.toString('hex');

    return user

}

exports.createUser=createUser;
