# TEAL Program Breakdown

## Function

This DApp is composed of a stateful smart contract and a stateless smart contract (as an escrow account).

Upon creation, the DApp requires several arguments:

* Team1Name    - Name of the 1st team, defined on creation.
* Team2Name    - Name of the 2nd team, defined on creation.
* LimitDate    - Date after which no more bets can be placed, and the winning team can be set by the creator.
* EndDate      - Date after which funds can be reclaimed if the creator did not set a winning team.

Upon its creation, the admin account must call the application with the args `escrow ESCROW_ADDRESS` where `ESCROW_ADDRESS` is the address of the compiled stateless smart contract `escrow.teal`, with the parameter `TMPL_APP_ID` replaced by the app id of the dapp created previously. This is address where bets will be sent to by users.

It is also recommended that the escrow account should be funded with the minimum amount of algos (0.1) so that users can succesfully claim their due.

Users can use the application by grouping an app OptIn with a payment transaction to the escrow account (by means of an atomic transaction). The OptIn transaction must contain exactly one argument, which is the name of one of the two teams (i.e. the values corresponding to Team1Name or Team2Name).

Once the LimitDate has passed, users can no longer opt in to the contract, and can therefore no longer bet on a team. At this time, the admin may call the application with the args `winner TEAM_NAME` where `TEAM_NAME` is the name of one of the two teams. After this has happened, users who chose the winning team are able to claim back their wager + winnings, which are dependant on how much other users have wagered.

To claim their winnings, an payment transaction signed by the escrow account logic must be atomically grouped with an application call with the argument `claim`. Users are only able to claim exactly the amount they are entitled to, which can be calculated but is facilitated by the frontend application.

If there is no winner chosen after EndDate has passed, users are able to reclaim their winnings. Reclaiming is similair to claiming, except the argument passed is `reclaim`.

In both the claim and reclaim cases, the user pays for the transaction fee.