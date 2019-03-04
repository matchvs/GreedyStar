cc.Class({
    extends:cc.Component,

    properties:{
        scoreLable:cc.Label
    },


    onLoad: function () {
    },

    updateItem: function(obj) {
        if (this.scoreLable.string !== "") {
            this.scoreLable.string = "";
        }
        this.scoreLable.string = obj.userID+"："+obj.score;
    }

});
