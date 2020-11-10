require("dotenv").config();
var express =  require('express');
const lightwallet = require('eth-lightwallet');
const path = require('path');
const fs = require("fs");
const Tx = require("ethereumjs-tx").Transaction;
const Web3 = require('web3');
const axios = require('axios');
const { emit } = require("process");

const sustainImpactPath = path.resolve(__dirname, "./build/contracts/SustainImpact.json");
const sustainImpactJSON = fs.readFileSync(sustainImpactPath, "utf8");
const sustainImpact = JSON.parse(sustainImpactJSON);

// const contractAddress = "0xE10020a8CE231fD4055Ed5F15cb62cB3429D0262";
var Infura_kovan = process.env.INFURA_KEY_KOVAN;
const contractAddress = process.env.CONTRACT_ADDRESS_KOVAN;
const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/v3/"+Infura_kovan));

const myContract = new web3.eth.Contract(sustainImpact.abi, contractAddress, {
  // from: account, // default from address
  gasPrice: "3000000", // default gas price in wei, 20 gwei in this case
});

const app = express();
app.use(express.json());


const port = 3000;
  

app.get('/api/getseed',(req,res) => {
    try{
    var secretSeed = lightwallet.keystore.generateRandomSeed();
    res.json({Seed:secretSeed})
    }catch(error){
      var errMsg = error.toString();
      res.json({success:0,err:errMsg});
    }
})

app.post('/api/checkSeed',(req,res)=>{
  var seed = req.body.seed

  try{
    var checkSeed = lightwallet.keystore.isSeedValid(seed)

    res.json({Valid:checkSeed})
  }
  catch(error){
    var errMsg = error.toString();
    res.json({Success:0,Error:errMsg})
  }
})


app.post('/api/new_wallet', (req, res) => {
    var password = req.body.password
    var randomSeed = req.body.seed;

  lightwallet.keystore.createVault({
    password: password,
    seedPhrase: randomSeed,
    //random salt
    hdPathString: "m/0'/0'/0'"
  }, function (err, ks) {
    global_keystore = ks

    if (password == '') {
      res.json({ERR: 'Password not found'})
    }
    var address = '0x...'
    global_keystore.keyFromPassword(password, function(err, pwDerivedKey) {
    global_keystore.generateNewAddress(pwDerivedKey, 1);
    var addresses = global_keystore.getAddresses();
        var address = addresses[0];
        var pk = global_keystore.exportPrivateKey(address, pwDerivedKey);
        const privateKeyUS = Buffer.from(pk, "hex");
        res.json({address: address,Wallet_Data: ks,Private_Key:pk})

      })
    })
  })

app.post("/api/getEtherBalance", async (req, res) => {
    var address = req.body.address;
    console.log(address);
    web3.eth
      .getBalance(address)
      .then((s) => {
        var result = web3.utils.fromWei(s, "ether");
        console.log(result);
        res.json({ ETH_balance: result });
      })
      .catch((err) => {
        console.log("Error", err);
        res.send(err);
      });
  });

app.post("/api/sendETH", async (req, res) => {
    var amount = req.body.amount * (10**18);
    var address = req.body.address;
    var sender = req.body.sender;
    var SenderPrivateKey = req.body.sendersPrivatekey;
    console.log("Amount", amount);
    const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  
  
   await web3.eth.getTransactionCount(sender, (err, txCount) => {
      console.log("In the Block");
      console.log("Error", err);
  
      const txObject = {
        nonce: web3.utils.toHex(txCount),
        to: address,
        value: amount,
        from: sender,
        gasLimit: web3.utils.toHex(62000),
        gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
        chainId: 0x42,
      };
  
      const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
      console.log("tx obj", tx);
      tx.sign(privateKeyUS);
      const serializedTransaction = tx.serialize();
  
      console.log("serialized Transaction", serializedTransaction);
      const raw = "0x" + serializedTransaction.toString("hex");
      console.log("Raw Transaction", raw);
      web3.eth.sendSignedTransaction(raw, (err, txHash) => {
        if (err) {
          res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
          console.log("Error", err);
        } else {
          console.log("txHash:", txHash);
          res.json({ Tx: txHash, From: sender, value: amount });
        }
      });
    });
  });

app.post("/api/updateProfile", async(req, res) => {
  var address = req.body.userAddress;
  var SenderPrivateKey = req.body.userPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var username = req.body.username;
  var url = req.body.url;
  var phoneNumber = req.body.phoneNumber;
  var deviceId1 = req.body.deviceId1;
  var meterId1 = req.body.meterId1;
  var deviceId2 = req.body.deviceId2;
  var meterId2 = req.body.meterId2;

  web3.eth.getTransactionCount(address, (err, txCount) => {
    console.log("In the Block");
    console.log("Error", err);

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: contractAddress,
      value: "0x00",
      data: myContract.methods.updateUser(address, username, url, phoneNumber, deviceId1, meterId1, deviceId2, meterId2).encodeABI(),
      gasLimit: web3.utils.toHex(300000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
      chainId: 0x42,
    };
    const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
    console.log("tx obj", tx);
    tx.sign(privateKeyUS);
    const serializedTransaction = tx.serialize();

    console.log("serialized Transaction", serializedTransaction);
    const raw = "0x" + serializedTransaction.toString("hex");
    console.log("Raw Transaction", raw);
    web3.eth.sendSignedTransaction(raw, (err, txHash) => {
      if (err) {
        return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
      } else {
        console.log("txHash:", txHash);
        return res.json({ Tx: txHash, From: address, Status: "Profile Updated"});
      }
    });
  });
})

app.post("/api/createUser", async (req, res) => {

  var secretSeed = lightwallet.keystore.generateRandomSeed();
  var password = "123";
  var randomSeed = secretSeed;
  // var amount = req.body.amount * (10**18);
  // var address = req.body.address;
  // var sender = req.body.sender;
  // var SenderPrivateKey = req.body.sendersPrivatekey;

  lightwallet.keystore.createVault({
    password: password,
    seedPhrase: randomSeed,
    //random salt
    hdPathString: "m/0'/0'/0'"
  }, function (err, ks) {
    global_keystore = ks

    if (password == '') {
      res.json({ERR: 'Password not found'})
    }
    var address = '0x...'
    global_keystore.keyFromPassword(password, async function(err, pwDerivedKey) {
    global_keystore.generateNewAddress(pwDerivedKey, 1);
    var addresses = global_keystore.getAddresses();
        var address = addresses[0];
        var pk = global_keystore.exportPrivateKey(address, pwDerivedKey);
        const privateKeyUS = Buffer.from(pk, "hex");
        var amount = process.env.AMOUNT * (10 ** 18);
        var sender = process.env.SENDER_ADDRESS;
        var SenderPrivateKey = process.env.SENDER_PK;
        const privateKeySender = Buffer.from(SenderPrivateKey, "hex");
        console.log("SEnder", sender);
        console.log("PK", SenderPrivateKey);
        console.log("Amount", amount);

        await web3.eth.getTransactionCount(sender, (err, txCount) => {
          console.log("In the Block");
          console.log("Error", err);
      
          const txObject = {
            nonce: web3.utils.toHex(txCount),
            to: address,
            value: amount,
            from: sender,
            gasLimit: web3.utils.toHex(62000),
            gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
            chainId: 0x42,
          };
      
          const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
          console.log("tx obj", tx);
          tx.sign(privateKeySender);
          const serializedTransaction = tx.serialize();
      
          console.log("serialized Transaction", serializedTransaction);
          const raw = "0x" + serializedTransaction.toString("hex");
          console.log("Raw Transaction", raw);
          web3.eth.sendSignedTransaction(raw, (err, txHash) => {
            if (err) {
              res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
              console.log("Error", err);
            } else {
              console.log("txHash:", txHash);

              
              // res.json({ Tx: txHash, From: sender, value: amount });
            }
          }).on('receipt', async function(receipt){
            console.log(receipt);
            var username = req.body.username;
              var url = req.body.url;
              var phoneNumber = req.body.phoneNumber;
              var deviceId1 = req.body.deviceId1;
              var meterId1 = req.body.meterId1;
              var deviceId2 = req.body.deviceId2;
              var meterId2 = req.body.meterId2;

              web3.eth.getTransactionCount(address, (err, txCount) => {
                console.log("In the Block");
                console.log("Error", err);
            
                const txObject = {
                  nonce: web3.utils.toHex(txCount),
                  to: contractAddress,
                  value: "0x00",
                  data: myContract.methods.createUser(username, url, phoneNumber, deviceId1, meterId1, deviceId2, meterId2).encodeABI(),
                  gasLimit: web3.utils.toHex(300000),
                  gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
                  chainId: 0x42,
                };
                const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
                console.log("tx obj", tx);
                tx.sign(privateKeyUS);
                const serializedTransaction = tx.serialize();
            
                console.log("serialized Transaction", serializedTransaction);
                const raw = "0x" + serializedTransaction.toString("hex");
                console.log("Raw Transaction", raw);
                web3.eth.sendSignedTransaction(raw, (err, txHash) => {
                  if (err) {
                    return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
                    // console.log("Error", err);
                  } else {
                    console.log("txHash:", txHash);
                    return res.json({ Tx: txHash, From: address, Seed : [secretSeed], Status: ["Profile Updated"], address: [address],Wallet_Data: [ks], Private_Key: [pk]});
                  }
                });
              });

          })
        });

        // res.json({address: address,Wallet_Data: ks,Private_Key:pk})
      })
    })
})

app.post("/api/getUser", async (req, res) => {
  var address = req.body.address;
  console.log(address);
  try {
    myContract.methods
      .getUser(address)
      .call()
      .then(function (data) {
        res.json({username : data[0], url : data[1], phoneNumber : data[2], deviceId : data[3], meterId : data[4]});
      })
      .catch(function (err) {
        console.log(err);
        res.json({ Success: 0, ERR: err });
      });
  } catch (err) {
    res.json({ Success: 0, ERR: err });
  }
});

app.post("/api/createOrder", async(req, res) => {
  
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var unit = req.body.unit;
  var energy = req.body.energy;
  var timeFrom = req.body.timeFrom;
  var timeTo = req.body.timeTo;
  var sellerDeviceId = req.body.sellerDeviceId;
  var location = req.body.location;
  var amountOfPower = req.body.amountOfPower;
  var price = req.body.price;

  web3.eth.getTransactionCount(address, (err, txCount) => {

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: contractAddress,
      value: "0x00",
      data: myContract.methods.createOrder(unit, energy, timeFrom, timeTo, sellerDeviceId, location, amountOfPower, price).encodeABI(),
      gasLimit: web3.utils.toHex(300000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
      chainId: 0x42,
    };
    const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
    console.log("tx obj", tx);
    tx.sign(privateKeyUS);
    const serializedTransaction = tx.serialize();

    console.log("serialized Transaction", serializedTransaction);
    const raw = "0x" + serializedTransaction.toString("hex");
    console.log("Raw Transaction", raw);
    web3.eth.sendSignedTransaction(raw , (err, data) => {
      console.log("Data ", data);
      if (err) {
        console.log("Error", err);
        return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
      } else {
        console.log("txHash:", data);
      }
    })
    .on('receipt', function(receipt){
      console.log(receipt);
      myContract.methods
            .getOrderId()
            .call()
            .then(function (order) {
              console.log(order);
              // res.send(data);
              console.log(order[order.length-1]);
              res.json({ Tx: receipt.blockHash, From: address, OrderId: order[order.length - 1], Status: "Order Created"})
            })
            .catch(function (err) {
              console.log(err);
              // res.json({ Success: 0, ERR: err });
            })
    });
  })
})

app.post("/api/getOrder", async (req, res) => {
  var orderId = req.body.orderId;
  console.log(orderId);
  try {
    myContract.methods
      .getOrder(orderId)
      .call()
      .then(function (data) {
        // console.log(data);
        res.json({sellerAddress : data[0], unit: data[1], energy: data[2], timeFrom: data[3], timeTo: data[4], sellerDeviceId: data[5], location: data[6], amountOfPower: data[7], price: data[8], buyerAddress: data[9], buyerDeviceId: data[10], status: data[11]});
      })
      .catch(function (err) {
        console.log(err);
        res.json({ Success: 0, ERR: err });
      });
  } catch (err) {
    res.json({ Success: 0, ERR: err });
  }
});

app.post("/api/updateOrder", async(req, res) => {
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var orderId = req.body.orderId;
  var unit = req.body.unit;
  var energy = req.body.energy;
  var timeFrom = req.body.timeFrom;
  var timeTo = req.body.timeTo;
  var sellerDeviceId = req.body.sellerDeviceId;
  var location = req.body.location;
  var amountOfPower = req.body.amountOfPower;
  var price = req.body.price;

  web3.eth.getTransactionCount(address, (err, txCount) => {
    console.log("In the Block");
    console.log("Error", err);

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: contractAddress,
      value: "0x00",
      data: myContract.methods.updateOrder(orderId, unit, energy, timeFrom, timeTo, sellerDeviceId, location, amountOfPower, price).encodeABI(),
      gasLimit: web3.utils.toHex(300000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
      chainId: 0x42,
    };
    console.log("tcObject : " , txObject);
    const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
    console.log("tx obj", tx);
    tx.sign(privateKeyUS);
    const serializedTransaction = tx.serialize();

    console.log("serialized Transaction", serializedTransaction);
    const raw = "0x" + serializedTransaction.toString("hex");
    console.log("Raw Transaction", raw);
    web3.eth.sendSignedTransaction(raw, (err, txHash) => {
      if (err) {
        console.log("Error", err);
        return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
      } else {
        console.log("txHash:", txHash);
        return res.json({ Tx: txHash, From: address, Status: "Order Updated"});
      }
    });
  });
})

app.post("/api/acceptOrder", async(req, res) => {
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var orderId = req.body.orderId;
  var buyerDeviceId = req.body.buyerDeviceId;


  web3.eth.getTransactionCount(address, (err, txCount) => {
    console.log("In the Block");
    console.log("Error", err);

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: contractAddress,
      value: "0x00",
      data: myContract.methods.acceptOrder(orderId, buyerDeviceId).encodeABI(),
      gasLimit: web3.utils.toHex(300000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
      chainId: 0x42,
    };
    const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
    console.log("tx obj", tx);
    tx.sign(privateKeyUS);
    const serializedTransaction = tx.serialize();

    console.log("serialized Transaction", serializedTransaction);
    const raw = "0x" + serializedTransaction.toString("hex");
    console.log("Raw Transaction", raw);
    web3.eth.sendSignedTransaction(raw, (err, txHash) => {
      if (err) {
        console.log("Error", err);
        return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
      } else {
        console.log("txHash:", txHash);

        return res.json({ Tx: txHash, From: address, Status: "Order Accepted"});
      }
    });
  });
})

app.post("/api/cancleOrder", async(req, res) => {
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var orderId = req.body.orderId;


  web3.eth.getTransactionCount(address, (err, txCount) => {
    console.log("In the Block");
    console.log("Error", err);

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: contractAddress,
      value: "0x00",
      data: myContract.methods.cancleOrder(orderId).encodeABI(),
      gasLimit: web3.utils.toHex(300000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
      chainId: 0x42,
    };
    const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
    console.log("tx obj", tx);
    tx.sign(privateKeyUS);
    const serializedTransaction = tx.serialize();

    console.log("serialized Transaction", serializedTransaction);
    const raw = "0x" + serializedTransaction.toString("hex");
    console.log("Raw Transaction", raw);
    web3.eth.sendSignedTransaction(raw, (err, txHash) => {
      if (err) {
        console.log("Error", err);
        return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
      } else {
        console.log("txHash:", txHash);
        return res.json({ Tx: txHash, From: address, Status: "Order Cancled"});
      }
    });
  });
})

app.post("/api/deleteOrder", async(req, res) => {
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var orderId = req.body.orderId;


  web3.eth.getTransactionCount(address, (err, txCount) => {
    console.log("In the Block");
    console.log("Error", err);

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: contractAddress,
      value: "0x00",
      data: myContract.methods.deleteOrder(orderId).encodeABI(),
      gasLimit: web3.utils.toHex(300000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
      chainId: 0x42,
    };
    const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
    console.log("tx obj", tx);
    tx.sign(privateKeyUS);
    const serializedTransaction = tx.serialize();

    console.log("serialized Transaction", serializedTransaction);
    const raw = "0x" + serializedTransaction.toString("hex");
    console.log("Raw Transaction", raw);
    web3.eth.sendSignedTransaction(raw, (err, txHash) => {
      if (err) {
        console.log("Error", err);
        return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
      } else {
        console.log("txHash:", txHash);
        return res.json({ Tx: txHash, From: address, Status: "Order Deleted"});
      }
    });
  });
})

app.post("/api/startTrade", async(req, res) => {
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var orderId = req.body.orderId;
  var buyerAddress = req.body.buyerAddress;
  var response = axios.post("http://localhost:3000/api/getReading", {
    "address": req.body.address,
    "buyerAddress":req.body.buyerAddress,
    "orderId":req.body.orderId
  }).then(function(data){
    console.log(data);
    var sellerMeterReading = data.data.SellerMeter;
    var buyerMeterReading = data.data.BuyerMeter;
    console.log("In trade ", sellerMeterReading, buyerMeterReading);

    web3.eth.getTransactionCount(address, (err, txCount) => {
      console.log("In the Block");
      console.log("Error", err);
  
      const txObject = {
        nonce: web3.utils.toHex(txCount),
        to: contractAddress,
        value: "0x00",
        data: myContract.methods.startTrading(orderId, sellerMeterReading, buyerMeterReading).encodeABI(),
        gasLimit: web3.utils.toHex(300000),
        gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
        chainId: 0x42,
      };
      const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
      console.log("tx obj", tx);
      tx.sign(privateKeyUS);
      const serializedTransaction = tx.serialize();
  
      console.log("serialized Transaction", serializedTransaction);
      const raw = "0x" + serializedTransaction.toString("hex");
      console.log("Raw Transaction", raw);
      web3.eth.sendSignedTransaction(raw, (err, txHash) => {
        if (err) {
          console.log("Error", err);
          return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
        } else {
          console.log("txHash:", txHash);
          return res.json({ Tx: txHash, From: address, Status: "Trading Started"});
        }
      });
    });
  }).catch(function(err){
    console.log(err)
  })
})

app.post("/api/endTrade", async(req, res) => {
  var address = req.body.sellerAddress;
  var SenderPrivateKey = req.body.sellerPrivatekey;
  const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
  var orderId = req.body.orderId;

  var response = axios.post("http://localhost:3000/api/getReading", {
    "address": req.body.address,
    "buyerAddress":req.body.buyerAddress,
    "orderId":req.body.orderId
  }).then(function(data){
    console.log(data);
    var sellerMeterReading = data.data.SellerMeter;
    var buyerMeterReading = data.data.BuyerMeter;
    console.log("In trade ", sellerMeterReading, buyerMeterReading);

    web3.eth.getTransactionCount(address, (err, txCount) => {
      console.log("In the Block");
      console.log("Error", err);
  
      const txObject = {
        nonce: web3.utils.toHex(txCount),
        to: contractAddress,
        value: "0x00",
        data: myContract.methods.endTrading(orderId, sellerMeterReading, buyerMeterReading).encodeABI(),
        gasLimit: web3.utils.toHex(300000),
        gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
        chainId: 0x42,
      };
      const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
      console.log("tx obj", tx);
      tx.sign(privateKeyUS);
      const serializedTransaction = tx.serialize();
  
      console.log("serialized Transaction", serializedTransaction);
      const raw = "0x" + serializedTransaction.toString("hex");
      console.log("Raw Transaction", raw);
      web3.eth.sendSignedTransaction(raw, (err, txHash) => {
        if (err) {
          console.log("Error", err);
          return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
        } else {
          console.log("txHash:", txHash);
          return res.json({ Tx: txHash, From: address, Status: "Trading Ended"});
        }
      });
    });
  }).catch(function(err){
    console.log(err)
  })


})

// app.post("/api/validateTrade", async(req, res) => {
//   var address = req.body.address;
//   var SenderPrivateKey = req.body.sendersPrivatekey;
//   const privateKeyUS = Buffer.from(SenderPrivateKey, "hex");
//   var orderId = req.body.orderId;
//   var sellerFine = req.body.sellerFine;
//   var buyerFine = req.body.buyerFine;


//   web3.eth.getTransactionCount(address, (err, txCount) => {
//     console.log("In the Block");
//     console.log("Error", err);

//     const txObject = {
//       nonce: web3.utils.toHex(txCount),
//       to: contractAddress,
//       value: "0x00",
//       data: myContract.methods.validateTrade(orderId, sellerFine, buyerFine).encodeABI(),
//       gasLimit: web3.utils.toHex(300000),
//       gasPrice: web3.utils.toHex(web3.utils.toWei("45", "gwei")),
//       chainId: 0x42,
//     };
//     const tx = new Tx(txObject, { chain: "kovan", hardfork: "petersburg" });
//     console.log("tx obj", tx);
//     tx.sign(privateKeyUS);
//     const serializedTransaction = tx.serialize();

//     console.log("serialized Transaction", serializedTransaction);
//     const raw = "0x" + serializedTransaction.toString("hex");
//     console.log("Raw Transaction", raw);
//     web3.eth.sendSignedTransaction(raw, (err, txHash) => {
//       if (err) {
//         console.log("Error", err);
//         validateTrade(req.body.orderId);
//         return res.json({ ERROR: "Error - Possibly because of insufficent ETH  " });
//       } else {
//         console.log("txHash:", txHash);
//         return res.json({ Tx: txHash, From: address, Status: "Order Validate"});
//       }
//     });
//   });
// })

validateTrade = function(req, res){
  var orderId = req.body.orderId;
  console.log(orderId);
  myContract.methods
  .getOrder(orderId)
  .call()
  .then(function(data){
    console.log(data);
    myContract.methods
    .getTradeDetails(orderId)
    .call()
    .then(function(data1){
      console.log(data1);
        var buyerStartReading = data[2];
        console.log("b_start" + data[2]);
        var buyerEndReading = data[4];
        console.log("b_end" + data[4]);
        var p_consumed = buyerEndReading - buyerStartReading;
        console.log("p_consumed" + p_consumed);
        var unit = data1[1];
        console.log("unit" + unit);
        var b_fine = 0;
        var sellerStartReading = data[1];
        var sellerEndReading = data[3];
        var p_produced = sellerEndReading - sellerStartReading;
        var s_fine = 0;
        if((!isNaN(p_produced)) && (!isNaN(p_consumed))){
          if(p_produced < unit){
            s_fine = (unit - p_produced) * (data1[8] + 2.5);
            console.log("ShortFall Fine : " + s_fine);
            res.json({Success:1, Status: "Order Validated", ShortfallFine: s_fine})
          }else if(p_produced > unit){
            s_fine = (p_produced - unit) * 2.5;
            console.log("OverSupply Fine : " + s_fine);
            res.json({Success:1, Status: "Order Validated", OverSupplyFine: s_fine})
          }else if(p_consumed > unit){
            b_fine = (p_consumed - unit) * 2.5;
            console.log("OverConsumed Fine : " + b_fine);
            res.json({Success:1, Status: "Order Validated", OverConsumedFine: b_fine})
          }
        }
        else{
          console.log("Readings are not correct");
          b_fine = 9999;
          s_fine = 9999;
          res.json({Success: 0, Status: "Reading are not correct", BuyerFine: b_fine, SellerFine: s_fine});
        }
    })
  })
}

getReading = async function(req, res){
  var address =req.body.address;
  var buyerAddress = req.body.buyerAddress;
  var orderId = req.body.orderId;

  myContract.methods
  .getOrder(orderId)
  .call()
  .then(function(data){
    var sellerDeviceId = data[5];
    myContract.methods
    .getUser(address)
    .call()
    .then(function(data1){
      var s_deviceId;
      var s_meterId;
      var i;
      if(sellerDeviceId == data1[3][0]){
        s_deviceId = data1[3][0];
        s_meterId = data1[4][0];
        console.log(data1[3][0]);
        console.log("Matched send for response", s_deviceId, s_meterId);
        try{
          var response = axios.post("14.139.98.213:4013/agent/fetchTransactionData",{ 
            "meterId": s_meterId,
            "timestamp": Date.now()
          });
          readings=response.data.meterData[0].meterReading;
          console.log(readings);
          return readings;
        }catch(error){
          readings = 0;
          console.log("readings : " + readings);
          return readings;
        }
      }else if(sellerDeviceId == data[3][1]){
        sellerDeviceId = s_deviceId;
        s_meterId = data1[4][1];
        var response = axios.post("14.139.98.213:4013/agent/fetchTransactionData",{ 
          "meterId": s_meterId,
          "timestamp": Date.now()
        });
        readings=response.data.meterData[0].meterReading;
        console.log(readings);
        return readings;
      }else{
        res.json({Status : "Seller Device is not matched"});
      }
    }).then(() => { 
      var buyerDeviceId = data[10];
      console.log(buyerDeviceId)
      myContract.methods
      .getUser(buyerAddress)
      .call()
      .then(function(data2){
        // console.log(data2);
        var b_deviceId;
        var b_meterId;
        var i;
        console.log(data2[3][1]);
        console.log(buyerDeviceId);
        if(buyerDeviceId == data2[3][0]){
          b_deviceId = data2[3][0];
          b_meterId = data2[4][0];
          console.log(data2[3][0]);
          console.log("Matched send for response Buyer", b_deviceId, b_meterId);
          try{
            var response = axios.post("14.139.98.213:4013/agent/fetchTransactionData",{ 
              "meterId": b_meterId,
              "timestamp": Date.now()
            });
            buyer_readings=response.data.meterData[0].meterReading;
            console.log(buyer_readings);
            return buyer_readings;
          }catch(error){
            buyer_readings = 0;
            console.log("readings : " + buyer_readings);
            return buyer_readings;
          }
        }else if(buyerDeviceId == data2[3][1]){
          b_deviceId = data2[3][1];
          b_meterId = data2[4][1];
          console.log(data2[3][1]);
          console.log("Matched send for response Buyer", b_deviceId, b_meterId);
          try{
            var response = axios.post("14.139.98.213:4013/agent/fetchTransactionData",{ 
              "meterId": b_meterId,
              "timestamp": Date.now()
            });
            buyer_readings=response.data.meterData[0].meterReading;
            console.log(buyer_readings);
            return buyer_readings;
          }catch(error){
            buyer_readings = 0;
            console.log("readings : " + buyer_readings);
            return buyer_readings;
          }
        }else{
          res.json({Status : "Seller Device is not matched"});
        }
      })
    })
    res.json({SellerMeter : readings, BuyerMeter : buyer_readings});
  }).catch((error) =>{
      readings = 0;
      buyer_readings = 0;
      res.json({SellerMeter : readings, BuyerMeter : buyer_readings});
  });

  // myContract.methods
  // .getUser(address)
  // .call()
  // .then(function(data){
  //   console.log(data);
  //   var url = data[1];
  //   var deviceId = data[3][0];
  //   var meterId = data[4][0];
  //   console.log(url, deviceId, meterId);
  //   var response = axios.post("14.139.98.213:4013/agent/fetchTransactionData",{ 
  //     "meterId": meterId,
  //     "timestamp": 2020
  //   });
  //   readings=response.data.meterData[0].meterReading;
  //   console.log(readings);
  //   return readings;
  // }).catch((error) =>{
  //     readings = 0;
  // });
}

app.post("/api/getReading", getReading);

app.post("/api/validateTrade", validateTrade);

app.post("/api/getTradeDetail", async (req, res) => {
  var orderId = req.body.orderId;
  console.log(orderId);
  try {
    myContract.methods
      .getTradeDetails(orderId)
      .call()
      .then(function (data) {
        // console.log(data);
        res.json({tradeStatus: data[0], sellerMeterReadingStart: data[1], buyerMeterReadingStart: data[2], sellerMeterReadingEnd: data[3], buyerMeterReadingEnd: data[4], tradeStartTime: data[5], tradeEndTime: data[6], sellerFine: data[7], buyerFine: data[8]});
      })
      .catch(function (err) {
        console.log(err);
        res.json({ Success: 0, ERR: err });
      });
  } catch (err) {
    res.json({ Success: 0, ERR: err });
  }
});


  // Start the server
  const server = app.listen(port, (error) => {
    if (error) return console.log(`Error: ${error}`);

    console.log(`Server listening on port ${server.address().port}`);
})
