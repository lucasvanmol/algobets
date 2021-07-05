# AlgoBets Frontend

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Configuration
You can configure the `.env` file to change the ledger type (MainNet, TestNet, or even a local sandbox, if you have configured it in AlgoSigner).

The creator address is the admin address which has been used to deploy applications. You can use the address provided to see some examples of how published dapps look like, or you can provide your own address and create your own dapps with that address instead.

Since all api calls are actually just calls from AlgoSigner, there is no need for a backend. You can just call `npm run serve` and interact with the blockchain, as long as the creator address has created some applications.
