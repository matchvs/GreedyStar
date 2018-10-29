let Const = require('../../Const/Const');
let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {
    },

    onCollisionEnter(other, self) {
        // 别的玩家碰撞了食物, 这里不处理
        if (!(other && other.node && other.node.userID && (other.node.userID === Const.userID || other.node.userID === GameData.robotIDs[0] || other.node.userID === GameData.robotIDs[1]))) {
            return;
        }
        // 如果玩家还是无敌,就直接返回
        if (other.node.isInvin) {
            return
        }
        if (other.tag === 1 && self.tag === 999) {
            if (!other.node.isInvin) {
                let data = {
                    food: self.node,
                    score: self.node.score,
                    foodID: self.node.foodID,
                    userID: other.node.userID,
                    userScore: GameData.players[0].score,
                };

                for(var i = 0; i < GameData.players.length;i++) {
                    if (data.userID == GameData.players[i].userID) {
                        data.userScore = GameData.players[i].score;
                    }
                }
                console.log("userID : userScore :", data.userID+":"+data.userScore);
                cc.director.GlobalEvent.emit('playerEatAFood', data);
            }

            if (other.node.userID === GameData.robotIDs[0]) {
                self.node.userID = other.node.userID;

                this.robotVolume(self.node,1);
            }
            if (other.node.userID === GameData.robotIDs[1]) {
                self.node.userID = other.node.userID;
                this.robotVolume(self.node,2);
            }
        }
    },

    /**
     * 计算机器人的
     * @param data
     * @param i
     */
    robotVolume (data,i) {
        let score = data.score ,addWidth = score / 30
            , lastWidth = GameData.players[i].lastWidth
            , scaleAdd = (lastWidth + addWidth) / lastWidth;
        var scale = Number( GameData.players[i].scale * scaleAdd).toFixed(2);
        GameData.players[i].lastScale = scale; // 上一次应该放大的值
        GameData.players[i].scale = scale; // 上一次应该放大的值
        GameData.players[i].lastWidth = lastWidth + addWidth;
        let _data = {
            userID: data.userID,
            scale: scale,
            index:i,
            lastWidth: GameData.players[i].lastWidth
        };
        cc.director.GlobalEvent.emit('otherChangeSize', _data)
    }

});
