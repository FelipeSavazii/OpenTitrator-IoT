import io from 'socket.io-client';

export const socket = io('https://opentitrator-iot.onrender.com/', {
  autoConnect: false 
});