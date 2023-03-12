/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakTable = class DurakTable {

    static MAX_CARD_SPACE = 10;

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
            if (attacking.getRank() === rank) {
                return true;
            }
            if (defending?.getRank() === rank) {
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
        return pair ? (pair[1] || pair[0]) : null;
    }

    getAttackingCard (index) {
        return this.pairs[index]?.[0];
    }

    getDefendingCard (index) {
        return this.pairs[index]?.[1];
    }

    getWeakerAttackingCards (defending) {
        const cards = [];
        const attacks = this.getOpenAttackingCards();
        for (const attacking of attacks) {
            if (this.play.canBeat(attacking, defending)) {
                cards.push(attacking);
            }
        }
        return cards;
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
        const attacks = this.countAttacks();
        const [dx, dy] = this.getOffsetStep(attacks);
        const index = this.getAttackingIndex(card);
        return [
            this.rect.x + dx * index,
            this.rect.y + dy * index
        ];
    }

    getAttackingIndex (card) {
        const attacks = this.countAttacks();
        for (let i = 0; i < attacks; ++i) {
            if (this.pairs[i][0] === card) {
                return i;
            }
        }
    }

    getDefendingOffset (card) {
        const attacks = this.countAttacks();
        const [dx, dy] = this.getOffsetStep(attacks);
        const index = this.getDefendingIndex(card);
        return [
            this.rect.x + dx * index + this.defenseRect.x,
            this.rect.y + dy * index + this.defenseRect.y
        ];
    }

    getDefendingIndex (card) {
        const attacks = this.countAttacks();
        for (let i = 0; i < attacks; ++i) {
            if (this.pairs[i][1] === card) {
                return i;
            }
        }
    }

    getOffsetStep (total) {
        const space = this.constructor.MAX_CARD_SPACE;
        const cardWidth = this.play.getCardWidth();
        return [Club.getOffsetStep(this.rect.w, cardWidth, total, space), 0];
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