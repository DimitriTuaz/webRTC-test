function initPeer(messageCallback){
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    
    var wsUri = "ws://localhost:8090/";
    var signalingChannel = createSignalingChannel(wsUri, PEER_ID);
    var servers = { iceServers: [{urls: "stun:stun.1.google.com:19302"}] };

    //Array which will contain the peerConnections
    var peerConnections = [];
    window.channel = [];
    //List of all peers connected to this peer
    var connectedList = document.getElementById('connected');

    function startCommunication(peerId) {
 	    var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });
        
 	    var i = peerConnections.push(pc);

        signalingChannel.onAnswer = function (answer, source) {
            console.log('receive answer from ', source);
            peerConnections[i-1].setRemoteDescription(new RTCSessionDescription(answer));
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ",source);
            peerConnections[i-1].addIceCandidate(new RTCIceCandidate(ICECandidate));
        };

        peerConnections[i-1].onicecandidate = function (evt) {
            if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        //:warning the dataChannel must be opened BEFORE creating the offer.
        var _commChannel = peerConnections[i-1].createDataChannel('communication', {
            reliable: false
        });

        peerConnections[i-1].createOffer(function(offer){
            peerConnections[i-1].setLocalDescription(offer);
            console.log('send offer');
            signalingChannel.sendOffer(offer, peerId);
        }, function (e){
            console.error(e);
        });

        window.channel = _commChannel;
        
        _commChannel.onclose = function(evt) {
            console.log("dataChannel closed");
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
        connectedElt.textContent = peerId;
        connectedList.appendChild(connectedElt);
    }
    
    window.startCommunication = startCommunication;

    function createPeerConnection(peerId){
        var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });
            
        pc.onicecandidate = function (evt) {
            if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ",source);
            pc.addIceCandidate(new RTCIceCandidate(ICECandidate));
        };

        pc.ondatachannel = function(event) {
          var receiveChannel = event.channel;
          console.log("channel received");
          window.channel = receiveChannel;
          receiveChannel.onmessage = function(event){
            messageCallback(event.data);
          };
        };

        //Add on the page the Id of the peer which connected to us
        var connectedElt = document.createElement("li");
        connectedElt.textContent = peerId;
        connectedList.appendChild(connectedElt);

        return pc;
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