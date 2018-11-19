cc.Class({
    extends:cc.Component,

    properties:{
        scoreLable:cc.Label
    },


    onLoad: function () {
        var self = this;
    },

    updateItem: function(obj) {
        this.scoreLable.string = obj.userID+"："+obj.score;
    }

});
