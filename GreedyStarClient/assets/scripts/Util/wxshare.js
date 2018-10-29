/**
 * 获取用户信息
 */
function getWxUserInfo(data) {
    wx.getUserInfo({
        openIdList: ['selfOpenId'],
        lang: 'zh_CN',
        success: function (res) {
            console.log('success', res.userInfo);
            return data(res.userInfo);
        },
        fail: function (res) {
            reject(res);
            console.log("fail", res);
            return '';
        }
    });

}

module.exports = {
    getWxUserInfo,
}