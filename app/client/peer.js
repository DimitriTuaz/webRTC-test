function initPeer(messageCallback){
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    
    var wsUri = "ws://localhost:8090/";
    var signalingChannel = createSignalingChannel(wsUri, PEER_ID);
    var servers = { iceServers: [{urls: "stun:stun.1.google.com:19302"}] };
}