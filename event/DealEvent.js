/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('e-champ/arena/Event');

module.exports = class DealEvent extends Base {

    constructor () {
        super(...arguments);
        this.prepareData();
    }

    prepareData () {
        this._hiddenData = [];
        this._openData = [];
        for (const [pos, cards] of this.data) {
            this._hiddenData.push([pos, cards.length]);
            this._openData.push([pos, cards.map(card => card.data)]);
        }
    }

    serializeForPlayer (player) {
        const result = [];
        for (let i = 0; i < this.data.length; ++i) {
            player?.pos === this.data[i][0]
                ? result.push(this._openData[i])
                : result.push(this._hiddenData[i]);
        }
        return [this.name, result];
    }

    serialize () {
        const result = [];
        for (let i = 0; i < this.data.length; ++i) {
            result.push(this._openData[i]);
        }
        return [this.name, result];
    }
};