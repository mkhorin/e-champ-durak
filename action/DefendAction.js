/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseAction');

module.exports = class DefendAction extends Base {

    validate () {
        if (!this.validateBase()) {
            return false;
        }
        const play = this.play;
        const items = play.deck.parsePairs(this.data.pairs);
        if (!items || !items.length) {
            return this.setError('Invalid pairs');
        }
        if (this.hand !== play.defender) {
            return this.setError('Player cannot defend');
        }
        for (const item of items) {
            const [attacking, defending] = item;
            const pair = play.table.getPairByAttacking(attacking);
            if (!pair) {
                return this.setError(`No attacking card: ${attacking}`);
            }
            if (pair[1]) {
                return this.setError(`Attacking card is already beaten: ${attacking}`);
            }
            if (!this.hand.has(defending)) {
                return this.setError(`Hand has no card: ${defending}`);
            }
            if (!play.canBeat(attacking, defending)) {
                return this.setError(`Defending card is weak: ${defending}`);
            }
            item.push(pair);
        }
        this.items = items;
        return true;
    }

    execute () {
        const data = [];
        for (const [attacking, defending, pair] of this.items) {
            this.hand.remove(defending);
            pair[1] = defending;
            data.push([attacking.data, defending.data]);
            defending.faced = true;
        }
        this.play.updateEmptyHands(this.hand);
        this.play.updateFacedCards();
        this.play.updateTurnedHands();
        this.play.addEvent('defend', [this.hand.pos, data]);
        this.play.endTurn();
    }
};