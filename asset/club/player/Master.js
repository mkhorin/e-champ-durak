/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakMaster = class DurakMaster extends Club.DurakPlayer {

    static TOP_HALF_MULTIPLIER = 1.5;

    constructor () {
        super(...arguments);
        this.play.on('click', '.card[data-rank][data-suit]', this.onCard.bind(this));
        this.$action = this.$container.find('.master-action');
        this.$action.click(this.onAction.bind(this));
    }

    getContainer () {
        return this.play.find(`.master`);
    }

    canAct () {
        if (this.isRoundEnd()) {
            return !this.turned;
        }
        if (this.turned || this.isEmpty()) {
            return false;
        }
        const table = this.play.table;
        if (this.isDefender()) {
            return table.hasOpenAttack();
        }
        if (table.isEmpty()) {
            return this.isAttacker();
        }
        if (this.play.isAttackLimit()) {
            return false;
        }
        return this.play.getActiveAttacker() === this;
    }

    update () {
        this.canAct() ? this.activate() : this.deactivate();
    }

    activate () {
        super.activate();
        this.play.toggleClass('master', true);
        this.play.toggleClass('defender', this.isDefender());
        this.toggleAction(this.isRoundEnd() || !this.play.table.isEmpty());
    }

    deactivate () {
        super.deactivate();
        this.play.toggleClass('master', false);
        this.toggleAction(false);
        this.resetSelection();
    }

    onAction () {
        this.resetSelection();
        this.isRoundEnd() ? this.continue() : this.pass();
    }

    continue () {
        this.send(Club.Durak.ACTION_CONTINUE);
    }

    pass () {
        this.send(Club.Durak.ACTION_PASS);
    }

    onCard (event) {
        const target = $(event.target).data('card');
        if (!this.active || !target || this.isRoundEnd()) {
            return false;
        }
        if (this.selection && this.play.table.isOpenAttackingCard(target)) {
            return this.move(target);
        }
        if (!this.cards.has(target)) {
            return false;
        }
        const topHalf = event.offsetY * this.constructor.TOP_HALF_MULTIPLIER < this.play.getCardHeight();
        if (this.selection === target) {
            return !topHalf || !this.move() ? this.resetSelection() : true;
        }
        if (!topHalf) {
            return this.setSelection(target);
        }
        this.setSelection(target);
        this.move();
    }

    move (target) {
        const card = this.selection;
        if (!card) {
            return false;
        }
        if (!this.isDefender()) {
            return this.attack();
        }
        if (target) {
            return this.defend(target);
        }
        if (this.play.canTransfer(card)) {
            return this.transfer();
        }
        target = this.play.table.resolveAttackingCard(card);
        if (target) {
            return this.defend(target);
        }
    }

    attack () {
        if (this.play.getActiveAttacker() === this && this.play.canCardAttack(this.selection)) {
            this.toggleSelectedClass(false);
            const cards = [this.selection.getData()];
            this.send(Club.Durak.ACTION_ATTACK, {cards});
            return true;
        }
    }

    defend (target) {
        if (this.play.canBeat(target, this.selection)) {
            this.toggleSelectedClass(false);
            const pairs = [[target.getData(), this.selection.getData()]];
            this.send(Club.Durak.ACTION_DEFEND, {pairs});
            return true;
        }
    }

    transfer () {
        this.toggleSelectedClass(false);
        const cards = [this.selection.getData()];
        this.send(Club.Durak.ACTION_TRANSFER, {cards});
        return true;
    }

    toggleAction (state) {
        this.$action.toggleClass('active', state);
    }

    setSelection (card) {
        this.resetSelection();
        this.selection = card;
        this.arrangeSelection();
    }

    resetSelection () {
        this.resetSelectionOffset();
        this.toggleSelectedClass(false);
        this.selection = null;
    }

    resetSelectionOffset () {
        this.selection?.changeOffset(0, Club.Durak.CARD_SELECTION_OFFSET);
    }

    toggleSelectedClass (state) {
        this.selection?.toggleClass('selected', state);
    }

    removeCard (card) {
        this.selection = null;
        return super.removeCard(card);
    }

    setEndStatus (status) {
        super.setEndStatus(status);
        this.play.find('.round-message').attr('data-status', status);
    }

    arrange () {
        const rect = this.play.getElementRect('.master-cards');
        this.cards.setOffset(rect.x, rect.y, rect.w);
        this.cards.arrange();
        this.arrangeSelection();
    }

    arrangeSelection () {
        this.selection?.changeOffset(0, -Club.Durak.CARD_SELECTION_OFFSET);
        this.toggleSelectedClass(true);
    }

    send () {
        this.play.send(...arguments);
        this.toggleSelectedClass(false);
        this.selection = null;
        this.deactivate();
    }
};