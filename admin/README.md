# admin.py

For deploying and updating the dapp.

## Usage

Before using this CLI, you need to put your Algod and Indexer addresses and tokens in the `.env` file. If you're using the PureStake API, you must also include your API key.

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
```
