<template>
    <button 
        @click="toggleBetModal"
        :style="{ background: color }"
    >
        {{ text }}
    </button>
    <transition name="fade">
        <BetModal v-if="showBetModal" :teamName="teamName" :teamColor="color" :dapp="dapp" @toggle-bet-modal="toggleBetModal"></BetModal>
    </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import BetModal from './BetModal.vue'

export default defineComponent({
    name: 'Button',
    components: {
        BetModal
    },
    data() {
        return {
            showBetModal: false
        }
    },
    props: {
        text: String,
        color: String,
        teamName: String,
        dapp: Object,
    },
    methods: {
        toggleBetModal: function() {
            this.showBetModal = !this.showBetModal;
        }
    }
})
</script>

<style scoped>
button {
    display: inline-block;
    background: #000;
    color: #fff;
    border: none;
    padding: 10px 20px;
    margin: 5px;
    border-radius: 5px;
    cursor: pointer;
    text-decoration: none;
    font-size: 15px;
    font-family: inherit;
}
</style>
