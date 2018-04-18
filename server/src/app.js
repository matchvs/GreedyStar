const log4js = require('log4js');
const textEncoding = require('text-encoding');
const Room = require('./room');
const log = log4js.getLogger();

/**
 * 游戏逻辑处理入口
 * @class App
 */
class App {
    constructor() {
        this.rooms = new Map();
    }

    setPushHander(pushHander) {
        this.pushHander = pushHander;
    }

    onCreateRoom(request) {
        log.debug('onCreateRoom:', request);

        let options = {
            roomId: request.roomID,
            gameId: request.gameID,
            pushHander: this.pushHander,
            maxPlayer: request.createExtInfo.maxPlayer,
            createFlag: request.createExtInfo.createFlag
        };

        let room = new Room(options);

        this.rooms.set(request.roomID, room);
    }

    onDeleteRoom(request) {
        log.debug('onDeleteRoom:', request);

        this.rooms.delete(request.roomID);
    }

    onJoinRoom(request) {
        log.debug('onJoinRoom:', request);

        let room = this.rooms.get(request.roomID);
        if (room) {
            room.playerEnter(request.userID);
        }
    }

    onJoinOver(request) {
        log.debug('onJoinOver:', request);
    }

    onLeaveRoom(request) {
        log.debug('onLeaveRoom:', request);

        let room = this.rooms.get(request.roomID);
        if (room) {
            room.playerExit(request.userID);
        }
    }

    onKickPlayer(request) {
        log.debug('onKickPlayer:', request);

        let room = this.rooms.get(request.roomID);
        if (room) {
            room.playerExit(request.userID);
        }
    }

    onUserState(request) {
        log.debug('onUserState:', request);

        // 暂不处理
        // let room = this.rooms.get(request.roomid);
        // if (room && request.state === 3) {
        //     room.playerExit(request.userid);
        // }
    }

    onReceiveEvent(request) {
        // log.debug('onReceiveEvent:', request);
        let room = this.rooms.get(request.roomID);
        if (room) {
            let content = new textEncoding.TextDecoder("utf-8").decode(request.cpProto);
            let data = JSON.parse(content);

            log.debug('onReceiveEvent: data', data);

            room.roomEvent(data);
        }
    }

    onRoomDetail(request) {
        log.debug('onRoomDetail:', request);
    }
}

module.exports = App;
