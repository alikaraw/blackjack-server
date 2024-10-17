module.exports = class Player {
    /**
     * Constructor for creating a Player object
     * @param {Number} balance player balance 
     */
    constructor(balance){
        this.balance = balance;
        this.wins = 0;
        this.loses = 0;
        this.resetPlayer();
    }

    setBalance(balance) {
        this.balance = balance;
    }
    
    addBalance(balance) {
        this.balance += balance;
    }

    setBet(bet) {
        this.bet = bet;
        this.balance = this.balance - bet;
    }

    flipCards() {
        for (let iCard = 0; iCard < this.handMain.length; iCard++) {
            this.handMain[iCard].setCardUp(true);
        }
    }

    /**
     * resets both hands of the player
     */
    resetHands() {
        this.handMain = [];
        this.handSplit = [];
    }

    /**
     * resets all player info for the round (bet, insurance, hands)
     */
    resetPlayer(){
        this.resetHands();
        this.bet = 0;
        this.insurance = 0;
        this.splittedHand = false;
    }

    /**
     * Switches between the hands of the player
     */
    switchHands() {
        let temp = this.handMain;
        this.handMain = this.handSplit;
        this.handSplit = temp;
    }

    /**
     * Check if the player can split his hand
     * A player can split only when he has only 2 cards and they are similar and has enough balance to bet twice
     * @returns whether the player can split his hand
     */
    canSplit() {
        return this.canSurrender() && this.handMain[0].value == this.handMain[1].value && this.balance >= this.bet;
    }

    /**
     * Splits the hand1 of the player to two hands
     */
    splitHand() {
        this.balance -= this.bet;
        this.handSplit.push(this.handMain.pop());
        this.splittedHand = true;
    }

    /**
     * Checks if the player can double his bet
     * A player can double his bet only if he has 2 card in main hand, 0 cards in split hand and have enough balance to double it
     * @returns true if the player can double his bet
     */
    canDouble() {
        return this.canSurrender() && this.balance >= this.bet;
    }

    /**
     * Doubles the bet of the player
     */
    doubleHand() {
        this.balance -= this.bet;
        this.bet *= 2;
    }

    /**
     * Checks if the player can surrender
     * A player can surrender only if he has 2 cards in main hand and 0 cards in split hand
     * @returns true of the player can surrender
     */
    canSurrender() {
        return this.handMain.length == 2 && this.handSplit.length == 0;
    }

    /**
     * Surrenders the player hand
     */
    surrenderHand() {
        this.balance += this.bet * 0.5;
        this.bet = 0;
    }

    /**
     * Player takes insurance equal to 0.5 of his bet
     */
    takeInsurance() {
        if(this.balance - (this.bet * 0.5) <= 0) { // player has less then 0.5 of bet, meaning insurance will set balance to 0
            this.insurance = this.balance;
            this.balance = 0;
        } else {
            this.insurance = this.bet * 0.5;
            this.balance -= this.insurance;
        }
    }

    /**
     * Adds a card to the main hand of the player
     * @param {Card} card card to add
     */
    addCard(card) {
        this.handMain.push(card);
    }

    /**
     * Returns the amout of points in player's main hand
     * @returns {Number} the amount of points in player's main hand
     */
    getMainHandPoints() {
        return this._calcHandPoints(this.handMain)
    }

    /**
     * Returns the amout of points in player's split hand
     * @returns {Number} the amount of points in player's split hand
     */
    getSplitHandPoints(){
        return this._calcHandPoints(this.handSplit);
    }

    /**
     * Check if the main hand of the player has blackjack
     * @returns {Boolean} whether the main hand has blackjack
     */
    isMainHandBJ() {
        return this._hasBlackjack(this.handMain);
    }

    /**
     * Check if the split hand of the player has blackjack
     * @returns {Boolean} whether the split hand has blackjack
     */
    isSplitHandBJ() {
        return this._hasBlackjack(this.handSplit);
    }

    _hasBlackjack(cards) {
        return cards.length == 2 && ((cards[0].value == 1 && cards[1].value >= 11) || (cards[0].value >= 11 && cards[1].value == 1));
    }

    _calcHandPoints(cards) {
        let sum = 0;
        let amountOfAces = 0;

        for(let iCard = 0; iCard < cards.length; iCard++) {
            if(!cards[iCard].isUp) { continue; }
            
            if(cards[iCard].value == 1) {
                amountOfAces++;
            } else {
                sum += (cards[iCard].value >= 11) ? 10 : cards[iCard].value;  
            }
        }

        while(amountOfAces > 0) {
            sum += ((sum + 11) > 21) ? 1 : 11;
            amountOfAces--;
        }

        return sum;
    }
}