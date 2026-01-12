/**
 * Apex Copilot Widget Embed Script
 * Lightweight script that loads the widget iframe
 */
(function() {
  'use strict';

  // Widget state
  var state = {
    initialized: false,
    agentId: null,
    config: {},
    isOpen: false,
    sessionId: null,
    visitorId: null,
  };

  // Default configuration
  var defaults = {
    primaryColor: '#2563eb',
    position: 'bottom-right',
    greeting: "Hi! I'm here to help. What questions do you have?",
    placeholder: 'Type your message...',
    buttonText: 'Chat with us',
    showBranding: true,
    autoOpen: false,
    autoOpenDelay: 5000,
    collectEmail: true,
  };

  // API base URL
  var apiBase = getScriptOrigin();

  function getScriptOrigin() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].id === 'apex' && scripts[i].src) {
        var url = new URL(scripts[i].src);
        return url.origin;
      }
    }
    return 'https://app.apexaffinity.com';
  }

  // Get or create visitor ID
  function getVisitorId() {
    var key = 'apex_visitor_id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, id);
    }
    return id;
  }

  // Create widget styles
  function injectStyles() {
    var css = '\n      #apex-widget-container {\n        position: fixed;\n        z-index: 999999;\n        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n      }\n      #apex-widget-container.bottom-right {\n        bottom: 20px;\n        right: 20px;\n      }\n      #apex-widget-container.bottom-left {\n        bottom: 20px;\n        left: 20px;\n      }\n      #apex-widget-button {\n        width: 60px;\n        height: 60px;\n        border-radius: 50%;\n        border: none;\n        cursor: pointer;\n        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        transition: transform 0.2s, box-shadow 0.2s;\n      }\n      #apex-widget-button:hover {\n        transform: scale(1.05);\n        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);\n      }\n      #apex-widget-button svg {\n        width: 28px;\n        height: 28px;\n        fill: white;\n      }\n      #apex-widget-window {\n        position: absolute;\n        bottom: 80px;\n        width: 380px;\n        height: 520px;\n        background: white;\n        border-radius: 16px;\n        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);\n        display: none;\n        flex-direction: column;\n        overflow: hidden;\n      }\n      #apex-widget-container.bottom-right #apex-widget-window {\n        right: 0;\n      }\n      #apex-widget-container.bottom-left #apex-widget-window {\n        left: 0;\n      }\n      #apex-widget-window.open {\n        display: flex;\n      }\n      #apex-widget-header {\n        padding: 16px;\n        color: white;\n        display: flex;\n        align-items: center;\n        gap: 12px;\n      }\n      #apex-widget-header-avatar {\n        width: 40px;\n        height: 40px;\n        border-radius: 50%;\n        background: rgba(255, 255, 255, 0.2);\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-size: 18px;\n        font-weight: 600;\n      }\n      #apex-widget-header-avatar img {\n        width: 100%;\n        height: 100%;\n        border-radius: 50%;\n        object-fit: cover;\n      }\n      #apex-widget-header-info h3 {\n        margin: 0;\n        font-size: 16px;\n        font-weight: 600;\n      }\n      #apex-widget-header-info p {\n        margin: 2px 0 0;\n        font-size: 13px;\n        opacity: 0.9;\n      }\n      #apex-widget-close {\n        margin-left: auto;\n        background: none;\n        border: none;\n        color: white;\n        cursor: pointer;\n        padding: 4px;\n        opacity: 0.8;\n      }\n      #apex-widget-close:hover {\n        opacity: 1;\n      }\n      #apex-widget-messages {\n        flex: 1;\n        overflow-y: auto;\n        padding: 16px;\n        display: flex;\n        flex-direction: column;\n        gap: 12px;\n      }\n      .apex-widget-message {\n        max-width: 85%;\n        padding: 10px 14px;\n        border-radius: 16px;\n        font-size: 14px;\n        line-height: 1.4;\n      }\n      .apex-widget-message.user {\n        align-self: flex-end;\n        color: white;\n        border-bottom-right-radius: 4px;\n      }\n      .apex-widget-message.assistant {\n        align-self: flex-start;\n        background: #f1f3f5;\n        color: #1a1a1a;\n        border-bottom-left-radius: 4px;\n      }\n      #apex-widget-input-container {\n        padding: 12px 16px;\n        border-top: 1px solid #eee;\n        display: flex;\n        gap: 8px;\n      }\n      #apex-widget-input {\n        flex: 1;\n        padding: 10px 14px;\n        border: 1px solid #e0e0e0;\n        border-radius: 24px;\n        font-size: 14px;\n        outline: none;\n        transition: border-color 0.2s;\n      }\n      #apex-widget-input:focus {\n        border-color: var(--apex-primary);\n      }\n      #apex-widget-send {\n        width: 40px;\n        height: 40px;\n        border-radius: 50%;\n        border: none;\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        transition: opacity 0.2s;\n      }\n      #apex-widget-send:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n      }\n      #apex-widget-send svg {\n        width: 18px;\n        height: 18px;\n        fill: white;\n      }\n      #apex-widget-branding {\n        padding: 8px 16px;\n        text-align: center;\n        font-size: 11px;\n        color: #999;\n        border-top: 1px solid #eee;\n      }\n      #apex-widget-branding a {\n        color: #666;\n        text-decoration: none;\n      }\n      #apex-widget-branding a:hover {\n        text-decoration: underline;\n      }\n      #apex-widget-typing {\n        display: none;\n        align-self: flex-start;\n        background: #f1f3f5;\n        padding: 12px 16px;\n        border-radius: 16px;\n        border-bottom-left-radius: 4px;\n      }\n      #apex-widget-typing.show {\n        display: block;\n      }\n      .apex-typing-dots {\n        display: flex;\n        gap: 4px;\n      }\n      .apex-typing-dots span {\n        width: 8px;\n        height: 8px;\n        background: #999;\n        border-radius: 50%;\n        animation: apex-typing 1.4s infinite;\n      }\n      .apex-typing-dots span:nth-child(2) { animation-delay: 0.2s; }\n      .apex-typing-dots span:nth-child(3) { animation-delay: 0.4s; }\n      @keyframes apex-typing {\n        0%, 60%, 100% { transform: translateY(0); }\n        30% { transform: translateY(-4px); }\n      }\n    ';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Create widget HTML
  function createWidget() {
    var config = Object.assign({}, defaults, state.config);
    var container = document.createElement('div');
    container.id = 'apex-widget-container';
    container.className = config.position;
    container.style.setProperty('--apex-primary', config.primaryColor);

    container.innerHTML = '\n      <div id="apex-widget-window">\n        <div id="apex-widget-header" style="background: ' + config.primaryColor + '">\n          <div id="apex-widget-header-avatar">\n            ' + (config.agentAvatar ? '<img src="' + config.agentAvatar + '" alt="">' : getInitials(config.agentName)) + '\n          </div>\n          <div id="apex-widget-header-info">\n            <h3>' + (config.agentName || 'Support') + '</h3>\n            <p>Usually replies instantly</p>\n          </div>\n          <button id="apex-widget-close" aria-label="Close chat">\n            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n              <path d="M18 6L6 18M6 6l12 12"/>\n            </svg>\n          </button>\n        </div>\n        <div id="apex-widget-messages">\n          <div class="apex-widget-message assistant">' + config.greeting + '</div>\n        </div>\n        <div id="apex-widget-typing">\n          <div class="apex-typing-dots">\n            <span></span><span></span><span></span>\n          </div>\n        </div>\n        <div id="apex-widget-input-container">\n          <input type="text" id="apex-widget-input" placeholder="' + config.placeholder + '">\n          <button id="apex-widget-send" style="background: ' + config.primaryColor + '" aria-label="Send message">\n            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>\n          </button>\n        </div>\n        ' + (config.showBranding ? '<div id="apex-widget-branding">Powered by <a href="https://apexaffinity.com" target="_blank">Apex</a></div>' : '') + '\n      </div>\n      <button id="apex-widget-button" style="background: ' + config.primaryColor + '" aria-label="' + config.buttonText + '">\n        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>\n      </button>\n    ';

    document.body.appendChild(container);

    // Bind events
    document.getElementById('apex-widget-button').addEventListener('click', toggleWidget);
    document.getElementById('apex-widget-close').addEventListener('click', toggleWidget);
    document.getElementById('apex-widget-send').addEventListener('click', sendMessage);
    document.getElementById('apex-widget-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });

    // Auto-open if configured
    if (config.autoOpen) {
      setTimeout(function() {
        if (!state.isOpen) toggleWidget();
      }, config.autoOpenDelay);
    }
  }

  function getInitials(name) {
    if (!name) return 'S';
    return name.split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function toggleWidget() {
    state.isOpen = !state.isOpen;
    var window = document.getElementById('apex-widget-window');
    window.classList.toggle('open', state.isOpen);
    if (state.isOpen) {
      document.getElementById('apex-widget-input').focus();
    }
  }

  function addMessage(content, role) {
    var messages = document.getElementById('apex-widget-messages');
    var msg = document.createElement('div');
    msg.className = 'apex-widget-message ' + role;
    if (role === 'user') {
      msg.style.background = state.config.primaryColor || defaults.primaryColor;
    }
    msg.textContent = content;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function setTyping(show) {
    var typing = document.getElementById('apex-widget-typing');
    typing.classList.toggle('show', show);
    if (show) {
      var messages = document.getElementById('apex-widget-messages');
      messages.scrollTop = messages.scrollHeight;
    }
  }

  function sendMessage() {
    var input = document.getElementById('apex-widget-input');
    var message = input.value.trim();
    if (!message) return;

    input.value = '';
    addMessage(message, 'user');
    setTyping(true);

    var sendBtn = document.getElementById('apex-widget-send');
    sendBtn.disabled = true;

    fetch(apiBase + '/api/copilot/widget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: state.agentId,
        visitorId: state.visitorId,
        sessionId: state.sessionId,
        message: message,
      }),
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      setTyping(false);
      sendBtn.disabled = false;

      if (data.error) {
        addMessage('Sorry, I\'m having trouble connecting. Please try again.', 'assistant');
        return;
      }

      state.sessionId = data.sessionId;
      addMessage(data.response, 'assistant');
    })
    .catch(function(err) {
      console.error('Apex widget error:', err);
      setTyping(false);
      sendBtn.disabled = false;
      addMessage('Sorry, something went wrong. Please try again.', 'assistant');
    });
  }

  // Initialize widget
  function init(options) {
    if (state.initialized) {
      console.warn('Apex widget already initialized');
      return;
    }

    if (!options || !options.agentId) {
      console.error('Apex widget: agentId is required');
      return;
    }

    state.agentId = options.agentId;
    state.config = options.config || {};
    state.visitorId = getVisitorId();

    // Fetch agent config from API
    fetch(apiBase + '/api/copilot/widget?agentId=' + options.agentId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) {
          console.error('Apex widget:', data.error);
          return;
        }

        state.config = Object.assign({}, data.config, state.config);
        injectStyles();
        createWidget();
        state.initialized = true;
      })
      .catch(function(err) {
        console.error('Apex widget init error:', err);
      });
  }

  // Expose global API
  window.apex = function(command, options) {
    switch (command) {
      case 'init':
        init(options);
        break;
      case 'open':
        if (!state.isOpen) toggleWidget();
        break;
      case 'close':
        if (state.isOpen) toggleWidget();
        break;
      default:
        console.warn('Apex widget: unknown command', command);
    }
  };

  // Process any queued commands
  if (window.apex && window.apex.q) {
    window.apex.q.forEach(function(args) {
      window.apex.apply(null, args);
    });
  }
})();
