<template>
    <div>
        <h1>{{localStateBetAlgos}}</h1>
        <img src="../assets/algorand_logo_mark_black.svg" alt="">
        <h1>on </h1>
        <h1 :style="{color: color}">{{localState.Team}}</h1>
    </div>
</template>

<script lang="ts">
import { DappLocalState } from '@/types'
import { defineComponent, PropType } from 'vue'
import {microalgosToAlgos} from 'algosdk'


export default defineComponent({
    props: {
        localState: {
            type: Object as PropType<DappLocalState>,
            required: true,
        },
        color: {
            type: String,
            default: 'black'
        }
    },
    computed: {
        localStateBetAlgos(): number {
            return microalgosToAlgos((this.localState as DappLocalState).Bet)
        }
    }
})
</script>

<style scoped>
h1 {
    display: inline;
    color: black;
    font-size: 54px;
}
img {
    width: 100px;
    margin-top: -20px;
    margin-left: -20px;
    margin-right: 0px;
    margin-bottom: -32px;
}
</style>