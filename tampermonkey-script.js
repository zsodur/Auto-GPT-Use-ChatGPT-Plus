// ==UserScript==
// @name         ChatGPT API By Browser Script
// @namespace    http://tampermonkey.net/
// @version      1
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        GM_webRequest
// @license MIT
// ==/UserScript==
console.log('starting');

const WS_URL = `ws://localhost:8765`;

function getTextFromNode(node) {
  let result = '';

  if (!node) return result;
  const childNodes = node.childNodes;

  for (let i = 0; i < childNodes.length; i++) {
    let childNode = childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      result += childNode.textContent;
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      result += getTextFromNode(childNode);
    }
  }

  return result;
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Main app class
class App {
  constructor() {
    this.socket = null;
    this.observer = null;
    this.stop = false;
    this.dom = null;
    this.lastText = null; // Track the last message text
  }

  async start({ text, model, newChat }) {
    this.stop = false;
    console.log('Starting to edit or send a message');

    // Check for the edit button
    const editButton = document.querySelector('button.flex.h-9.w-9.items-center.justify-center.rounded-full.text-token-text-secondary.transition.hover\\:bg-token-main-surface-tertiary');
    if (editButton) {
      console.log('Edit button found, clicking it');
      editButton.click();
      await sleep(500);

      // Select all text and replace with the new text
      const textarea = document.querySelector('textarea');
      if (textarea) {
        console.log('Textarea found, replacing text');
        textarea.value = text;
        textarea.select();
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);

        // Adding a small delay before pressing the send button
        await sleep(500);

        // Click the send button to send the edited message
        const sendButton = document.querySelector('button.btn.relative.btn-primary');
        if (sendButton) {
          console.log('Send button found, clicking it');
          sendButton.click();
        } else {
          console.log('Error: Send button not found');
        }
      } else {
        console.log('Error: Textarea not found');
      }
    } else {
      console.log('No edit button found, sending a new message');
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = text;
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
        await sleep(500);
        const sendButton = document.querySelector('button.mb-1.mr-1.flex.h-8.w-8.items-center.justify-center.rounded-full.bg-black.text-white.transition-colors.hover\\:opacity-70.focus-visible\\:outline-none.focus-visible\\:outline-black.disabled\\:bg-\\[\\#D7D7D7\\].disabled\\:text-\\[\\#f4f4f4\\].disabled\\:hover\\:opacity-100.dark\\:bg-white.dark\\:text-black.dark\\:focus-visible\\:outline-white.disabled\\:dark\\:bg-token-text-quaternary.dark\\:disabled\\:text-token-main-surface-secondary');
        if (sendButton) {
          console.log('Send button found, clicking it');
          sendButton.click();
        } else {
          console.log('Error: Send button not found');
        }
      } else {
        console.log('Error: Textarea not found');
      }
    }

    this.observeMutations();
  }

  async observeMutations() {
    await sleep(2000); // Initial delay before first checking button state
    this.observer = new MutationObserver(async (mutations) => {
      await sleep(500); // Adding delay to ensure message content is updated
      const list = [...document.querySelectorAll('div.agent-turn')];
      const last = list[list.length - 1];
      if (!last) {
        console.log('Error: No last message found');
        return;
      }
      const lastText = getTextFromNode(last.querySelector('div[data-message-author-role="assistant"]'));
      if (!lastText || lastText === this.lastText) {
        console.log('Error: Last message text not found or unchanged');
        return;
      }

      // Check the state of the button to ensure the message is fully loaded
      const stopButton = document.querySelector('button[aria-label="Stop generating"]');
      const sendButton = document.querySelector('button.mb-1.mr-1.flex.h-8.w-8.items-center.justify-center.rounded-full.bg-black.text-white.transition-colors.hover\\:opacity-70.focus-visible\\:outline-none.focus-visible\\:outline-black.disabled\\:bg-\\[\\#D7D7D7\\].disabled\\:text-\\[\\#f4f4f4\\].disabled\\:hover\\:opacity-100.dark\\:bg-white.dark\\:text-black.dark\\:focus-visible\\:outline-white.disabled\\:dark\\:bg-token-text-quaternary.dark\\:disabled\\:text-token-main-surface-secondary[disabled]');

      if (stopButton || !sendButton) {
        console.log('Message not fully loaded yet');
        return;
      }

      this.lastText = lastText;
      console.log('send', {
        text: lastText,
      });
      this.socket.send(
        JSON.stringify({
          type: 'answer',
          text: lastText,
        })
      );
      await sleep(1000);
      if (!stopButton) {
        if (this.stop) return;
        this.stop = true;
        console.log('send', {
          type: 'stop',
        });
        this.socket.send(
          JSON.stringify({
            type: 'stop',
          })
        );
        this.observer.disconnect();
      }
    });

    const observerConfig = { childList: true, subtree: true };
    this.observer.observe(document.body, observerConfig);
  }

  sendHeartbeat() {
    if (this.socket.readyState === WebSocket.OPEN) {
      console.log('Sending heartbeat');
      this.socket.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }

  connect() {
    this.socket = new WebSocket(WS_URL);
    this.socket.onopen = () => {
      console.log('Server connected, can process requests now.');
      this.dom.innerHTML = '<div style="color: green;">API Connected!</div>';
    };
    this.socket.onclose = () => {
      console.log('Error: The server connection has been disconnected, the request cannot be processed.');
      this.dom.innerHTML = '<div style="color: red;">API Disconnected!</div>';

      setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect();
      }, 2000);
    };
    this.socket.onerror = (error) => {
      console.log('Error: Server connection error, please check the server.', error);
      this.dom.innerHTML = '<div style="color: red;">API Error!</div>';
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received data from server', data);
        this.start(data);
      } catch (error) {
        console.log('Error: Failed to parse server message', error);
      }
    };
  }

  init() {
    window.addEventListener('load', () => {
      this.dom = document.createElement('div');
      this.dom.style = 'position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; justify-content: center; align-items: center;';
      document.body.appendChild(this.dom);

      this.connect();

      setInterval(() => this.sendHeartbeat(), 30000);
    });
  }
}

(function () {
  'use strict';
  const app = new App();
  app.init();
})();
