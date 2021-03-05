/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakDiscard = class DurakDiscard {

    constructor (play) {
        this.play = play;
        this.cards = play.createCardList();
    }

    getCardOffset () {
        return [this.rect.x, this.rect.y];
    }

    clear () {
        this.cards.clear();
    }

    count () {
        return this.cards.count();
    }

    arrange () {
        this.rect = this.play.getElementRect('.discard');
        this.cards.setOffset(this.rect.x, this.rect.x, this.rect.w);
        this.cards.arrange();
    }
};