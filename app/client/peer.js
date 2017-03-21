//Array which will contains the channels
var channel = [];
//Array which will contains the peerConnections
var peerConnections = [];
//
var connectedPeersId = [];
var signalingChannel

function initPeer(messageCallback){
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    
    var wsUri = "ws://localhost:8090/";
    signalingChannel = createSignalingChannel(wsUri, PEER_ID);
    var servers = { iceServers: [{urls: "stun:stun.1.google.com:19302"}] };

    //List of all peers connected to this peer (on the HTML page)
    var connectedList = document.getElementById('connected');
    //Index of the RTC connection for this peer 
    var index;

    signalingChannel.onInit = function (connectedPeers) {
        connectedPeersId = connectedPeers;
        var i = 0;
        //Wait for a connection to be really establich before establishing a new one
        function connectToPeers(){
            if(i < connectedPeersId.length){
                if(connectedPeersId[i] != PEER_ID){
                    createPeerConnection(connectedPeersId[i], true, connectToPeers);    
                }
            }
            i++;
        }
        connectToPeers();
    };

    function createPeerConnection(peerId, isInitiator, callback){
 	    var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });
        
 	    index = peerConnections.push(pc);

        signalingChannel.onAnswer = function (answer, source) {
            console.log('receive answer from ', source);
            peerConnections[index-1].setRemoteDescription(new RTCSessionDescription(answer));
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ",source);
            peerConnections[index-1].addIceCandidate(new RTCIceCandidate(ICECandidate));
            //Place the callback here, as is the last step before connection is established
            if(isInitiator === true){
                callback();                
            }
        };

        peerConnections[index-1].onicecandidate = function (evt) {
            if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        peerConnections[index-1].ondatachannel = function(event) {
            var receiveChannel = event.channel;
            console.log("channel received");
            channel.push(receiveChannel);
            receiveChannel.onmessage = function(event){
                messageCallback(event.data);
            };
            receiveChannel.onclose = function(event){
                console.log("dataChannel closed");
                connectedList.removeChild(connectedElt);
            };
        };

        if(isInitiator === true){
            //:warning the dataChannel must be opened BEFORE creating the offer.
            var _commChannel = peerConnections[index-1].createDataChannel('communication', {
                reliable: false
            });

            peerConnections[index-1].createOffer(function(offer){
                peerConnections[index-1].setLocalDescription(offer);
                console.log('send offer');
                signalingChannel.sendOffer(offer, peerId);
            }, function (e){
                console.error(e);
            });

            //Add the channel to the channel array
            channel.push(_commChannel);

            _commChannel.onclose = function(evt) {
                console.log("dataChannel closed");
                connectedList.removeChild(connectedElt);
            };

            _commChannel.onerror = function(evt) {
                console.error("dataChannel error");
            };

            _commChannel.onopen = function(){
                console.log("dataChannel opened");
            };

            _commChannel.onmessage = function(message){
                messageCallback(message.data);
            };
        }
        
        //Add on the page the Id of the peer we connected to
        var connectedElt = document.createElement("li");
        connectedElt.textContent = index + " : " + peerId;
        connectedList.appendChild(connectedElt);

        if(isInitiator === false){
            return peerConnections[index-1];
        }
    }

    signalingChannel.onOffer = function (offer, source) {
        console.log('receive offer');
        var peerConnection = createPeerConnection(source, false);
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        peerConnection.createAnswer(function(answer){
            peerConnection.setLocalDescription(answer);
            console.log('send answer');
            signalingChannel.sendAnswer(answer, source);
        }, function (e){
            console.error(e);
        });
    };
}