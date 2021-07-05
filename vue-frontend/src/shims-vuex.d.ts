import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex'// path to store file
import { Dapp, Account, ActiveAccount } from '@/types'


declare module '@vue/runtime-core' {
  interface State {
    hasAlgoSigner: boolean,
    dapps: Dapp[],
    userAccounts: Account[],
    activeDapps: ActiveAccount[],
    getters: {
      expiredDapps: Dapp[],
      activeDapps: Dapp[],
    }
  }

  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
