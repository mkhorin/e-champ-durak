/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Club.Durak = class Durak extends Club.CardPlay {

    static CARD_SELECTION_OFFSET = 16;
    static MAX_PLAYERS = 6;
    static STATUS_MOVE_DURATION = .5;

    static ACTION_ATTACK = 'attack';
    static ACTION_CONTINUE = 'continue';
    static ACTION_DEFEND = 'defend';
    static ACTION_PASS = 'pass';
    static ACTION_TRANSFER = 'transfer';

    static MESSAGE_PASS = 'Pass';
    static MESSAGE_READY = 'Ready';
    static MESSAGE_PICK_UP = 'Pick up';
    static MESSAGE_THINK = 'Thinking...';
    static MESSAGE_WAIT = '...';

    constructor () {
        super(...arguments);
        this.setGame('durak');
        this.stock = new Club.DurakStock(this);
        this.discard = new Club.DurakDiscard(this);
        this.table = new Club.DurakTable(this);
        this.events = this.createEvents();
        this.createPlayers();
        this.countdown = this.createCountdown();
        this.turnAttackStatus = this.find('.turn-status.player-attacker').get(0);
        this.turnDefenseStatus = this.find('.turn-status.player-defender').get(0);
        $(window).resize(this.onResizeWindow.bind(this));
    }

    createEvents () {
        return super.createEvents({
            BaseEvent: Club.DurakEvent,
            onHandledEvents: this.onHandledEvents.bind(this),
            onHandledHiddenEvents: this.onHandledHiddenEvents.bind(this)
        });
    }

    createCountdown () {
        return new Club.CircularCountdown({
            refreshInterval: 200,
            $element: this.master.$action
        });
    }

    start (data) {
        super.start(...arguments);
        this.master.pos = data.pos || 0;
        this.page.toggleLoading(true);
        this.events.clear();
    }

    resolveLastHiddenEventIndex () {
        const turn = this.events.getLastIndexByName(Club.DurakEvent.TURN);
        const index = turn + 1 === this.events.count()
            ? this.events.getFirstPreviousIndexByName(turn, Club.DurakEvent.DEAL)
            : turn;
        return index - 1;
    }

    startRound (data) {
        this.clear();
        this.roundData = data;
        this.round = data.round;
        this.options = data.options;
        this.winner = null;
        this.prevAttacker = null;
        this.prevDefender = null;
        this.createCards(data.deck);
        this.startPlayers(data.players);
        this.setTrump(data.trump);
        this.stock.start();
        this.toggleRoundEnd(false);
        this.arrange();
        this.startCountdown();
    }

    clear () {
        super.clear();
        this.clearCards();
        this.stock.clear();
        this.table.clear();
        this.discard.clear();
        this.players.forEach(player => player.clear());
        this.countdown.clear();
    }

    startCountdown () {
        const timeout = this.options?.actionTimeout * 1000;
        this.countdown.start(timeout || 0, this.messageTimestamp);
    }

    startPlayers (items) {
        this.playerMap = {};
        for (let i = 0; i < items.length; ++i) {
            const pos = (i + this.master.pos) % items.length;
            this.playerMap[pos] = this.players[i];
            this.players[i].start(pos, items[pos]);
        }
        this.setDataAttr('opponents', items.length - 1);
    }

    getPlayer (pos) {
        return this.playerMap[pos];
    }

    getActiveAttacker () {
        if (!this.options.siege) {
            return this.isReadyToAttack(this.attacker) ? this.attacker : null;
        }
        const counter = this.countRoundPlayers();
        for (let i = 0; i < counter; ++i) {
            const pos = (this.attacker.pos + i) % counter;
            const player = this.getPlayer(pos);
            if (this.isReadyToAttack(player)) {
                return player;
            }
        }
    }

    createPlayers () {
        this.master = new Club.DurakMaster(0, this);
        this.players = [this.master];
        this.playerMap = {};
        const $opponents = this.find('.opponents');
        for (let num = 1; num < Club.Durak.MAX_PLAYERS; ++num) {
            const content = this.resolveTemplate('opponent', {num});
            $opponents.append(content);
            const player = new Club.DurakOpponent(num, this);
            this.players.push(player);
        }
        Jam.t($opponents);
    }

    countRoundPlayers () {
        return this.roundData.players.length;
    }

    canBeat (attacking, defending) {
        if (attacking.getSuit() !== defending.getSuit()) {
            return this.isTrump(defending);
        }
        if (attacking.getRank() < defending.getRank()) {
            return true;
        }
        return this.options.fallenAce
            && attacking.getRank() === this.options.maxRank
            && defending.getRank() === this.options.minRank
            && this.isTrump(attacking);
    }

    canCardAttack (card) {
        if (this.table.isEmpty()) {
            return true;
        }
        if (this.isAttackLimit()) {
            return false;
        }
        return this.options.siege
            ? this.table.isSameRank(card)
            : this.table.isSameAttackingRank(card);
    }

    canTransfer (card) {
        return this.options.transferable
            && this.table.countAttacks() < this.getMaxAttacks()
            && this.table.canTransfer(card)
            && this.getTransferTarget();
    }

    getTransferTarget () {
        const counter = this.countRoundPlayers();
        for (let i = 1; i < counter; ++i) {
            const pos = (this.defender.pos + i) % counter;
            const player = this.getPlayer(pos);
            const numCards = player.cards.count();
            if (numCards) {
                return numCards > this.table.countAttacks() ? player : null;
            }
        }
    }

    getMaxAttacks () {
        return this.discard.count()
            ? this.options.maxAttacks
            : this.options.maxAttacksBeforeDiscard;
    }

    isAttackLimit () {
        return this.table.countAttacks() === this.getMaxAttacks()
            || this.table.getOpenAttackingCards().length === this.defender.cards.count()
            || this.table.hasOnlyFullRanks();
    }

    isFinished () {
        return this.events.getLastIndexByName(Club.DurakEvent.END) !== undefined;
    }

    isReadyToAttack (player) {
        return !player.turned
            && player !== this.defender
            && player.cards.count();
    }

    isTrump (card) {
        return card.getSuit() === this.trump?.suit;
    }

    setTrump (data) {
        this.trump = data;
        this.setDataAttr('trump', data?.suit);
    }

    setAttacker (player) {
        this.prevAttacker = this.attacker;
        this.setDataAttr('attacker', player ? player.num : null);
        this.attacker = player;
    }

    setDefender (player) {
        this.prevDefender = this.defender;
        this.setDataAttr('defender', player ? player.num : null);
        this.defender = player;
    }

    resolveWinner (player) {
        if (!player || !player.isEmpty() || !this.stock.isEmpty()) {
            return false;
        }
        if (!this.winner) {
            player.setWinner();
            this.winner = player;
            return true;
        }
        if (this.players.filter(player => !player.isEmpty()).length > 1) {
            player.setFinisher();
        }
    }

    onMessage (data) {
        super.onMessage(data);
        this.events.add(data.events);
        this.events.process();
        this.startCountdown();
    }

    onHandledHiddenEvents () {
        this.page.toggleLoading(false);
        this.toggleClass('hidden', false);
        this.arrange();
    }

    onHandledEvents () {
        if (!this.events.prediction) {
            this.master.update();
        }
    }

    arrange () {
        this.setCardSize();
        this.stock.arrange();
        this.table.arrange();
        this.discard.arrange();
        this.players.forEach(player => player.arrange());
    }

    updateTurnedPlayers () {
        this.players.forEach(player => player.setTurned(player.isEmpty()));
    }

    updatePlayerMessages () {
        this.players.forEach(player => player.updateMessage());
    }

    toggleRoundEnd (state) {
        this.finished = state;
        this.toggleClass('end', state);
        if (state) {
            this.setAttacker(null);
            this.setDefender(null);
        }
    }

    onResizeWindow () {
        if (!this.motion.isActive()) {
            this.arrange();
        }
    }

    showTurn () {
        if (!this.prevAttacker) {
            return null;
        }
        this.toggleClass('show-statuses', true); // show all player statuses to get valid offsets
        if (this.attacker !== this.prevAttacker) {
            this.moveStatus(this.turnAttackStatus, this.attacker, this.prevAttacker);
        }
        if (this.defender !== this.prevDefender) {
            this.moveStatus(this.turnDefenseStatus, this.defender, this.prevDefender);
        }
        this.toggleClass('show-statuses', false);
        this.toggleClass('turning', true);
        this.motion.done(() => this.toggleClass('turning', false));
    }

    moveCard (card) {
        card.toggleClass('selected', false);
        return super.moveCard(...arguments);
    }

    moveStatus (status, player, prevPlayer) {
        this.motion.move({
            element: status,
            source: prevPlayer.getStatusOffset(),
            target: player.getStatusOffset(),
            duration: Club.Durak.STATUS_MOVE_DURATION
        });
    }

    hasExportData () {
        return !this.isFinished();
    }

    exportData () {
        return Object.assign(super.exportData(), {
            events: this.events.items,
            pos: this.master.pos
        });
    }
};