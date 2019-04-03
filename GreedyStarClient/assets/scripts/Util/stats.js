 function DefaultHttp(callback) {
        this.mCallback = callback;

        var send = function (url, callback, isPost, params) {
            var cType = isPost ? "application/json" : "application/x-www-form-urlencoded";
            var http = new XMLHttpRequest();
            http.open(isPost ? "POST" : "GET", url, true);
            http.setRequestHeader("Content-type", cType);
            http.onreadystatechange = function () {//Call a function when the state changes.
                if (http.readyState === 4) {
                    if (http.status === 200) {
                        callback.onMsg(http.responseText);
                    } else {
                        callback.onErr(http.status, http.statusText);
                    }
                }
            };
            if (isPost) {
                if (typeof params === "object") {
                    http.send(JSON.stringify(params));
                } else {
                    http.send(params);
                }
            } else {
                http.send(null);
            }
        };

        /**
         * HTTP GET
         * @param url {String} ex:"http://testpay.matchvs.com/wc3/submitOrder.do?key=fa"
         */
        this.get = function (url, callBack) {
            send(url, callBack || this.mCallback, false, null);
        };
        /**
         * HTTP POST
         * @param url {String} ex:"http://testpay.matchvs.com/wc3/submitOrder.do"
         * @param params {String} ex:"lorem=ipsum&name=binny";
         */
        this.post = function (url, params) {
            send(url, this.mCallback, true, params);
        };
    }

    var Http = new DefaultHttp();


    var HOST = "115.231.9.66";
    var PORT = "8081";
    var PROTOCOL = "http://";
    var getUrl = function (uri) {
        return PROTOCOL + HOST + ":" + PORT + "/stats/" + uri;
    };


    var GetUrlParam = function (paraName) {
        var url = document.location.toString();
        var arrObj = url.split("?");

        if (arrObj.length > 1) {
            var arrPara = arrObj[1].split("&");
            var arr;

            for (var i = 0; i < arrPara.length; i++) {
                arr = arrPara[i].split("=");

                if (arr != null && arr[0] === paraName) {
                    return arr[1];
                }
            }
        }
        return "";
    };
	
	
	var statsUpload = function (data,ID) {

         Http.get(getUrl("stats/add?ID="+(ID||0)+"&value=" + data), {
                 onMsg: function (res) {
                     // console.log("[INFO]  "+res);
                 },
                 onErr: function (e) {
                     console.log("[INFO]  " + e);
                 }
             }
         );
	}
 module.exports = {
     statsUpload,
 }