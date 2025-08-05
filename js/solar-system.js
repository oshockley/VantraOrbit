/**
 * Create a realistic, interactive 3D solar system using Three.js.
 * 
 * Requirements:
 * - Load realistic planet models using GLTF or texture-mapped spheres.
 * - Each planet should orbit the Sun based on real orbital distances and speeds.
 * - The camera should support full 360° rotation, zoom, and pan using OrbitControls.
 * - Planets should spin on their axes and have appropriate sizes relative to each other.
 * - Load realistic textures for each planet (Earth, Mars, Jupiter, etc.)
 * - Add stars in the background for immersion.
 * - Lighting should reflect space ambience (use ambient + directional lights).
 * 
 * Use a reusable function like loadPlanet(name, size, distance, texturePath) to create each planet.
 */

class SolarSystem {
    constructor() {
        // Initialize scene, camera, and renderer for 3D space
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
        
        // Try WebGL first, fall back to Canvas if it fails
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false
            });
            console.log('Using WebGL renderer');
        } catch (e) {
            console.warn('WebGL failed, falling back to Canvas renderer:', e);
            // Note: THREE.CanvasRenderer was removed in newer versions
            // So we'll try WebGL with different settings
            try {
                this.renderer = new THREE.WebGLRenderer({ 
                    antialias: false,
                    powerPreference: "low-power",
                    failIfMajorPerformanceCaveat: false,
                    preserveDrawingBuffer: true
                });
                console.log('Using WebGL renderer with fallback settings');
            } catch (e2) {
                console.error('All rendering methods failed:', e2);
                alert('Your system does not support WebGL. Please use a modern browser or update your graphics drivers.');
                return;
            }
        }
        
        // Add WebGL context restoration handling
        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            console.warn('WebGL context lost, preventing default and attempting restore');
            event.preventDefault();
        });
        
        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored, reinitializing scene');
            this.initScene();
        });
        
        this.planets = [];
        this.orbitPaths = [];
        this.animationSpeed = 1.0;
        this.planetScale = 3.0;
        this.showOrbits = true;
        this.followTarget = null;
        this.isPaused = false;
        
        // Mobile optimizations
        this.isMobile = MobileOptimizations.isMobileDevice();
        this.performanceSettings = window.PERFORMANCE_SETTINGS || {};
        
        this.init();
    }
    
    init() {
        // Setup renderer with enhanced quality settings
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.performanceSettings.pixelRatio || 2)); // High DPI support
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.antialias = this.performanceSettings.antialias !== false; // Enable antialiasing for smoother edges
        document.body.appendChild(this.renderer.domElement);
        
        // Setup camera position with optimized settings for clarity
        this.camera.position.set(0, 100, 300);
        this.camera.near = 0.1;
        this.camera.far = 50000; // Increased for distant stars
        this.camera.updateProjectionMatrix();
        
        // Setup orbit controls for full 360° rotation, zoom, and pan
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 2000;
        
        // Add lighting that reflects space ambience
        this.setupLighting();
        
        // Add stars in the background for immersion
        this.createStarField();
        
        // Create the Sun
        this.createSun();
        
        // Load all planets with realistic textures
        this.loadAllPlanets();
        
        // Add Earth's Moon
        this.createMoon();
        
        // Setup UI controls
        this.setupUI();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mobile event handlers
        this.setupMobileEventHandlers();
        
        // Store reference globally for mobile optimizations
        window.solarSystemApp = this;
    }
    
    setupLighting() {
        // Ambient light for space ambience
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light from the Sun
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        this.sunLight.position.set(0, 0, 0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.scene.add(this.sunLight);
        
        // Point light at the Sun's position for realistic illumination
        this.sunPointLight = new THREE.PointLight(0xffaa44, 2.0, 2000);
        this.sunPointLight.position.set(0, 0, 0);
        this.sunPointLight.castShadow = true;
        this.scene.add(this.sunPointLight);
        
        // Additional warm light for Sun's glow effect on nearby objects
        this.sunGlowLight = new THREE.PointLight(0xff6600, 1.0, 100);
        this.sunGlowLight.position.set(0, 0, 0);
        this.scene.add(this.sunGlowLight);
    }
    
    createStarField() {
        // Create background sphere with ultra-high resolution Milky Way texture
        const loader = new THREE.TextureLoader();
        
        // Try loading 8K texture first, fallback to 2K if needed
        const tryLoad8K = () => {
            loader.load('textures/stars_milky_way_8k.jpg', (texture) => {
                console.log('Successfully loaded 8K Milky Way texture');
                this.createStarSphere(texture);
            }, undefined, (error) => {
                console.warn('8K texture failed, trying 2K version:', error);
                loader.load('textures/stars_milky_way.jpg', (texture) => {
                    console.log('Successfully loaded 2K Milky Way texture');
                    this.createStarSphere(texture);
                }, undefined, (error) => {
                    console.warn('All textures failed, using procedural stars:', error);
                    this.createProceduralStars();
                });
            });
        };
        
        tryLoad8K();
    }
    
    createStarSphere(texture) {
        // Optimize texture settings for maximum clarity
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.generateMipmaps = true;
        
        // Create high-detail sphere geometry
        const starGeometry = new THREE.SphereGeometry(15000, 128, 64);
        const starMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide, // Render on the inside of the sphere
            fog: false // Disable fog for crisp distant stars
        });
        
        const starSphere = new THREE.Mesh(starGeometry, starMaterial);
        this.scene.add(starSphere);
        
        // Store reference for potential rotation
        this.starSphere = starSphere;
    }
    
    createProceduralStars() {
        // Enhanced fallback procedural stars with higher detail
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 25000; // Increased star count for better density
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            // Distribute stars on sphere surface
            const radius = 15000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Vary star colors (white, blue-white, yellow-white)
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                colors[i * 3] = 1.0; // White stars
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 1.0;
            } else if (colorVariation < 0.9) {
                colors[i * 3] = 0.8; // Blue-white stars
                colors[i * 3 + 1] = 0.9;
                colors[i * 3 + 2] = 1.0;
            } else {
                colors[i * 3] = 1.0; // Yellow-white stars
                colors[i * 3 + 1] = 0.95;
                colors[i * 3 + 2] = 0.8;
            }
            
            // Vary star sizes
            sizes[i] = Math.random() * 3 + 1;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starMaterial = new THREE.PointsMaterial({
            vertexColors: true,
            size: 2,
            sizeAttenuation: false,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    createSun() {
        const loader = new THREE.TextureLoader();
        console.log('Loading Sun texture: textures/sun.jpg');
        
        loader.load('textures/sun.jpg', (texture) => {
            console.log('Successfully loaded Sun texture');
            const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
            
            // Main Sun material with realistic glow
            const sunMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                emissive: 0xff6600,
                emissiveIntensity: 0.8,
                emissiveMap: texture, // Use the same texture for emissive glow
                roughness: 1.0,
                metalness: 0.0
            });
            
            this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
            this.scene.add(this.sun);
            
            // Create multiple glow layers for realistic effect
            this.createSunGlowEffects();
            
        }, (progress) => {
            console.log(`Loading Sun texture progress: ${(progress.loaded / progress.total * 100)}%`);
        }, (error) => {
            console.warn('Failed to load Sun texture, using fallback:', error);
            // Enhanced fallback sun with procedural glow
            const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
            const sunMaterial = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff6600,
                emissiveIntensity: 1.0,
                roughness: 1.0,
                metalness: 0.0
            });
            
            this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
            this.scene.add(this.sun);
            
            // Create glow effects even for fallback
            this.createSunGlowEffects();
        });
    }
    
    createSunGlowEffects() {
        // Inner glow - bright orange
        const innerGlowGeometry = new THREE.SphereGeometry(11.5, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.scene.add(innerGlow);
        
        // Middle glow - yellow-orange
        const middleGlowGeometry = new THREE.SphereGeometry(13, 32, 32);
        const middleGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.25,
            side: THREE.BackSide
        });
        const middleGlow = new THREE.Mesh(middleGlowGeometry, middleGlowMaterial);
        this.scene.add(middleGlow);
        
        // Outer glow - soft yellow
        const outerGlowGeometry = new THREE.SphereGeometry(15, 32, 32);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.scene.add(outerGlow);
        
        // Corona effect - very large, very subtle
        const coronaGeometry = new THREE.SphereGeometry(20, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.scene.add(corona);
        
        // Store glow effects for animation
        this.sunGlowEffects = [innerGlow, middleGlow, outerGlow, corona];
    }
    
    createMoon() {
        const loader = new THREE.TextureLoader();
        loader.load('textures/moon.jpg', (texture) => {
            const moonGeometry = new THREE.SphereGeometry(0.27 * this.planetScale, 16, 16);
            const moonMaterial = new THREE.MeshStandardMaterial({ map: texture });
            this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
            
            // Enable shadows
            this.moon.castShadow = true;
            this.moon.receiveShadow = true;
            
            // Moon properties
            this.moon.userData = {
                name: 'Moon',
                distance: 8, // Distance from Earth (scaled)
                orbitSpeed: 0.036, // Faster than Earth's rotation
                rotationSpeed: 0.0036, // Tidally locked (same as orbit)
                angle: 0,
                parentPlanet: 'Earth'
            };
            
            this.scene.add(this.moon);
            this.planets.push(this.moon);
            
            // Add to planet selector
            const option = document.createElement('option');
            option.value = 'Moon';
            option.textContent = 'Moon';
            document.getElementById('followPlanet').appendChild(option);
        }, undefined, (error) => {
            console.warn('Failed to load Moon texture');
        });
    }
    
    createSaturnRings(saturnPlanet) {
        const loader = new THREE.TextureLoader();
        
        // Load multiple textures for enhanced ring appearance
        const loadRingTextures = () => {
            const ringTexture = loader.load('textures/saturn_rings.png');
            
            // Create enhanced ring materials with multiple texture layers
            this.saturnRings = [];
            
            // Main ring system with enhanced 3D appearance
            const ringSegments = [
                { inner: 12, outer: 16, speed: 0.008, opacity: 0.9, height: 0.2, color: 0xdddddd }, // D Ring
                { inner: 16, outer: 20, speed: 0.006, opacity: 1.0, height: 0.3, color: 0xffffff }, // C Ring
                { inner: 20, outer: 25, speed: 0.004, opacity: 0.95, height: 0.5, color: 0xf5f5f5 }, // B Ring (brightest)
                { inner: 26, outer: 30, speed: 0.003, opacity: 0.8, height: 0.4, color: 0xeeeeee }, // A Ring
                { inner: 32, outer: 34, speed: 0.002, opacity: 0.6, height: 0.15, color: 0xcccccc }  // F Ring (thin outer ring)
            ];
            
            ringSegments.forEach((segment, index) => {
                // Create 3D ring geometry with thickness
                this.create3DRingSegment(saturnPlanet, segment, ringTexture, index);
            });
            
            // Add Cassini Division and enhanced gaps
            this.createEnhancedRingGaps(saturnPlanet);
            
            // Add multiple particle layers for depth
            this.createEnhancedRingParticles(saturnPlanet);
            
            // Add ring shadows and lighting effects
            this.createRingLightingEffects(saturnPlanet);
        };
        
        // Load texture and create rings
        loadRingTextures();
    }
    
    create3DRingSegment(saturnPlanet, segment, texture, index) {
        // Create actual 3D ring geometry instead of flat rings
        const ringGeometry = new THREE.CylinderGeometry(
            segment.outer,  // top radius
            segment.outer,  // bottom radius  
            segment.height, // height (thickness)
            64,             // radial segments
            1,              // height segments
            true            // open ended
        );
        
        // Create inner cylinder to subtract (for ring hole)
        const innerGeometry = new THREE.CylinderGeometry(
            segment.inner,
            segment.inner,
            segment.height * 1.1,
            64,
            1,
            true
        );
        
        // Create ring material with enhanced properties
        const ringMaterial = new THREE.MeshStandardMaterial({
            map: texture.clone(),
            color: segment.color,
            transparent: true,
            opacity: segment.opacity,
            roughness: 0.8,
            metalness: 0.1,
            emissive: new THREE.Color(0x111111),
            emissiveIntensity: 0.05,
            side: THREE.DoubleSide,
            alphaTest: 0.1
        });
        
        // Apply procedural normal mapping for surface detail
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create noise pattern for ring texture detail
        const imageData = ctx.createImageData(512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.random() * 0.3 + 0.7;
            imageData.data[i] = 128 + (noise - 0.5) * 100;     // R
            imageData.data[i + 1] = 128 + (noise - 0.5) * 100; // G  
            imageData.data[i + 2] = 128 + (noise - 0.5) * 100; // B
            imageData.data[i + 3] = 255;                        // A
        }
        ctx.putImageData(imageData, 0, 0);
        
        const normalTexture = new THREE.CanvasTexture(canvas);
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(8, 1);
        
        ringMaterial.normalMap = normalTexture;
        ringMaterial.normalScale = new THREE.Vector2(0.5, 0.5);
        
        // Create the ring mesh
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        
        // Create inner cutout using CSG-like approach
        const innerMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const innerRing = new THREE.Mesh(innerGeometry, innerMaterial);
        innerRing.rotation.x = Math.PI / 2;
        ring.add(innerRing);
        
        // Store ring properties for animation
        ring.userData = {
            rotationSpeed: segment.speed,
            index: index,
            segment: segment
        };
        
        saturnPlanet.add(ring);
        this.saturnRings.push(ring);
        
        // Add subsurface scattering effect
        this.addRingSubsurfaceEffect(saturnPlanet, segment, index);
    }
    
    addRingSubsurfaceEffect(saturnPlanet, segment, index) {
        // Create a glow effect beneath the rings for subsurface scattering
        const glowGeometry = new THREE.RingGeometry(segment.inner, segment.outer, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.9, 0.85, 0.8),
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = Math.PI / 2;
        glow.position.y = -segment.height * 0.6;
        
        glow.userData = {
            rotationSpeed: segment.speed * 0.7,
            isGlow: true
        };
        
        saturnPlanet.add(glow);
        this.saturnRings.push(glow);
    }
    
    createEnhancedRingGaps(saturnPlanet) {
        // Cassini Division - more realistic gap
        const gapSegments = [
            { inner: 24.5, outer: 26.5, opacity: 0.1, color: 0x444444 },
            { inner: 18.5, outer: 19.5, opacity: 0.05, color: 0x333333 }, // Smaller gap
        ];
        
        gapSegments.forEach(gap => {
            const gapGeometry = new THREE.RingGeometry(gap.inner, gap.outer, 64);
            const gapMaterial = new THREE.MeshBasicMaterial({
                color: gap.color,
                transparent: true,
                opacity: gap.opacity,
                side: THREE.DoubleSide
            });
            
            const gapMesh = new THREE.Mesh(gapGeometry, gapMaterial);
            gapMesh.rotation.x = Math.PI / 2;
            gapMesh.userData = { rotationSpeed: 0.0035 };
            
            saturnPlanet.add(gapMesh);
            this.saturnRings.push(gapMesh);
        });
    }
    
    createEnhancedRingParticles(saturnPlanet) {
        // Create multiple particle systems for different ring zones
        const particleSystems = [
            { count: 1500, innerRadius: 12, outerRadius: 20, size: 0.2, color: 0xffffff, speed: 0.006 },
            { count: 2000, innerRadius: 20, outerRadius: 25, size: 0.3, color: 0xf8f8ff, speed: 0.004 },
            { count: 1000, innerRadius: 26, outerRadius: 30, size: 0.25, color: 0xf0f0f0, speed: 0.003 },
            { count: 500, innerRadius: 32, outerRadius: 34, size: 0.15, color: 0xe8e8e8, speed: 0.002 }
        ];
        
        particleSystems.forEach((system, systemIndex) => {
            const particleGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(system.count * 3);
            const colors = new Float32Array(system.count * 3);
            const sizes = new Float32Array(system.count);
            const velocities = new Float32Array(system.count * 3);
            
            for (let i = 0; i < system.count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = system.innerRadius + Math.random() * (system.outerRadius - system.innerRadius);
                const height = (Math.random() - 0.5) * 0.3;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = height;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
                
                // Orbital velocity for realistic motion
                const orbitalSpeed = system.speed * (1 + Math.random() * 0.2);
                velocities[i * 3] = -Math.sin(angle) * orbitalSpeed;
                velocities[i * 3 + 1] = 0;
                velocities[i * 3 + 2] = Math.cos(angle) * orbitalSpeed;
                
                // Ice particle colors with variation
                const brightness = 0.8 + Math.random() * 0.2;
                const tint = new THREE.Color(system.color);
                colors[i * 3] = tint.r * brightness;
                colors[i * 3 + 1] = tint.g * brightness;
                colors[i * 3 + 2] = tint.b * brightness;
                
                sizes[i] = system.size * (0.5 + Math.random() * 0.5);
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                vertexColors: true,
                size: system.size,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const particles = new THREE.Points(particleGeometry, particleMaterial);
            particles.userData = { 
                rotationSpeed: system.speed,
                systemIndex: systemIndex,
                isParticleSystem: true
            };
            
            saturnPlanet.add(particles);
            this.saturnRings.push(particles);
        });
    }
    
    createRingLightingEffects(saturnPlanet) {
        // Add rim lighting effect around rings
        const rimLightGeometry = new THREE.RingGeometry(11, 35, 64);
        const rimLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.03,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const rimLight = new THREE.Mesh(rimLightGeometry, rimLightMaterial);
        rimLight.rotation.x = Math.PI / 2;
        rimLight.scale.setScalar(1.05);
        
        saturnPlanet.add(rimLight);
        this.saturnRings.push(rimLight);
    }
    
    createRingGaps(saturnPlanet) {
        // Create dark ring segments to simulate gaps like Cassini Division
        const gapGeometry = new THREE.RingGeometry(24.5, 26.5, 64);
        const gapMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const gap = new THREE.Mesh(gapGeometry, gapMaterial);
        gap.rotation.x = Math.PI / 2;
        gap.userData = { rotationSpeed: 0.0035 };
        
        saturnPlanet.add(gap);
        this.saturnRings.push(gap);
    }
    
    createSimpleRings(saturnPlanet) {
        // Fallback simple rings if texture fails
        const ringGeometry = new THREE.RingGeometry(15, 25, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xccaa77,
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 0.8
        });
        
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        rings.userData = { rotationSpeed: 0.005 };
        
        saturnPlanet.add(rings);
        this.saturnRings = [rings];
    }
    
    createRingParticles(saturnPlanet) {
        // Create subtle particle effects to simulate ice and rock particles in rings
        const particleCount = 2000;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles in ring zones
            const angle = Math.random() * Math.PI * 2;
            const radius = 12 + Math.random() * 22; // Within ring area
            const height = (Math.random() - 0.5) * 0.5; // Very thin ring
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Ice particle colors (white to light blue)
            const brightness = 0.7 + Math.random() * 0.3;
            colors[i * 3] = brightness;
            colors[i * 3 + 1] = brightness;
            colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1);
            
            sizes[i] = Math.random() * 0.5 + 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            vertexColors: true,
            size: 0.3,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData = { rotationSpeed: 0.004 };
        
        saturnPlanet.add(particles);
        this.saturnRings.push(particles);
    }
    
    // Reusable function to create each planet with realistic properties
    loadPlanet(name, size, distance, texturePath, orbitSpeed, rotationSpeed, planetData) {
        return new Promise((resolve) => {
            const geometry = new THREE.SphereGeometry(size * this.planetScale, 32, 32);
            
            // Create material with texture
            const loader = new THREE.TextureLoader();
            
            // Define fallback colors for each planet
            const fallbackColors = {
                'Mercury': 0x8C7853,
                'Venus': 0xFFC649,
                'Earth': 0x6B93D6,
                'Mars': 0xCD5C5C,
                'Jupiter': 0xF4A460,
                'Saturn': 0xFAD5A5,
                'Uranus': 0x4FD0E7,
                'Neptune': 0x4169E1
            };
            
            console.log(`Loading texture for ${name}: ${texturePath}`);
            
            loader.load(
                texturePath,
                (texture) => {
                    console.log(`Successfully loaded texture for ${name}`);
                    const material = new THREE.MeshStandardMaterial({ map: texture });
                    const planet = new THREE.Mesh(geometry, material);
                    
                    // Enable shadows
                    planet.castShadow = true;
                    planet.receiveShadow = true;
                    
                    // Set initial position
                    planet.position.x = distance;
                    planet.position.y = 0;
                    planet.position.z = 0;
                    
                    // Store planet properties
                    planet.userData = {
                        name: name,
                        distance: distance,
                        orbitSpeed: orbitSpeed,
                        rotationSpeed: rotationSpeed,
                        angle: Math.random() * Math.PI * 2, // Random starting position
                        size: size,
                        ...planetData
                    };
                    
                    this.scene.add(planet);
                    this.planets.push(planet);
                    
                    // Special handling for Saturn - add rings
                    if (name === 'Saturn') {
                        this.createSaturnRings(planet);
                    }
                    
                    // Create orbit path
                    if (this.showOrbits) {
                        this.createOrbitPath(distance);
                    }
                    
                    // Add to planet selector
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    document.getElementById('followPlanet').appendChild(option);
                    
                    resolve(planet);
                },
                (progress) => {
                    console.log(`Loading progress for ${name}: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.warn(`Failed to load texture for ${name}:`, error);
                    console.log(`Using fallback color for ${name}`);
                    
                    // Create planet with fallback color
                    const material = new THREE.MeshStandardMaterial({ 
                        color: fallbackColors[name] || 0x888888 
                    });
                    const planet = new THREE.Mesh(geometry, material);
                    
                    // Enable shadows
                    planet.castShadow = true;
                    planet.receiveShadow = true;
                    
                    planet.position.x = distance;
                    planet.userData = {
                        name: name,
                        distance: distance,
                        orbitSpeed: orbitSpeed,
                        rotationSpeed: rotationSpeed,
                        angle: Math.random() * Math.PI * 2,
                        size: size,
                        ...planetData
                    };
                    
                    this.scene.add(planet);
                    this.planets.push(planet);
                    
                    // Special handling for Saturn - add rings
                    if (name === 'Saturn') {
                        this.createSaturnRings(planet);
                    }
                    
                    // Create orbit path
                    if (this.showOrbits) {
                        this.createOrbitPath(distance);
                    }
                    
                    // Add to planet selector
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    document.getElementById('followPlanet').appendChild(option);
                    
                    resolve(planet);
                }
            );
        });
    }
    
    createOrbitPath(distance) {
        const orbitGeometry = new THREE.RingGeometry(distance - 0.5, distance + 0.5, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const orbitPath = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitPath.rotation.x = Math.PI / 2;
        this.scene.add(orbitPath);
        this.orbitPaths.push(orbitPath);
    }
    
    async loadAllPlanets() {
        // Planet data with realistic orbital distances (scaled down) and speeds
        const planetData = [
            {
                name: 'Mercury',
                size: 0.38,
                distance: 40,
                texturePath: 'textures/mercury.jpg',
                orbitSpeed: 0.024,
                rotationSpeed: 0.004,
                data: {
                    realDistance: '57.9 million km',
                    period: '88 Earth days',
                    diameter: '4,879 km',
                    type: 'Terrestrial'
                }
            },
            {
                name: 'Venus',
                size: 0.95,
                distance: 70,
                texturePath: 'textures/venus.jpg',
                orbitSpeed: 0.015,
                rotationSpeed: -0.002, // Retrograde rotation
                data: {
                    realDistance: '108.2 million km',
                    period: '225 Earth days',
                    diameter: '12,104 km',
                    type: 'Terrestrial'
                }
            },
            {
                name: 'Earth',
                size: 1.0,
                distance: 100,
                texturePath: 'textures/earth.jpg',
                orbitSpeed: 0.01,
                rotationSpeed: 0.01,
                data: {
                    realDistance: '149.6 million km',
                    period: '365.25 days',
                    diameter: '12,756 km',
                    type: 'Terrestrial'
                }
            },
            {
                name: 'Mars',
                size: 0.53,
                distance: 150,
                texturePath: 'textures/mars.jpg',
                orbitSpeed: 0.008,
                rotationSpeed: 0.009,
                data: {
                    realDistance: '227.9 million km',
                    period: '687 Earth days',
                    diameter: '6,792 km',
                    type: 'Terrestrial'
                }
            },
            {
                name: 'Jupiter',
                size: 11.2,
                distance: 250,
                texturePath: 'textures/jupiter.jpg',
                orbitSpeed: 0.002,
                rotationSpeed: 0.04,
                data: {
                    realDistance: '778.5 million km',
                    period: '11.86 Earth years',
                    diameter: '142,984 km',
                    type: 'Gas Giant'
                }
            },
            {
                name: 'Saturn',
                size: 9.5,
                distance: 350,
                texturePath: 'textures/saturn.jpg',
                orbitSpeed: 0.0009,
                rotationSpeed: 0.038,
                data: {
                    realDistance: '1.43 billion km',
                    period: '29.46 Earth years',
                    diameter: '120,536 km',
                    type: 'Gas Giant'
                }
            },
            {
                name: 'Uranus',
                size: 4.0,
                distance: 450,
                texturePath: 'textures/uranus.jpg',
                orbitSpeed: 0.0004,
                rotationSpeed: 0.03,
                data: {
                    realDistance: '2.87 billion km',
                    period: '84 Earth years',
                    diameter: '51,118 km',
                    type: 'Ice Giant'
                }
            },
            {
                name: 'Neptune',
                size: 3.9,
                distance: 550,
                texturePath: 'textures/neptune.jpg',
                orbitSpeed: 0.0001,
                rotationSpeed: 0.032,
                data: {
                    realDistance: '4.5 billion km',
                    period: '165 Earth years',
                    diameter: '49,528 km',
                    type: 'Ice Giant'
                }
            }
        ];
        
        // Load all planets
        const loadPromises = planetData.map(planet => 
            this.loadPlanet(
                planet.name,
                planet.size,
                planet.distance,
                planet.texturePath,
                planet.orbitSpeed,
                planet.rotationSpeed,
                planet.data
            )
        );
        
        try {
            await Promise.all(loadPromises);
            console.log('All planets loaded successfully');
        } catch (error) {
            console.warn('Some planets failed to load:', error);
        } finally {
            // Hide loading screen and show controls
            document.getElementById('loading').style.display = 'none';
            document.getElementById('controls').style.display = 'block';
            document.getElementById('planetInfo').style.display = 'block';
        }
    }
    
    setupUI() {
        // Speed control
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            speedValue.textContent = this.animationSpeed.toFixed(1) + 'x';
        });
        
        // Scale control
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        scaleSlider.addEventListener('input', (e) => {
            const newScale = parseFloat(e.target.value);
            const scaleFactor = newScale / this.planetScale;
            this.planetScale = newScale;
            scaleValue.textContent = this.planetScale.toFixed(1) + 'x';
            
            // Update planet scales
            this.planets.forEach(planet => {
                planet.scale.setScalar(scaleFactor * planet.scale.x);
            });
        });
        
        // Orbit visibility
        const showOrbitsCheckbox = document.getElementById('showOrbits');
        showOrbitsCheckbox.addEventListener('change', (e) => {
            this.showOrbits = e.target.checked;
            this.orbitPaths.forEach(orbit => {
                orbit.visible = this.showOrbits;
            });
        });
        
        // Follow planet
        const followSelect = document.getElementById('followPlanet');
        followSelect.addEventListener('change', (e) => {
            const planetName = e.target.value;
            this.followTarget = planetName ? this.planets.find(p => p.userData.name === planetName) : null;
        });
        
        // Planet clicking for info
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.planets);
            
            if (intersects.length > 0) {
                const planet = intersects[0].object;
                this.showPlanetInfo(planet);
            }
        });
    }
    
    showPlanetInfo(planet) {
        const data = planet.userData;
        document.getElementById('planetName').textContent = data.name;
        document.getElementById('planetDistance').textContent = data.realDistance || 'Unknown';
        document.getElementById('planetPeriod').textContent = data.period || 'Unknown';
        document.getElementById('planetDiameter').textContent = data.diameter || 'Unknown';
        document.getElementById('planetType').textContent = data.type || 'Unknown';
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Skip animation if paused (for mobile battery optimization)
        if (this.isPaused) return;
        
        // Update planets - orbit around the Sun and spin on their axes
        this.planets.forEach(planet => {
            const data = planet.userData;
            
            if (data.parentPlanet === 'Earth') {
                // Moon orbits around Earth
                const earth = this.planets.find(p => p.userData.name === 'Earth');
                if (earth) {
                    data.angle += data.orbitSpeed * this.animationSpeed;
                    planet.position.x = earth.position.x + Math.cos(data.angle) * data.distance;
                    planet.position.z = earth.position.z + Math.sin(data.angle) * data.distance;
                    planet.position.y = earth.position.y;
                }
            } else if (data.name !== 'Moon') {
                // Regular planetary motion around the Sun
                data.angle += data.orbitSpeed * this.animationSpeed;
                planet.position.x = Math.cos(data.angle) * data.distance;
                planet.position.z = Math.sin(data.angle) * data.distance;
            }
            
            // Rotation on axis
            planet.rotation.y += data.rotationSpeed * this.animationSpeed;
            
            // Special handling for Saturn - rotate rings independently
            if (data.name === 'Saturn' && this.saturnRings) {
                this.saturnRings.forEach(ring => {
                    if (ring.userData && ring.userData.rotationSpeed) {
                        if (ring.type === 'Points') {
                            // Particles rotate around Y-axis
                            ring.rotation.y += ring.userData.rotationSpeed * this.animationSpeed;
                            
                            // Animate particle motion for more realism
                            if (ring.userData.isParticleSystem) {
                                const positions = ring.geometry.attributes.position.array;
                                const velocities = ring.geometry.attributes.velocity.array;
                                
                                for (let i = 0; i < positions.length; i += 3) {
                                    positions[i] += velocities[i] * this.animationSpeed * 0.1;
                                    positions[i + 2] += velocities[i + 2] * this.animationSpeed * 0.1;
                                }
                                ring.geometry.attributes.position.needsUpdate = true;
                            }
                        } else if (ring.userData.isGlow) {
                            // Glow effects rotate slower and pulse
                            ring.rotation.z += ring.userData.rotationSpeed * this.animationSpeed;
                            const pulse = Math.sin(Date.now() * 0.001 + ring.userData.index) * 0.05 + 0.95;
                            ring.material.opacity = ring.material.opacity * pulse;
                        } else {
                            // Ring meshes rotate around Z-axis
                            ring.rotation.z += ring.userData.rotationSpeed * this.animationSpeed;
                            
                            // Add subtle pulsing to ring brightness
                            if (ring.userData.segment) {
                                const time = Date.now() * 0.0005;
                                const pulse = Math.sin(time + ring.userData.index) * 0.1 + 0.9;
                                ring.material.opacity = ring.userData.segment.opacity * pulse;
                            }
                        }
                    }
                });
            }
        });
        
        // Sun rotation and glow animation
        if (this.sun) {
            this.sun.rotation.y += 0.005 * this.animationSpeed;
            
            // Animate sun glow effects for realistic pulsing
            if (this.sunGlowEffects) {
                const time = Date.now() * 0.001;
                this.sunGlowEffects.forEach((glow, index) => {
                    // Different pulsing speeds for each glow layer
                    const pulseSpeed = 0.5 + index * 0.2;
                    const pulse = Math.sin(time * pulseSpeed) * 0.1 + 0.9;
                    
                    // Vary opacity for pulsing effect
                    const baseOpacity = [0.4, 0.25, 0.15, 0.05][index];
                    glow.material.opacity = baseOpacity * pulse;
                    
                    // Slight rotation for dynamic effect
                    glow.rotation.y += (0.001 + index * 0.0005) * this.animationSpeed;
                    glow.rotation.x += (0.0005 + index * 0.0002) * this.animationSpeed;
                });
            }
        }
        
        // Subtle starfield rotation for immersive effect
        if (this.starSphere) {
            this.starSphere.rotation.y += 0.0001 * this.animationSpeed;
        }
        
        // Camera following
        if (this.followTarget) {
            const offset = new THREE.Vector3(50, 30, 50);
            const targetPosition = this.followTarget.position.clone().add(offset);
            this.camera.position.lerp(targetPosition, 0.05);
            this.controls.target.copy(this.followTarget.position);
        }
        
        // Update controls
        this.controls.update();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setupMobileEventHandlers() {
        // Handle mobile tap events
        window.addEventListener('mobileTap', (e) => {
            const mouse = new THREE.Vector2();
            mouse.x = (e.detail.x / window.innerWidth) * 2 - 1;
            mouse.y = -(e.detail.y / window.innerHeight) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.planets);
            
            if (intersects.length > 0) {
                const planet = intersects[0].object;
                this.showPlanetInfo(planet);
                this.followTarget = planet;
            }
        });
        
        // Handle pinch zoom
        window.addEventListener('pinchZoom', (e) => {
            const zoomFactor = e.detail.scale;
            this.camera.position.multiplyScalar(1 / zoomFactor);
            this.controls.update();
        });
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
    }
}

// Initialize the solar system when the page loads
window.addEventListener('load', () => {
    new SolarSystem();
});
