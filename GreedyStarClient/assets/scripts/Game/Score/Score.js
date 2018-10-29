let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    onLoad() {
        this.itemNodeArr = [];
    },

    start() {
        if (GameData.isGameStart === false) {
            return
        }

        this.onEvent();

        this.addScoreItems()
    },


    update(dt) {
        if (GameData.isGameOver === true) {
            this.offEvent()
        }
    },

    onEvent() {
        cc.director.GlobalEvent.off('playerScoreChange').on('playerScoreChange', (data) => {
            this.changePlayerScore(data, false)
        }, this);

        cc.director.GlobalEvent.off('playerScoreReset').on('playerScoreReset', (data) => {
            this.changePlayerScore(data, true)
        }, this);

        cc.director.GlobalEvent.off('newPlayer').on('newPlayer', (data) => {
            this.addScoreItem(data)
        }, this);

        // userHalfLeaveRoom
        cc.director.GlobalEvent.off('removeScoreItemOfLeaveRoom').on('removeScoreItemOfLeaveRoom', (data) => {
            this.removeScoreItemOfLeaveRoom(data)
        }, this);
    },

    offEvent() {
        cc.director.GlobalEvent.off('playerScoreChange', this);
        cc.director.GlobalEvent.off('playerScoreReset', this);
        cc.director.GlobalEvent.off('newPlayer', this);
        cc.director.GlobalEvent.off('removeScoreItemOfLeaveRoom', this);
    },

    addScoreItems() {
        let players = [];

        let l = GameData.players.length;

        for (let i = 0; i < l; i++) {
            let _player = GameData.players[i];
            players[i] = {};

            // TODO: 不建议使用let key in
            for (let key in _player) {
                players[i][key] = _player[key];
            }

            players[i].score = _player.score || 0;
        }

        // 使用简单的冒泡排序
        for (let i = 0; i < players.length - 1; i++) {
            for (let j = 0; j < players.length - 1 - i; j++) {
                // 只需要判断userId
                if (players[j].userId > players[j + 1].userId) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp
                }
            }
        }

        for (let i = 0; i < l; i++) {
            let player = players[i]
                , userId = player.userId
                , userName = player.userName
                , score = player.score || 0;

            let node = new cc.Node()
                , label = node.addComponent(cc.Label);

            node.parent = this.node;
            node.width = 260;
            node.height = 28;
            node.x = 0;
            node.y = -i * 28 - 14;

            label.fontFamily = 'Microsoft YaHei UI';
            label.fontSize = 16;
            label.lineHeight = 28;
            // label.string = userId + ':' + score;
            label.string = userName + ':' + score;

            node.userId = userId;
            this.itemNodeArr.push(node);
        }

        let subHead = cc.find('Canvas/disScore/subHead');
        subHead.height = 28 * l + 46;
    },

    addScoreItem(data) {
        let userId = data.userId
            , score = data.score || 0;

        let l = this.itemNodeArr.length;

        // 防止重复的情况
        // 中途退出,又加入
        for (let i = 0; i < l; i++) {
            let node = this.itemNodeArr[i];
            if (node.userId === userId) {
                return;
            }
        }

        // 创建
        let node = new cc.Node()
            , label = node.addComponent(cc.Label);

        node.parent = this.node;
        node.width = 260;
        node.height = 28;
        node.x = 0;
        node.y = -l * 28 - 14;

        label.fontFamily = 'Microsoft YaHei UI';
        label.fontSize = 16;
        label.lineHeight = 28;
        this.itemNodeArr.push(node);

        let subHead = cc.find('Canvas/disScore/subHead');
        subHead.height = 28 * (l + 1) + 46;

        let players = [];

        for (let i = 0; i < GameData.players.length; i++) {
            let _player = GameData.players[i];
            players[i] = {};

            // TODO 不用for in
            for (let key in _player) {
                players[i][key] = _player[key];
            }

            players[i].score = _player.score || 0;
        }


        // TODO javascript sort函数改写
        // 使用简单的冒泡排序
        for (let i = 0; i < players.length - 1; i++) {
            for (let j = 0; j < players.length - 1 - i; j++) {
                // 分数小就后
                if (players[j].score < players[j + 1].score) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp;
                }

                // 分数同,userId大就后
                else if (players[j].userId > players[j + 1].userId && players[j].score === players[j + 1].score) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp;
                }
            }
        }

        // 更新
        for (let i = 0; i < this.itemNodeArr.length; i++) {
            let node = this.itemNodeArr[i]
                , label = node.getComponent(cc.Label);

            node.userId = players[i].userId;
            // label.string = players[i].userId + ':' + players[i].score
            label.string = players[i].userName + ':' + players[i].score
        }
    },

    removeScoreItemOfLeaveRoom(data) {
        let lastNode = this.itemNodeArr.pop();
        this.itemNodeArr.splice(this.itemNodeArr.length, 1);
        this.node.removeChild(lastNode);

        let l = this.itemNodeArr.length;
        let subHead = cc.find('Canvas/disScore/subHead');
        subHead.height = 28 * l + 46;

        let players = [];

        for (let i = 0; i < GameData.players.length; i++) {
            let _player = GameData.players[i];
            players[i] = {};

            // TODO 不用for in
            for (let key in _player) {
                players[i][key] = _player[key];
            }

            players[i].score = _player.score || 0;
        }

        // TODO javascript sort函数改写
        // 使用简单的冒泡排序
        for (let i = 0; i < players.length - 1; i++) {
            for (let j = 0; j < players.length - 1 - i; j++) {
                // 分数小就后
                if (players[j].score < players[j + 1].score) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp;
                }

                // 分数同,userId大就后
                else if (players[j].userId > players[j + 1].userId && players[j].score === players[j + 1].score) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp;
                }
            }
        }

        // 更新
        for (let i = 0; i < this.itemNodeArr.length; i++) {
            let node = this.itemNodeArr[i]
                , label = node.getComponent(cc.Label);

            node.userId = players[i].userId;
            // label.string = players[i].userId + ':' + players[i].score
            label.string = players[i].userName + ':' + players[i].score
        }
    },

    changePlayerScore(data, isReset) {
        let userId = data.userId
            , score = data.score
            , userScore = data.userScore || null;

        // TODO 这个状态不要在这里修改
        for (let i = 0; i < GameData.players.length; i++) {
            if (userId === GameData.players[i].userId) {
                // isReset ? GameData.players[i].score = 0 : GameData.players[i].score += score;
                // break;

                // 同步分数
                if (isReset === true) {
                    GameData.players[i].score = 0
                } else {
                    GameData.players[i].score += score;
                    
                    // 如果个人总分 > 本地个人增加的值
                    if (userScore) {
                        if (userScore > GameData.players[i].score) {
                            GameData.players[i].score = userScore;
                        }
                    }
                }

                break;
            }
        }

        let players = [];

        for (let i = 0; i < GameData.players.length; i++) {
            let _player = GameData.players[i];
            players[i] = {};

            for (let key in _player) {
                players[i][key] = _player[key]
            }
            players[i].score = _player.score || 0
        }

        // 使用简单的冒泡排序
        for (let i = 0; i < players.length - 1; i++) {
            for (let j = 0; j < players.length - 1 - i; j++) {
                // 分数小就后
                if (players[j].score < players[j + 1].score) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp;
                }
                // 分数同,userId大就后
                else if (players[j].userId > players[j + 1].userId && players[j].score === players[j + 1].score) {
                    let temp = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = temp;
                }
            }
        }

        // 更新
        for (let i = 0; i < this.itemNodeArr.length; i++) {
            let node = this.itemNodeArr[i];
            let label = node.getComponent(cc.Label);
            node.userId = players[i].userId;
            // label.string = players[i].userId + ':' + players[i].score
            label.string = players[i].userName + ':' + players[i].score
        }
    }
});
