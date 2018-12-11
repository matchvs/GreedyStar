let engine = require('../../Lib/MatchvsEngine');

cc.Class({
    extends: cc.Component,

    properties: {
        dot: cc.Node,
        speed:cc.Node,
    },



    onLoad() {
        this.input = {l: 0, r: 0, u: 0, d: 0,p:0};
        this.ringRadius = this.node.width / 2;
        //操纵杆X坐标
        this.joyStickX = this.node.getPosition().x;
        //操纵杆Y坐标
        this.joyStickY = this.node.getPosition().y;
        this.initInput(this);
    },



    initInput(self) {
       var keycode = {37: 0, 38: 0, 39: 0, 40: 0, 32:0, 1000:0, 1001:0, 1003:0, 1004:0};
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, function (event) {
            if ((event.keyCode >31 && event.keyCode < 42) || (event.keyCode > 999 && event.keyCode < 1005) || keycode[event.keyCode] != 1) {
                keycode[event.keyCode] = 1;
                syncKeyCode2Input();
            }
        }.bind(this));
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, function (event) {
            if ((event.keyCode > 31 && event.keyCode < 42) || (event.keyCode > 999 && event.keyCode < 1005) || keycode[event.keyCode] != 1) {
                keycode[event.keyCode] = 0;
                syncKeyCode2Input();
            }
        }.bind(this));
        
        this.node.on(cc.Node.EventType.TOUCH_START,function (event) {
                let touchPos = self.node.convertToNodeSpaceAR(event.getLocation());
                let posX = self.joyStickX + touchPos.x;
                let posY = self.joyStickY + touchPos.y;
                let distance = touchPos.sub(cc.v2(0,0));
                var rad = Math.atan2(touchPos.y, touchPos.x);
                isDirection(rad,8);
                if (self.ringRadius > distance) {
                    self.dot.setPosition(cc.v2(posX, posY));
                    return true;
                }
                return false;
        });

        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            let touchPos = self.node.convertToNodeSpaceAR(event.getLocation());
            let posX = self.joyStickX + touchPos.x;
            let posY = self.joyStickY + touchPos.y;
            let distance =  touchPos.sub(cc.v2(0,0));
            var rad = Math.atan2(touchPos.y, touchPos.x);// [-PI, PI]
            isDirection(rad,8);
            if (self.ringRadius > distance) {
                self.dot.setPosition(cc.v2(posX, posY))
            } else {
                let bPosX = self.node.getPosition().x + Math.cos(getRadian(cc.v2(posX, posY))) * self.ringRadius;
                let bPosY = self.node.getPosition().y + Math.sin(getRadian(cc.v2(posX, posY))) * self.ringRadius;
                self.dot.setPosition(cc.v2(bPosX, bPosY))
            }
            syncKeyCode2Input();
        });

        this.node.on(cc.Node.EventType.TOUCH_END, function (event) {
            self.dot.setPosition(self.node.getPosition());
            keycode = {37: 0, 38: 0, 39: 0, 40: 0, 32:0, 1000:0, 1001:0, 1003:0, 1004:0};
            syncKeyCode2Input();
        });



        this.speed.on(cc.Node.EventType.TOUCH_START,function () {
            self.input.p = 1;
        });

        this.speed.on(cc.Node.EventType.TOUCH_END,function () {
            self.input.p  = 0;
        });

        function syncKeyCode2Input() {
            if (self.input == null) {
                self.input = {l: 0, r: 0, u: 0, d: 0,p:0};
            }
            self.input.l = keycode["37"] == 1 || keycode["1000"] == 1 ? 1 : 0;
            self.input.u = keycode["38"] == 1 || keycode["1003"] == 1 ? 1 : 0;
            self.input.r = keycode["39"] == 1 || keycode["1001"] == 1 ? 1 : 0;
            self.input.d = keycode["40"] == 1 || keycode["1004"] == 1 ? 1 : 0;
            self.input.p = keycode["32"];
            engine.prototype.sendEventEx(1,JSON.stringify({type: "input", data: self.input}))
        }

        function isDirection (rad,count) {
            keycode = {37: 0, 38: 0, 39: 0, 40: 0, 32:0, 1000:0, 1001:0, 1003:0, 1004:0};
            if ((rad >= -Math.PI / count && rad < 0) || (rad >= 0 && rad < Math.PI / count)) {
                keycode["39"] = 1; //右
                // console.log("右");
            } else if (rad >= Math.PI / count && rad < 3 * Math.PI / count) {
                keycode["39"] = 1; //右上
                keycode["38"] = 1;
                // console.log("右上");
            } else if (rad >= 3 * Math.PI / count && rad < 5 * Math.PI / count) {
                keycode["38"] = 1; // 上
                // console.log("上");
            } else if (rad >= 5 * Math.PI / count && rad < 7 * Math.PI / count) {
                keycode["37"] = 1;// 左上
                keycode["38"] = 1;
                // console.log("左上");
            } else if ((rad >= 7 * Math.PI / count && rad < Math.PI) || (rad >= -Math.PI && rad < -7 * Math.PI / count)) {
                keycode["37"] = 1;// 左
                // console.log("左");
            } else if (rad >= -7 * Math.PI / count && rad < -5 * Math.PI / count) {
                keycode["37"] = 1;// 左下
                keycode["40"] = 1;
                // console.log("左下");
            } else if (rad >= -5 * Math.PI / count && rad < -3 * Math.PI / count) {
                keycode["40"] = 1;// 下
                // console.log("下");
            } else {
                keycode["39"] = 1;// 右下
                keycode["40"] = 1;
                // console.log("右下");
            }
            syncKeyCode2Input();
        }

        function getRadian(point) {
            return self.radian = Math.PI / 180 * getAngle(point);
        }

        function  getAngle(point) {
            return Math.atan2(point.y - self.joyStickY, point.x - self.joyStickX) * (180 / Math.PI);
        }
    },
});
