export default class Card {
    static valueNames = {
        1: "ace",
        11: "jack",
        12: "queen",
        13: "king",
    }

    static symbolNames = {
        0: "clubs",
        1: "diamonds",
        2: "hearts",
        3: "spades",
    }

    /**
     * Constructor for creating a Card object
     * @param {Number} value number betweel 1 - 13, 1 being Ace and 13 being King
     * @param {Number} symbol symbol of the card 0-3 [0:♣] [1:♦] [2:♥] [3:♠] 
     */
    constructor(value, symbol){
        this.value = value;
        this.symbol = symbol;
        this.isUp = false;
    }

    /**
     * @returns {String} value of the Card as string
     */
    getValueName() { return Card.valueNames[this.value] ? Card.valueNames[this.value] : this.value; }

    /**
     * @returns {String} symbol of the Card as string
     */
    getSymbolName() { return Card.symbolNames[this.symbol]; }

    /**
     * sets the card face 
     * @param {Boolean} isFaceUp whether the card is faced up or down 
     */
    setCardUp(isFaceUp) { this.isUp = isFaceUp; }
}