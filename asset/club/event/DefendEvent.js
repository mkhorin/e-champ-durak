/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakDefendEvent = class DurakDefendEvent extends Club.DurakEvent {

    static PROCESS_DELAY = 100;

    constructor () {
        super(...arguments);
        this.items = this.data[1];
    }

    processNormal () {
        const pairs = this.execute();
        pairs.forEach(({attacking, defending}) => attacking.after(defending));
        setTimeout(this.processPairs.bind(this, pairs), this.constructor.PROCESS_DELAY);
    }

    processPairs (pairs) {
        pairs.forEach(this.processPair, this);
        this.play.motion.done(() => {
            this.player.arrange();
            this.play.table.arrange();
            this.finish();
        });
    }

    processPair ({attacking, defending}, index) {
        const offset = this.table.getDefendingOffset(defending);
        this.play.moveCard(defending, offset)
            .done(() => this.openCard(defending, index));
    }

    processHidden () {
        this.execute().forEach(({defending}, index) => this.openCard(defending, index));
        this.finish();
    }

    execute () {
        const defender = this.player;
        const cards = [];
        for (let [attacking, defending] of this.items) {
            attacking = this.play.cards.find(attacking.rank, attacking.suit);
            defending = defender.cards.find(defending.rank, defending.suit) || defender.cards.last();
            defender.removeCard(defending);
            this.table.addDefense(attacking, defending);
            cards.push({attacking, defending});
        }
        this.play.updateTurnedPlayers();
        this.play.updatePlayerMessages();
        this.play.master.update();
        this.play.resolveWinner(defender);
        return cards;
    }

    openCard (card, index) {
        card.open(this.items[index][1].rank, this.items[index][1].suit);
    }
};