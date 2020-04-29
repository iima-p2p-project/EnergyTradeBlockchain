var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
var {
  sendRequest
} = require('./submitrequest');
var {
  createUser
} = require('./createuser');
const crypto = require("crypto");
const axios = require('axios');
const jwt = require('jsonwebtoken');
const accessTokenSecret = 'peer2peertradingsecret';
var privateKey = fs.readFileSync('selfsigned.key', 'utf8');
var certificate = fs.readFileSync('selfsigned.crt', 'utf8');
var credentials = {
  key: privateKey,
  cert: certificate
};


const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.id = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};


app.post('/login', (req, res) => {
  const userid = req.body.userid;
  axios.get('http://localhost:8008/state/' + userid).then((response) => {
    var userbase = response.data.data;
    let buff = new Buffer(userbase, 'base64');
    let userdata = buff.toString('ascii');
    var userjdata = JSON.parse(userdata);
    if (userjdata) {
      const accessToken = jwt.sign({
        userid: userid
      }, accessTokenSecret);
      res.json({
        accessToken
      });
    }
  }).
  catch((error) => {
    res.send({
      "Status": "USER_NOT_EXISTS",
      "ErrorMessage": error
    })
  });

});





app.post('/createorder', authenticateJWT, (req, res) => {

  if (req.body.userid && req.body.seller_deviceid && req.body.energy && req.body.time_from &&
    req.body.time_to && req.body.location && req.body.amount_of_power && req.body.price && req.body.userpbkey && req.body.userpvkey) {
    var orderdata = {};
    var sysdate = Date.now()
    orderdata["CREATED_TIMESTAMP"] = sysdate;
    orderdata["Seller_UserID"] = req.body.userid;
    orderdata["Buyer_UserID"] = "";
    orderdata["Seller_DeviceID"] = req.body.seller_deviceid;
    orderdata["Buyer_DeviceID"] = "";
    orderdata["Accepted_TIMESTAMP"] = "";
    orderdata["ORDER_STATUS"] = "CREATED";
    orderdata["ENERGY"] = req.body.energy;
    orderdata["TIME_FROM"] = req.body.time_from;
    orderdata["TIME_TO"] = req.body.time_to;
    orderdata["LOCATION"] = req.body.location;
    orderdata["AMOUNT_OF_POWER"] = req.body.amount_of_power;
    orderdata["PRICE"] = req.body.price;
    orderdata["TRADE_S_TIMESTAMP"] = "";
    orderdata["TRADE_C_TIMESTAMP"] = "";
    orderdata["TRADE_STATUS"] = "Not Intiated"
    orderdata["Seller_METER_READING_S"] = 0;
    orderdata["Seller_METER_READING_E"] = 0;
    orderdata["Buyer_METER_READING_S"] = 0;
    orderdata["Buyer_METER_READING_E"] = 0;
    orderdata["B_FINE"] = 0;
    orderdata["S_FINE"] = 0;
    var data = `{"action":"CREATE_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    var orderid = 'fe9d87' + crypto.createHash('sha512').update(req.body.userid + sysdate).digest('hex').toLowerCase().substring(0, 64);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {
      var batch_id_data = JSON.parse(result.body);
      if (batch_id_data.link) {
        //console.log(batch_id_data);
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "order_id": orderid,
          "Batch_id": resp,
          "TxnID": transactionid,
          "status": "ORDER_CREATED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing the required Inputs"
    });
  }
});


app.post('/acceptorder', authenticateJWT, (req, res) => {

  if (req.body.buyeruserid && req.body.buyerdeviceid && req.body.orderid && req.body.userpbkey && req.body.userpvkey) {
    var orderdata = {};
    var sysdate = Date.now()
    orderdata["buyeruserid"] = req.body.buyeruserid;
    orderdata["buyeracctimestamp"] = sysdate;
    orderdata["buyer_deviceid"] = req.body.buyerdeviceid;
    orderdata["orderid"] = req.body.orderid;
    var data = `{"action":"ACCEPT_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {

      var batch_id_data = JSON.parse(result.body);
      if (batch_id_data.link) {
        // console.log(batch_id_data);
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "Batch_id": resp,
          "TxnID": transactionid,
          "status": "ORDER_ACCEPTED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing Required Inputs"
    });
  }
});
app.post('/updateorder', authenticateJWT, (req, res) => {
  if (req.body.userid && req.body.seller_deviceid && req.body.energy && req.body.time_from &&
    req.body.time_to && req.body.location && req.body.amount_of_power && req.body.price && req.body.userpbkey && req.body.userpvkey && req.body.orderid) {
    var orderdata = {};
    var newupdatedorderdata = {};
    var sysdate = Date.now()
    newupdatedorderdata["CREATED_TIMESTAMP"] = sysdate;
    newupdatedorderdata["Seller_UserID"] = req.body.userid;
    newupdatedorderdata["Buyer_UserID"] = "";
    newupdatedorderdata["Seller_DeviceID"] = req.body.seller_deviceid;
    newupdatedorderdata["Buyer_DeviceID"] = "";
    newupdatedorderdata["Accepted_TIMESTAMP"] = "";
    newupdatedorderdata["ORDER_STATUS"] = "CREATED";
    newupdatedorderdata["ENERGY"] = req.body.energy;
    newupdatedorderdata["TIME_FROM"] = req.body.time_from;
    newupdatedorderdata["TIME_TO"] = req.body.time_to;
    newupdatedorderdata["LOCATION"] = req.body.location;
    newupdatedorderdata["AMOUNT_OF_POWER"] = req.body.amount_of_power;
    newupdatedorderdata["PRICE"] = req.body.price;
    newupdatedorderdata["TRADE_S_TIMESTAMP"] = "";
    newupdatedorderdata["TRADE_C_TIMESTAMP"] = "";
    newupdatedorderdata["TRADE_STATUS"] = "Not Intiated"
    newupdatedorderdata["Seller_METER_READING_S"] = 0;
    newupdatedorderdata["Seller_METER_READING_E"] = 0;
    newupdatedorderdata["Buyer_METER_READING_S"] = 0;
    newupdatedorderdata["Buyer_METER_READING_E"] = 0;
    newupdatedorderdata["B_FINE"] = 0;
    newupdatedorderdata["S_FINE"] = 0;
    var orderid = req.body.orderid;
    orderdata['orderid'] = orderid;
    orderdata['newupdatedorderdata'] = newupdatedorderdata;

    var data = `{"action":"UPDATE_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {

      var batch_id_data = JSON.parse(result.body);
      // console.log(batch_id_data);
      if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "order_id": orderid,
          "Batch_id": resp,
          "TxnID": transactionid,
          "Status": "ORDER_UPDATED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing Required Inputs"
    });
  }
});

app.post('/cancelorder', authenticateJWT, (req, res) => {
  if (req.body.orderid && req.body.userpbkey && req.body.userpvkey) {
    var orderdata = {};
    var orderid = req.body.orderid;
    orderdata['orderid'] = orderid;
    var data = `{"action":"CANCEL_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {

      var batch_id_data = JSON.parse(result.body);
      //console.log(batch_id_data);
      if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "order_id": orderid,
          "Batch_id": resp,
          "TxnID": transactionid,
          "Status": "ORDER_CANCELLED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing Required Inputs"
    });
  }
});

app.post('/getOrder', authenticateJWT, (req, res) => {
  if (req.body.orderid) {
    var orderid = req.body.orderid;
    axios.get('http://localhost:8008/state/' + orderid).then((response) => {
      var orderbase = response.data.data;
      let buff = new Buffer(orderbase, 'base64');
      let orderdata = buff.toString('ascii');
      var orderjdata = JSON.parse(orderdata);
      res.send({
        "Status": "ORDER_EXIST",
        "ORDER_DATA": orderjdata
      })

    }).
    catch((error) => {
      res.send({
        "Status": "ORDER_NOTEXISTS",
        "ErrorMessage": error
      })
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing Required Inputs"
    })
  }
});

app.post('/getUser', authenticateJWT, (req, res) => {
  if (req.body.userid) {
    var userid = req.body.userid;
    axios.get('http://localhost:8008/state/' + userid).then((response) => {
      var userbase = response.data.data;
      let buff = new Buffer(userbase, 'base64');
      let userdata = buff.toString('ascii');
      var userjdata = JSON.parse(userdata);
      res.send({
        "Status": "USER_EXIST",
        "USER_DATA": userjdata
      })

    }).
    catch((error) => {
      res.send({
        "Status": "USER_NOT_EXISTS",
        "ErrorMessage": error
      })
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing Required Details"
    })
  }
});
app.post('/starttrade', authenticateJWT, (req, res) => {
  if (req.body.orderid && req.body.userpbkey && req.body.userpvkey) {
    var orderdata = {};
    var sysdate = Date.now()
    orderdata["trade_s_timestamp"] = sysdate;
    // orderdata["PROC_METER_READING_S"]=req.body.PROC_METER_READING_S;
    // orderdata["CONS_METER_READING_S"]=req.body.CONS_METER_READING_S;
    orderdata['orderid'] = req.body.orderid;

    var data = `{"action":"START_TRADE","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {

      var batch_id_data = JSON.parse(result.body);
      //console.log(batch_id_data);
      if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "order_id": req.body.orderid,
          "Batch_id": resp,
          "TxnID": transactionid,
          "Status": "TRADE_STARTED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing required Inputs"
    });
  }
});

app.post('/endtrade', authenticateJWT, (req, res) => {
  if (req.body.orderid && req.body.userpbkey && req.body.userpvkey) {
    var orderdata = {};
    var sysdate = Date.now()
    orderdata["trade_e_timestamp"] = sysdate;
    // orderdata["PROC_METER_READING_E"]=req.body.PROC_METER_READING_E;
    // orderdata["CONS_METER_READING_E"]=req.body.CONS_METER_READING_E;
    orderdata['orderid'] = req.body.orderid;;

    var data = `{"action":"END_TRADE","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {

      var batch_id_data = JSON.parse(result.body);
      //console.log(batch_id_data);
      if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "order_id": req.body.orderid,
          "Batch_id": resp,
          "TxnID": transactionid,
          "Status": "TRADE_ENDED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing required Inputs"
    });
  }
});

app.post('/validatetrade', authenticateJWT, (req, res) => {
  if (req.body.orderid && req.body.userpbkey && req.body.userpvkey) {
    var orderdata = {};
    orderdata['orderid'] = req.body.orderid;;
    var data = `{"action":"VALIDATE_TRADE","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function(err, result, transactionid) {

      var batch_id_data = JSON.parse(result.body);
      // console.log(batch_id_data);
      if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({
          "order_id": req.body.orderid,
          "Batch_id": resp,
          "TxnID": transactionid,
          "Status": "ORDER_VALIDATED"
        });
      } else {
        res.send({
          "Status": "ERROR",
          "ErrorMessage": batch_id_data.error
        });
      }
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing required Inputs"
    });
  }
});

app.post('/createuser', (req, res) => {
  if (req.body.username && req.body.HWInfo && req.body.url && req.body.phonenumber) {
    var user = {};
    user = createUser();
    var userdata = {};
    var sysdate = Date.now()
    var UserID = 'fe9d87' + crypto.createHash('sha512').update(req.body.phonenumber).digest('hex').toLowerCase().substring(0, 64);
    axios.get('http://localhost:8008/state/' + UserID).then((response) => {
      var userbase = response.data.data;
      let buff = new Buffer(userbase, 'base64');
      let userdata = buff.toString('ascii');
      var userjdata = JSON.parse(userdata);
      res.send({
        "Status": "USER_ALEADY_EXIST",
        "USER_DATA": userjdata
      })

    }).
    catch((error) => {

      userdata["CREATED_TIMESTAMP"] = sysdate;
      userdata["UserID"] = UserID;
      userdata["username"] = req.body.username;
      userdata["HWInfo"] = req.body.HWInfo;
      userdata["url"] = req.body.url;
      userdata["phonenumber"] = req.body.phonenumber;
      var data = `{"action":"CREATE_USER","data":${JSON.stringify(userdata)}}`;
      var payload = JSON.parse(data);

      sendRequest(payload, user.publickey, user.privatekey, function(err, result, transactionid) {

        var batch_id_data = JSON.parse(result.body);
        //  console.log(batch_id_data);
        if (batch_id_data.link) {
          var pos = batch_id_data.link.search("id=");
          var resp = batch_id_data.link.substring(pos + 3);
          res.send({
            "User_ID": UserID,
            "publickey": user.publickey,
            "privatekey": user.privatekey,
            "Batch_ID": resp,
            "TxnID": transactionid,
            "Status": "USER_CREATED"
          });
        } else {
          res.send({
            "Status": "ERROR",
            "ErrorMessage": batch_id_data.error
          });
        }
      });
    });
  } else {
    res.send({
      "Status": "ERROR",
      "ErrorMessage": "Missing required Inputs"
    });
  }
});


app.post('/agent/fetchTransactionData', (req, res) => {
  if (req.body.orderid && req.body.userpbkey && req.body.userpvkey) {
    var meterid = req.body.meterid;
    var timestamp = req.body.timestamp;
    var readings;

    if (meterid == '3' && timestamp == "2019-10-28 07:00:00") {
      readings = 100
      res.send({
        "readings": readings
      });
    } else if (meterid == '1' && timestamp == "2019-10-28 07:00:00") {
      readings = 200
      res.send({
        "readings": readings
      });
    } else if (meterid == '3' && timestamp == "2019-10-28 08:00:00") {
      readings = 500
      res.send({
        "readings": readings
      });
    } else if (meterid == '1' && timestamp == "2019-10-28 08:00:00") {
      readings = 600
      res.send({
        "readings": readings
      });
    }

  } else {
    res.send({
      "readings": 0
    });
  }
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(6380);
httpsServer.listen(6381);