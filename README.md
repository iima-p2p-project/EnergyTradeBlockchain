Deployment Instructions

Postman Link :
https://www.getpostman.com/collections/c1079d0c417a562046c0

    1. Install Docker ,node.js, git,docker-compose  in the Ubuntu Machine
    2. Install forever using npm install -g forever
    3. Pull the repo
    4. Run  sudo docker-compose -f  network.yaml up -d
    5.cd contract/contract/
    6. npm install
    5. Go to Repo/contract/  and run  forever start  index.js  tcp://localhost:4004
    6. Go to Repo/contract/  and run  forever start  index.js  tcp://localhost:4005
    7. Go to Repo/contract/  and run  forever start  index.js  tcp://localhost:4006
    8. Go to Repo/contract/  and run  forever start  index.js  tcp://localhost:4007
    9. Go to Repo/contract/  and run  forever start  index.js  tcp://localhost:4008
    10.  Go to Repo/middleware and run npm install  
    11.  Go to Repo/middleware and run forever start index.js
    12. Check whether all services are running by executing command forever list



Access the Middleware host:6380 for http , host:6381 for https
