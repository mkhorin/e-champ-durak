/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakDiscardEvent = class DurakDiscardEvent extends Club.DurakEvent {

    static AFTER_MASTER_DELAY = 10;
    static AFTER_OPPONENT_DELAY = 1000;
    static MOVE_DELAY = .1;
    static MOVE_DURATION = .2;

    constructor () {
        super(...arguments);
        this.cards = this.table.getCards();
    }

    processNormal () {
        setTimeout(() => {
            this.execute().reverse().forEach(this.processCard, this);
            this.finishAfterMotion();
        }, this.getProcessDelay());
    }

    processCard (card) {
        const offset = this.play.discard.getCardOffset(card);
        this.play.moveCard(card, offset, this.constructor.MOVE_DURATION, this.constructor.MOVE_DELAY)
            .done(this.closeCard.bind(this, card));
    }

    getProcessDelay () {
        return this.play.master.isDefender() || this.isMasterPassInPreviousEvents()
            ? this.constructor.AFTER_MASTER_DELAY
            : this.constructor.AFTER_OPPONENT_DELAY;
    }

    processHidden () {
        this.execute();
        this.finish();
    }

    execute () {
        this.play.discard.cards.add(this.cards);
        this.table.clear();
        return this.cards;
    }
};