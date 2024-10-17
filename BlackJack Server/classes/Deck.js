module.exports = class Deck {
    /**
     * Constructor for creating a Deck object
     */
    constructor(){
        this.cards = [];
        this.discarded_cards = [];
    }

    /**
     * Adds a card to the Deck
     * @param {Card} card card to add to the Deck
     */
    addCard(card) { this.cards.push(card); }

    /**
     * Returns a random Card from the Deck, and places the picked Card in a discarded pile
     * @returns {Card} random Card from the Deck faced down
     */
    getRandomCard() { 
        let randomCardIndex = Math.random() * this.cards.length;
        let randomCard = this.cards.splice(randomCardIndex, 1)[0];
        this.discarded_cards.push(randomCard);
        return randomCard;
    }

    /**
     * Returns a random Card from the Deck, and places the picked Card in a discarded pile
     * @returns {Card} random Card from the Deck faced up
     */
    getRandomCardUp() {
        let card = this.getRandomCard();
        card.setCardUp(true)
        return card;
    }
    
    /**
     * Resets the Deck by added the discarded Cards back to the Deck
     */
    resetDeck() {
        for(let iCard = this.discarded_cards.length; iCard >  0; iCard--) {
            this.cards.push(this.discarded_cards.pop());
        }

        for(let iCard = 0; iCard < this.cards.length; iCard++) {
            this.cards[iCard].setCardUp(false);
        }
    }
}