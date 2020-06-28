
forever stopall
cd contract/contract/
forever start  index.js  tcp://localhost:4004
forever start  index.js  tcp://localhost:4005
forever start  index.js  tcp://localhost:4006
forever start  index.js  tcp://localhost:4007
forever start  index.js  tcp://localhost:4008
cd ../../middleware/
forever start index.js
forever list
