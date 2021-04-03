/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakAttackEvent = class DurakAttackEvent extends Club.DurakEvent {

    static PROCESS_DELAY = 100;

    constructor () {
        super(...arguments);
        this.items = this.data[1];
    }

    processNormal () {
        this.table.arrange(this.items.length);
        const cards = this.execute();
        cards.forEach(this.arrangeCard, this);
        setTimeout(this.processCards.bind(this, cards), this.constructor.PROCESS_DELAY);
    }

    arrangeCard (card) {
        const index = this.table.getAttackingIndex(card);
        this.table.getDefendingCard(index - 1)?.after(card);
    }

    processCards (cards) {
        cards.forEach(this.processCard, this);
        this.play.motion.done(() => {
            this.player.arrange();
            this.play.table.arrange();
            this.finish();
        });
    }

    processCard (card, index) {
        const offset = this.table.getAttackingOffset(card);
        this.play.moveCard(card, offset).done(() => this.openCard(card, index));
    }

    processHidden () {
        this.execute().forEach(this.openCard, this);
        this.finish();
    }

    execute () {
        const attacker = this.player;
        const cards = [];
        for (const {rank, suit} of this.items) {
            let card = attacker.cards.find(rank, suit);
            if (!card && !this.isMaster()) {
                card = attacker.cards.last();
            }
            if (card) {
                attacker.removeCard(card);
                this.table.addAttack(card);
                cards.push(card);
            }
        }
        this.play.isAttackLimit()
            ? this.play.players.forEach(player => player.setTurned(true))
            : attacker.setTurned(attacker.isEmpty());
        this.play.defender.setTurned(false);
        this.play.updatePlayerMessages();
        this.play.resolveWinner(attacker);
        return cards;
    }
};