'use strict';


const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const registerButton = document.getElementById("registerButton");
const startButton = document.getElementById("startButton");


// Set event listeners for user interface widgets

registerButton.addEventListener("click", register, false);
startButton.addEventListener("click", start, false);



function startup() {

}


const socket = io();
    let peerConnection;
    let localStream;

    function register() {
        const username = document.getElementById("username").value;
        socket.emit('register', username);
        getLocalStream();
    }

    socket.on('user_list', function(users) {
        var userList = document.getElementById("user_list");
        userList.innerHTML = "";
        for (var i = 0; i < users.length; i++) {
            var option = document.createElement("option");
            option.value = users[i];
            option.text = users[i];
            userList.add(option);
        }
    });

    socket.on('message', function(message){

      switch(message.type){
        case 'offer':
          handleOfferMessage(message);
          break;
        case 'answer':
          handleAnswerMessage(message);
          break;
        case 'candidate':
          handleCandidateMessage(message);
          break;
        case 'call':
          handleCallMessage(message);
          break;
        default:
          console.error("Recieve unknow message type : &" + message.type);
      }
    })

    function handleCandidateMessage(message){

      console.log('handleCandidateMessage');

      if (peerConnection) {
        
        const newIceCandidate = new RTCIceCandidate({
          candidate: message.candidate,
          sdpMid: message.sdpMid,
          sdpMLineIndex: message.sdpMLineIndex,
        });

        peerConnection.addIceCandidate(newIceCandidate)
        .then(() => {
          console.log('Successfully added ICE candidate');
        })
        .catch(error => {
          console.error('Error adding ICE candidate:', error);
        });
      }
      else 
      {console.log("for candidate : peerconnection is null");}
      
    }

    async function handleOfferMessage(message){
    console.log("handleOfferMessage");
    
    if (!peerConnection){
      console.error("peerconnect is null");
    }

    const offer = new RTCSessionDescription(message.desc);

    if (!peerConnection){
      console.error(" peerConnection is NULL");
    }

    // 设置远程描述
    await peerConnection.setRemoteDescription(offer);

    // 创建answer
    const answer = await peerConnection.createAnswer();

    // 设置本地描述
    await peerConnection.setLocalDescription(answer);

    // 发送answer
    
      socket.emit('message', {
        type:"answer",
        to:message.to,
        desc:answer
      });

   }


   
   function handleAnswerMessage(message){
    
    console.log('handleAnswerMessage');

  
    if (!peerConnection){
      console.log("peerConnection is NULL");
      return;
    }
              // 处理收到answer的事件
    console.log("recieve answer ....");
    const answer = new RTCSessionDescription(message.desc);
    peerConnection.setRemoteDescription(answer);
              
   }

    // 获取本地视频流
    async function  getLocalStream() {
      console.log("getLocalStream");
      localStream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
      console.log("getLocalStream end");
      localVideo.srcObject = localStream;
    }

    // 创建RTCPeerConnection对象
    function createPeerConnection() {
        // 将本地媒体流添加到RTCPeerConnection

      //  const localStream = document.querySelector('#localVideo').srcObject;

        console.log("create peerconnect");
        peerConnection = new RTCPeerConnection()

        localStream.getTracks().forEach(track => {
         //   const localVideo = document.querySelector('#localVideo');

            peerConnection.addTrack(track, localStream);
        });

        // 处理收到远端媒体流的事件

        console.log("set remote stream");
        peerConnection.addEventListener('track', event => {
            console.log("set remote track");
           // const remoteVideo = document.querySelector('#remoteVideo');
            remoteVideo.srcObject = event.streams[0];
        });

    }

    // 开始呼叫对方客户端
    function start() {

      const toUser = document.getElementById("user_list").value;
      
      socket.emit('message', {
        type:"call", 
        to:toUser
      });
      

      console.log("Start");
      console.log("createPeerConnection");
      createPeerConnection() 
      console.log("createPeerConnection end");
      // 创建RTCPeerConnection对象


      peerConnection.onicecandidate = e => {
        if (e.candidate){
          console.log("send candidate, " + "sdpMid: " + e.candidate.sdpMid + " \n sdpMLineIndex: " + e.candidate.sdpMLineIndex + " , \n candidate : " + e.candidate.candidate);
          socket.emit('message', {
            type:"candidate",
            to:toUser,
            candidate:e.candidate.candidate,
            sdpMid:e.candidate.sdpMid,
            sdpMLineIndex:e.candidate.sdpMLineIndex
          });
        }
      };

  

    }

    // 建立WebSocket连接
    //const socket = io();x

    // 处理连接成功事件
    socket.on('connect', () => {
      console.log('Connected to server');
    });



    // 处理收到呼叫请求的事件
    async function handleCallMessage(message){


      console.log('handleCallMessage');
      createPeerConnection() 
      if (!peerConnection) {
        console.error("peerConnection is null");
        return;
      }

      peerConnection.onicecandidate = e => {

        if (e.candidate){
          console.log("send candidate, " + "sdpMid: " + e.candidate.sdpMid + " \n sdpMLineIndex: " + e.candidate.sdpMLineIndex + " , \n candidate : " + e.candidate.candidate);

          console.log("send candidate");
          socket.emit('message',  {
            type:"candidate",
            to:message.to,
            candidate:e.candidate.candidate,
            sdpMid:e.candidate.sdpMid,
            sdpMLineIndex:e.candidate.sdpMLineIndex
          });
        }
      };



      // 创建offer
      await peerConnection.createOffer()
        .then(offer => {
          // 设置本地描述
          return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
          socket.emit('message', {
            type:"offer",
            to:message.to,
            desc:peerConnection.localDescription
          });
        })
        .catch(error => {
          console.error(`Error creating offer: ${error}`);
        });

    }