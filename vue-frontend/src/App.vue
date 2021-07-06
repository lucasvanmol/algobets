<template>
    <NavBar text="AlgoBets"></NavBar>
    <router-view></router-view>
    <div v-if="hasAlgoSigner">
        
    </div>
    <NeedAlgoSigner v-else-if="!loading"></NeedAlgoSigner>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import NavBar from './components/NavBar.vue'
import NeedAlgoSigner from './components/NeedAlgoSigner.vue'
declare var AlgoSigner: any; // eslint-disable-line

export default defineComponent({
    name: 'App',
    components: {
        NavBar,
        NeedAlgoSigner
    },
    data() {
        return {
            loading: true,
        }
    },
    computed: {
        hasAlgoSigner() {
            return this.$store.state.hasAlgoSigner;
        },
    },
    mounted() {
        this.checkAlgoSigner();
        setTimeout(() => this.loading = false, 200)
    },
    methods: {
        async checkAlgoSigner() {
            if (typeof AlgoSigner !== 'undefined') {
                this.$store.commit('setHasAlgoSigner', true);
                this.$store.dispatch('getAll');
            } else {
                setTimeout(() => this.checkAlgoSigner(), 1);
            }
        }
    }
});
</script>

<style>
#app {
    text-align: center;
    margin-top: 100px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

body {
    margin: 0px;
}

</style>
