# admin.py

For deploying and updating the dapp.

## Setup

First, install the required dependencies with pip:

```
pip install -r requirements.txt
```

Then configure your `.env` file:

### Sandbox env file

```
ALGOD_ADDRESS="http://localhost:4001"
ALGOD_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
INDEXER_ADDRESS="http://localhost:8980"
API_KEY=""
```

### Purestake API (Testnet)

```
ALGOD_ADDRESS="https://testnet-algorand.api.purestake.io/ps2"
ALGOD_TOKEN=""
INDEXER_ADDRESS="https://testnet-algorand.api.purestake.io/idx2"
API_KEY="your-api-key-here"
```

## Usage

```
$ python .\admin.py --help
usage: admin.py [-h] {list,create,delete,setwinner,info} ...

positional arguments:
  {list,create,delete,setwinner,info}
    list                list active dapps for account
    create              create a new dapp with account
    delete              delete a dapp from account
    setwinner           set winner for a given dapp
    info                get dapp info

optional arguments:
  -h, --help            show this help message and exit
```

Commands such as `create` `delete` and `setwinner` require you to pass in the creator's private key. For now, this is done by creating a file with your mnemonic, and using it as an argument like so:

```
$ python .\admin.py create --help
usage: admin.py create [-h] privatekey team1name team2name limitdate enddate

positional arguments:
  privatekey  filename of creator mnemonic
  team1name   name of the 1st team
  team2name   name of the 2nd team
  limitdate   date after which bets cannot be made and the winner can be chosen, as a unix timestamp
  enddate     date after which the winner cannot be chosen anymore, as a unix timestamp

optional arguments:
  -h, --help  show this help message and exit
$ cat my_private_key
your twenty five word mnemonic goes here ...
$ python .\admin.py create my_private_key England Denmark 1625684400 1626116400
Deploying application with args: ['England', 'Denmark', 1625684400, 1626116400]
Waiting for confirmation...
...
All done!
$ python .\admin.py list PVFMNQ57IHIYVB5UCUF55AWC2GPTJ2TIOMNO4EOFDHSWT6ZFM672W63LRM
{
  "id": 32,
  "EndDate": 1626116400,
  "LimitDate": 1625684400,
  "Team1": "England",
  "Team1Total": 0,
  "Team2": "Denmark",
  "Team2Total": 0,
  "Winner": "",
  "Escrow": "NJRD6MZXQTHV6QMBIVTZG7CEGM6OEYMNSJVNKCHIZQ5YAS6WT4RJIYNQUA"
}
$ python .\admin.py info 32
{'id': '32', 'EndDate': 1626116400, 'LimitDate': 1625684400, 'Team1': 'England', 'Team1Total': 0, 'Team2': 'Denmark', 'Team2Total': 0, 'Winner': '', 'Escrow': 'NJRD6MZXQTHV6QMBIVTZG7CEGM6OEYMNSJVNKCHIZQ5YAS6WT4RJIYNQUA'}
```
