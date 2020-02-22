var express =require('express');
var bodyParser=require('body-parser');
const app=express();
app.use(bodyParser.json());
var {sendRequest}=require('./submitrequest');
var {createUser}=require('./createuser');
const crypto = require("crypto");
const axios=require('axios');




app.post('/createorder',(req,res) => {

var orderdata={};
var sysdate=Date.now()
orderdata["CREATED_TIMESTAMP"]=sysdate;
orderdata["Seller_UserID"]=req.body.userid;
orderdata["Buyer_UserID"]="";
orderdata["Accepted_TIMESTAMP"]="";
orderdata["ORDER_STATUS"]="CREATED";
orderdata["UNITS"]=req.body.units;
orderdata["TIME_FROM"]=req.body.time_from;
orderdata["TIME_TO"]=req.body.time_to;
orderdata["LOCATION"]=req.body.location;
orderdata["AMOUNT_OF_POWER"]=req.body.amount_of_power;
orderdata["PRICE"]=req.price;
orderdata["TRADE_S_TIMESTAMP"]="";
orderdata["TRADE_C_TIMESTAMP"]="";
orderdata["TRADE_STATUS"]="Not Intiated"
orderdata["PROC_METER_READING_S"]=0;
orderdata["PROC_METER_READING_E"]=0;
orderdata["CONS_METER_READING_S"]=0;
orderdata["CONS_METER_READING_E"]=0;
orderdata["B_FINE"]=0;
orderdata["C_FINE"]=0;
var data= `{"action":"CREATE_ORDER","data":${JSON.stringify(orderdata)}}`;
var payload = JSON.parse(data);
var orderid='fe9d87'+ crypto.createHash('sha512').update(req.body.userid+sysdate).digest('hex').toLowerCase().substring(0, 64);
sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
  if (!err){
var batch_id_data=JSON.parse(result.body);
console.log(batch_id_data);
  var pos = batch_id_data.link.search("id=");
  var resp = batch_id_data.link.substring(pos+3);
   res.send({"order_id":orderid,"Batch_id":resp,"TxnID":transactionid,"status":"ORDER_CREATED"});
  }
  else{
    res.send({"Status":"ERROR","ErrorMessage":err});
  }
});
   });

app.post('/acceptorder',(req,res) => {

    var orderdata={};
    var sysdate=Date.now()
    orderdata["buyeruserid"]=req.body.buyeruserid;
    orderdata["buyeracctimestamp"]=sysdate;
    orderdata["orderid"]=req.body.orderid;
    var data= `{"action":"ACCEPT_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
      if (!err){
    var batch_id_data=JSON.parse(result.body);
    console.log(batch_id_data);
      var pos = batch_id_data.link.search("id=");
      var resp = batch_id_data.link.substring(pos+3);
       res.send({"Batch_id":resp,"TxnID":transactionid,"status":"ORDER_ACCEPTED"});
      }
      else{
        res.send({"Status":"ERROR","ErrorMessage":err});
      }
    });
       });
app.post('/updateorder',(req,res) => {
    var orderdata={};
    var newupdatedorderdata={};
    var sysdate=Date.now()
    newupdatedorderdata["CREATED_TIMESTAMP"]=sysdate;
    newupdatedorderdata["Seller_UserID"]=req.body.userid;
    newupdatedorderdata["Buyer_UserID"]="";
    newupdatedorderdata["Accepted_TIMESTAMP"]="";
    newupdatedorderdata["ORDER_STATUS"]="CREATED";
    newupdatedorderdata["UNITS"]=req.body.units;
    newupdatedorderdata["TIME_FROM"]=req.body.time_from;
    newupdatedorderdata["TIME_TO"]=req.body.time_to;
    newupdatedorderdata["LOCATION"]=req.body.location;
    newupdatedorderdata["AMOUNT_OF_POWER"]=req.body.amount_of_power;
    newupdatedorderdata["PRICE"]=req.price;
    newupdatedorderdata["TRADE_S_TIMESTAMP"]="";
    newupdatedorderdata["TRADE_C_TIMESTAMP"]="";
    newupdatedorderdata["TRADE_STATUS"]="Not Intiated"
    newupdatedorderdata["PROC_METER_READING_S"]=0;
    newupdatedorderdata["PROC_METER_READING_E"]=0;
    newupdatedorderdata["CONS_METER_READING_S"]=0;
    newupdatedorderdata["CONS_METER_READING_E"]=0;
    newupdatedorderdata["B_FINE"]=0;
    newupdatedorderdata["C_FINE"]=0;
    var orderid=req.body.orderid;
    orderdata['orderid']=orderid;
    orderdata['newupdatedorderdata']=newupdatedorderdata;
    
    var data= `{"action":"UPDATE_ORDER","data":${JSON.stringify(orderdata)}}`;
    var payload = JSON.parse(data);
    sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
      if (!err){
      var batch_id_data=JSON.parse(result.body);
    console.log(batch_id_data);
      var pos = batch_id_data.link.search("id=");
      var resp = batch_id_data.link.substring(pos+3);
       res.send({"order_id":orderid,"Batch_id":resp,"TxnID":transactionid,"Status":"ORDER_UPDATED"});
      }
      else{
        res.send({"Status":"ERROR","ErrorMessage":err});
      }
    });
       });
    
app.post('/cancelorder',(req,res) => {
        var orderdata={};
        var orderid=req.body.orderid;
        orderdata['orderid']=orderid;
        var data= `{"action":"CANCEL_ORDER","data":${JSON.stringify(orderdata)}}`;
        var payload = JSON.parse(data);
        sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
          if (!err){
          var batch_id_data=JSON.parse(result.body);
        console.log(batch_id_data);
          var pos = batch_id_data.link.search("id=");
          var resp = batch_id_data.link.substring(pos+3);
            res.send({"order_id":orderid,"Batch_id":resp,"TxnID":transactionid,"Status":"ORDER_CANCELLED"});
          }
          else{
            res.send({"Status":"ERROR","ErrorMessage":err});
          }
        });
            });

app.post('/getOrder',(req,res) => {
    var orderid=req.body.orderid;
    axios.get('http://localhost:8008/state/'+orderid).then((response) => {
      var orderbase=response.data.data;
      let buff = new Buffer(orderbase, 'base64');
      let orderdata = buff.toString('ascii');
      var orderjdata=JSON.parse(orderdata);
      res.send({"Status":"ORDER_EXIST","ORDER_DATA":orderjdata})

    }).
    catch((error) => {
      res.send({"Status":"ORDER_NOTEXISTS","ErrorMessage":error})
    });

    });

app.post('/getUser',(req,res) => {
      var userid=req.body.userid;
      axios.get('http://localhost:8008/state/'+userid).then((response) => {
        var userbase=response.data.data;
        let buff = new Buffer(userbase, 'base64');
        let userdata = buff.toString('ascii');
        var userjdata=JSON.parse(userdata);
        res.send({"Status":"USER_EXIST","USER_DATA":userjdata})
  
      }).
      catch((error) => {
        res.send({"Status":"USER_NOT_EXISTS","ErrorMessage":error})
      });
  
      });
app.post('/starttrade',(req,res) => {
      var orderdata={};
      var sysdate=Date.now()
      orderdata["trade_s_timestamp"]=sysdate;
      orderdata["PROC_METER_READING_S"]=req.body.PROC_METER_READING_S;
      orderdata["CONS_METER_READING_S"]=req.body.CONS_METER_READING_S;
      orderdata['orderid']=req.body.orderid;;
      
      var data= `{"action":"START_TRADE","data":${JSON.stringify(orderdata)}}`;
      var payload = JSON.parse(data);
      sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
        if (!err){
        var batch_id_data=JSON.parse(result.body);
      console.log(batch_id_data);
        var pos = batch_id_data.link.search("id=");
        var resp = batch_id_data.link.substring(pos+3);
          res.send({"order_id":orderid,"Batch_id":resp,"TxnID":transactionid,"Status":"TRADE_STARTED"});
        }
        else{
          res.send({"Status":"ERROR","ErrorMessage":err});
        }
      });
          });
      
app.post('/endtrade',(req,res) => {
  var orderdata={};
  var sysdate=Date.now()
  orderdata["trade_e_timestamp"]=sysdate;
  orderdata["PROC_METER_READING_E"]=req.body.PROC_METER_READING_E;
  orderdata["CONS_METER_READING_E"]=req.body.CONS_METER_READING_E;
  orderdata['orderid']=req.body.orderid;;
  
  var data= `{"action":"END_TRADE","data":${JSON.stringify(orderdata)}}`;
  var payload = JSON.parse(data);
  sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
    if (!err){
    var batch_id_data=JSON.parse(result.body);
  console.log(batch_id_data);
    var pos = batch_id_data.link.search("id=");
    var resp = batch_id_data.link.substring(pos+3);
      res.send({"order_id":orderid,"Batch_id":resp,"TxnID":transactionid,"Status":"TRADE_STARTED"});
    }
    else{
      res.send({"Status":"ERROR","ErrorMessage":err});
    }
  });
      });
  
app.post('/validatetrade',(req,res) => {
  var orderdata={};
  orderdata['orderid']=req.body.orderid;;
  var data= `{"action":"VALIDATE_TRADE","data":${JSON.stringify(orderdata)}}`;
  var payload = JSON.parse(data);
  sendRequest(payload,req.body.userpbkey,req.body.userpvkey,function(err,result,transactionid){
    if (!err){
    var batch_id_data=JSON.parse(result.body);
  console.log(batch_id_data);
    var pos = batch_id_data.link.search("id=");
    var resp = batch_id_data.link.substring(pos+3);
      res.send({"order_id":orderid,"Batch_id":resp,"TxnID":transactionid,"Status":"ORDER_VALIDATED"});
    }
    else{
      res.send({"Status":"ERROR","ErrorMessage":err});
    }
  });
      });

app.post('/createuser',(req,res) => {
      var user={};
      user=createUser();
      var userdata={};
var sysdate=Date.now()
userdata["CREATED_TIMESTAMP"]=sysdate;
userdata["UserID"]=user.publickey;
userdata["username"]=req.body.username;
userdata["HWInfo"]=req.body.HWInfo;
var data= `{"action":"CREATE_USER","data":${JSON.stringify(userdata)}}`;
var payload = JSON.parse(data);
var UserID='fe9d87'+ crypto.createHash('sha512').update(user.publickey).digest('hex').toLowerCase().substring(0, 64);
sendRequest(payload,user.publickey,user.privatekey,function(err,result,transactionid){
  if (!err){
  var batch_id_data=JSON.parse(result.body);
console.log(batch_id_data);
  var pos = batch_id_data.link.search("id=");
  var resp = batch_id_data.link.substring(pos+3);
   res.send({"User_ID":UserID,"publickey":user.publickey,"privatekey":user.privatekey,"Batch_ID":resp,"TxnID":transactionid,"Status":"USER_CREATED"});
  }
  else{
    res.send({"Status":"ERROR","ErrorMessage":err});
  }
});

        });

app.listen(6380);
