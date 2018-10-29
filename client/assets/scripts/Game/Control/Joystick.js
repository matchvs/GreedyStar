let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,

    properties: {
        dot: cc.Node,
        left_Down:false,
        right_Down:false,
        up_Down:false,
        down_Down:false,     //四个方向键是否被按下的状态
        posY : 0,
        posX: 0
    },

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN,this.onKeyDown,this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
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

    onKeyDown(event) {
        switch (event.keyCode) {
            case 1003:
                this.up_Down = true;
                break;
            case 1004:
                this.down_Down = true;
                break;
            case 1000:
                this.left_Down = true;
                break;
            case 1001:
                this.right_Down = true;
                break;
        }
        this.gamepad();
    },

    onKeyUp(event) {
        switch (event.keyCode) {
            case 1003:
                this.up_Down = false;
                break;
            case 1004:
                this.down_Down = false;
                break;
            case 1000:
                this.left_Down = false;
                break;
            case 1001:
                this.right_Down = false;
                break;
        }
        this.gamepad();
    },


    gamepad() {
        this.posX = this.joyStickX;
        this.posY = this.joyStickY;
        if(!this.up_Down&&!this.down_Down&&!this.left_Down&&!this.right_Down) {
           this.touchEndEventHandle();
           return;
        }
        if (this.right_Down) {
            this.posX = this.joyStickX + (this.ringRadius/2);
        }
        if (this.up_Down) {
            this.posY = this.joyStickY + (this.ringRadius/2);
        }
        if (this.down_Down) {
            this.posY = this.joyStickY - (this.ringRadius/2);
        }
        if (this.left_Down) {
            this.posX = this.joyStickX -  (this.ringRadius/2);
        }
        this.dot.setPosition(cc.p(this.posX, this.posY));
        GameData.angle = this.getAngle(cc.p(this.posX, this.posY));
        GameData.speed1 = 120;
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
        GameData.speed1 = 120;
    },

    touchEndEventHandle: function () {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        this.dot.setPosition(this.node.getPosition());

        GameData.angle = null;
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
