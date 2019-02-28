cc.Class({
    extends: cc.Component,

    properties: {
        nodeLable:cc.Label
    },


    start () {

    },

    updateItem: function(obj) {
        this.nodeLable.string = obj.area+ "     " + obj.latency+"ms";
        this.name = obj.nodeID;
    }

});
