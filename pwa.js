// Add to home screen/installation handling
let deferredPrompt;

// Add event listener for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Store the event for later use
  deferredPrompt = e;
  
  // Optionally, show a custom "Add to Home Screen" button here
  // For iOS, we don't need this as they handle installation differently
});

// For iOS, we need to detect standalone mode
function isRunningStandalone() {
  return (window.navigator.standalone) || 
         (window.matchMedia('(display-mode: standalone)').matches);
}

// Handle page load events for PWA
window.addEventListener('load', () => {
  // Check if running as installed app
  if (isRunningStandalone()) {
    console.log('Running in standalone mode');
    // You could customize the UI for standalone mode here
  }
  
  // Ensure proper viewport height on iOS (fixes common iOS PWA issues)
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Fix for iOS PWA overscroll behavior
  document.body.style.overscrollBehaviorY = 'none';
});

// Update viewport on resize (important for iOS orientation changes)
window.addEventListener('resize', () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

// Handle app-specific behavior when installed
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}