/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakPlayer = class DurakPlayer {

    constructor (num, play) {
        this.play = play;
        this.num = num;
        this.$container = this.getContainer();
        this.cards = this.createCardList();
        this.$won = this.$container.find('.player-stat-won');
        this.$lost = this.$container.find('.player-stat-lost');
        this.$drawn = this.$container.find('.player-stat-drawn');
        this.clear();
    }

    isEmpty () {
        return this.cards.isEmpty();
    }

    isAttacker () {
        return this.play.attacker === this;
    }

    isDefender () {
        return this.play.defender === this;
    }

    isRoundEnd () {
        return this.play.finished;
    }

    activate () {
        this.active = true;
    }

    deactivate () {
        this.active = false;
    }

    setTurned (state) {
        this.turned = state;
    }

    toggleClass () {
        this.$container.toggleClass(...arguments);
    }

    updateMessage () {
        this.setMessage(this.getMessage());
    }

    getMessage () {
        if (this.isDefender()) {
            if (!this.play.table.hasOpenAttack()) {
                return Club.Durak.MESSAGE_WAIT;
            }
            return this.turned
                ? Club.Durak.MESSAGE_PICK_UP
                : Club.Durak.MESSAGE_THINK;
        }
        if (this.play.isAttackLimit()) {
            return Club.Durak.MESSAGE_WAIT;
        }
        if (this.play.getActiveAttacker() === this) {
            return Club.Durak.MESSAGE_THINK;
        }
        return !this.turned || this.isEmpty()
            ? Club.Durak.MESSAGE_WAIT
            : Club.Durak.MESSAGE_PASS;
    }

    setMessage () {}

    getContainer () {}

    clear () {
        this.cards.clear();
        this.active = false;
        this.setEndStatus('');
        this.setMessage('');
    }

    createCardList () {
        return this.play.createCardList(...arguments);
    }

    start (pos, data) {
        this.pos = pos;
        this.data = data;
        this.$won.html(data.won);
        this.$lost.html(data.lost);
        this.$drawn.html(data.drawn);
        this.setMessage(Club.Durak.MESSAGE_WAIT);
        this.setName();
        this.arrange();
    }

    setName () {
        const name = this.play.resolvePlayerName(this.data);
        this.$container.find('.player-name').html(name).attr('title', name);
    }

    onMoveCard (card, data) {
        this.cards.add(card);
        if (data) {
            card.open(data.rank, data.suit);
        }
    }

    removeCard () {
        this.cards.remove(...arguments);
    }

    getRightSidePlayerLastCard () {
        return null;
    }

    openCards () {}

    setWinner () {
        this.setEndStatus('winner');
        this.incrementStatCounter(this.$won);
    }

    setFinisher () {
        this.setEndStatus('out');
    }

    setLoser (cards) {
        this.openCards(cards);
        this.setEndStatus('loser');
        this.incrementStatCounter(this.$lost);
    }

    setDraw () {
        this.setEndStatus('draw');
        this.incrementStatCounter(this.$drawn);
    }

    setEndStatus (status) {
        this.endStatus = status;
        this.$container.attr('data-end', status);
    }

    incrementStatCounter ($stat) {
        $stat.html(parseInt($stat.html()) + 1);
    }

    getStatusOffset () {
        return this.play.getOffset(this.$container.find('.player-status').first());
    }
};