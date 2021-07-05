import * as algosdk from 'algosdk';
import { Base64 } from 'js-base64';
import { Dapp, Team, Account, DappLocalState } from "@/types";
import { Transaction } from 'algosdk';
declare const AlgoSigner: any;
const CREATOR = process.env.VUE_APP_CREATOR_ADDRESS;
const LEDGER_NAME = process.env.VUE_APP_LEDGER_NAME;


export default {

    async getDapps(): Promise<Dapp[]> {
        // Connect to algosigner
        await AlgoSigner.connect();

        // Get all dapps created by CREATOR
        const r = await AlgoSigner.indexer({
            ledger: LEDGER_NAME,
            path: `/v2/accounts/${CREATOR}` 
        });
        const apps = r['account']['created-apps'];

        const dapps: Dapp[] = []
        apps.forEach((app: any) => {
            // include app id
            const team1: Team = {
                Name: "",
                Total: 0
            }
            const team2: Team = {
                Name: "",
                Total: 0
            }
            const dapp: Dapp  = {
                Id: app['id'],
                Team1: {
                    Name: '',
                    Total: 0
                },
                Team2: {
                    Name: '',
                    Total: 0
                },
                Winner: '',
                Escrow: '',
                LimitDate: 0,
                EndDate: 0
            }

            // and get all global state variables, and decode them
            app['params']['global-state'].forEach((item: any) => {
                const key = Buffer.from(item['key'], 'base64').toString('ascii');
                
                const val_str = Buffer.from(item['value']['bytes'], 'base64').toString('ascii');
                const val_uint = item['value']['uint'];
                switch (key) {
                    case "Team1":
                        team1.Name = val_str;
                        break;

                    case "Team2":
                        team2.Name = val_str;
                        break;
                    
                    case "Team1Total":
                        team1.Total = val_uint;
                        break;

                    case "Team2Total":
                        team2.Total = val_uint;
                        break;

                    case "Winner":
                        dapp.Winner = val_str;
                        break;

                    case "LimitDate":
                    case "EndDate":
                        dapp[key] = val_uint;
                        break;
                    
                    case "Escrow": {
                        const bytes = Base64.toUint8Array(item['value']['bytes']);
                        const addr = algosdk.encodeAddress(bytes);
                        if (!algosdk.isValidAddress(addr)) {
                            throw Error(`Escrow value for app with id ${dapp.Id} is not a valid address! (${addr})`);
                        }
                        dapp.Escrow = addr
                        break;
                    }
                        
                    default:
                        console.warn(`Unexpected global variable "${key}" from app with id ${dapp.Id}`)
                        break;
                }
            });
            
            dapp.Team1 = team1;
            dapp.Team2 = team2;
            dapps.push(dapp as Dapp);
        });

        return dapps;
    },

    async getUserAccounts(): Promise<Account[]> {
        await AlgoSigner.connect();

        // Get user accounts
        const accountsRaw = await AlgoSigner.accounts({
            ledger: LEDGER_NAME,
        });

        const userAccounts: Account[] = [];

        accountsRaw.forEach((account: any) => {
            const len = account.address.length;
            const slice = account.address.slice(0, 6) 
                + " ... " 
                + account.address.substr(len-6, len);

            const acc: Account = {
                address: account.address,
                short: slice
            };

            userAccounts.push(acc);
        });
        
        return userAccounts;       
    },

    async getActiveDapps(appIds: number[], accounts: Account[]): Promise<{Id: number, Team: string, Bet: number, account: Account}[]> {
        const activeAccounts: {Id: number, Team: string, Bet: number, account: Account}[] = [];
        
        // For every account, get active dapps
        // If that dapp's app id is in appIds, save it into activeAccounts (along with local state)
        for (let i = 0; i < accounts.length; i++) {

            const account = accounts[i];

            const info = await AlgoSigner.indexer({
                ledger: LEDGER_NAME,
                path: `/v2/accounts/${account.address}`
            });


            if ('account' in info && 'apps-local-state' in info['account']) {
                info['account']['apps-local-state'].forEach((app: any) => {
                    if (appIds.includes(app['id'])) {
                        
                        const localState = {
                            Id: app['id'],
                            Team: '',
                            Bet: 0,
                            account: account,
                        }

                        app['key-value'].forEach((item: any) => {
                            const key = Buffer.from(item['key'], 'base64').toString('ascii');
                            switch (key) {
                                case "MyTeam":
                                    localState.Team = Buffer.from(item['value']['bytes'], 'base64').toString('ascii');
                                    break;

                                case "MyBet":
                                    localState.Bet = item['value']['uint']
                                    break;

                                default:
                                    console.warn(`Unexpected global variable "${key}" from app with id ${app['id']}`)
                                    break;
                            }
                        });
                        
                        activeAccounts.push(localState);
                    }
                });
            }
        }

        return activeAccounts;  
    },

    async getMinParams(): Promise<algosdk.SuggestedParams> {
        const suggestedParams = await AlgoSigner.algod({
            ledger: LEDGER_NAME,
            path: '/v2/transactions/params'
        });

        const params: algosdk.SuggestedParams = {
            fee: suggestedParams["min-fee"],
            flatFee: true,
            firstRound: suggestedParams["last-round"],
            genesisHash: suggestedParams["genesis-hash"],
            genesisID: suggestedParams["genesis-id"],
            lastRound: suggestedParams["last-round"] + 1000,
        }

        return params
    },

    async optInToDapp(address: string, dapp: Dapp, amount: number, teamName: string) {
        const params = await this.getMinParams();

        const tx0 = new algosdk.Transaction({
            to: dapp.Escrow,
            from: address,
            amount: amount,
            ...params,
        });

        const myTeam = new TextEncoder().encode(teamName);
        const tx1 = algosdk.makeApplicationOptInTxn(
            address,
            params,
            dapp.Id,
            [myTeam]
        );

        this.combineAndSend(tx0, tx1);
    },

    async combineAndSend(tx0: Transaction, tx1: Transaction) {
        algosdk.assignGroupID([tx0, tx1]);

        const binaryTxs = [tx0.toByte(), tx1.toByte()];
        const base64Txs = binaryTxs.map((binary) => AlgoSigner.encoding.msgpackToBase64(binary));

        const signedTxs = await AlgoSigner.signTxn([
        {
            txn: base64Txs[0],
        },
        {
            txn: base64Txs[1],
        },
        ]);

        const binarySignedTxs = signedTxs.map((tx: any) => AlgoSigner.encoding.base64ToMsgpack(tx.blob));
        const combinedBinaryTxns = new Uint8Array(binarySignedTxs[0].byteLength + binarySignedTxs[1].byteLength);
        combinedBinaryTxns.set(binarySignedTxs[0], 0);
        combinedBinaryTxns.set(binarySignedTxs[1], binarySignedTxs[0].byteLength);
        
        const combinedBase64Txns = AlgoSigner.encoding.msgpackToBase64(combinedBinaryTxns);

        await AlgoSigner.send({
            ledger: LEDGER_NAME,
            tx: combinedBase64Txns,
        });
    },

    calculateClaimAmount(my_bet: number, my_team_total: number, other_team_total: number, fee=1000) {
        return Math.floor(my_bet / my_team_total * (my_team_total + other_team_total) - fee)
    },
    
    async claimFromDapp(dls: DappLocalState) {
        const escrow_tmpl = await (await fetch('../conf/escrow.teal')).text();
        const escrow_src = escrow_tmpl.replace('TMPL_APP_ID', dls.dapp.Id.toString());
        const response = await AlgoSigner.algod({
            ledger: LEDGER_NAME,
            path: '/v2/teal/compile',
            body: escrow_src,
            method: 'POST',
            contentType: 'text/plain',
        });
        console.log(response)
        if (response['hash'] !== dls.dapp.Escrow) {
            throw Error(`Escrow program hash ${response['hash']} did not equal the dapps's escrow address ${dls.dapp.Escrow}`)
        }

        const program = new Uint8Array(Buffer.from(response['result'], 'base64'))
     
        const lsig = algosdk.makeLogicSig(program)

        const params = await this.getMinParams();


        let myTeamTotal = dls.dapp.Team1.Total;
        let otherTeamTotal = dls.dapp.Team2.Total;
        if (dls.Team !== dls.dapp.Team1.Name) {
            myTeamTotal = dls.dapp.Team2.Total;
            otherTeamTotal = dls.dapp.Team1.Total;
        }

        const amount = this.calculateClaimAmount(dls.Bet, myTeamTotal, otherTeamTotal);

        console.log("Claiming " + amount + " with account " + dls.account.address);
        const txn_1 = new algosdk.Transaction({
            to: dls.account.address, 
            from: lsig.address(),
            amount: amount,
            ...params
        })

        const args: Uint8Array[] = [];
        args.push(new Uint8Array(Buffer.from('claim')))

        const txn_2 = algosdk.makeApplicationNoOpTxn(dls.account.address, params, dls.dapp.Id, args);

        algosdk.assignGroupID([txn_1, txn_2]);

        const binaryTxs = [txn_1.toByte(), txn_2.toByte()];
        const base64Txs = binaryTxs.map((binary) => AlgoSigner.encoding.msgpackToBase64(binary));

        const signedTxs = await AlgoSigner.signTxn([
        {
            txn: base64Txs[0],
            signers: []
        },
        {
            txn: base64Txs[1],
        },
        ]);

        // Sign leftover transaction with the SDK
        const stxn_1 = algosdk.signLogicSigTransactionObject(txn_1, lsig);
        const signedTx1Binary = stxn_1.blob;
        const signedTx2Binary = AlgoSigner.encoding.base64ToMsgpack(signedTxs[1].blob);

        const combinedBinaryTxns = new Uint8Array(signedTx1Binary.byteLength + signedTx2Binary.byteLength);
        combinedBinaryTxns.set(signedTx1Binary, 0);
        combinedBinaryTxns.set(signedTx2Binary, signedTx1Binary.byteLength);
        
        const combinedBase64Txns = AlgoSigner.encoding.msgpackToBase64(combinedBinaryTxns);

        await AlgoSigner.send({
            ledger: LEDGER_NAME,
            tx: combinedBase64Txns,
        });
    }
}