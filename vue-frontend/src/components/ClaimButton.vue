<template>
    <button 
        @click="claimBet"
        :style="{ background: color }"
    >
        Claim
    </button>
</template>

<script lang="ts">
import { DappLocalState } from '@/types';
import { defineComponent, PropType } from 'vue'
import api from '../api/dapps'

export default defineComponent({
    name: 'ClaimButton',
    props: {
        color: String,
        localState: {
            type: Object as PropType<DappLocalState>,
            required: true,
        }
    },
    methods: {
        claimBet: function() {
            api.claimFromDapp(this.localState);
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
