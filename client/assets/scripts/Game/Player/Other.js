let Mvs = require('../../Lib/Mvs');
let GameData = require('../../Global/GameData');
let Const = require('../../Const/Const');

cc.Class({
    extends: cc.Component,

    properties: {
        // otherPrefab_: cc.Prefab
    },

    onLoad() {
        this.parent = cc.find('Canvas/bg');

        this.otherPool = new cc.NodePool();
        this.otherPrefab = undefined;

        this.onEvent()
    },

    start() {
        if (GameData.isGameStart === false) {
            return;
        }
    },

    // 暂时不用
    loadOtherPrefab(callback) {
        cc.loader.loadRes("prefab/player", (err, res) => {
            if (err) {
                console.error('load other prefab error', err);
                return;
            }
            this.otherPrefab = res;
            callback && callback();
        });
    },

    update(dt) {
    },

    onEvent() {
        cc.director.GlobalEvent.off("otherBirth").on('otherBirth', this.otherBirth, this);
        cc.director.GlobalEvent.off("othersBirth").on('othersBirth', this.othersBirth, this);
        cc.director.GlobalEvent.off("otherMove").on('otherMove', this.otherMove, this);
        cc.director.GlobalEvent.off("otherDie").on('otherDie', this.otherDie, this);
        cc.director.GlobalEvent.off("otherVivid").on('otherVivid', this.otherVivid, this);
        cc.director.GlobalEvent.off("otherChangeSize").on('otherChangeSize', this.otherChangeSize, this);
        cc.director.GlobalEvent.off("otherEatOther").on('otherEatOther', this.otherEatOther, this);

        cc.director.GlobalEvent.off("hideOther").on('hideOther', this.hideOther, this);
        cc.director.GlobalEvent.off("otherDieOfLeaveRoom").on('otherDieOfLeaveRoom', this.otherDieOfLeaveRoom, this)

        cc.director.GlobalEvent.off('canYouBeEaten').on('canYouBeEaten', (data) => {
            this.canYouBeEaten(data);
        }, this);

    },

    offEvent() {
        cc.director.GlobalEvent.off('otherBirth', this);
        cc.director.GlobalEvent.off("othersBirth", this);
        cc.director.GlobalEvent.off('otherMove', this);
        cc.director.GlobalEvent.off('otherDie', this);
        cc.director.GlobalEvent.off('otherVivid', this);
        cc.director.GlobalEvent.off("otherChangeSize", this);
        cc.director.GlobalEvent.off("otherEatOther", this);

        // cc.director.GlobalEvent.off("userHalfLeaveRoom", this);
        cc.director.GlobalEvent.off("hideOther", this);
        cc.director.GlobalEvent.off("otherDieOfLeaveRoom", this);

        cc.director.GlobalEvent.off('canYouBeEaten', this)
    },


    othersBirth(data) {
        // let playerStatusData = data.data;
        // for (let i = 0; i < playerStatusData.length; i++) {
        //     let oneData = playerStatusData[i];
        //     let toggleInvin = true;
        //     this.otherBirth(oneData, toggleInvin)
        // }
        this.otherBirth(data.data, true);
    },

    // other birth ok
    otherBirth(data, toggleInvin) {
        // TODO 更好的判断规则
        if (this.otherPrefab === undefined) {
            cc.loader.loadRes("prefab/player", (err, res) => {
                if (err) {
                    console.error('load (other)player prefab error', err);
                    return;
                }

                this.otherPrefab = res;

                this._otherBirth(data, toggleInvin);
            });
        } else {
            this._otherBirth(data, toggleInvin);
        }
    },

    _otherBirth(data, toggleInvin) {
        let node
            , index
            , userId = data.userId;

        try {
            let foo = this.parent
        } catch (e) {
            this.parent = cc.find('Canvas/bg');
        }

        let children = this.parent.children;
        for (let i = 0, l = children.length; i < l; i++) {
            if (children[i].userId && children[i].userId === userId) {
                console.warn('the child(child.userId = ' + userId + ') has exist');
                return;
            }
        }

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let player = GameData.players[i];

            if (player.userId === userId) {
                index = i;
                break;
            }
        }

        if (!(this.otherPool && this.otherPool && this.otherPool.size())) {
            this.otherPool = new cc.NodePool()
        }

        if (this.otherPool.size() > 0) {
            node = this.otherPool.get()
        } else {
            node = cc.instantiate(this.otherPrefab)
        }

        node.userId = userId;

        // 不好的处理方式
        // TODO 应该在loadRes中有错误处理
        node.parent = this.parent;

        // 改变贴图
        let spIndex = Number(index + 1)
            , url = 'image/game/player/' + spIndex + '.png';

        cc.loader.loadRes(url, (err, res) => {
            if (err) {
                console.error('load res image/game/player/x.png error', err);
                return;
            }

            let png = node.getComponent(cc.Sprite);
            png.spriteFrame = new cc.SpriteFrame(res);

            let username = node.getChildByName('username').getComponent(cc.Label);
            username.string = userId;

            this.changeOtherStatus({
                x: data.x,
                y: data.y,
                scale: data.scale,
                opacity: data.opacity,
                isLive: data.isLive,
                isInvin: data.isInvin,
                index,
                node,
            });

            if (toggleInvin && toggleInvin === true) {

                setTimeout(() => {
                    if (node.isLive) {
                        this.changeOtherStatus({
                            isInvin: 0,
                            opacity: 255,
                            index,
                            node
                        })
                    }
                }, 3000)

            }
        })
    },

    // other move
    otherMove(data) {
        let node = undefined
            , index = 0
            , userId = data.userId;

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg')
        }

        let children = this.parent.children;
        for (let i = 0, l = children.length; i < l; i++) {
            let _node = children[i];
            if (_node.userId === userId) {
                node = _node;
                break;
            }
        }

        // 如果节点不存在,则创建一个对应的节点
        if (undefined === node) {
            this.otherBirth(data);
            return;
        }

        let username = node.getChildByName('username').getComponent(cc.Label);
        username.string = userId;

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let player = GameData.players[i];
            if (player.userId === userId) {
                index = i;
                break;
            }
        }

        if (index === 0) {
            console.warn('function otherMove: index is error');
            return;
        }

        // let username = node.getChildByName('username').getComponent(cc.Label);
        //     username.string = userId;

        this.changeOtherStatus({
            x: data.x,
            y: data.y,
            opacity: data.opacity,
            isLive: data.isLive,
            isInvin: data.isInvin,
            index,
            node
        })
    },

    // other die
    otherDie(data) {
        let node
            , index
            , userId = data.userId;

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg')
        }

        for (let i = 0, l = this.parent.children.length; i < l; i++) {
            let _node = this.parent.children[i];
            if (_node.userId === userId) {
                node = _node;
                break;
            }
        }

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let player = GameData.players[i];
            if (player.userId === userId) {
                index = i;
                break;
            }
        }

        cc.director.GlobalEvent.emit('playerScoreReset', data);

        // 实际不需要node.x等值的修改了
        this.changeOtherStatus({
            x: data.x,
            y: data.y,
            scale: data.scale,
            opacity: data.opacity,
            isLive: data.isLive,
            isInvin: data.isInvin,
            index,
            node,
            noAction: true
        });

        this.otherPool.put(node);
    },

    hideOther(data) {
        let node
            , userId = data.userId;

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg')
        }

        for (let i = 0, l = this.parent.children.length; i < l; i++) {
            let _node = this.parent.children[i];
            if (_node.userId === userId) {
                node = _node;
                break;
            }
        }

        node.active = false;
    },

    // 玩家中途退出游戏
    otherDieOfLeaveRoom(data) {
        let node
            , userId = data.userId;

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg')
        }

        for (let i = 0, l = this.parent.children.length; i < l; i++) {
            let _node = this.parent.children[i];
            if (_node.userId === userId) {
                node = _node;
                break;
            }
        }

        // 直接删掉
        this.otherPool.put(node);
    },


    // vivid
    otherVivid(data) {
        // let node
        // , index
        // , userId = data.userId;

        // for (let i = 0, l = GameData.players.length; i < l; i++) {
        //     let player = GameData.players[i];
        //     if (player.userId === userId) {
        //         index = i;
        //         break;
        //     }
        // }
        // console.error('otherVivid userId:', data.userId);
        if (this.otherPrefab === undefined || this.otherPrefab == null || !this.otherPrefab) {
            cc.loader.loadRes("prefab/player", (err, res) => {
                if (err) {
                    console.error('load (other)player prefab error', err);
                    return;
                }

                this.otherPrefab = res;

                this._otherVivid(data);
            });
        } else {
            this._otherVivid(data);
        }
    },

    _otherVivid(data) {
        let node
            , index
            , userId = data.userId;

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let player = GameData.players[i];
            if (player.userId === userId) {
                index = i;
                break;
            }
        }

        if (this.otherPool.size() > 0) {
            node = this.otherPool.get()
        } else {
            node = cc.instantiate(this.otherPrefab)
        }

        // BUG:
        // 第二次加载房间时,如果被吃,将会调用两次vivid函数???
        let children = this.parent.children;
        for (let i = 0, l = children.length; i < l; i++) {
            if (children[i].userId && children[i].userId === userId) {
                console.warn('the child(child.userId = ' + userId + ') has exist');
                return;
            }
        }

        let username = node.getChildByName('username').getComponent(cc.Label);
        username.string = userId;

        this.changeOtherStatus({
            x: data.x,
            y: data.y,
            scale: data.scale,
            opacity: data.opacity,
            isLive: data.isLive,
            isInvin: data.isInvin,
            index,
            node,
            noAction: true
        });

        setTimeout(() => {
            // 如果复活后, 3秒后还活着, 就把无敌关了
            if (node.isLive) {
                this.changeOtherStatus({
                    isInvin: 0,
                    opacity: 255,
                    index,
                    node
                })
            }
        }, 3000);

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg')
        }

        node.parent = this.parent;
        node.userId = data.userId;
    },


    // add size
    // change size
    otherChangeSize(data) {
        let node
            , index
            , userId = data.userId;

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg');
        }

        for (let i = 0, l = this.parent.children.length; i < l; i++) {
            let _node = this.parent.children[i];
            if (_node.userId === userId) {
                node = _node;
                break
            }
        }

        // 如果节点不存在,则创建一个对应的节点
        // if (undefined === node) {
        //   this.otherBirth(data)
        //   return
        // }

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let player = GameData.players[i];
            if (player.userId === userId) {
                index = i;
                break
            }
        }

        this.changeOtherStatus({
            scale: data.scale,
            lastWidth: data.lastWidth,
            index,
            node
        })
    },

    changeOtherStatus(data) {
        try {
            if (GameData.isGameOver) {
                return
            }

            let index = data.index
                , node = data.node;

            if (undefined !== data.x) {
                GameData.players[index].x = node.x = data.x
            }
            if (undefined !== data.y) {
                GameData.players[index].y = node.y = data.y
            }
            if (undefined !== data.gold) {
                GameData.players[index].gold = node.gold = data.gold
            }
            if (undefined !== data.scale) {

                if (data.noAction) {
                    GameData.players[index].scale = node.scale = data.scale;
                    if (!!GameData.players[index].hasScaleAction) {
                        GameData.players[index].hasScaleAction = false;

                        if (!!GameData.players[index].scaleAction) {
                            node.stopAction(GameData.players[index].scaleAction);
                            GameData.players[index].scaleAction = null;
                        }
                    }


                }

                else {
                    GameData.players[index].scale = data.scale;
                    // node.scale
                    if (!!GameData.players[index].hasScaleAction) {
                        if (!!GameData.players[index].scaleAction) {
                            node.stopAction(GameData.players[index].scaleAction);
                        }
                    }

                    GameData.players[index].hasScaleAction = true;

                    GameData.players[index].scaleAction = cc.sequence(
                        cc.scaleTo(0.5, data.scale).easing(cc.easeExponentialInOut(0.5)),
                        cc.callFunc(() => {
                            GameData.players[index].scaleAction = null;
                            GameData.players[index].hasScaleAction = false;
                        })
                    );

                    node.runAction(GameData.players[index].scaleAction);
                }
            }
            if (undefined !== data.opacity) {
                GameData.players[index].opacity = node.opacity = data.opacity
            }
            if (undefined !== data.isLive) {
                GameData.players[index].isLive = node.isLive = data.isLive
            }
            if (undefined !== data.isInvin) {
                GameData.players[index].isInvin = node.isInvin = data.isInvin
            }
            if (undefined !== data.invinTime) {
                GameData.players[index].invinTime = node.invinTime = data.invinTime
            }
            if (undefined !== data.lastWidth) {
                GameData.players[index].lastWidth = node.lastWidth = data.lastWidth
            }
            if (undefined !== data.score) {
                GameData.players[index].score = node.score = data.score
            }
        } catch (err) {

        }
    },

    // 这个处理包括所有人
    otherEatOther(data) {
        let node
            , index
            , userId = data.oUserId
            , score = data.score;

        let nodes = cc.find('Canvas/bg').children;

        for (let i = 0, l = nodes.length; i < l; i++) {
            let _node = nodes[i];
            if (userId === _node.userId) {
                node = _node;
                break
            }
        }

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let player = GameData.players[i];
            if (userId === player.userId) {
                index = i;
                break
            }
        }

        this.otherAddSize(userId, score, index, node);

        cc.director.GlobalEvent.emit('playerScoreChange', {
            userId,
            score
        })
    },

    otherAddSize(userId, score, index, node) {
        if (score === 0) {
            return;
        }

        let addWidth = score / 5
            , lastWidth = GameData.players[index].lastWidth || 40
            , scale = (lastWidth + addWidth) / lastWidth;

        let action = cc.sequence(
            // cc.scaleBy(0, scale),
            cc.scaleBy(0.5, scale).easing(cc.easeElasticInOut(0.5)),
            cc.callFunc(() => {
                GameData.players[index].lastWidth = lastWidth + addWidth;
                node.lastWidth = lastWidth + addWidth
            }),
        );

        node.runAction(action);
    },


    canYouBeEaten: function (data) {
        let node = undefined
            // , index = 0
            , beEatUserId = data.beEatUserId;

        // 先简单判断如果是scale大,那就要被吃

        try {
            let foo = this.parent;
        } catch (e) {
            this.parent = cc.find('Canvas/bg');
        }

        let children = this.parent.children;
        for (let i = 0, l = children.length; i < l; i++) {
            let _node = children[i];
            if (_node.userId === beEatUserId) {
                node = _node;
                break;
            }
        }

        if (undefined === node) {
            console.error('该节点不存在,node.userId:', beEatUserId);
            return;
        }

        let action = cc.blink(0.18, 5);
        node.runAction(action);

        let meNode = cc.find('Canvas/bg/player');
        // 注意
        // meNode.runAction(action);
        // 这样写不行
        meNode.runAction(cc.blink(0.2, 5));

        if (meNode.scale > node.scale) {

            let timer = setTimeout(() => {

                let data = JSON.stringify({
                    event: Const.YOU_CAN_BE_EATEN,
                    beEatUserId,
                    eatUserId: Const.userId
                });

                let result = Mvs.engine.sendEvent(data);

                clearTimeout(timer)

            }, 200);
        }
    }
});
