// Mobile optimizations and touch handling for Solar System Complex

class MobileOptimizations {
    constructor() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
        this.touchSupported = 'ontouchstart' in window;
        
        this.init();
    }
    
    init() {
        // Optimize for mobile devices
        if (this.isMobile || this.isTablet) {
            this.optimizeForMobile();
        }
        
        // Add touch gesture support
        if (this.touchSupported) {
            this.addTouchGestures();
        }
        
        // Add mobile UI controls
        this.setupMobileUI();
        
        // Handle device orientation
        this.handleOrientation();
        
        // Optimize performance for mobile
        this.optimizePerformance();
    }
    
    optimizeForMobile() {
        // Reduce particle counts for better performance
        window.MOBILE_OPTIMIZATIONS = {
            reducedParticles: true,
            maxParticles: this.isMobile ? 1000 : 3000,
            reducedTextureQuality: this.isMobile,
            simplifiedShaders: this.isMobile,
            maxGeometryDetail: this.isMobile ? 32 : 64
        };
        
        // Add mobile-specific CSS
        document.body.classList.add('mobile-device');
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent pull-to-refresh
        document.body.addEventListener('touchstart', e => {
            if (e.touches.length === 1 && e.touches[0].clientY <= 10) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', e => {
            if (e.touches.length === 1 && e.touches[0].clientY <= 10) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    addTouchGestures() {
        let lastTouchDistance = 0;
        let touchStartTime = 0;
        let touchStartPosition = { x: 0, y: 0 };
        
        // Pinch to zoom
        document.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            if (e.touches.length === 1) {
                touchStartPosition.x = e.touches[0].clientX;
                touchStartPosition.y = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const scale = distance / lastTouchDistance;
                    // Dispatch custom zoom event
                    window.dispatchEvent(new CustomEvent('pinchZoom', { 
                        detail: { scale: scale }
                    }));
                }
                lastTouchDistance = distance;
            }
        });
        
        // Double tap to focus planet
        document.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 200 && e.changedTouches.length === 1) {
                // Dispatch custom tap event for planet selection
                window.dispatchEvent(new CustomEvent('mobileTap', {
                    detail: {
                        x: e.changedTouches[0].clientX,
                        y: e.changedTouches[0].clientY
                    }
                }));
            }
        });
    }
    
    setupMobileUI() {
        // Mobile controls toggle
        const toggleButton = document.getElementById('controlsToggle');
        const controls = document.getElementById('controls');
        const planetInfo = document.getElementById('planetInfo');
        
        let controlsVisible = false;
        
        toggleButton.addEventListener('click', () => {
            controlsVisible = !controlsVisible;
            if (controlsVisible) {
                document.body.classList.remove('controls-hidden');
                controls.style.display = 'block';
                planetInfo.style.display = 'block';
                toggleButton.textContent = 'Hide Controls';
            } else {
                document.body.classList.add('controls-hidden');
                controls.style.display = 'none';
                planetInfo.style.display = 'none';
                toggleButton.textContent = 'Show Controls';
            }
        });
        
        // Start with controls hidden on mobile
        if (this.isMobile) {
            document.body.classList.add('controls-hidden');
            toggleButton.textContent = 'Show Controls';
        }
        
        // Add haptic feedback for supported devices
        if ('vibrate' in navigator) {
            document.addEventListener('touchstart', () => {
                navigator.vibrate(10); // Short vibration
            });
        }
    }
    
    handleOrientation() {
        // Handle device orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Trigger resize event
                window.dispatchEvent(new Event('resize'));
                
                // Recalculate canvas size
                if (window.solarSystemApp && window.solarSystemApp.onWindowResize) {
                    window.solarSystemApp.onWindowResize();
                }
            }, 100);
        });
        
        // Lock orientation to landscape on mobile for better experience
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => {
                console.log('Could not lock orientation:', err);
            });
        }
    }
    
    optimizePerformance() {
        // Reduce quality on low-end devices
        const canvas = document.querySelector('canvas');
        if (canvas && this.isMobile) {
            // Reduce pixel ratio for better performance
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            
            // Store optimization settings
            window.PERFORMANCE_SETTINGS = {
                pixelRatio: pixelRatio,
                antialias: !this.isMobile, // Disable antialiasing on mobile
                shadowMapSize: this.isMobile ? 1024 : 2048,
                maxLights: this.isMobile ? 2 : 4
            };
        }
        
        // Battery optimization
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) { // Low battery
                    window.PERFORMANCE_SETTINGS.reducedQuality = true;
                }
            });
        }
        
        // Visibility API - pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (window.solarSystemApp) {
                if (document.hidden) {
                    window.solarSystemApp.pause();
                } else {
                    window.solarSystemApp.resume();
                }
            }
        });
    }
    
    // Utility methods
    static isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    static getTouchPosition(touch, canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((touch.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((touch.clientY - rect.top) / rect.height) * 2 + 1
        };
    }
}

// Initialize mobile optimizations
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizations = new MobileOptimizations();
});

// Cordova device ready event
document.addEventListener('deviceready', () => {
    console.log('Cordova device ready');
    
    // Hide splash screen
    if (navigator.splashscreen) {
        navigator.splashscreen.hide();
    }
    
    // Set status bar
    if (window.StatusBar) {
        StatusBar.styleDefault();
        StatusBar.backgroundColorByHexString('#000000');
    }
    
    // Lock orientation
    if (screen.orientation) {
        screen.orientation.lock('landscape');
    }
}, false);
