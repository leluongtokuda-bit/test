export const initLiveChat = () => {
  if ((window as any).Tawk_API && (window as any).__tawkLoaded) return;

  (window as any).Tawk_API = (window as any).Tawk_API || {};
  (window as any).Tawk_LoadStart = new Date();
  (window as any).__tawkLoaded = true;

  // Hide widget by default, only show when user clicks Support
  (window as any).Tawk_API.onLoad = function () {
    (window as any).Tawk_API.hideWidget();
  };

  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = "https://embed.tawk.to/69ba70136b81021c3452028d/1jk04bj5f";
  s1.charset = "UTF-8";
  s1.setAttribute("crossorigin", "*");
  document.head.appendChild(s1);
};

export const openLiveChat = () => {
  initLiveChat();

  const check = () => {
    const api = (window as any).Tawk_API;
    if (api && typeof api.maximize === "function") {
      api.showWidget();
      api.maximize();
    } else {
      setTimeout(check, 300);
    }
  };
  check();
};
