/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseAction');

module.exports = class TransferAction extends Base {

    validate () {
        if (!this.validateBase()) {
            return false;
        }
        const {play} = this;
        if (!play.options.transferable) {
            return this.setError('No transferable option');
        }
        if (this.hand !== play.defender) {
            return this.setError('Player is not defender');
        }
        if (play.table.isEmpty() || play.table.hasAnyDefense()) {
            return this.setError('Transfer is not possible');
        }
        if (play.getActiveAttacker()) {
            return this.setError('Attack is not over yet');
        }
        const cards = play.deck.parseCards(this.data.cards);
        if (!cards || !cards.length) {
            return this.setError('Invalid cards');
        }
        for (const card of cards) {
            if (!play.table.isSameAttackingRank(card)) {
                return this.setError(`Card cannot transfer: ${card}`);
            }
        }
        const attacks = play.table.countAttacks() + cards.length;
        if (attacks > play.getMaxAttacks()) {
            return this.setError('Too many attacks');
        }
        const target = play.getLeftSideHandWithCards(this.hand);
        if (!target) {
            return this.setError('No target player');
        }
        if (target.count() < attacks) {
            return this.setError('Not enough target player cards');
        }
        this.target = target;
        this.cards = cards;
        return true;
    }

    execute () {
        const {play} = this;
        const data = [];
        for (const card of this.cards) {
            this.hand.remove(card);
            play.table.attack(card);
            data.push(card.data);
        }
        play.updateEmptyHands(this.hand);
        play.updateFacedCards();
        play.attacker = play.defender;
        play.defender = this.target;
        play.updateTurnedHands();
        play.addEvent('transfer', [this.target.pos, data]);
        play.endTurn();
    }
};