/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakMaster = class DurakMaster extends Club.DurakPlayer {

    static AMBIGUOUS_MESSAGE = 'This is an ambiguous defense. Choose one attacking card';
    static CARD_BOTTOM_FACTOR = 1.8;
    static CARD_HELP = 'Press on the top of a card to action. Press the bottom to toggle selection';
    static CARD_HELP_KEY = 'club.durak.cardHelp';

    constructor () {
        super(...arguments);
        this.play.on('click', '.card[data-rank][data-suit]', this.onCard.bind(this));
        this.play.on('click', '.master-cards .small-card', this.onSmallCard.bind(this));
        this.play.on('click', '.master-scale', this.onScale.bind(this));
        this.$action = this.$container.find('.master-action');
        this.$action.click(this.onAction.bind(this));
    }

    getContainer () {
        return this.play.find(`.master`);
    }

    update () {
        this.canAct() ? this.activate() : this.deactivate();
    }

    canAct () {
        if (this.isRoundEnd()) {
            return !this.turned;
        }
        if (this.turned || this.isEmpty()) {
            return false;
        }
        const {play} = this;
        if (this.isDefender()) {
            return play.table.hasOpenAttack() && !play.getActiveAttacker();
        }
        if (play.table.isEmpty()) {
            return this.isAttacker();
        }
        if (play.isAttackLimit()) {
            return false;
        }
        return play.getActiveAttacker() === this;
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
        this.toggleScale(false);
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
        const bottom = event.offsetY * this.constructor.CARD_BOTTOM_FACTOR > this.play.getCardHeight();
        if (bottom) {
            this.showCardHelp();
        }
        if (this.selection === target) {
            return bottom
                ? this.resetSelection()
                : this.move(null, true);
        }
        if (bottom) {
            return this.setSelection(target);
        }
        this.setSelection(target);
        this.move();
    }

    move (target, reselection) {
        const {selection} = this;
        if (!selection) {
            return false;
        }
        if (!this.isDefender()) {
            return this.attack();
        }
        if (target) {
            return this.defend(target);
        }
        const cards = this.play.table.getWeakerAttackingCards(selection);
        if (this.play.canTransfer(selection)) {
            return !cards.length || reselection ? this.transfer() : null;
        }
        if (cards.length === 1) {
            return this.defend(cards[0]);
        }
        if (cards.length && reselection) {
            this.showMessage(this.constructor.AMBIGUOUS_MESSAGE);
        }
    }

    attack () {
        if (this.play.getActiveAttacker() === this && this.play.canCardAttack(this.selection)) {
            const cards = [this.selection.getData()];
            this.addPredictedEvent(Club.DurakEvent.ATTACK, [this.pos, cards]);
            this.send(Club.Durak.ACTION_ATTACK, {cards});
            return true;
        }
    }

    defend (target) {
        if (this.play.canBeat(target, this.selection)) {
            const pairs = [[target.getData(), this.selection.getData()]];
            this.addPredictedEvent(Club.DurakEvent.DEFEND, [this.pos, pairs]);
            this.send(Club.Durak.ACTION_DEFEND, {pairs});
            return true;
        }
    }

    transfer () {
        const cards = [this.selection.getData()];
        const target = this.play.getTransferTarget();
        this.addPredictedEvent(Club.DurakEvent.TRANSFER, [target.pos, cards]);
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
        this.selection = null;
        this.deactivate();
        this.play.send(...arguments);
    }

    showCardHelp () {
        if (!Jam.localStorage.get(this.constructor.CARD_HELP_KEY)) {
            this.showMessage(this.constructor.CARD_HELP);
            Jam.localStorage.set(this.constructor.CARD_HELP_KEY, true);
        }
    }

    showMessage (message) {
        return Jam.dialog.info(this.play.translate(message), {strictCancel: true});
    }

    onSmallCard (event) {
        const {rank, suit} = $(event.target).data();
        const card = this.cards.find(rank, suit);
        this.toggleScale(false);
        this.setSelection(card);
    }

    onScale () {
        this.resetSelection();
        this.toggleScale();
        this.createSmallCards();
    }

    toggleScale () {
        this.play.toggleClass('master-scaled', ...arguments);
    }

    createSmallCards () {
        const $container = this.play.find('.master-cards').empty();
        for (const card of this.cards) {
            $container.append(this.createSmallCard(card));
        }
    }

    createSmallCard (card) {
        const element = document.createElement('div');
        element.setAttribute('data-rank', card.getRank());
        element.setAttribute('data-suit', card.getSuit());
        element.classList.add('small-card');
        return element;
    }

    addPredictedEvent () {
        this.play.events.addPrediction(...arguments);
        this.play.events.process();
    }
};