var Toast = {
    LENGTH_LONG: 3.5,
    LENGTH_SHORT: 2,
    CENTER: 0,
    TOP: 1,
    TOP_LEFT: 2,
    LEFT: 3,
    BOTTOM_LEFT: 4,
    BOTTOM: 5,
    BOTTOM_RIGHT: 6,
    RIGHT: 7,
    TOP_RIGHT: 8,
};

Toast.makeText = function (text, duration) {
    var _text;
    var _duration;
    var _gravity;
    var _x = 0;
    var _y = 0;
    var ToastObject = function (tText, tDuration) {
        _text = tText;
        _duration = tDuration;
        //
        this.setGravity = function (gravity, x, y) {
            _gravity = gravity;
            _x = x;
            _y = y;
        }
        //
        this.show = function () {
            // 加载背景纹理
            if (Toast.bgSpriteFrame === undefined) {
                self = this;
                (function () {
                    cc.loader.load({ 'uuid': 'b43ff3c2-02bb-4874-81f7-f2dea6970f18' },
                        function (error, result) {
                            if (error) {
                                cc.error(error);
                                return;
                            }
                            Toast.bgSpriteFrame = new cc.SpriteFrame(result);
                            Toast.bgSpriteFrame.insetTop = 3;
                            Toast.bgSpriteFrame.insetBottom = 3;
                            Toast.bgSpriteFrame.insetLeft = 4;
                            Toast.bgSpriteFrame.insetRight = 4;
                            //加载完再调用
                            self.show();
                        })
                })();
                return;
            }
            // canvas
            var canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
            var width = canvas.node.width;
            var height = canvas.node.height;
            if (_duration === undefined) {
                _duration = Toast.LENGTH_SHORT;
            }
            // 背景图片设置
            var bgNode = new cc.Node();
            // 背景图片透明度
            bgNode.opacity = 200;
            var bgSprite = bgNode.addComponent(cc.Sprite);
            bgSprite.type = cc.Sprite.Type.SLICED;
            var bgLayout = bgNode.addComponent(cc.Layout);
            bgLayout.resizeMode = cc.Layout.ResizeMode.CONTAINER;

            // Lable文本格式设置
            var textNode = new cc.Node();
            var textLabel = textNode.addComponent(cc.Label);
            textLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            textLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
            textLabel.fontSize = 20;
            textLabel.string = _text;

            //背景图片与文本内容的间距
            var hPadding = textLabel.fontSize / 8;
            var vPadding = 2;
            bgLayout.paddingLeft = hPadding;
            bgLayout.paddingRight = hPadding;
            bgLayout.paddingTop = vPadding;
            bgLayout.paddingBottom = vPadding;

            // 当文本宽度过长时，设置为自动换行格式
            if (_text.length * textLabel.fontSize > width / 3) {
                textNode.width = width / 3;
                textLabel.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            }

            bgNode.addChild(textNode);
            if (Toast.bgSpriteFrame) {
                bgSprite.spriteFrame = Toast.bgSpriteFrame;
            }
            // gravity 设置Toast显示的位置
            if (_gravity == Toast.CENTER) {
                textNode.y = 0;
                textNode.x = 0;
            } else if (_gravity == Toast.TOP) {
                textNode.y = textNode.y + (height / 5) * 2;
            } else if (_gravity == Toast.TOP_LEFT) {
                textNode.y = textNode.y + (height / 5) * 2;
                textNode.x = textNode.x + (width / 5);
            } else if (_gravity == Toast.LEFT) {
                textNode.x = textNode.x + (width / 5);
            } else if (_gravity == Toast.BOTTOM_LEFT) {
                textNode.y = textNode.y - (height / 5) * 2;
                textNode.x = textNode.x + (width / 5);
            } else if (_gravity == Toast.BOTTOM) {
                textNode.y = textNode.y - (height / 5) * 2;
            } else if (_gravity == Toast.BOTTOM_RIGHT) {
                textNode.y = textNode.y - (height / 5) * 2;
                textNode.x = textNode.x - (width / 5);
            } else if (_gravity == Toast.RIGHT) {
                textNode.x = textNode.x - (width / 5);
            } else if (_gravity == Toast.TOP_RIGHT) {
                textNode.y = textNode.y + (height / 5) * 2;
                textNode.x = textNode.x - (width / 5);
            } else {
                // 默认情况 BOTTOM
                textNode.y = textNode.y - (height / 5) * 2;
            }
            textNode.x = textNode.x + _x;
            textNode.y = textNode.y + _y;

            canvas.node.addChild(bgNode);

            var finished = cc.callFunc(function (target) {
                bgNode.destroy();
            }, self);
            var action = cc.sequence(cc.moveBy(_duration,cc.p(0,0)),cc.fadeOut(0.3), finished);
            bgNode.runAction(action);
        }
    }

    return new ToastObject(text, duration);
};

Toast.showText = function (text, duration) {
    Toast.makeText(text, duration).show();
}