let Mvs = require('../Lib/Mvs');
let Const = require('../Const/Const');
let GameData = require('../Global/GameData');
// let Config = require('Config');
// let GameData = require('GameData');

cc.Class({
    extends: cc.Component,

    onLoad() {
        cc.director.setDisplayStats(false);
        LocalStore_Clear();

        this.mvsBind();

        // 断线之后需要重新init
        // if (GameData.initStatus !== 6) {
            this.init();
        // }
    },

    mvsBind() {
        Mvs.response.initResponse = this.mvsInitResponse.bind(this);
        // Mvs.response.errorResponse = this.mvsErrorResponse.bind(this);
    },

    init() {
        if (GameData.initStatus === 6) {
            return;
        }

        if (GameData.initStatus === 2 || GameData.initStatus === 5) {
            console.warn('sdk initing or waiting response');
            console.warn('GameData.initStatus:', GameData.initStatus);
            return;
        }

        GameData.initStatus = 2;

        let response = Mvs.response;

        let gameId = Const.gameId || 201151;
        let channel = Const.channel;
        let platform = Const.platform;
        this.mvsInit(response, channel, platform, gameId);
    },

    mvsInit(response, channel, platform, gameId) {
        let result = Mvs.engine.init(response, channel, platform, gameId);

        if (result === 0) {
            GameData.initStatus = 3;
            console.log('sdk init ok', result);
        } else {
            GameData.initStatus = 4;
            console.error('sdk init error', result);
            return;
        }

        GameData.initStatus = 5;
    },

    mvsInitResponse(status) {
        if (status === 200) {
            GameData.initStatus = 6;
            console.log('response init ok', status);
        } else {
            GameData.initStatus = 7;
            console.error('response init error', status);
        }
    },

    // mvsErrorResponse(code, errMsg) {
    //     console.error('mvsErrorResponse', arguments);
    //
    //     // 目前只能处理code = 1000 的情况
    //     // ??? code = 1000 && errMsg === "gateway disconnect"
    //     if (code === 1000) {
    //         GameData.isServerErrorCode1000 = true;
    //         this.showPromptOfError('你已掉线 请刷新 重开');
    //     }
    // },

    // showPromptOfError(str) {
    //     let promptNode = cc.find('Canvas/prompt');
    //     let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
    //     promptTxt.string = str;
    //
    //     promptNode.active = true;
    // },

    play() {
        if (GameData.initStatus === 6) {
            cc.director.loadScene('lobby');
            GameData.isInCoverView = false;
        }else {
            console.warn('please wait matchvs init');
        }
    }
});
