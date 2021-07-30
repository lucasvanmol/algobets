from algosdk.v2client import indexer, algod
from algosdk import encoding, mnemonic
from algosdk.future import transaction
from base64 import b64decode, b64encode, decodebytes
from dotenv import dotenv_values
from datetime import datetime, timedelta
import utils
import json, time, argparse, os

# Configure and start Algod client & indexer

if os.path.isfile(".env.local"):
    config = dotenv_values(".env.local")
elif os.path.isfile(".env"):
    config = dotenv_values(".env")
else:
    raise FileNotFoundError(".env file not found!")


headers = {
    "X-API-Key": config["API_KEY"]
}
client = algod.AlgodClient(
    config["ALGOD_TOKEN"], config["ALGOD_ADDRESS"], headers)
indx = indexer.IndexerClient(
    indexer_token="", indexer_address=config["INDEXER_ADDRESS"], headers=headers)


def generate_escrow(app_id: int, escrow_file='../teal/escrow.teal'):
    with open(escrow_file) as f:
        src = f.read()
    return src.replace("TMPL_APP_ID", str(app_id))


def full_deploy(private_key: str, team1: str, team2: str, limitdate: datetime, enddate: datetime):
    # Deploy the new app
    app_id = deploy(private_key, team1, team2, limitdate, enddate)

    # Set the escrow adddress
    escrow = set_escrow(private_key, app_id)

    # Fund escrow with min amount so users can withdraw without closing out the account
    print('Funding escrow account')
    pub = mnemonic.to_public_key(mnemonic.from_private_key(private_key))
    txn = transaction.PaymentTxn(
        pub, utils.get_min_params(client), escrow, 100000)
    stxn = txn.sign(private_key)
    txid = client.send_transaction(stxn)
    utils.wait_for_confirmation(client, txid, 20)
    print("All done!")


def deploy(private_key: str, team1: str, team2: str, limitdate: datetime, enddate: datetime) -> int:
    args = [team1, team2, int(limitdate.timestamp()), int(enddate.timestamp())]

    print(f"Deploying application with args: {args}")
    transaction_response = utils.deploy_application(
        client, 4, 4, 1, 1, "../teal/app.teal", "../teal/clear.teal", private_key, app_args=args)

    print("Successfully deployed application:")
    print(json.dumps(transaction_response, indent=2) + "\n\n")

    return transaction_response['application-index']


def set_escrow(private_key: str, app_id: int):
    print(f"Updating application {app_id} with escrow address")
    src = generate_escrow(app_id)
    result = client.compile(src)
    escrow_hash = result["hash"]
    filename = escrow_hash + ".teal"
    print(f"Escrow address is {escrow_hash}")

    addr = encoding.decode_address(escrow_hash)
    args = ["escrow", addr]
    transaction_response = utils.call_application(
        client, app_id, private_key, args)
    print("Successfully updated application:")
    print(json.dumps(transaction_response, indent=2) + "\n\n")
    return escrow_hash


def set_winner(private_key: str, app_id: int, team_name: str):
    args = ["winner", team_name]
    print(f"Updating application with args: {args}")
    transaction_response = utils.call_application(
        client, app_id, private_key, args)
    print("Successfully update application:")
    print(json.dumps(transaction_response, indent=2) + "\n\n")


def delete_application(private_key: str, app_id: int, close_out=True):
    pub = mnemonic.to_public_key(mnemonic.from_private_key(private_key))
    params = utils.get_min_params(client)

    if close_out:
        resp = client.compile(generate_escrow(app_id))
        program = decodebytes(resp["result"].encode())
        lsig = transaction.LogicSig(program)

        txn_1 = transaction.PaymentTxn(
            lsig.address(), params, pub, 0, close_remainder_to=pub)
        txn_2 = transaction.ApplicationDeleteTxn(pub, params, app_id)

        gid = transaction.calculate_group_id([txn_1, txn_2])
        txn_1.group = gid
        txn_2.group = gid

        stxn_1 = transaction.LogicSigTransaction(txn_1, lsig)
        stxn_2 = txn_2.sign(private_key)

        signed_group = [stxn_1, stxn_2]

        txid = client.send_transactions(signed_group)
    else:
        print("WARNING! This will permenantly delete the application, and any assets left in the escrow address will be unrecoverable!")
        i = input("Are you sure you wish to continue? [y/N]")
        if i.lower() != 'y':
            print("Aborted")
            return

        txn = transaction.ApplicationDeleteTxn(pub, params, app_id)
        stxn = txn.sign(private_key)
        txid = client.send_transaction(stxn)

    utils.wait_for_confirmation(client, txid, 20)
    print("All done!")


def arg_list(args):
    info = utils.get_acc_info(args.address, indx)
    if args.approval is not None:
        approval_program = b64encode(utils.compile_program(
            client, args.approval.read())).decode()
        apps = filter(lambda app: app['params']['approval-program']
                      == approval_program, info['account']['created-apps'])
    else:
        apps = info['account']['created-apps']

    for app in apps:
        state = app["params"]["global-state"]
        decoded = utils.convert_state_dict(state, app['id'])
        print(json.dumps(decoded, indent=2))


def arg_delete(args):
    pk = mnemonic.to_private_key(args.privatekey.read())
    delete_application(pk, args.app_id, close_out=not args.f)


def arg_create(args):
    pk = mnemonic.to_private_key(args.privatekey.read())
    limitdate = datetime.fromtimestamp(args.limitdate)
    enddate = datetime.fromtimestamp(args.enddate)
    full_deploy(pk, args.team1name, args.team2name, limitdate, enddate)


def arg_info(args):
    print(utils.get_app_info(args.app_id, indx))


def arg_setwinner(args):
    pk = mnemonic.to_private_key(args.privatekey.read())
    set_winner(pk, args.app_id, args.team_name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    parser_list = subparsers.add_parser(
        'list', help="list active dapps for account")
    parser_list.add_argument('address')
    parser_list.add_argument(
        '--approval', help="optionally, an approval program to filter out", type=argparse.FileType('r'))
    parser_list.set_defaults(func=arg_list)

    parser_create = subparsers.add_parser(
        'create', help="create a new dapp with account")
    parser_create.add_argument(
        'privatekey', help='filename of creator mnemonic', type=argparse.FileType('r'))
    parser_create.add_argument(
        'team1name', help='name of the 1st team')
    parser_create.add_argument(
        'team2name', help='name of the 2nd team')
    parser_create.add_argument(
        'limitdate', help='date after which bets cannot be made and the winner can be chosen, as a unix timestamp', type=int)
    parser_create.add_argument(
        'enddate', help='date after which the winner cannot be chosen anymore, as a unix timestamp', type=int)
    parser_create.set_defaults(func=arg_create)

    parser_delete = subparsers.add_parser(
        'delete', help="delete a dapp from account")
    parser_delete.add_argument(
        'privatekey', help='filename of creator mnemonic', type=argparse.FileType('r'))
    parser_delete.add_argument('app_id')
    parser_delete.add_argument(
        '-f', action="store_true", help="forcefully delete the application without closing out the escrow account")
    parser_delete.set_defaults(func=arg_delete)

    parser_setwinner = subparsers.add_parser(
        'setwinner', help="set winner for a given dapp")
    parser_setwinner.add_argument(
        'privatekey', help='filename of creator mnemonic', type=argparse.FileType('r'))
    parser_setwinner.add_argument('app_id')
    parser_setwinner.add_argument('team_name')
    parser_setwinner.set_defaults(func=arg_setwinner)

    parser_info = subparsers.add_parser('info', help="get dapp info")
    parser_info.add_argument('app_id')
    parser_info.set_defaults(func=arg_info)

    args = parser.parse_args()

    try:
        args.func(args)
    except AttributeError:
        print('Try --help to see a list of commands')
