/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const defaults = require('e-champ/config/default-game');

module.exports = {

    ...defaults,

    Class: require('../DurakGame'),
    label: 'Durak',
    play: {
        Class: require('../DurakPlay')
    },
    actions: {
        'attack': {
            Class: require('../action/AttackAction')
        },
        'continue': {
            Class: require('../action/ContinueAction')
        },
        'defend': {
            Class: require('../action/DefendAction')
        },
        'pass': {
            Class: require('../action/PassAction')
        },
        'transfer': {
            Class: require('../action/TransferAction')
        }
    },
    bots: {
        'standard': require('./default-bot-standard')
    },
    defaultBot: 'standard',
    events: {
        'deal': {
            Class: require('../event/DealEvent')
        }
    },
    maxPlayers: 6,
    options: {
        actionTimeout: 60, // seconds
        attackLoser: false,
        cardsDealtAtOnce: 2,
        deck: '36',
        defaultCardsInHand: 6,
        fallenAce: false, // lowest trump card beats trump ace
        maxAttacks: 6,
        maxAttacksBeforeDiscard: 5,
        maxOneColorSequenceFromStock: 5,
        shuffle: true,
        siege: true,
        stopAttackOnPickingUp: false,
        transferable: false,
        withoutTrump: false
    },
    optionModel: {
        Class: require('../model/Options')
    },
    assets: require('./default-assets'),
    decks: require('./default-decks'),
    templates: {
        'messages': 'template/messages',
        'play': 'template/play',
        'playback': 'template/play'
    },
    webPage: 'https://github.com/mkhorin/e-champ-durak'
};