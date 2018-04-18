let Mvs = require('../../Lib/Mvs');
let utils = require('../../Util/index');
let Const = require('../../Const/Const');
let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    onLoad() {
        this.scaleAction = null;

        this.gameWidth = 2560;
        this.gameHeight = 1440;
        this.gameRect = cc.rect(-this.gameWidth / 2 - 5, -this.gameHeight / 2 - 5, this.gameWidth + 10, this.gameHeight + 10);

        this.originWidth = 0;
        this.isEdge = false;
    },

    start() {
        if (GameData.isGameStart === false) {
            return;
        }

        try {
            let node = this.node;
            let foo = node.x;
        } catch (e) {
            this.node = cc.find('Canvas/bg/player');
        }

        // 镜头跟随
        let mapBgNode = cc.find('Canvas/bg');
        let followAction = cc.follow(this.node);
        followAction.setTag(100);
        mapBgNode.stopActionByTag(100);
        mapBgNode.runAction(followAction);

        this.originWidth = this.node.width;
        GameData.players[0].lastWidth = this.originWidth || 40;

        try {
            let node = this.node;
            let foo = node.x;
        } catch (e) {
            this.node = cc.find('Canvas/bg/player');
        }

        let userNameNode = this.node.getChildByName('username').getComponent(cc.Label);
        userNameNode.string = Const.userId;

        this.onEvents();

        // 延迟200ms出生
        setTimeout(() => {
            this.playerBirth();
        }, 200);
    },

    update(dt) {
        if (GameData.isGameStart === false) {
            return
        }
        this.playerMove(dt);
        this.judgeIsEdge();
    },

    onEvents() {
        cc.director.GlobalEvent.on('playerEatAFood', this.playerAddSize, this);
        cc.director.GlobalEvent.on('playerSpeedUp', this.playerGoldMinus, this);
        cc.director.GlobalEvent.on('playerVivid', this.playerRevive, this);
        cc.director.GlobalEvent.on('iCanBeEaten', this.iCanBeEaten, this);
    },

    // 暂未使用
    offEvents() {
        cc.director.GlobalEvent.off('playerEatAFood', this);
        cc.director.GlobalEvent.off('playerSpeedUp', this);
        cc.director.GlobalEvent.off('playerVivid', this);
        cc.director.GlobalEvent.off('iCanBeEaten', this);
    },

    playerBirth() {
        // GameData.players[0].userId
        this.node.userId = Const.userId;

        let position = this.getRandomPosition();

        let data = {
            userId: Const.userId,
            x: position.x,
            y: position.y,
            scale: 1,
            opacity: 255,
            isLive: 1,
            isInvin: 0,
        };

        this.emitPlayerBirth(data);
        this.changePlayerStatus(data);
    },

    playerMove(dt) {
        if (!GameData.players[0].isLive) {
            return
        }

        let angle = GameData.angle
            , speed1 = GameData.speed1
            , speed2 = GameData.speed2;

        if (!angle) {
            return
        }

        if (GameData.gold === 0) {
            speed2 = 0
        }

        let x = this.node.x
            , y = this.node.y
            , scale = this.node.scale;

        if (angle && (speed1 || speed2)) {
            let speed = speed2 ? speed2 : speed1;
            x += Math.cos(angle * (Math.PI / 180)) * speed * dt;
            y += Math.sin(angle * (Math.PI / 180)) * speed * dt;
        }


        // 如果还是无敌,碰到地图,就不移动
        if (this.node.isInvin) {
            let r = GameData.players[0].lastWidth / 2
                , newX = x === 0 ? x : (x > 0 ? x + r : x - r)
                , newY = y === 0 ? y : (y > 0 ? y + r : y - r);

            if (!this.isContainsPoint(newX, newY, this.gameRect)) {
                return
            }
        }

        let data = {
            userId: GameData.players[0].userId,
            x,
            y,
            scale,
            isLive: 1,
        };

        this.emitPlayerMove(data);

        delete data.scale;
        this.changePlayerStatus(data)
    },

    judgeIsEdge() {
        if (this.isEdge === true) {
            return;
        }

        let x = this.node.x
            , y = this.node.y
            , r = GameData.players[0].lastWidth / 2;

        x = x === 0 ? x : (x > 0 ? x + r : x - r);
        y = y === 0 ? y : (y > 0 ? y + r : y - r);

        if (!this.isContainsPoint(x, y, this.gameRect) && !this.node.isInvin) {
            this.isEdge = true;

            let data = {
                userId: this.node.userId,
                scale: 1,
                opacity: 0,
                isLive: 0,
                isInvin: 0,
            };

            this.emitPlayerDie(data);

            data.score = 0;
            this.changePlayerStatus(data)
        }
    },

    onCollisionEnter(other, self) {
        if (other.tag === 1 && self.tag === 1) {
            if (!other.node.isLive || !self.node.isLive) {
                return
            }

            if (other.node.isInvin || self.node.isInvin) {
                return
            }

            if (other.node.scale > self.node.scale) {
                if (GameData.dieDataBuffer !== undefined || GameData.dieDataBuffer !== null) {
                    GameData.dieDataBuffer = null;
                }

                GameData.dieDataBuffer = {
                    data: {
                        userId: self.node.userId, // die userId
                        scale: 1,
                        opacity: 0,
                        isLive: 0,
                        isInvin: 0,
                        score: GameData.players[0].score, // die user score
                        oUserId: other.node.userId, // other userId
                        oeo: true // 'other eat other'
                    },
                    oNode: other.node,
                };

                let data = JSON.stringify({
                    beEatUserId: self.node.userId,
                    eatUserId: other.node.userId,
                    event: Const.CAN_I_BE_EATEN
                });
                let result = Mvs.engine.sendEvent(data);

                let action = cc.blink(0.2, 5);
                self.node.runAction(action);
            }
        }
    },

    iCanBeEaten() {
        let data = GameData.dieDataBuffer.data;

        this.emitPlayerDie(data);

        data.score = 0;
        this.changePlayerStatus(data);

        let oUserId = data.oUserId
            , oScore = data.score
            , oIndex
            , oNode = data.oNode;

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let players = GameData.players[i];
            if (oUserId === players.userId) {
                oIndex = i;
                break;
            }
        }

        let otherScript = cc.find('Canvas/bg').getComponent('Other');
        otherScript.otherAddSize(oUserId, oScore, oIndex, oNode);
    },

    playerRevive(data) {
        this.isEdge = false;

        // bug
        if (GameData.players[0].isLive) {
            return;
        }

        GameData.players[0].lastWidth = this.originWidth;

        console.log('me revive', Const.userId);

        this.changePlayerStatus({
            x: data.x,
            y: data.y,
            scale: 1,
            opacity: 178,
            isLive: 1,
            isInvin: 1,
        });

        let timer = setTimeout(() => {
            if (!GameData.isGameStart || GameData.isGameOver) {
                clearTimeout(timer);
                return;
            }

            // 如果复活后, 3秒后还活着, 就把无敌关了
            if (this.node.isLive) {
                this.changePlayerStatus({
                    isInvin: 0,
                    opacity: 255
                })
            }
        }, 3000)
    },

    playerAddSize(data) {
        if (data.userId !== GameData.players[0].userId) {
            return;
        }

        let score = data.score
            , addWidth = score / 5
            , lastWidth = GameData.players[0].lastWidth
            , scaleAdd = (lastWidth + addWidth) / lastWidth;

        let scale;

        if (!!GameData.players[0].hasScaleAction) {
            if (!!this.scaleAction) {
                // 不是removeAction
                this.node.stopAction(this.scaleAction);
            }
            scale = Number(GameData.players[0].lastScale * scaleAdd).toFixed(2);
        } else {
            scale = Number(this.node.scale * scaleAdd).toFixed(2);
        }

        GameData.players[0].lastScale = scale; // 上一次应该放大的值
        GameData.players[0].hasScaleAction = true;
        GameData.players[0].lastWidth = lastWidth + addWidth;


        // 先发送事件
        let userId = GameData.players[0].userId;

        let _data = JSON.stringify({
            event: Const.OTHER_CHANGE_SIZE_EVENT,
            userId: userId,
            scale: scale,
            lastWidth: GameData.players[0].lastWidth
        });
        let result = Mvs.engine.sendEvent(_data);


        // 后动画
        this.scaleAction = cc.sequence(
            // BUG: 不能把预处理放在这里
            cc.scaleTo(0.5, scale).easing(cc.easeElasticInOut(0.5)),
            cc.callFunc(() => {
                this.scaleAction = null;
                GameData.players[0].hasScaleAction = false;
            }),
        );

        this.node.runAction(this.scaleAction);
    },

    playerGoldMinus(data) {
        let gold = GameData.gold - data.gold;

        if (gold <= 0) {
            gold = 0;
            this.emitPlayerNoGold({})
        }

        this.changePlayerStatus({
            gold
        });

        let disGoldLabel = cc.find('Canvas/disGold/head/label').getComponent(cc.Label);
        disGoldLabel.string = GameData.gold;
    },

    changePlayerStatus(data) {
        try {
            if (!GameData.isGameStart|| GameData.isGameOver) {
                return;
            }

            try {
                let node = this.node;
                let foo = node.x;
            } catch (e) {
                this.node = cc.find('Canvas/bg/player');
            }

            if (undefined !== data.x) {
                GameData.players[0].x = this.node.x = data.x;
            }
            if (undefined !== data.y) {
                GameData.players[0].y = this.node.y = data.y;
            }
            if (undefined !== data.gold) {
                GameData.gold = this.node.gold = data.gold;
            }
            if (undefined !== data.scale) {
                GameData.players[0].scale = this.node.scale = data.scale;
            }
            if (undefined !== data.opacity) {
                GameData.players[0].opacity = this.node.opacity = data.opacity;
            }
            if (undefined !== data.isLive) {
                GameData.players[0].isLive = this.node.isLive = data.isLive;
            }
            if (undefined !== data.isInvin) {
                GameData.players[0].isInvin = this.node.isInvin = data.isInvin;
            }
            if (undefined !== data.invinTime) {
                GameData.players[0].invinTime = this.node.invinTime = data.invinTime;
            }
            if (undefined !== data.lastWidth) {
                GameData.players[0].lastWidth = this.node.lastWidth = data.lastWidth;
            }
            if (undefined !== data.score) {
                GameData.players[0].score = this.node.score = data.score;
            }
        } catch (e) {

        }
    },

    emitPlayerBirth(data) {
        cc.director.GlobalEvent.emit('playerBirth', data)
    },

    emitPlayerMove(data) {
        cc.director.GlobalEvent.emit('playerMove', data)
    },

    emitPlayerDie(data) {
        cc.director.GlobalEvent.emit('playerDie', data)
    },

    emitPlayerNoGold(data) {
        cc.director.GlobalEvent.emit('playerNoGold', data)
    },

    getRandomPosition() {
        let pad = 20
            , minX = -this.gameWidth / 2 + pad
            , minY = -this.gameHeight / 2 + pad
            , maxX = this.gameWidth / 2 - pad
            , maxY = this.gameHeight / 2 - pad;

        let x = utils.getRandom(minX, maxX);
        let y = utils.getRandom(minY, maxY);

        return {x, y}
    },

    isContainsPoint(x, y, rect) {
        return cc.rectContainsPoint(rect, cc.p(x, y))
    }
});
