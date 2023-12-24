/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('e-champ/arena/BotSolver');

module.exports = class Standard extends Base {

    /**
     * Start solver
     * @typedef {Object} Card
     * @property {number} rank - Card rank (2 - 14)
     * @property {string} name - Card suit (diamonds, hearts, clubs, spades)
     * @param {Object} data - Game state snapshot
     * @param {number} data.player - Player position
     * @param {number} data.attacker - Attacker position
     * @param {number} data.defender - Defender position
     * @param {Card[]} data.cards - Player cards
     * @param {Array} data.hands - [Number of cards in hand, Faced cards in hand]
     * @param {Array} data.table - [Attacking card, Defending card]
     * @param {number} data.stock - Number of stocked cards
     * @param {Card[]} data.discard - Discarded cards
     * @param {Card} [data.trump]
     * @param {Object} data.options - Game options
     */
    execute (data) {
        Object.assign(this, data);
        this.player === this.defender ? this.defend() : this.attack();
    }

    defend () {
        if (this.canTransfer()) {
            const card = this.getCardToTransfer();
            if (card) {
                return this.complete('transfer', {cards: [card]});
            }
        }
        const pairs = this.getPairsToDefend();
        if (pairs.length) {
            return this.complete('defend', {pairs});
        }
        this.complete('pass');
    }

    canTransfer () {
        const openAttacks = this.countOpenAttacks();
        if (this.options.transferable && openAttacks) {
            if (openAttacks === this.table.length) {
                this.transferTarget = this.getTransferTarget();
                return Number.isInteger(this.transferTarget);
            }
        }
    }

    getCardToTransfer () {
        const attacking = this.table[0][0].rank;
        for (const card of this.cards) {
            if (card.rank === attacking) {
                return card;
            }
        }
    }

    getTransferTarget () {
        const total = this.hands.length;
        for (let i = 1; i < total; ++i) {
            const pos = (this.player + i) % total;
            const [cards] = this.hands[pos];
            if (cards > 0) {
                return cards > this.table.length ? pos : null;
            }
        }
    }

    getPairsToDefend () {
        const pairs = [];
        const cards = this.cards.slice(0);
        for (let [attacking, defending] of this.table) {
            if (defending) {
                continue;
            }
            defending = this.getCardToDefend(attacking, cards);
            if (!defending) {
                return [];
            }
            cards.splice(cards.indexOf(defending), 1);
            pairs.push([attacking, defending]);
        }
        return pairs;
    }

    getCardToDefend (attacking, cards) {
        cards = this.getCardsToDefend(attacking, cards);
        return cards.length
            ? this.filterLowestCards(cards)[0]
            : null;
    }

    getCardsToDefend (attacking, cards) {
        const result = [];
        for (const card of cards) {
            if (this.canBeat(attacking, card)) {
                result.push(card);
            }
        }
        return result;
    }

    canBeat (attacking, defending) {
        if (attacking.suit !== defending.suit) {
            return this.isTrump(defending);
        }
        if (attacking.rank < defending.rank) {
            return true;
        }
        return this.options.fallenAce
            && attacking.rank === this.options.maxRank
            && defending.rank === this.options.minRank
            && this.isTrump(attacking);
    }

    isTrump (card) {
        return card.suit === this.trump?.suit;
    }

    attack () {
        const validCards = this.filterByTable(this.cards);
        const cards = this.getCardsToAttack(validCards);
        this.trimToMaxAttacks(cards);
        cards.length
            ? this.complete('attack', {cards})
            : this.complete('pass');
    }

    getCardsToAttack (validCards) {
        return this.isLonelyAttack()
            ? this.getCardsToLonelyAttack(validCards)
            : this.getCardsToNormalAttack(validCards);
    }

    isLonelyAttack () {
        return this.stock === 0
            && this.cards.length > 1
            && this.isOtherHandsEmpty();
    }

    getCardsToLonelyAttack (cards) {
        for (let i = 0; i < cards.length; ++i) {
            const card = cards[i];
            if (!this.canDefend(card) && this.isSameRank(cards, i)) {
                return [card];
            }
        }
        return this.getCardsToNormalAttack(cards);
    }

    getCardsToNormalAttack (validCards) {
        return this.filterLowestCards(validCards);
    }

    canDefend (attacking) {
        const hands = this.hands[this.defender][1];
        for (const defending of hands) {
            if (this.canBeat(attacking, defending)) {
                return true;
            }
        }
    }

    isSameRank (cards, exceptIndex) {
        let sampleRank = null;
        for (let i = 0; i < cards.length; ++i) {
            if (exceptIndex === i) {
            } else if (sampleRank === null) {
                sampleRank = cards[i].rank;
            } else if (sampleRank !== cards[i].rank) {
                return false;
            }
        }
        return true;
    }

    isOtherHandsEmpty () {
        if (this.hands.length > 2) {
            for (let i = 0; i < this.hands.length; ++i) {
                if (this.attacker !== i && this.defender !== i) {
                    if (this.hands[i][0] > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    trimToMaxAttacks (cards) {
        if (cards.length > 1) {
            const extra = cards.length - this.getMaxAttacks();
            if (extra > 0) {
                cards.splice(0, extra);
            }
        }
    }

    getMaxAttacks () {
        let total = this.discard.length
            ? this.options.maxAttacks
            : this.options.maxAttacksBeforeDiscard;
        total -= this.table.length;
        const handCards = this.hands[this.defender][0] - this.countOpenAttacks();
        return total < handCards ? total : handCards;
    }

    filterByTable (cards) {
        if (!this.table.length) {
            return cards;
        }
        const result = [];
        for (const card of cards) {
            if (this.isRankOnTable(card.rank)) {
                result.push(card);
            }
        }
        return result;
    }

    isRankOnTable (rank) {
        const {siege} = this.options;
        for (const [attacking, defending] of this.table) {
            if (attacking.rank === rank) {
                return true;
            }
            if (siege && defending?.rank === rank) {
                return true;
            }
        }
        return false;
    }

    filterLowestCards (cards) {
        if (!cards.length) {
            return cards;
        }
        let result = [cards[0]];
        for (let i = 1; i < cards.length; ++i) {
            let diff = this.compareCards(result[0], cards[i]);
            if (diff > 0) {
                result = [cards[i]];
            } else if (diff === 0) {
                result.push(cards[i]);
            }
        }
        return result;
    }

    countOpenAttacks () {
        let counter = 0;
        for (const pair of this.table) {
            if (!pair[1]) {
                ++counter;
            }
        }
        return counter;
    }

    countTable () {
        let counter = this.table.length * 2;
        for (const pair of this.table) {
            if (!pair[1]) {
                --counter;
            }
        }
        return counter;
    }

    compareCards (a, b) {
        if (a.suit === b.suit) {
            return a.rank - b.rank;
        }
        if (this.isTrump(a)) {
            return 1;
        }
        if (this.isTrump(b)) {
            return -1;
        }
        return a.rank - b.rank;
    }
};