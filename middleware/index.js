  var express = require('express');
  var http = require('http');
  var https = require('https');
  var fs = require('fs');
  var bodyParser = require('body-parser');
  const app = express();
  app.use(bodyParser.json());
  var { sendRequest } = require('./submitrequest');
  var { createUser } = require('./createuser');
  const crypto = require("crypto");
  const axios = require('axios');
  const jwt = require('jsonwebtoken');
  const accessTokenSecret = 'peer2peertradingsecret';
  var privateKey  = fs.readFileSync('selfsigned.key', 'utf8');
  var certificate = fs.readFileSync('selfsigned.crt', 'utf8');
  var credentials = {key: privateKey, cert: certificate};


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
      if(userjdata){
        const accessToken = jwt.sign({ userid:userid }, accessTokenSecret);
        res.json({
          accessToken
      });
      }
    }).
      catch((error) => {
        res.send({ "Status": "USER_NOT_EXISTS", "ErrorMessage": error })
      });

  });





  app.post('/createorderdr',authenticateJWT, (req, res) => {

      var orderdata = {};
    var sysdate = Date.now()
    if (req.body.createdTS  && req.body.startTS   && req.body.plannedQuantity  && req.body.buyerUserId &&
      req.body.buyerDevice  && req.body.sellers   &&  req.body.userpbkey  && req.body.userpvkey && req.body.price)
      {
    orderdata["createdTS"] = req.body.createdTS;
    orderdata["startTS"] =  req.body.startTS;
    orderdata["endTS"] =  req.body.endTS;
    orderdata["price"] =  req.body.price;
    orderdata["plannedQuantity"] = req.body.plannedQuantity;
    orderdata["buyerUserId"] = req.body.buyerUserId;
    orderdata["buyerDevice"] = req.body.buyerDevice;
    orderdata["eventStatus"] = "LOCKED";
    orderdata["buyerNetMeterReading_s"] = 0;
    orderdata["buyerNetMeterReading_e"] = 0;
    orderdata["buyerFine"] = 0;
    orderdata["sellers"] = req.body.sellers;
    var data = `{"action":"CREATE_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    var orderid = 'c19056' + crypto.createHash('sha512').update(req.body.buyerUserId + req.body.createdTS).digest('hex').toLowerCase().substring(0, 64);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function (err, result, transactionid) {
        var batch_id_data = JSON.parse(result.body);
        if (batch_id_data.link) {
        //console.log(batch_id_data);
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({ "order_id": orderid, "Batch_id": resp, "TxnID": transactionid, "status": "ORDER_CREATED" });
      }
      else {
        res.send({ "Status": "ERROR", "ErrorMessage": batch_id_data.error });
      }
    });
  }
    else{
      res.send({ "Status": "ERROR", "ErrorMessage": "Missing Required Inputs"});
    }

});



  app.post('/getOrder',authenticateJWT, (req, res) => {
    if(req.body.orderid){
    var orderid = req.body.orderid;
    axios.get('http://localhost:8008/state/' + orderid).then((response) => {
      var orderbase = response.data.data;
      let buff = new Buffer(orderbase, 'base64');
      let orderdata = buff.toString('ascii');
      var orderjdata = JSON.parse(orderdata);
      res.send({ "Status": "ORDER_EXIST", "ORDER_DATA": orderjdata })

    }).
      catch((error) => {
        res.send({ "Status": "ORDER_NOTEXISTS", "ErrorMessage": error })
      });
    }
    else{
      res.send({ "Status": "ERROR", "ErrorMessage": "Missing Required Inputs" })
    }
  });

  app.post('/getUser',authenticateJWT, (req, res) => {
    if(req.body.userid){
    var userid = req.body.userid;
    axios.get('http://localhost:8008/state/' + userid).then((response) => {
      var userbase = response.data.data;
      let buff = new Buffer(userbase, 'base64');
      let userdata = buff.toString('ascii');
      var userjdata = JSON.parse(userdata);
      res.send({ "Status": "USER_EXIST", "USER_DATA": userjdata })

    }).
      catch((error) => {
        res.send({ "Status": "USER_NOT_EXISTS", "ErrorMessage": error })
      });
    }
    else{
      res.send({ "Status": "ERROR", "ErrorMessage": "Missing Required Details" })
    }
  });
  app.post('/starttradedr',authenticateJWT, (req, res) => {
    if(req.body.orderid  && req.body.userpbkey  && req.body.userpvkey){
    var orderdata = {};
    orderdata['orderid'] = req.body.orderid;
    var data = `{"action":"START_TRADE","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function (err, result, transactionid) {

        var batch_id_data = JSON.parse(result.body);
        //console.log(batch_id_data);
        if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({ "order_id": req.body.orderid, "Batch_id": resp, "TxnID": transactionid, "Status": "TRADE_STARTED" });
      }
      else {
        res.send({ "Status": "ERROR", "ErrorMessage": batch_id_data.error });
      }
    });
  }
  else{
    res.send({ "Status": "ERROR", "ErrorMessage": "Missing required Inputs" });
  }
  });

  app.post('/endtradedr',authenticateJWT, (req, res) => {
    if(req.body.orderid  && req.body.userpbkey  && req.body.userpvkey){
    var orderdata = {};
    // orderdata["PROC_METER_READING_E"]=req.body.PROC_METER_READING_E;
    // orderdata["CONS_METER_READING_E"]=req.body.CONS_METER_READING_E;
    orderdata['orderid'] = req.body.orderid;;

    var data = `{"action":"END_TRADE","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function (err, result, transactionid) {

        var batch_id_data = JSON.parse(result.body);
        //console.log(batch_id_data);
        if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({ "order_id": req.body.orderid, "Batch_id": resp, "TxnID": transactionid, "Status": "TRADE_ENDED" });
      }
      else {
        res.send({ "Status": "ERROR", "ErrorMessage": batch_id_data.error });
      }
    });
  }
  else{
    res.send({ "Status": "ERROR", "ErrorMessage": "Missing required Inputs" });
  }
  });

  app.post('/validatetrade',authenticateJWT, (req, res) => {
    if(req.body.orderid  && req.body.userpbkey  && req.body.userpvkey){
    var orderdata = {};
    orderdata['orderid'] = req.body.orderid;;
    var data = `{"action":"VALIDATE_TRADE","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload, req.body.userpbkey, req.body.userpvkey, function (err, result, transactionid) {

        var batch_id_data = JSON.parse(result.body);
      // console.log(batch_id_data);
      if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({ "order_id": req.body.orderid, "Batch_id": resp, "TxnID": transactionid, "Status": "ORDER_VALIDATED" });
      }
      else {
        res.send({ "Status": "ERROR", "ErrorMessage": batch_id_data.error });
      }
    });
  }else{
    res.send({ "Status": "ERROR", "ErrorMessage": "Missing required Inputs" });
  }
  });

  app.post('/createuser', (req, res) => {
    if(req.body.username  && req.body.HWInfo  && req.body.url && req.body.phonenumber){
    var user = {};
    user = createUser();
    var userdata = {};
    var sysdate = Date.now()
    var UserID = 'fe9d87' + crypto.createHash('sha512').update(req.body.phonenumber).digest('hex').toLowerCase().substring(0, 64);
    axios.get('http://localhost:8008/state/'+UserID).then((response) => {
      var userbase = response.data.data;
      let buff = new Buffer(userbase, 'base64');
      let userdata = buff.toString('ascii');
      var userjdata = JSON.parse(userdata);
      res.send({ "Status": "USER_ALEADY_EXIST", "USER_DATA": userjdata })

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

    sendRequest(payload, user.publickey, user.privatekey, function (err, result, transactionid) {

        var batch_id_data = JSON.parse(result.body);
      //  console.log(batch_id_data);
        if (batch_id_data.link) {
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos + 3);
        res.send({ "User_ID": UserID, "publickey": user.publickey, "privatekey": user.privatekey, "Batch_ID": resp, "TxnID": transactionid, "Status": "USER_CREATED" });
      }
      else {
        res.send({ "Status": "ERROR", "ErrorMessage": batch_id_data.error });
      }
    });
  });
    }
    else{
      res.send({ "Status": "ERROR", "ErrorMessage": "Missing required Inputs" });
    }
  });


  var httpServer = http.createServer(app);
  var httpsServer = https.createServer(credentials, app);

  httpServer.listen(6380);
  httpsServer.listen(6381);
