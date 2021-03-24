/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakDealEvent = class DurakDealEvent extends Club.DurakEvent {

    static MOVE_DELAY = .1;
    static MOVE_DURATION = .25;

    constructor () {
        super(...arguments);
        this.deals = this.createDeals();
    }

    createDeals () {
        return this.data.map(this.createDeal, this);
    }

    createDeal ([pos, items]) {
        const total = Array.isArray(items) ? items.length : items;
        const player = this.getPlayer(pos);
        const opened = Array.isArray(items);
        return {total, player, opened, items};
    }

    processNormal () {
        for (const {player, total} of this.deals) {
            player.cards.arrange(total);
        }
        const items = this.getMoveItems();
        this.execute();
        items.forEach(this.processMoveItem, this);
        this.finishAfterMotion();
    }

    getMoveItems () {
        const result = [];
        const {cardsDealtAtOnce, defaultCardsInHand} = this.play.options;
        const turns = Math.ceil(defaultCardsInHand / cardsDealtAtOnce);
        for (let turn = 0; turn < turns; ++turn) {
            for (const {player, total, items} of this.deals) {
                const start = turn * cardsDealtAtOnce;
                for (let i = start; i < total && i < start + cardsDealtAtOnce; ++i) {
                    const card = this.play.stock.splice(1)[0];
                    result.push([card, items[i], player]);
                    player.cards.add(card);
                }
            }
        }
        return result;
    }

    processMoveItem ([card, data, player]) {
        const offset = player.cards.getCardOffset(card);
        this.play.moveCard(card, offset, this.constructor.MOVE_DURATION, this.constructor.MOVE_DELAY)
            .done(this.afterCardMove.bind(this, ...arguments));
    }

    afterCardMove ([card, data, player]) {
        data ? this.openCard(card, data)
             : this.closeCard(card);
        player.cards.setCardOrder(card, player.getRightSidePlayerLastCard());
    }

    processHidden () {
        this.execute();
        for (const {player, total, items} of this.deals) {
            const cards = this.play.stock.splice(total);
            player.cards.add(cards);
            Array.isArray(items)
                ? cards.forEach((card, index) => this.openCard(card, items[index]))
                : cards.forEach(this.closeCard, this);
        }
        this.finish();
    }

    execute () {
        for (const {player} of this.deals) {
            player.setTurned(false);
            player.setMessage(Club.Durak.MESSAGE_WAIT);
        }
    }

    openCard (card, data) {
        card.open(data.rank, data.suit);
    }
};