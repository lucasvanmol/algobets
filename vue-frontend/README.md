# AlgoBets Frontend

You can check out the frontend running here: https://lucasvanmol.github.io/algobets/, or if you want to run it locally you can follow these instructions:

## Project setup
```
npm install
```

### Serve on localhost w/ hot-reload
```
npm run serve
```

### Building for production
```
npm run build
```

### Configuration

You can configure the `.env` file to change the ledger type (MainNet, TestNet, or even a local sandbox, if you have configured it in AlgoSigner).

The creator address is the admin address which has been used to deploy applications. You can use the address provided to see some examples of how published dapps look like, or you can provide your own address and create your own dapps with that address instead.

Since all api calls are actually just calls from AlgoSigner, there is no need for a backend. You can just call `npm run serve` and interact with the blockchain, as long as the creator address has created some applications.
