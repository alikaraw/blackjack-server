let Player = require('./Player');
let Deck = require('./Deck');
let Card = require('./Card');

module.exports = class GameManager {
    /**
     * Creates a new game manager with a balance equal to all players
     * @param {Number} balance the starting balance for all players in the party
     */
    constructor(amountOfPlayers, balance) {
        this.players = [];
        for (let iPlayer = 0; iPlayer < amountOfPlayers; iPlayer++) {
            this.players.push(new Player(balance));    
        }

        this.dealer = new Player(0);
        this.deck = new Deck();

        for(let deck = 0; deck < 5; deck++) { // 4 decks 
            for(let symbol = 0; symbol < 4; symbol++) { // 4 Symbols
                for(let value = 1; value <= 13; value++) { // 13 Cards per Symbol
                    this.deck.addCard(new Card(value, symbol))
                }
            }
        }
    }

    getPlayer(index) {
        return this.players[index];
    }

    getPlayers() {
        return this.players;
    }

    getDealer() {
        return this.dealer;
    }

    setPlayerBalance(index, balance) {
        this.players[index].setBalance(balance);
    }

    addBalanceToPlayer(index, balance) {
        this.players[index].addBalance(balance);
    }

    flipPlayerCards(index) {
        this.players[index].flipCards();
    }

    flipDealerCards() {
        this.dealer.flipCards();
    }

    setPlayerBet(index, bet) {
        this.players[index].setBet(bet);
    }

    startRound() {
        // dealer gets 2 cards
        this.dealer.addCard(this.deck.getRandomCardUp());
        this.dealer.addCard(this.deck.getRandomCard());
        
        // then all players get 2 cards
        for(let iPlayer = 0; iPlayer < this.players.length; iPlayer++) {
            for (let iCard = 0; iCard < 2; iCard++) {
                this.drawCardForPlayer(iPlayer);
            }
        }
    }

    resetGame() {
        this.deck.resetDeck();
        this.dealer.resetHands();
        for(let iPlayer = 0; iPlayer < this.players.length; iPlayer++) {
            this.players[iPlayer].resetHands();
            this.players[iPlayer].setBet(0);
        }
    }

    // round is finished when the second card of the dealer is up
    isRoundFinished() {
        return this.dealer.handMain[1].isUp;
    }

    drawCardForPlayer(index) {
        this.players[index].addCard(this.deck.getRandomCardUp());
    }

    drawCardForDealer() {
        this.dealer.addCard(this.deck.getRandomCardUp());
    }
}