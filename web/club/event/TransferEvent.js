/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakTransferEvent = class DurakTransferEvent extends Club.DurakEvent {

    static PROCESS_DELAY = 250;

    constructor () {
        super(...arguments);
        this.items = this.data[1];
    }

    processNormal () {
        this.table.arrange(this.items.length);
        this.execute().forEach(this.processCard, this);
        this.play.motion.done(this.processTurn.bind(this));
    }

    processCard (card, index) {
        const offset = this.table.getAttackingOffset(card);
        this.play.moveCard(card, offset).done(() => this.openCard(card, index));
    }

    processTurn () {
        this.play.attacker.arrange();
        this.play.showTurn();
        this.finishAfterMotion(this.constructor.PROCESS_DELAY);
    }

    processHidden () {
        this.execute().forEach(this.openCard, this);
        this.finish();
    }

    execute () {
        const defender = this.play.defender;
        const cards = [];
        for (const {rank, suit} of this.items) {
            let card = defender.cards.find(rank, suit);
            if (!card && this.play.defender !== this.play.master) {
                card = defender.cards.last();
            }
            if (card) {
                defender.removeCard(card);
                this.table.addAttack(card);
                cards.push(card);
            }
        }
        this.play.setAttacker(defender);
        this.play.setDefender(this.player);
        this.play.updateTurnedPlayers();
        this.play.updatePlayerMessages();
        this.play.resolveWinner(defender);
        return cards;
    }
};