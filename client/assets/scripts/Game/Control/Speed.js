let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {
        this.initTouchEvent();
        this.initOnEvent();

        this.timer = null;
        this.canSpeedUp = false;
    },

    start() {
    },

    initTouchEvent() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStartEventHandle, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMoveEventHandle, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEndEventHandle, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancelEventHandle, this);
    },

    initOnEvent() {
        cc.director.GlobalEvent.off('playerNoGold').on('playerNoGold', (data) => {
            this.canSpeedUp = false;
            if (this.timer) {
                clearInterval(this.timer);
            }
        }, this)
    },

    touchStartEventHandle(event) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (!GameData.angle) {
            return;
        }

        if (!GameData.gold) {
            return;
        }

        GameData.speed2 = 400;
        this.canSpeedUp = true;
        this.emitPlayerSpeedUp();

    },

    emitPlayerSpeedUp() {
        cc.director.GlobalEvent.emit('playerSpeedUp', {gold: 1});

        this.timer = setInterval(() => {
            cc.director.GlobalEvent.emit('playerSpeedUp', {gold: 0.5})
        }, 500);
    },

    touchMoveEventHandle(event) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (!GameData.gold || this.canSpeedUp === false) {
            GameData.speed2 = 0;
            this.canSpeedUp = false;
            return;
        }

        GameData.speed2 = 180;
    },

    touchEndEventHandle() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        GameData.speed2 = 0;
        this.canSpeedUp = false;

        if (this.timer) {
            clearInterval(this.timer);
        }
    },

    touchCancelEventHandle() {
        this.touchEndEventHandle()
    }
});
