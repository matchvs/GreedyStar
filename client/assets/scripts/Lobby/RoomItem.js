let Mvs = require('../Lib/Mvs');
let Const = require('../Const/Const');
let GameData = require('../Global/GameData');

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
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.loginStatus !== 6) {
            return;
        }

        // cocos creator v1.8.0
        // 防止点击穿透
        if (GameData.isShowUserProfileLayer === true) {
            return;
        }
        if (GameData.isShowJoinRoomLayer === true) {
            return;
        }


        if (GameData.isQuickJoinBtnClick === true) {
            return;
        }

        if (GameData.isCreateRoomBtnClick === true) {
            return;
        }

        if (GameData.isJoinRoomBtn2Click === true) {
            return;
        }

        if (GameData.isRoomItemClick === true) {
            return;
        }

        GameData.isRoomItemClick = true;

        // gm.isRoomItemClick = true
        // gm.isLeaveRoomClick = false
        

        if (GameData.joinRoomStatus === 2 || GameData.joinRoomStatus === 5) {
            console.warn('sdk joinRooming or waiting response');
            console.warn('GameData.joinRoomStatus', GameData.joinRoomStatus);
            return;
        }

        GameData.joinRoomStatus = 2;

        let roomId = this.node.roomId;
        let userProfile = Const.userName;
        this.mvsJoinRoom(roomId, userProfile)
    },

    setRoomId() {
        let label = this.node.getChildByName('label').getComponent(cc.Label);
        label.string = '房间ID: ' + this.node.roomId
    },

    mvsJoinRoom(roomId, userProfile) {
        let result = Mvs.engine.joinRoom(roomId, userProfile);
        GameData.joinRoomStatus = 5;

        if (result === 0) {
            console.log('sdk joinRoom ok', result);
            GameData.joinRoomStatus = 3;
        } else {
            console.error('sdk joinRoom error', result);
            cc.find('Canvas').getComponent('Lobby').showPromptOfError('加入房间[sdk]失败 请刷新 重试');
            GameData.joinRoomStatus = 4;
        }
    },
});
