// 星星颜色
let colorList = [
    [20, 191, 255],
    [39, 209, 175],
    [107, 193, 54],
    [121, 77, 178],
    [236, 192, 97],
    [241, 117, 50],
    [242, 100, 217],
    [246, 230, 96],
    [251, 121, 121],
];

// 星星分数
let scoreList = [20, 40, 60];

module.exports = {
    ADD_FOOD_DT: 2, // 3秒
    MAX_FOOD_COUNT: 100,
    // gameTime: 3 * 60,

    // game
    MAX_PLAYER_COUNT: 6,
    SYSTEM_ROOM_MIN_PLAYER_COUNT: 3,
    CUSTOM_ROOM_MIN_PLAYER_COUNT: 4,

    colorList,
    scoreList,

    // debug
    isDebug: true,
};
