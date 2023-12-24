/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakTransferEvent = class DurakTransferEvent extends Club.DurakEvent {

    static PROCESS_DELAY = 250;

    constructor () {
        super(...arguments);
        this.from = this.play.defender;
        this.target = this.player;
        this.items = this.data[1];
    }

    processNormal () {
        this.table.arrange(this.items.length);
        this.executeCards().forEach(this.processCard, this);
        this.play.motion.done(this.processTurn.bind(this));
    }

    processCard (card, index) {
        if (this.from !== this.play.master) {
            this.closeCard(card);
        }
        const offset = this.table.getAttackingOffset(card);
        this.play.moveCard(card, offset).done(() => this.openCard(card, index));
    }

    processTurn () {
        this.from.arrange();
        this.executeTurn();
        this.play.showTurn();
        this.finishAfterMotion(this.constructor.PROCESS_DELAY);
    }

    processHidden () {
        this.executeCards();
        this.executeTurn();
        this.finish();
    }

    executeCards () {
        const cards = [];
        for (const {rank, suit} of this.items) {
            let card = this.from.cards.find(rank, suit);
            if (!card && this.from !== this.play.master) {
                card = this.from.cards.last();
                card.open(rank, suit);
            }
            if (card) {
                this.from.removeCard(card);
                this.table.addAttack(card);
                cards.push(card);
            }
        }
        return cards;
    }

    executeTurn () {
        const {play} = this;
        play.setAttacker(this.from);
        play.setDefender(this.target);
        play.isAttackLimit()
            ? play.players.forEach(player => player.setTurned(true))
            : play.updateTurnedPlayers();
        play.defender.setTurned(false);
        play.updatePlayerMessages();
        play.resolveWinner(this.from);
    }
};