let Const = require('../Const/Const');


function MoveSync(onMoveSync) {
    this.cacheSize = Math.floor(MoveSync.FPS / 10);
    this.cacheQueue = [];
    this.isCacheing = true;
    this.timer = setInterval(function () {
        if (this.cacheQueue.length > 0) {
            if (!this.isCacheing) {
                onMoveSync(this.cacheQueue.pop());
                if (this.cacheSize > 0 && this.cacheQueue.length > this.cacheSize) {
                    while (this.cacheQueue.length > (this.cacheSize - 1)) {
                        onMoveSync(this.cacheQueue.pop());
                        // console.warn('[WARN] should jump frame ! the cacheQueue.len' + this.cacheQueue.length + '  >  ' + this.cacheSize);
                    }
                    this.isCacheing = true;
                }
            } else {
                // console.log('[INFO] caching, queue.size:' + this.cacheQueue.length);
            }
        } else {
            // console.warn('[WARN] the cache is not enough !');
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




