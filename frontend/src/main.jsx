import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Silenciador de consola para limpieza (mantiene console.error)
const originalError = console.error;
const noop = () => {};

console.log = noop;
console.warn = noop;
console.info = noop;
console.debug = noop;

console.error = (...args) => {
  // Ignorar advertencias internas de React específicas
  if (args[0]?.includes?.('inert')) return;
  originalError(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)