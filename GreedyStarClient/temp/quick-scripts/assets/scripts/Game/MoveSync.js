(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/Game/MoveSync.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'e592aNGQ59LjbYlnyCK7KWj', 'MoveSync', __filename);
// scripts/Game/MoveSync.js

'use strict';

var Const = require('../Const/Const');

function MoveSync(onMoveSync) {
    this.cacheSize = Math.floor(MoveSync.FPS / 10);
    this.cacheQueue = [];
    this.isCacheing = true;
    this.timer = setInterval(function () {
        if (this.cacheQueue.length > 0) {
            if (!this.isCacheing) {
                onMoveSync(this.cacheQueue.pop());
                if (this.cacheSize > 0 && this.cacheQueue.length > this.cacheSize) {
                    while (this.cacheQueue.length > this.cacheSize - 1) {
                        onMoveSync(this.cacheQueue.pop());
                        console.warn('[WARN] should jump frame ! the cacheQueue.len' + this.cacheQueue.length + '  >  ' + this.cacheSize);
                    }
                    this.isCacheing = true;
                }
            } else {
                console.log('[INFO] caching, queue.size:' + this.cacheQueue.length);
            }
        } else {
            console.warn('[WARN] the cache is not enough !');
        }
    }.bind(this), 1000 / MoveSync.FPS);
}

MoveSync.prototype.update = function (arrow) {
    this.cacheQueue.unshift(arrow);
    if (this.isCacheing && this.cacheQueue.length >= this.cacheSize) {
        this.isCacheing = false;
    }
};

MoveSync.prototype.dispose = function () {
    clearInterval(this.timer);
};

MoveSync.FPS = Const.FPS;

module.exports = MoveSync;

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=MoveSync.js.map
        