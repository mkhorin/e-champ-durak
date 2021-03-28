/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakEvent = class DurakEvent {

    static ATTACK = 'attack';
    static DEAL = 'deal';
    static DEFEND = 'defend';
    static DISCARD = 'discard';
    static END = 'end';
    static PASS = 'pass';
    static READY = 'ready';
    static ROUND = 'round';
    static PICK_UP = 'pickUp';
    static TRANSFER = 'transfer';
    static TURN = 'turn';

    static getClass (name) {
        switch (name) {
            case this.ATTACK: return Club.DurakAttackEvent;
            case this.DEAL: return Club.DurakDealEvent;
            case this.DEFEND: return Club.DurakDefendEvent;
            case this.DISCARD: return Club.DurakDiscardEvent;
            case this.END: return Club.DurakEndEvent;
            case this.PASS: return Club.DurakPassEvent;
            case this.READY: return Club.DurakReadyEvent;
            case this.ROUND: return Club.DurakRoundEvent;
            case this.PICK_UP: return Club.DurakPickUpEvent;
            case this.TRANSFER: return Club.DurakTransferEvent;
            case this.TURN: return Club.DurakTurnEvent;
        }
    }

    constructor (params) {
        this.play = params.play;
        this.table = this.play.table;
        this.hidden = params.hidden;
        this.data = params.data;
        this.player = this.getPlayer(this.data?.[0]);
        this.index = params.index;
        this.onHandled = params.onHandled;
    }

    isMaster () {
        return this.player === this.play.master;
    }

    isMasterPassInPreviousEvents () {
        const items = this.play.events.slice(0, this.index).reverse();
        for (const [name, data] of items) {
            if (name !== Club.DurakEvent.PASS) {
                return false;
            }
            if (this.play.master.pos === data[0]) {
                return true;
            }
        }
    }

    getPlayer (pos) {
        return this.play.getPlayer(pos);
    }

    process () {
        this.hidden ? this.processHidden() : this.processNormal();
    }

    processHidden () {
        this.finish();
    }

    processNormal () {
        this.finish();
    }

    finish () {
        this.onHandled(this);
    }

    finishAfterMotion (delay = 0) {
        this.play.motion.done(() => setTimeout(this.finish.bind(this), delay));
    }

    arrangeAfterMotion (player) {
        this.play.motion.done(player.arrange.bind(player));
    }

    openCard (card, index) {
        card.open(this.items[index].rank, this.items[index].suit);
        card.toggleClass('selected', false);
    }

    closeCard (card) {
        if (!this.play.keepFacedCards) {
            card.close()
        }
    }
};