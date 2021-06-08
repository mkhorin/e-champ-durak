/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('e-champ/arena/Play');

module.exports = class Durak extends Base {

    start () {
        super.start();
        this.deck = new Deck;
        //this.options.deck = 'test';
        //this.options.shuffle = false;
        this.deck.createCards(this.options.deck, this.game.decks);
        this.options.minRank = this.deck.minRank;
        this.options.maxRank = this.deck.maxRank;
        this.stock = new Stock;
        this.table = new Table;
        this.discard = new Discard;
        this.hands = this.room.players.map(this.createHand, this);
        this.botHands = this.hands.filter(hand => hand.isBot());
        this.round = 0;
        this.startRound();
    }

    createHand (player) {
        return new Hand(player);
    }

    startRound () {
        this.table.clear();
        this.discard.clear();
        this.hands.forEach(hand => hand.clear());
        this.stock.clear();
        this.stock.add(this.deck);
        if (this.options.shuffle) {
            this.stock.shuffle({
                maxOneColorSequence: this.options.maxOneColorSequenceFromStock
            });
        }
        this.setTrump();
        this.attacker = null;
        this.defender = null;
        this.finished = false;
        this.allCardsFaced = false;
        this.picked = false;
        this.emptyHands = [];
        this.events.clear();
        this.addEvent('round', {
            deck: this.deck.count(),
            options: this.options,
            players: this.hands.map(hand => hand.getData()),
            round: this.round,
            trump: this.trump?.serialize()
        });
        this.startTurn();
        this.update();
    }

    setTrump () {
        if (this.options.withoutTrump) {
            this.trump = null;
        } else {
            this.trump = this.stock.get(0);
            this.trump.faced = true;
        }
    }

    startTurn () {
        this.dealCards();
        if (this.getHandsWithCards().length < 2) {
            return this.endRound();
        }
        this.attacker = this.attacker
            ? this.getLeftSideHandWithCards(this.picked ? this.defender : this.attacker)
            : this.resolveRoundAttacker();
        this.defender = this.getLeftSideHandWithCards(this.attacker);
        this.picked = false;
        this.changedDefendingCards = false;
        this.updateTurnedHands();
        this.addEvent('turn', {
            attacker: this.attacker?.pos,
            defender: this.defender?.pos
        });
    }

    resolveRoundAttacker () {
        if (!this.roundLoser) {
            return (this.trump && this.getHandWithLowestTrump()) || this.getHandWithLowestCard();
        }
        return this.options.attackLoser
            ? this.getRightSideHand(this.roundLoser)
            : this.getLeftSideHand(this.roundLoser);
    }

    getHandWithLowestTrump () {
        let lowestHand = null;
        let lowestRank = Number.MAX_SAFE_INTEGER;
        for (const hand of this.hands) {
            const card = hand.getLowestBySuit(this.trump.suit);
            if (card && card.rank < lowestRank) {
                lowestHand = hand;
                lowestRank = card.rank;
            }
        }
        return lowestHand;
    }

    getHandWithLowestCard () {
        let lowestHands = [];
        let lowestRank = Number.MAX_SAFE_INTEGER;
        for (const hand of this.hands) {
            const card = hand.getLowest();
            if (!card) {
            } else if (card.rank < lowestRank) {
                lowestHands = [hand];
                lowestRank = card.rank;
            } else if (card.rank === lowestRank) {
                lowestHands.push(hand);
            }
        }
        return ArrayHelper.random(lowestHands);
    }

    endRound () {
        const hands = this.getHandsWithCards();
        const empties = this.emptyHands.length;
        const loser = hands[0];
        const winner = loser || empties > 2 ? this.emptyHands[0] : null;
        const draw1 = loser ? null : this.emptyHands[empties - 1];
        const draw2 = loser ? null : this.emptyHands[empties - 2];
        winner?.addWin();
        loser?.addLosing();
        draw1?.addDraw();
        draw2?.addDraw();
        this.finished = true;
        this.roundLoser = loser;
        this.addEvent('end', {
            winner: winner?.pos,
            loser: loser?.pos,
            draw1: draw1?.pos,
            draw2: draw2?.pos,
            loserCards: loser?.serialize(),
        });
        this.hands.forEach(hand => hand.turned = false);
        this.botHands.forEach(this.setHandReady, this);
    }

    getHandsWithCards () {
        return this.hands.filter(hand => hand.count());
    }

    getLeftSideHandWithCards (current) {
        for (let i = 1; i < this.hands.length; ++i) {
            const hand = this.getHandByPos(current.pos + i);
            if (hand.count()) {
                return hand;
            }
        }
    }

    getActiveAttacker () {
        const hands = this.options.siege ? this.hands.length : 1;
        for (let i = 0; i < hands; ++i) {
            const hand = this.getHandByPos(this.attacker.pos + i);
            if (!hand.turned && hand !== this.defender && hand.count()) {
                return hand;
            }
        }
    }

    getLeftSideHand (hand) {
        return this.getHandByPos(hand.pos + 1);
    }

    getRightSideHand (hand) {
        return this.getHandByPos(hand.pos - 1);
    }

    getHandByPos (pos) {
        return this.hands[(pos + this.hands.length) % this.hands.length];
    }

    dealCards () {
        const deals = [];
        for (const hand of this.sortHandsToDeal()) {
            const requires = this.countRequiredCards(hand);
            if (requires) {
                deals.push({cards: [], requires, hand});
            }
        }
        while (this.executeCardDeals(deals)) {}
        const result = [];
        for (const {cards, hand} of deals) {
            if (cards.length) {
                hand.add(cards);
                this.updateEmptyHands(hand);
                result.push([hand.pos, cards]);
            }
        }
        if (result.length) {
            this.updateFacedCards();
            this.addEvent('deal', result);
        }
    }

    executeCardDeals (deals) {
        let max = this.options.cardsDealtAtOnce;
        let dealt = false;
        for (const deal of deals) {
            const cards = this.stock.getDealCards(deal.requires > max ? max : deal.requires);
            if (cards.length) {
                deal.requires -= cards.length;
                deal.cards.push(...cards);
                dealt = dealt || deal.requires;
            }
        }
        return dealt;
    }

    sortHandsToDeal () {
        const start = this.attacker ? this.attacker.pos : 0;
        const last = this.defender ? this.defender.pos : null;
        const hands = [];
        for (let i = 0; i < this.hands.length; ++i) {
            const pos = (start + i) % this.hands.length;
            if (pos !== last) {
                hands.push(this.hands[pos]);
            }
        }
        if (this.defender) {
            hands.push(this.defender);
        }
        return hands;
    }

    countRequiredCards (hand) {
        const value = this.options.defaultCardsInHand - hand.count();
        return value < 0 ? 0 : value;
    }

    countHandsWithCards () {
        return this.hands.length - this.emptyHands.length;
    }

    setHandReady (hand) {
        hand.turned = true;
        this.addEvent('ready', [hand.pos]);
    }

    isTrump (card) {
        return this.trump && card.suit === this.trump.suit;
    }

    canBeat (attacking, defending) {
        if (attacking.suit !== defending.suit) {
            return this.isTrump(defending);
        }
        if (attacking.rank < defending.rank) {
            return true;
        }
        return this.options.fallenAce
            && attacking.rank === this.deck.maxRank
            && defending.rank === this.deck.minRank
            && this.isTrump(attacking);
    }

    canDefend (attacking) {
        for (const defending of this.defender) {
            if (this.canBeat(attacking, defending)) {
                return true;
            }
        }
    }

    canDefendAll () {
        for (const attacking of this.table.getOpenAttacks()) {
            if (!this.canDefend(attacking)) {
                return false;
            }
        }
        return true;
    }

    isAttackLimit () {
        return this.table.countAttacks() === this.getMaxAttacks()
            || this.table.countOpenAttacks() === this.defender.count()
            || this.table.hasOnlyFullRanks();
    }

    getMaxAttacks () {
        return this.discard.count()
            ? this.options.maxAttacks
            : this.options.maxAttacksBeforeDiscard;
    }

    updateEmptyHands (hand) {
        const index = this.emptyHands.indexOf(hand);
        hand.isEmpty()
            ? index === -1 && this.emptyHands.push(hand)
            : index !== -1 && this.emptyHands.splice(index, 1);
    }

    updateFacedCards () {
        if (!this.allCardsFaced && this.emptyHands.length + 2 === this.hands.length && this.stock.isEmpty()) {
            this.hands.forEach(card => card.faced = true);
            this.allCardsFaced = true;
        }
    }

    updateTurnedHands () {
        const attacks = this.table.countAttacks();
        const openAttacks = this.table.countOpenAttacks();
        const fullAttack = openAttacks === this.defender.count()
            || attacks === this.getMaxAttacks()
            || this.table.hasOnlyFullRanks();
        for (const hand of this.hands) {
            hand.turned = hand.isEmpty()
                || (!this.options.siege && hand !== this.attacker && hand !== this.defender)
                || (hand === this.defender ? attacks && !openAttacks : fullAttack);
        }
    }

    endTurn () {
        if (this.isObviousRoundEnd()) {
            return this.endRound();
        }
        for (const hand of this.hands) {
            if (!hand.turned) {
                return false;
            }
        }
        if (this.table.countAttacks()) {
            this.table.hasOpenAttack() ? this.pickUpTable() : this.discardTable();
        }
        this.table.clear();
        this.startTurn();
        return true;
    }

    isObviousRoundEnd () {
        if (!this.stock.isEmpty()) {
            return false;
        }
        const hands = this.countHandsWithCards();
        if (hands > 1) {
            return false;
        }
        return hands === 0
            || this.defender.isEmpty()
            || this.defender.count() > this.table.countOpenAttacks()
            || !this.canDefendAll();
    }

    discardTable () {
        this.discard.add(this.table.getCards());
        this.addEvent('discard');
    }

    pickUpTable () {
        this.picked = true;
        this.defender.add(this.table.getCards());
        this.updateEmptyHands(this.defender);
        this.addEvent('pickUp', [this.defender.pos]);
    }

    updateBots () {
        if (this.isFinished()) {
            return;
        }
        if (!this.isAttackLimit()) {
            const attacker = this.getActiveAttacker();
            if (attacker) {
                return attacker?.isBot() ? this.startBot(attacker) : null;
            }
        }
        if (!this.defender.turned && this.defender.isBot() && this.table.hasOpenAttack()) {
            this.startBot(this.defender);
        }
    }

    startBot (hand) {
        hand.player.createSolver(this.createSnapshot(hand));
    }

    createSnapshot (hand) {
        return {
            player: hand.pos,
            cards: hand.serialize(),
            attacker: this.attacker.pos,
            defender: this.defender.pos,
            hands: this.serializeHands(),
            table: this.table.serialize(),
            stock: this.stock.count(),
            trump: this.trump?.data,
            discard: this.discard.serialize(),
            options: {...this.options}
        };
    }

    serializeHands () {
        const result = [];
        for (const hand of this.hands) {
            result.push(hand.serializeFacedCards());
        }
        return result;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const Deck = require('e-champ/arena/card/Deck');
const Discard = require('e-champ/arena/card/Discard');
const Hand = require('e-champ/arena/card/Hand');
const Stock = require('e-champ/arena/card/Stock');
const Table = require('e-champ/arena/card/Table');