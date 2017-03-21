var  connectedPeers = {};
var  connectedPeersId = [];

function onMessage(ws, message){
    var type = message.type;
    switch (type) {
        case "ICECandidate":
            onICECandidate(message.ICECandidate, message.destination, ws.id);
            break;
        case "offer":
            onOffer(message.offer, message.destination, ws.id);
            break;
        case "answer":
            onAnswer(message.answer, message.destination, ws.id);
            break;
        case "init":
            onInit(ws, message.init);
            break;
        default:
            throw new Error("invalid message type");
    }
}

function onInit(ws, id){
    console.log("init from peer:", id);
    ws.id = id;
    connectedPeers[id] = ws;
    connectedPeersId.push(id);
    //Send the list of connected peers to the peers which just conncet to the signaling server
    connectedPeers[id].send(JSON.stringify({
        type:'init',
        connectedPeers: connectedPeersId,
    }));
}

function onOffer(offer, destination, source){
    console.log("offer from peer:", source, "to peer", destination);
    if(connectedPeers[destination] !== undefined){
        connectedPeers[destination].send(JSON.stringify({
            type:'offer',
            offer:offer,
            source:source,
        }));
    }
    else{
        console.log("The peer " + destination + " doesn\'t exist")
    }
}

function onAnswer(answer, destination, source){
    console.log("answer from peer:", source, "to peer", destination);
    if(connectedPeers[destination] !== undefined){
        connectedPeers[destination].send(JSON.stringify({
            type: 'answer',
            answer: answer,
            source: source,
        }));
    }
    else{
        console.log("The peer " + destination + " doesn\'t exist")
    }
}

function onICECandidate(ICECandidate, destination, source){
    console.log("ICECandidate from peer:", source, "to peer", destination);
    if(connectedPeers[destination] !== undefined){
        connectedPeers[destination].send(JSON.stringify({
            type: 'ICECandidate',
            ICECandidate: ICECandidate,
            source: source,
        }));    
    }
    else{
        console.log("The peer " + destination + " doesn\'t exist")
    }
}

module.exports = onMessage;

//exporting for unit tests only
module.exports._connectedPeers = connectedPeers;