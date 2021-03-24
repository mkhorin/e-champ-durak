/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakOpponent = class DurakOpponent extends Club.DurakPlayer {

    getContainer () {
        return this.play.find(`.opponent-${this.num}`);
    }

    createCardList () {
        this.$cards = this.$container.find('.player-cards');
        this.$message = this.$container.find('.player-message');
        this.$counter = this.$container.find('.player-card-counter');
        this.$counter.on('cards:change', this.onChangeCards.bind(this));
        return super.createCardList({
            $listener: this.$counter
        });
    }

    start () {
        super.start(...arguments);
        this.$container.attr('data-type', this.data.type);
    }

    arrange () {
        const rect = Club.getElementRect(this.$container);
        const list = Club.getElementRect(this.$cards);
        this.cards.setCardOrder(this.cards.get(0), this.getRightSidePlayerLastCard());
        this.cards.setOffset(rect.x + list.x, rect.y + list.y, list.w);
        this.cards.arrange();
    }

    setMessage (message) {
        this.$message.html(this.play.translate(message));
    }

    onChangeCards () {
        const total = this.cards.count();
        this.$counter.html(total).toggleClass('empty', total === 0);
    }

    getRightSidePlayerLastCard () {
        return this.num > 1
            ? this.play.players[this.num - 1].cards.last()
            : null;
    }

    openCards (data) {
        data.forEach(({rank, suit}, index) => this.cards.get(index).open(rank, suit));
    }
};