const log4js = require('log4js');
const textEncoding = require('text-encoding');
const constant = require("./constant");
const log = log4js.getLogger();

class Room {
    constructor(options) {
        this.players = new Map();
        this.gameId = options.gameId;
        this.roomId = options.roomId;
        this.pushHander = options.pushHander;
        this.maxPlayer = options.maxPlayer;
        this.createFlag = options.createFlag;
        // 1 系统创建
        // 2 用户创建


        this.time = 10;
        this.status = 0;
        // 0 最开始的状态
        // 1 发送read start
        // 2 关闭read start (5秒内,close read start)
        // 3 发送cannot leave room
        // 4 read start 倒计时结束
        // - 5 游戏开始

        this.isReadStarting = false;
        this.isCanLeaveRoom = true;
        this.isGameStart = false;
    }

    playerEnter(userId) {
        this.players.set(userId, null);

        // TODO: map的输出???
        if (this.players.size <= this.maxPlayer) {
            log.debug('----------');
            log.debug('房间ID: ' + this.roomId);
            log.debug('房间人数没超过所设的maxPlayer值');
            log.debug('房间玩家: ' + this.players);
            log.debug('----------');
            log.debug('');
        } else if (this.players > this.maxPlayer) {
            log.error('==========');
            log.error('房间ID: ' + this.roomId);
            log.error('房间人数超过所设的maxPlayer值了');
            log.error('房间玩家: ' + this.players);
            log.error('==========');
            log.error('');
        }

        if (this.createFlag === 1) {

            if (this.isGameStart === false) {

                if (this.players.size >= constant.SYSTEM_ROOM_MIN_PLAYER_COUNT) {

                    if (this.isReadStarting === false) {

                        // 发送事件'倒计时'
                        let data = {
                            event: constant.READY_TO_GAME_START_EVENT
                        };
                        this.sendEvent(data);

                        this.time = 10;
                        this.status = 1;
                        this.isReadStarting = true;
                        this.isCanLeaveRoom = true;
                        this.isGameStart = false;

                        let timer = setInterval(() => {

                            if (this.time > 5) {
                                if (this.players.size >= constant.SYSTEM_ROOM_MIN_PLAYER_COUNT) {

                                } else {
                                    // 发送事件'取消倒计时'
                                    let data = {
                                        event: constant.CLOSE_READY_TO_GAME_START_EVENT
                                    };
                                    this.sendEvent(data);

                                    this.time = 10;
                                    this.status = 2;
                                    this.isReadStarting = false;
                                    this.isCanLeaveRoom = true;
                                    this.isGameStart = false;

                                    clearInterval(timer);
                                    return;
                                }
                            }

                            else if (this.time <= 5 && this.time > 0) {
                                if (this.isCanLeaveRoom === true) {
                                    // 发送事件'不能离开房间'
                                    let data = {
                                        event: constant.CANNOT_LEAVE_ROOM_EVENT,
                                    };
                                    this.sendEvent(data);

                                    this.status = 3;
                                    this.isReadStarting = true;
                                    this.isCanLeaveRoom = false;
                                    this.isGameStart = false;
                                }
                            }

                            // 发送事件'倒计时此时的时间'
                            let data = {
                                event: constant.READY_GAME_TIME_EVENT,
                                time: this.time
                            };
                            this.sendEvent(data);


                            if (this.time === 0) {
                                let data = {
                                    event: constant.GAME_START_EVENT,
                                    time: this.time
                                };
                                this.sendEvent(data);
                            }

                            if (this.time <= 0) {
                                this.time = 0;
                                this.status = 4;
                                this.isReadStarting = true;
                                this.isCanLeaveRoom = false;
                                this.isGameStart = true;
                                clearInterval(timer);
                                return;
                            }

                            this.time--;
                        }, 1000)
                    }
                }
            }

            else if (this.isGameStart === true) {
                // FOR: 问题1
                setTimeout(() => {
                    let data = {
                        event: constant.GAME_HAS_START_EVENT,
                    };

                    this.sendEvent(data);
                }, 500)
            }
        }

        else if (this.createFlag === 2) {
            if (this.isGameStart === true) {
                setTimeout(() => {
                    let data = {
                        event: constant.GAME_HAS_START_EVENT,
                    };
                    this.sendEvent(data);
                }, 500)
            }
        }
    }

    playerExit(userId) {
        this.players.delete(userId);
    }

    sendEvent(data) {
        data.isServer = true;
        log.debug('sendEvent data', data);

        let content = new textEncoding.TextEncoder("utf-8").encode(JSON.stringify(data));

        this.pushHander.pushEvent({
            gameID: this.gameId,
            roomID: this.roomId,
            pushType: 3,
            content: content,
        });
    }

    roomEvent(data) {
        if (data.isClient) {
            if (data.event === constant.GAME_START_EVENT) {
                this.isGameStart = true;
            }
        }
    }
}

module.exports = Room;
