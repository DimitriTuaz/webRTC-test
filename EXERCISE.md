# WebRTC Exercise

A very source code of the application can be found in the `/app` directory. It's composed of 2 different parts :

- a signaling server (`/app/server/SignalingServer.js`) which is a websocket server written in node.js and used as a signaling mechanism for webRTC.
- a **peer** webpage (`app/client/caller.html`), which is able to establish a communication with an other **peers**.

## Launching the app

First run `npm install` to install dependencies. Then run `npm start` (it starts the signaling server on port 8090 and starts a web server on the root of this repository on port 8089).

In as many different tabs as you like, open [peer tabs](http://localhost:8089/app/client/peer.html).

## How the app works

When a **peer** tab is open, you must give an ID to this peer (it can be a number, the name of a friend, ...). 

As soon as you have more than one **peer** opened in your browser, they are all connected with each other. You have the list of the **peers** connected on the top of the page. 

To send a message, fill the first box with the number of the recipient (*the number of the peers is found in the above list*), and the second box with your message. Click on 'Send message', and here it goes!

The application automatically disconnect **peers** when they are shut down (i.e. the tab is closed).
