let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    properties: {
        dot: cc.Node,
    },

    onLoad() {
        this.ringRadius = this.node.width / 2;

        // this.joyStickPoint = this.node.getPosition();
        //操纵杆X坐标
        this.joyStickX = this.node.getPosition().x;
        //操纵杆Y坐标
        this.joyStickY = this.node.getPosition().y;

        this.initTouchEvent()
    },

    initTouchEvent() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStartEventHandle, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMoveEventHandle, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEndEventHandle, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancelEventHandle, this);
    },

    touchStartEventHandle(event) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        let touchPos = this.node.convertToNodeSpaceAR(event.getLocation());

        let posX = this.joyStickX + touchPos.x;
        let posY = this.joyStickY + touchPos.y;

        let distance = this.getDistance(touchPos, cc.p(0, 0));

        if (this.ringRadius > distance) {
            this.dot.setPosition(cc.p(posX, posY));
            return true;
        }
        return false;
    },

    touchMoveEventHandle(event) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        let touchPos = this.node.convertToNodeSpaceAR(event.getLocation());

        let posX = this.joyStickX + touchPos.x;
        let posY = this.joyStickY + touchPos.y;

        let distance = this.getDistance(touchPos, cc.p(0, 0));

        if (this.ringRadius > distance) {
            this.dot.setPosition(cc.p(posX, posY))
        } else {
            let bPosX = this.node.getPosition().x + Math.cos(this.getRadian(cc.p(posX, posY))) * this.ringRadius;
            let bPosY = this.node.getPosition().y + Math.sin(this.getRadian(cc.p(posX, posY))) * this.ringRadius;
            this.dot.setPosition(cc.p(bPosX, bPosY))
        }

        GameData.angle = this.getAngle(cc.p(posX, posY));
        GameData.speed1 = 180;
    },

    touchEndEventHandle() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        this.dot.setPosition(this.node.getPosition());

        GameData.angle = 0;
        GameData.speed1 = 0;
    },

    touchCancelEventHandle() {
        this.touchEndEventHandle();
    },

    getDistance(point1, point2) {
        return cc.pDistance(point1, point2);
    },

    getAngle(point) {
        return Math.atan2(point.y - this.joyStickY, point.x - this.joyStickX) * (180 / Math.PI);
    },

    getRadian(point) {
        return this.radian = Math.PI / 180 * this.getAngle(point);
    }
});
