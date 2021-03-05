/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseAction');

module.exports = class AttackAction extends Base {

    validate () {
        if (!this.validateBase()) {
            return false;
        }
        const play = this.play;
        if (this.hand === play.defender) {
            return this.setError('Defender cannot attack');
        }
        const cards = play.deck.parseCards(this.data.cards);
        if (!cards || !cards.length) {
            return this.setError('Invalid cards');
        }
        for (const card of cards) {
            if (!this.hand.has(card)) {
                return this.setError(`Player has no card: ${card}`);
            }
        }
        if (play.table.countAttacks() + cards.length > play.getMaxAttacks()) {
            return this.setError('Too many attacks');
        }
        if (play.table.countOpenAttacks() + cards.length > play.defender.count()) {
            return this.setError('Not enough defender cards');
        }
        if (play.table.isEmpty()) {
            if (this.hand !== play.attacker) {
                return this.setError('Player cannot attack');
            }
            if (cards.length > 1 && !Card.isSameRank(cards)) {
                return this.setError('Attacking cards are not of the same rank');
            }
        } else if (play.options.siege) {
            if (this.hand !== play.getActiveAttacker()) {
                return this.setError(`Player cannot attack before the right neighbor`);
            }
            for (const card of cards) {
                if (!play.table.isSameRank(card)) {
                    return this.setError(`Card cannot attack: ${card}`);
                }
            }
        } else if (this.hand !== play.attacker) {
            return this.setError('Player cannot attack');
        } else {
            for (const card of cards) {
                if (!play.table.isSameAttackingRank(card)) {
                    return this.setError(`Card cannot attack: ${card}`);
                }
            }
        }
        this.cards = cards;
        return true;
    }

    execute () {
        const play = this.play;
        const data = [];
        for (const card of this.cards) {
            this.hand.remove(card);
            play.table.attack(card);
            data.push(card.data);
        }
        play.updateEmptyHands(this.hand);
        play.updateFacedCards();
        this.hand.turned = this.hand.isEmpty();
        if (play.isAttackLimit()) {
            play.hands.forEach(hand => hand.turned = true);
        }
        play.defender.turned = false;
        play.addEvent('attack', [this.hand.pos, data]);
        play.endTurn();
    }
};

const Card = require('e-champ/arena/card/Card');