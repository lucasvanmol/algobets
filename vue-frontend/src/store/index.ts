import { createStore, createLogger } from 'vuex'
import { Dapp, Account, DappLocalState } from '@/types'
import api from '@/api/dapps'

const debug = process.env.NODE_ENV !== 'production'

export default createStore({
    state: {
        hasAlgoSigner: false,
        dapps: [] as Dapp[],
        userAccounts: [] as Account[],
        activeDapps: [] as DappLocalState[]
    },
    getters: {
        activeDapps(state) {
            const timestamp = Math.floor(Date.now() / 1000)
            return state.dapps.filter(dapp => dapp.LimitDate > timestamp)
        },
        expiredDapps(state) {
            const timestamp = Math.floor(Date.now() / 1000)
            return state.dapps.filter(dapp => dapp.LimitDate <= timestamp)
        }
    },
    mutations: {
        setHasAlgoSigner(state, value) {
            state.hasAlgoSigner = value
        },
        setDapps(state, value) {
            state.dapps = value
        },
        setUserAccounts(state, value) {
            state.userAccounts = value
        },
        setActiveDapps(state, value) {
            state.activeDapps = value
        }
    },
    actions: {
        async getAll(context) {
            await context.dispatch('getDapps');
            await context.dispatch('getUserAccounts');
            await context.dispatch('getActiveDapps');
        },
        async getDapps(context) {
            const dapps = await api.getDapps();
            context.commit('setDapps', dapps);
        },
        async getUserAccounts(context) {
            const userAccounts = await api.getUserAccounts();
            context.commit('setUserAccounts', userAccounts);
        },
        async getActiveDapps(context) {
            const appIds = context.state.dapps.map(dapp => dapp.Id);
            const accounts = context.state.userAccounts;
            const activeAccounts = await api.getActiveDapps(appIds, accounts);
            const acc = activeAccounts.map(acc => {
                return {
                    account: acc.account,
                    Team: acc.Team,
                    Bet: acc.Bet,
                    dapp: context.state.dapps.find(dapp => dapp.Id === acc.Id) as Dapp
                }
            })
            context.commit('setActiveDapps', acc);
        }
    },
    strict: debug,
    plugins: debug ? [createLogger()] : []
})
