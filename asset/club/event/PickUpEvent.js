/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakPickUpEvent = class DurakPickUpEvent extends Club.DurakEvent {

    static AFTER_MASTER_DELAY = 10;
    static AFTER_OPPONENT_DELAY = 1000;
    static MOVE_DELAY = .1;
    static MOVE_DURATION = .2;

    constructor () {
        super(...arguments);
        this.cards = this.table.getCards().reverse();
    }

    processNormal () {
        setTimeout(() => {
            this.playerCards = this.player.cards;
            this.playerCards.arrange(this.cards.length);
            this.rightPlayerCard = this.player.getRightSidePlayerLastCard();
            this.execute().forEach(this.processCard, this);
            this.finishAfterMotion();
        }, this.getProcessDelay());
    }

    processCard (card) {
        const offset = this.playerCards.getCardOffset(card);
        this.play.moveCard(card, offset, this.constructor.MOVE_DURATION, this.constructor.MOVE_DELAY)
            .done(this.afterCardMove.bind(this, card));
    }

    afterCardMove (card) {
        if (!this.isMaster()) {
            this.closeCard(card);
        }
        this.playerCards.setCardOrder(card, this.rightPlayerCard);
    }

    getProcessDelay () {
        return this.isMaster() || this.isMasterPassInPreviousEvents()
            ? this.constructor.AFTER_MASTER_DELAY
            : this.constructor.AFTER_OPPONENT_DELAY;
    }

    processHidden () {
        const cards = this.execute();
        if (!this.isMaster()) {
            cards.forEach(this.closeCard, this);
        }
        this.finish();
    }

    execute () {
        this.player.cards.add(this.cards);
        this.table.clear();
        return this.cards;
    }
};