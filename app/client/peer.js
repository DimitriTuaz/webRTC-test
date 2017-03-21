//Id of the peer
var PEER_ID;
//Array which will contains the channels
var channel = [];
//Array which will contains the peerConnections
var peerConnections = [];
//
var connectedPeersId = [];

function initPeer(messageCallback){
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    
    var wsUri = "ws://localhost:8090/";
    var signalingChannel = createSignalingChannel(wsUri, PEER_ID);
    var servers = { iceServers: [{urls: "stun:stun.1.google.com:19302"}] };

    //List of all peers connected to this peer (on the HTML page)
    var connectedList = document.getElementById('connected');
    //Index of the RTC connection for this peer 
    var index;

    signalingChannel.onInit = function (connectedPeers) {
        connectedPeersId = connectedPeers;
        console.log(connectedPeersId.length);
        /*for(i=0 ; i<connectedPeersId.length ; i++){
            if(connectedPeersId[i] != PEER_ID){
                startCommunication(connectedPeersId[i]);    
            }
            else{}
        }*/
        var i = 0;
        function connectToPeers(){
            if(i < connectedPeersId.length){
                if(connectedPeersId[i] != PEER_ID){
                    startCommunication(connectedPeersId[i],connectToPeers);    
                }
            }
            i++;
        }
        connectToPeers();
    };

    function startCommunication(peerId, callback){
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
            callback();
        };

        peerConnections[index-1].onicecandidate = function (evt) {
            if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

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

        //Add on the page the Id of the peer we connected to
        var connectedElt = document.createElement("li");
        connectedElt.textContent = index + " : " + peerId;
        connectedList.appendChild(connectedElt);
        console.log("Channel length : " + channel.length);
    }
    
    window.startCommunication = startCommunication;

    function createPeerConnection(peerId){
        var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });
        
        index = peerConnections.push(pc);

        peerConnections[index-1].onicecandidate = function (evt) {
            if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ",source);
            peerConnections[index-1].addIceCandidate(new RTCIceCandidate(ICECandidate));
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

        //Add on the page the Id of the peer which connected to us
        var connectedElt = document.createElement("li");
        connectedElt.textContent = index + " : " + peerId;
        connectedList.appendChild(connectedElt);

        return peerConnections[index-1];
    }

    signalingChannel.onOffer = function (offer, source) {
        console.log('receive offer');
        var peerConnection = createPeerConnection(source);
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