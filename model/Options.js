/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class Options extends Base {

    static getConstants () {
        return {
            ATTRS: [
                {
                    name: 'deck',
                    label: 'Deck',
                    view: 'select',
                    items: [{
                        value: '36'
                    }, {
                        value: '52'
                    }]
                }, {
                    name: 'cardsDealtAtOnce',
                    label: 'Number of cards dealt at once',
                    view: 'number'
                }, {
                    name: 'maxAttacks',
                    label: 'Max attacks at once',
                    view: 'number'
                }, {
                    name: 'maxAttacksBeforeDiscard',
                    label: 'Max attacks before first discard',
                    view: 'number'
                }, {
                    name: 'siege',
                    label: 'Siege durak',
                    view: 'checkbox',
                    format: 'boolean'
                }, {
                    name: 'transferable',
                    label: 'Transferable durak',
                    view: 'checkbox',
                    format: 'boolean'
                }, {
                    name: 'fallenAce',
                    label: 'Lowest trump card beats trump ace',
                    view: 'checkbox',
                    format: 'boolean'
                }, {
                    name: 'withoutTrump',
                    label: 'Without trump',
                    view: 'checkbox',
                    format: 'boolean'
                }, {
                    name: 'attackLoser',
                    label: 'Attack the loser first',
                    view: 'checkbox',
                    format: 'boolean'
                }, {
                    name: 'stopAttackOnPickingUp',
                    label: 'Stop attack on picking up',
                    view: 'checkbox',
                    format: 'boolean'
                }
            ],
            RULES: [
                [[
                    'cardsDealtAtOnce',
                    'deck',
                    'maxAttacks',
                    'maxAttacksBeforeDiscard'
                ],  'required'],
                [[
                    'cardsDealtAtOnce',
                    'maxAttacks',
                    'maxAttacksBeforeDiscard'
                ],  'integer', {min: 1, max: 18}],
                [[
                    'deck'
                ],  'range', {values: ['36', '52']}],
                [[
                    'attackLoser',
                    'fallenAce',
                    'siege',
                    'stopAttackOnPickingUp',
                    'transferable',
                    'withoutTrump'
                ],  'checkbox']
            ]
        };
    }
};
module.exports.init(module);