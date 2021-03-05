/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakTable = class DurakTable {

    constructor (play) {
        this.play = play;
        this.clear();
    }

    isEmpty () {
        return !this.countAttacks();
    }

    isSameRank (card) {
        const rank = card.getRank();
        for (const [attacking, defending] of this.pairs) {
            if (attacking.getRank() === rank || (defending?.getRank() === rank)) {
                return true;
            }
        }
    }

    isSameAttackingRank (card) {
        const rank = card.getRank();
        for (const [attacking] of this.pairs) {
            if (attacking.getRank() === rank) {
                return true;
            }
        }
    }

    isOpenAttackingCard (card) {
        for (const [attacking, defending] of this.pairs) {
            if (card === attacking && !defending) {
                return true;
            }
        }
    }

    hasOnlyFullRanks () {
        if (this.pairs.length !== 4) {
            return false;
        }
        const attackingRank = this.pairs[0][0]?.getRank();
        for (const [attacking] of this.pairs) {
            if (attacking.getRank() !== attackingRank) {
                return false;
            }
        }
        const defendingRank = this.pairs[0][1]?.getRank();
        for (const [, defending] of this.pairs) {
            if (defending?.getRank() !== defendingRank) {
                return false;
            }
        }
        return true;
    }

    hasOpenAttack () {
        for (const pair of this.pairs) {
            if (!pair[1]) {
                return true;
            }
        }
    }

    addAttack (attacking) {
        this.pairs.push([attacking]);
    }

    addDefense (attacking, defending) {
        const index = this.getAttackingIndex(attacking);
        this.pairs[index][1] = defending;
    }

    canTransfer (card) {
        const rank = card.getRank();
        for (const [attacking, defending] of this.pairs) {
            if (defending || attacking.getRank() !== rank) {
                return false;
            }
        }
        return this.pairs.length > 0;
    }

    clear () {
        this.pairs = [];
    }

    countAttacks () {
        return this.pairs.length;
    }

    getCards () {
        const cards = [];
        for (const [attacking, defending] of this.pairs) {
            cards.push(attacking);
            if (defending) {
                cards.push(defending);
            }
        }
        return cards;
    }

    getLastCard () {
        const pair = this.pairs[this.pairs.length - 1];
        return pair ? pair[1] || pair[0] : null;
    }

    getAttackingCard (index) {
        return this.pairs[index]?.[0];
    }

    getDefendingCard (index) {
        return this.pairs[index]?.[1];
    }

    resolveAttackingCard (card) {
        const cards = [];
        for (const attacking of this.getOpenAttackingCards()) {
            if (this.play.canBeat(attacking, card)) {
                cards.push(attacking);
            }
        }
        return cards.length === 1 ? cards[0] : null;
    }

    getOpenAttackingCards () {
        const cards = [];
        for (const [attacking, defending] of this.pairs) {
            if (!defending) {
                cards.push(attacking);
            }
        }
        return cards;
    }

    getAttackingOffset (card) {
        const [dx, dy] = this.getOffsetStep(this.countAttacks());
        const index = this.getAttackingIndex(card);
        return [
            this.rect.x + dx * index,
            this.rect.y + dy * index
        ];
    }

    getAttackingIndex (card) {
        for (let i = 0; i < this.countAttacks(); ++i) {
            if (this.pairs[i][0] === card) {
                return i;
            }
        }
    }

    getDefendingOffset (card) {
        const [dx, dy] = this.getOffsetStep(this.countAttacks());
        const index = this.getDefendingIndex(card);
        return [
            this.rect.x + dx * index + this.defenseRect.x,
            this.rect.y + dy * index + this.defenseRect.y
        ];
    }

    getDefendingIndex (card) {
        for (let i = 0; i < this.countAttacks(); ++i) {
            if (this.pairs[i][1] === card) {
                return i;
            }
        }
    }

    getOffsetStep (total) {
        const cardWidth = this.play.getCardWidth();
        return [Club.getOffsetStep(this.rect.w, cardWidth, total, Club.Durak.TABLE_CARD_SPACE), 0];
    }

    arrange (addition = 0) {
        this.rect = this.play.getElementRect('.table');
        this.defenseRect = this.play.getElementRect('.table-defense');
        const total = this.countAttacks();
        const [dx, dy] = this.getOffsetStep(total + addition);
        for (let i = 0; i < total; ++i) {
            const [attacking, defending] = this.pairs[i];
            const x = this.rect.x + dx * i;
            const y = this.rect.y + dy * i;
            attacking?.setOffset(x, y);
            defending?.setOffset(x + this.defenseRect.x, y + this.defenseRect.y);
        }
        this.reorder();
    }

    reorder () {
        let prev = null;
        for (const [attacking, defending] of this.pairs) {
            if (prev) {
                prev.after(attacking);
            }
            if (defending) {
                attacking.after(defending);
            }
            prev = defending || attacking;
        }
    }
};