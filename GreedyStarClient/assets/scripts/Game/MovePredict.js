var Const = require('../Const/Const');


function MovePredict(onMoveCalu) {
    this.cacheQueue = [];
    this.arrow = null;
    this.timer = setInterval(function () {
        if (this.arrow == null) {
            return;
        }
        onMoveCalu(this.arrow);
    }.bind(this), 1000 / MovePredict.FPS);
}

MovePredict.prototype.update = function (arrow) {
    this.arrow = arrow;
};
MovePredict.prototype.dispose = function () {
    clearInterval(this.timer);
};

MovePredict.FPS =  60;
module.exports = MovePredict;




