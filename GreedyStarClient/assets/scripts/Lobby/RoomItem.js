let Const = require('../Const/Const');
let msg = require("../Lib/MatvhvsMessage");
cc.Class({
    extends: cc.Component,

    onLoad() {
        this.initTouchEvent();
        this.setRoomId()
    },

    start() {
    },

    initTouchEvent() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStartEventHandle, this)
    },

    touchStartEventHandle() {
        let roomId = this.node.roomId;
        let userProfile = Const.userName;
        this.mvsJoinRoom(roomId, userProfile)
    },

    setRoomId() {
        let label = this.node.getChildByName('label').getComponent(cc.Label);
        label.string = '房间ID: ' + this.node.roomId
    },

    mvsJoinRoom(roomID, userProfile) {
        // let result = Mvs.engine.joinRoom(roomID, userProfile);
        let event = new cc.Event(msg.ADD_DESIGNATED_ROOMS,true);
        event['roomID'] = roomID;
        cc.systemEvent.dispatchEvent(event)
        // if (result === 0) {
        //     console.log('sdk joinRoom ok', result);
        // } else {
        //     console.error('sdk joinRoom error', result);
        //     cc.find('Canvas').getComponent('Lobby').showPromptOfError('加入房间[sdk]失败 请刷新 重试');
        // }
    },
});
