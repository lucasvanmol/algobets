import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'

console.log(process.env.VUE_APP_CREATOR_ADDRESS)

createApp(App)
    .use(store)
    .use(router)
    .mount('#app')
