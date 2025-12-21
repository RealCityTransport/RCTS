// src/data/transports/meta.js
// 운송 "실 데이터"(표시/목록/아이콘/순서)는 연구모듈이 아니라 여기서 관리

export const TRANSPORT_IDS = ['bus', 'truck', 'rail', 'plane', 'ship', 'spaceship'];

export const transportMeta = {
  bus: { name: '버스', icon: '🚌' },
  truck: { name: '트럭', icon: '🚚' },
  rail: { name: '철도', icon: '🚆' },
  plane: { name: '비행기', icon: '✈️' },
  ship: { name: '배', icon: '🚢' },
  spaceship: { name: '우주선', icon: '🚀' },
};
