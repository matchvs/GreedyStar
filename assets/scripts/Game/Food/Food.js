let Const = require('../../Const/Const');
let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {
    },

    onCollisionEnter(other, self) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        // 别的玩家碰撞了食物, 这里不处理
        if (!(other && other.node && other.node.userId && other.node.userId === Const.userId)) {
            return;
        }

        // 如果玩家还是无敌,就直接返回
        if (other.node.isInvin) {
            return
        }

        // other tag 1
        // food tag 999
        if (other.tag === 1 && self.tag === 999) {
            if (other.node.isInvin) {
                return;
            }

            let data = {
                food: self.node,
                score: self.node.score,
                foodId: self.node.foodId,
                userId: other.node.userId,

                userScore: GameData.players[0].score,
            };

            cc.director.GlobalEvent.emit('playerEatAFood', data);
        }
    }
});
