// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.6.2;

contract SustainImpact{
    
    uint private id = 0;
    
    struct HWInfo{
        string deviceId;
        uint meterId;
    }
    
    struct Users{
        uint userId;
        address userAddress;
        string username;
        string url;
        uint phoneNumber;
        uint hwCount;
        mapping (uint => HWInfo) hwInfo;
    }
    
    struct Order{
        address userAddress;
        uint unit;
        uint energy;
        string timeFrom;
        string timeTo;
        string deviceId;
        string location;
        uint amountOfPower;
        uint price;
        address buyerAddress;
        string buyerDeviceId;
        string status;
    }
    
    struct Trade{
        string tradeStatus;
        uint sellersMeterReading_S;
        uint buyersMeterReading_S;
        uint sellersMeterReading_E;
        uint buyersMeterReading_E;
        uint tradeStartTime;
        uint tradeEndTime;
        uint sellerFine;
        uint buyerFine;
    }
    
    uint[] public orderId;
    
    mapping (address => Users) users;
    mapping (uint => Order) orders;
    mapping (uint => Trade) trades;
    
    
    event NewOrderId(uint indexed _orderId);
    
    constructor() public{
        
    }
    
    function createUser(string memory _username, string memory _url, uint _phoneNumber, string memory _deviceId1, uint _meterId1, string memory _deviceId2, uint _meterId2) public{
       id += 1;
       users[msg.sender].userAddress = msg.sender;
       users[msg.sender].userId = id;
       users[msg.sender].username = _username;
       users[msg.sender].url = _url;
       users[msg.sender].phoneNumber = _phoneNumber;
       users[msg.sender].hwInfo[1].deviceId = _deviceId1;
       users[msg.sender].hwInfo[1].meterId = _meterId1;
       users[msg.sender].hwInfo[2].deviceId = _deviceId2;
       users[msg.sender].hwInfo[2].meterId = _meterId2;
       users[msg.sender].hwCount = 2;
    }
    
    function updateUser(address _userAddress, string memory _username, string memory _url, uint _phoneNumber, string memory _deviceId1, uint _meterId1, string memory _deviceId2, uint _meterId2) public{
       require(msg.sender == users[_userAddress].userAddress);
       users[msg.sender].username = _username;
       users[msg.sender].url = _url;
       users[msg.sender].phoneNumber = _phoneNumber;
       users[msg.sender].hwInfo[1].deviceId = _deviceId1;
       users[msg.sender].hwInfo[1].meterId = _meterId1;
       users[msg.sender].hwInfo[2].deviceId = _deviceId2;
       users[msg.sender].hwInfo[2].meterId = _meterId2;
       users[msg.sender].hwCount = 2;
        
    }
    
    function getUser(address _userAddress) public view returns(string memory _username, string memory _url, uint _phoneNumber, string[] memory _deviceId, uint[] memory _meterId){
        _deviceId = new string[](users[_userAddress].hwCount);
        _meterId = new uint[](users[_userAddress].hwCount);
        
        _username = users[_userAddress].username;
        _url = users[_userAddress].url;
        _phoneNumber = users[_userAddress].phoneNumber;
        uint index = 0;
        for(uint i = 1; i <= users[_userAddress].hwCount; i++){
            _deviceId[index] = users[_userAddress].hwInfo[i].deviceId;
            _meterId[index] = users[_userAddress].hwInfo[i].meterId;
            index++;
        }
        return (_username, _url, _phoneNumber, _deviceId, _meterId);
    }
    
    function createOrder(uint _unit, uint _energy, string memory _timeFrom, string memory _timeTo, string memory _deviceId, string memory _location, uint _amountOfPower, uint _price) public returns(bool){
        
        uint _orderId = uint(keccak256(abi.encodePacked(now)));
        orderId.push(_orderId);
        orders[_orderId].userAddress = msg.sender;
        orders[_orderId].unit = _unit;
        orders[_orderId].energy = _energy;
        orders[_orderId].timeFrom = _timeFrom;
        orders[_orderId].timeTo = _timeTo;
        orders[_orderId].deviceId = _deviceId;
        orders[_orderId].location = _location;
        orders[_orderId].amountOfPower = _amountOfPower;
        orders[_orderId].price = _price;
        orders[_orderId].status = "Created";
        emit NewOrderId(_orderId);
        return true;
    }
    
    function getOrderId() public view returns(uint[] memory _orderId){
        return orderId;
    }
    
    function getOrder(uint _orderId) public view returns(address _userAddress, uint _unit, uint _energy, string memory _timeFrom, string memory _timeTo, string memory _deviceId, string memory _location, uint _amountOfPower, uint _price, address _buyerAddress, string memory _buyerDeviceId, string memory _status){
        
        _userAddress = orders[_orderId].userAddress;
        _unit = orders[_orderId].unit;
        _energy = orders[_orderId].energy;
        _timeFrom = orders[_orderId].timeFrom;
        _timeTo = orders[_orderId].timeTo;
        _deviceId = orders[_orderId].deviceId;
        _location = orders[_orderId].location;
        _amountOfPower = orders[_orderId].amountOfPower;
        _price = orders[_orderId].price;
        _buyerAddress = orders[_orderId].buyerAddress;
        _buyerDeviceId = orders[_orderId].buyerDeviceId;
        _status = orders[_orderId].status;
        
        return (_userAddress, _unit, _energy, _timeFrom, _timeTo, _deviceId, _location, _amountOfPower, _price, _buyerAddress, _buyerDeviceId, _status);
    }
    
    function updateOrder(uint _orderId, uint _unit, uint _energy, string memory _timeFrom, string memory _timeTo, string memory _deviceId, string memory _location, uint _amountOfPower, uint _price) public{
        require(orders[_orderId].userAddress == msg.sender, "You are not creator of this order");
        
        orders[_orderId].userAddress = msg.sender;
        orders[_orderId].unit = _unit;
        orders[_orderId].energy = _energy;
        orders[_orderId].timeFrom = _timeFrom;
        orders[_orderId].timeTo = _timeTo;
        orders[_orderId].deviceId = _deviceId;
        orders[_orderId].location = _location;
        orders[_orderId].amountOfPower = _amountOfPower;
        orders[_orderId].price = _price;
    }
    
    function acceptOrder(uint _orderId, string memory _buyerDeviceId) public returns(string memory ){
        require(orders[_orderId].userAddress != msg.sender, "You are creator of this order");
        require(keccak256(abi.encodePacked((orders[_orderId].status))) != keccak256(abi.encodePacked(("Accepted"))), "Order is already accepted ");
        require(keccak256(abi.encodePacked((orders[_orderId].status))) != keccak256(abi.encodePacked(("Cancled"))), "Order is Cancled ");

        string memory _msg = "Order Accepted";
        orders[_orderId].buyerAddress = msg.sender;
        orders[_orderId].buyerDeviceId = _buyerDeviceId;
        orders[_orderId].status = "Accepted";
        return _msg;
    }
    
    function cancleOrder(uint _orderId) public returns(string memory){
        require(orders[_orderId].userAddress == msg.sender, "You are not creator of this order");
        
        string memory _msg = "Order Cancled";
        orders[_orderId].status = "Cancled";
        return _msg;
    }
    
    function deleteOrder(uint _orderId) public{
        require(orders[_orderId].userAddress == msg.sender, "You are not creator of this order");
        require(keccak256(abi.encodePacked((orders[_orderId].status))) != keccak256(abi.encodePacked(("Created"))), "Order is already accepted ");
        orders[_orderId].status = "Deleted";
    }
    
    function startTrading(uint _orderId, uint _sellerMeterReading, uint _buyerMeterReading) public {
        require(orders[_orderId].userAddress == msg.sender, "You are not creator of this order");
        require(keccak256(abi.encodePacked((orders[_orderId].status))) == keccak256(abi.encodePacked(("Accepted"))), "Order is not created yet. ");
        
        trades[_orderId].tradeStatus = "Initiated";
        trades[_orderId].sellersMeterReading_S = _sellerMeterReading;
        trades[_orderId].buyersMeterReading_S = _buyerMeterReading;
        trades[_orderId].tradeStartTime = now;

    }
    
    function endTrading(uint _orderId, uint _sellerMeterReading, uint _buyerMeterReading) public {
        require(orders[_orderId].userAddress == msg.sender, "You are not creator of this order");
        require(keccak256(abi.encodePacked((trades[_orderId].tradeStatus))) == keccak256(abi.encodePacked(("Initiated"))), "Trade is not started yet. ");
        
        trades[_orderId].tradeStatus = "Close";
        trades[_orderId].sellersMeterReading_E = _sellerMeterReading;
        trades[_orderId].buyersMeterReading_E = _buyerMeterReading;
        trades[_orderId].tradeEndTime = block.timestamp;
    }
    
    function validateTrade(uint _orderId, uint _sellerFine, uint _buyerFine) public{
        require(keccak256(abi.encodePacked((trades[_orderId].tradeStatus))) == keccak256(abi.encodePacked(("Close"))), "Trade is not ended yet. ");

        trades[_orderId].tradeStatus = "Order Validated";
        trades[_orderId].sellerFine = _sellerFine;
        trades[_orderId].buyerFine = _buyerFine;
    }
    
    function getTradeDetails(uint _orderId) public view returns(string memory _tradeStatus, uint _sellerMeterReading_S, uint _buyerMeterReading_S, uint _sellerMeterReading_E, uint _buyerMeterReading_E, uint _tradeStart, uint _tradeEnd, uint _sellerFine, uint _buyerFine){
        
        _tradeStatus = trades[_orderId].tradeStatus;
        _sellerMeterReading_S = trades[_orderId].sellersMeterReading_S;
        _buyerMeterReading_S = trades[_orderId].buyersMeterReading_S;
        _sellerMeterReading_E = trades[_orderId].sellersMeterReading_E;
        _buyerMeterReading_E = trades[_orderId].buyersMeterReading_E;
        _tradeStart = trades[_orderId].tradeStartTime;
        _tradeEnd = trades[_orderId].tradeEndTime;
        _sellerFine = trades[_orderId].sellerFine;
        _buyerFine = trades[_orderId].buyerFine;
        
        return(_tradeStatus, _sellerMeterReading_S, _buyerMeterReading_S, _sellerMeterReading_E, _buyerMeterReading_E, _tradeStart, _tradeEnd, _sellerFine, _buyerFine);
        
    }
}