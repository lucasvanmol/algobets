# AlgoBets

## Overview
This project contains three parts:
* A stateful and stateless smart contracts in `./TEAL`, these are the DApps deployed on the Algorand blockchain and the central part of the project
* A python admin CLI that can be used to deploy, update, and delete these programs in ./admin
* A frontend made with Vue, that uses the AlgoSigner extension to interact with the DApps on the blockchain

## Frontend

You can check out the frontend running here: https://lucasvanmol.github.io/algobets/

You can also run it locally by navigating to the `vue-frontend` directory and using:
```
npm install
npm run serve
```

**Please note that this project has not been audited for security, and is intended for instructional use only. It should not be used in a production environment.**
