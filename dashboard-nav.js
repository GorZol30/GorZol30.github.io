(function () {
  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const isProgramPage = currentPath.includes('/MemoryGames/') ||
    currentPath.includes('/Hangman/') ||
    currentPath.includes('/Mozifilm/') ||
    currentPath.includes('/QUIZ/build/') ||
    currentPath.includes('/Puzzle/dist/');
  const isDashboard = !isProgramPage && (/(^|\/)index\.html$/.test(currentPath) || currentPath === '/');

  let dashboardHref = './index.html';

  if (currentPath.includes('/MemoryGames/') || currentPath.includes('/Hangman/') || currentPath.includes('/Mozifilm/')) {
    dashboardHref = '../index.html';
  } else if (currentPath.includes('/QUIZ/build/') || currentPath.includes('/Puzzle/dist/')) {
    dashboardHref = '../../index.html';
  }

  if (!isProgramPage || isDashboard) {
    return;
  }

  // Make the shared Foundation Icon available in every standalone program.
  if (!document.querySelector('link[data-dashboard-icons], link[href*="foundicons"]')) {
    const iconStylesheet = document.createElement('link');
    iconStylesheet.rel = 'stylesheet';
    iconStylesheet.href = 'https://cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/foundation-icons.min.css';
    iconStylesheet.dataset.dashboardIcons = 'true';
    document.head.appendChild(iconStylesheet);
  }

  const style = document.createElement('style');
  style.textContent = `
    .dashboard-nav-btn {
      position: fixed;
      bottom: max(1rem, env(safe-area-inset-bottom));
      left: max(1rem, env(safe-area-inset-left));
      margin: 0;
      color: #d4fbfc;
      background: #2074fd;
      width: 3rem;
      height: 3rem;
      font-size: 1.2rem;
      z-index: 10000;
      border-radius: 50%;
      padding: .7rem;
      text-align: center;
      cursor: pointer;
      border: 0;
      box-sizing: border-box;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
      touch-action: manipulation;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .dashboard-nav-btn:active {
      transform: scale(0.97);
    }
    .dashboard-nav-btn:hover {
      color:#ffc700;
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'dashboard-nav-btn';
  button.setAttribute('aria-label', 'Vissza a főoldalra');
  button.innerHTML = '<i class="fi-arrow-left" aria-hidden="true"></i>';
  button.addEventListener('click', function () {
    window.location.assign(dashboardHref);
  });

  document.body.appendChild(button);

  // The Quiz is a single-page React application: its menu and question view
  // share the same URL. The dashboard button belongs only on its menu screen.
  if (currentPath.includes('/QUIZ/build/')) {
    const updateQuizButtonVisibility = function () {
      button.hidden = !document.querySelector('.mainWrapper');
    };

    updateQuizButtonVisibility();
    new MutationObserver(updateQuizButtonVisibility).observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
