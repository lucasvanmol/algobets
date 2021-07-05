from algosdk import account, mnemonic
from algosdk.future import transaction
from algosdk.future.transaction import LogicSig
import base64

def wait_for_confirmation(client, txid, timeout):
    start_round = client.status()["last-round"] + 1
    current_round = start_round

    print(f"Transaction {txid}: not yet confirmed as of round {current_round}")
    while current_round < start_round + timeout:
        try:
            pending_txn = client.pending_transaction_info(txid)
        except Exception:
            return
        if pending_txn.get("confirmed-round", 0) > 0:
            print(f"Transaction {txid}: CONFIRMED in round {current_round}")
            return pending_txn
        elif pending_txn["pool-error"]:
            raise Exception(f"Pool error: {pending_txn['pool-error']}")
        client.status_after_block(current_round)
        print(f"Transaction {txid}: not yet confirmed as of round {current_round}")
        current_round += 1
    
    raise Exception(f"Pending tx not found before timeout! Timeout round: {start_round + timeout}")


def compile_program(client, source_code):
    response = client.compile(source_code)
    return base64.b64decode(response['result'])

def deploy_application(client, global_ints, global_bytes, local_ints, local_bytes, approval_program, clear_program, private_key, app_args=None):
    global_schema = transaction.StateSchema(global_ints, global_bytes)
    local_schema = transaction.StateSchema(local_ints, local_bytes)

    with open(approval_program, "r") as f:
        approval_program_src = f.read()

    with open(clear_program, "r") as f:
        clear_program_src = f.read()

    sender_address = account.address_from_private_key(private_key)

    params = client.suggested_params()
    params.flat_fee = True
    params.fee = 1000

    on_complete = transaction.OnComplete.NoOpOC.real

    approval_program_bin = compile_program(client, approval_program_src)

    clear_program_bin = compile_program(client, clear_program_src)

    txn = transaction.ApplicationCreateTxn(sender_address, params, on_complete, approval_program_bin, clear_program_bin, global_schema, local_schema, app_args=app_args)

    signed_txn = txn.sign(private_key)
    tx_id = client.send_transaction(signed_txn)

    print("Waiting for confirmation...")
    wait_for_confirmation(client, tx_id, 20)
   
    return client.pending_transaction_info(tx_id)

def call_application(client, app_id: int, private_key: str, app_args = None): #NoOp
    sender_addr = account.address_from_private_key(private_key)
    params = client.suggested_params()
    params.flat_fee = True
    params.fee = 1000

    txn = transaction.ApplicationNoOpTxn(sender_addr, params, app_id, app_args=app_args)

    signed_txn = txn.sign(private_key)
    tx_id = client.send_transaction(signed_txn)

    wait_for_confirmation(client, tx_id, 20)

    transaction_response = client.pending_transaction_info(tx_id)
    print("Called app-id: ",transaction_response['txn']['txn']['apid'])
    if "global-state-delta" in transaction_response :
        print("Global State updated :\n",transaction_response['global-state-delta'])
    if "local-state-delta" in transaction_response :
        print("Local State updated :\n",transaction_response['local-state-delta'])

def update_application(client, app_id: int, private_key, approval_program, clear_program,  app_args = None): 
    with open(approval_program, "r") as f:
        approval_program_src = f.read()

    with open(clear_program, "r") as f:
        clear_program_src = f.read()

    sender_address = account.address_from_private_key(private_key)

    params = client.suggested_params()
    params.flat_fee = True
    params.fee = 1000

    approval_program_bin = compile_program(client, approval_program_src)

    clear_program_bin = compile_program(client, clear_program_src)

    txn = transaction.ApplicationUpdateTxn(sender_address, params, app_id, approval_program_bin, clear_program_bin, app_args=app_args)

    signed_txn = txn.sign(private_key)
    tx_id = client.send_transaction(signed_txn)


    print("Waiting for confirmation...")
    wait_for_confirmation(client, tx_id, 20)
   
    return client.pending_transaction_info(tx_id)

def get_min_params(client):
    params = client.suggested_params()
    params.flat_fee = True
    params.fee = 1000
    return params

# read user local state
def read_local_state(client, addr, app_id) :   
    results = client.account_info(addr)
    local_state = results['apps-local-state'][0]
    for index in local_state :
        if local_state[index] == app_id :
            print(f"local_state of account {addr} for app_id {app_id}: ", local_state['key-value'])

# read app global state
def read_global_state(client, addr, app_id) :   
    results = client.account_info(addr)
    apps_created = results['created-apps']
    for app in apps_created :
        if app['id'] == app_id :
            print(f"global_state for app_id {app_id}: ", app['params']['global-state'])