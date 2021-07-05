<template>
    <div class="dapp">
        
        <table>
            <tr>
                <td>
                    <h1 :style="{ color: team1Color }">{{ dapp.Team1.Name }}</h1>
                </td>
                <td>
                    <h2>vs</h2>
                </td>
                <td>
                    <h1 :style="{ color: team2Color }">{{ dapp.Team2.Name }}</h1>
                </td>
            </tr>
        </table>
        
        <Bar 
            :team1Total="dapp.Team1.Total"
            :team2Total="dapp.Team2.Total"
            :team1Color="team1Color"
            :team2Color="team2Color"
            :showRatios="!localState"
            >
        </Bar>
        <DappInfo :dapp="dapp"></DappInfo>
        <table v-if="!localState">
            <tr>
                <td>
                    <Button 
                        text="Vote"
                        :color="team1Color"
                        :teamName="dapp.Team1.Name"
                        :dapp="dapp"
                        >
                    </Button>
                </td>
                <td></td>
                <td>
                    <Button
                        text="Vote"
                        :color="team2Color"
                        :teamName="dapp.Team2.Name"
                        :dapp="dapp"
                        >
                    </Button>
                </td>
            </tr>
        </table>
        <div v-else>
            <LocalStateInfo :localState="localState" :color="myTeamColor"></LocalStateInfo>
            <div v-if="dapp.Winner === ''">
                Winner has yet to be picked...
            </div>
            <div v-else>
                <ClaimButton :color="myTeamColor" :localState="localState"></ClaimButton>
                Winner: <span :style="{ color: winningTeamColor }">{{dapp.Winner}}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Button from './Button.vue'
import Bar from './Bar.vue'
import DappInfo from './DappInfo.vue'
import { Dapp, DappLocalState } from '@/types'
import LocalStateInfo from './LocalStateInfo.vue'
import ClaimButton from './ClaimButton.vue'

export default defineComponent({
    name: 'DappBlock',
    props: {
        dapp: {
            type: Object as PropType<Dapp>,
            required: true
        },
        localState: {
            type: Object as PropType<DappLocalState>,
            required: false
        },
        team1Color: {
            type: String,
            default: "#72C076" 
        },
        team2Color: {
            type: String,
            default: "#73CDD3"
        },
    },
    components: {
        Button,
        Bar,
        DappInfo,
        LocalStateInfo,
        ClaimButton
    },
    computed: {
        myTeamColor(): string {
            if ((this.localState as DappLocalState).Team === this.dapp.Team1.Name) {
                return this.team1Color;
            } else {
                return this.team2Color;
            }
        },
        winningTeamColor(): string {
            if (this.dapp.Winner === this.dapp.Team1.Name) {
                return this.team1Color;
            } else {
                return this.team2Color;
            }
        }
    }
})
</script>


<style scoped>
.dapp {
    display: inline-block;
    background: #eeeeee;
    margin: 10px;
    padding: 10px 20px;
    border-radius: 10px;
    width: 80%;
    max-width: 700px;
}


.dapp table {
   width: 100%;
   border-collapse: collapse;
}

td {
    padding: 5px;
}

.dapp table tr td {
    text-align: left;
    width: 45%;
}

.dapp table tr td + td {
    text-align: center;
    width: 10%;
}

.dapp table tr td + td + td {
    text-align: right;
    width: 45%;
}

.dapp h1 {
    display: inline;
    font-size: 48px;
}

.dapp h2 {
    display: inline

}

.dapp img {
    width: 25px;
    height: 25px;
    border: 2px solid #000;
    border-radius: 50%;
    display: none;
}
</style>
