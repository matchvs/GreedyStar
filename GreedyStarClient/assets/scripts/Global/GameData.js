module.exports = {
    // me
    gold: 100,
    allValue: 0,
    winValue: 0,

    angle: null,
    //正常的速度
    speed1: 0,
    //加速按钮的速度
    speed2: 0,
    foodCounter: 0,
    foodIDCounter: 0,
    foodArr: [],
    colorList :[
        [20, 191, 255],
        [39, 209, 175],
        [107, 193, 54],
        [121, 77, 178],
        [236, 192, 97],
        [241, 117, 50],
        [242, 100, 217],
        [246, 230, 96],
        [251, 121, 121],
    ],
    // room
    players: [
    ],
    roomID: 0,
    ownerID: 0,
    isOwner: false,
    // false 为随机匹配模式，true 为好友匹配模式。
    GameMode:false,
    // game status
    isGameStart: false,
    isGameOver: false,


    //是否是独立部署
    isPremiseInit : false,

    //是否获取到了用户微信头像
    isWxAvatar : false
};
