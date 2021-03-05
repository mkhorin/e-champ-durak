/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakStock = class DurakStock {

    constructor (play) {
        this.play = play;
        this.cards = play.createCardList();
    }

    isEmpty () {
        return !this.trumpCard && this.cards.isEmpty();
    }

    start () {
        this.clear();
        this.cards.add(this.play.cards);
        this.cards.close();
        this.setTrumpCard(this.play.trump);
    }

    setTrumpCard (trump) {
        if (trump) {
            this.trumpCard = this.cards.get(0);
            this.trumpCard.open(trump.rank, trump.suit);
            this.cards.remove(this.trumpCard);
        }
    }

    clear () {
        this.cards.clear();
        this.trumpCard = null;
    }

    arrange () {
        const rect = this.play.getElementRect('.stock');
        const pile = this.play.getElementRect('.stock-pile');
        this.cards.setOffset(rect.x + pile.x, rect.y + pile.y, pile.w);
        this.cards.arrange();
        if (this.trumpCard) {
            this.trumpCard.setOffset(rect.x, rect.y);
        }
    }

    splice (amount) {
        const cards = this.cards.splice(this.cards.count() < amount ? amount - 1 : amount).reverse();
        if (cards.length < amount) {
            cards.push(this.trumpCard);
            this.trumpCard = null;
        }
        return cards;
    }
};