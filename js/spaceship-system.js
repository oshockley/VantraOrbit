class SpaceshipSystem {
    constructor(scene) {
        this.scene = scene;
        this.spaceships = [];
        this.orbitPaths = [];
        // Store spaceship data
        group.userData = {
            ...config,
            type: 'spaceship',
            navLights: group.children.filter(child => 
                child.material && child.material.color && 
                (child.material.color.getHex() === 0xff0000 || 
                 child.material.color.getHex() === 0x00ff00 || 
                 child.material.color.getHex() === 0xffffff)
            ),
            engineGlows: group.children.filter(child => 
                child.material && child.material.color && 
                child.material.color.getHex() === 0x00ffff
            )
        };

        // Add a small point light to illuminate the spaceship
        const spaceshipLight = new THREE.PointLight(0xffffff, 0.5, 50);
        spaceshipLight.position.set(0, 0, 0);
        group.add(spaceshipLight);
        
        return group;ationSpeed = 1.0;
        
        // Spaceship configuration
        this.spaceshipConfigs = [
            {
                name: 'Explorer-1',
                orbitRadius: 80,   // Between Mercury and Venus
                orbitSpeed: 0.015,
                size: 4.0,         // Increased size for visibility
                color: 0x4a9eff,
                angle: 0
            },
            {
                name: 'Voyager-2',
                orbitRadius: 200,  // Between Mars and Jupiter
                orbitSpeed: 0.008,
                size: 6.0,         // Increased size for visibility
                color: 0x74b9ff,
                angle: Math.PI
            },
            {
                name: 'Deep-Space-1',
                orbitRadius: 400,  // Between Saturn and Uranus
                orbitSpeed: 0.004,
                size: 8.0,         // Increased size for visibility
                color: 0xa29bfe,
                angle: Math.PI / 2
            }
        ];
        
        this.init();
    }
    
    init() {
        this.createSpaceships();
    }
    
    createSpaceships() {
        this.spaceshipConfigs.forEach((config, index) => {
            const spaceship = this.createSpaceshipModel(config);
            this.spaceships.push(spaceship);
            this.scene.add(spaceship);
            
            console.log(`Created spaceship ${config.name} at orbit radius ${config.orbitRadius} with size ${config.size}`);
            
            // Create orbit path visualization
            this.createOrbitPath(config.orbitRadius, config.color);
        });
    }
    
    createSpaceshipModel(config) {
        const group = new THREE.Group();
        
        // Main hull (elongated body)
        const hullGeometry = new THREE.CylinderGeometry(0.3 * config.size, 0.8 * config.size, 4 * config.size, 8);
        const hullMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            metalness: 0.7,
            roughness: 0.3
        });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.rotation.z = Math.PI / 2; // Point forward
        group.add(hull);
        
        // Cockpit/front section
        const cockpitGeometry = new THREE.SphereGeometry(0.6 * config.size, 8, 6);
        const cockpitMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87ceeb,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 1.8 * config.size;
        cockpit.scale.set(0.8, 0.8, 1.2);
        group.add(cockpit);
        
        // Engine nacelles (2 side engines)
        for (let i = 0; i < 2; i++) {
            const engineGeometry = new THREE.CylinderGeometry(0.2 * config.size, 0.3 * config.size, 2.5 * config.size, 6);
            const engineMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x555555,
                metalness: 0.8,
                roughness: 0.4
            });
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.rotation.z = Math.PI / 2;
            engine.position.y = (i === 0 ? 1 : -1) * 1.2 * config.size;
            engine.position.x = -0.5 * config.size;
            group.add(engine);
            
            // Engine glow effect
            const glowGeometry = new THREE.SphereGeometry(0.4 * config.size, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.x = -1.8 * config.size;
            glow.position.y = (i === 0 ? 1 : -1) * 1.2 * config.size;
            group.add(glow);
        }
        
        // Wings
        for (let i = 0; i < 2; i++) {
            const wingGeometry = new THREE.BoxGeometry(1.5 * config.size, 2.5 * config.size, 0.2 * config.size);
            const wingMaterial = new THREE.MeshStandardMaterial({ 
                color: config.color,
                metalness: 0.6,
                roughness: 0.4
            });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.position.y = (i === 0 ? 1.8 : -1.8) * config.size;
            wing.position.x = 0.5 * config.size;
            group.add(wing);
        }
        
        // Navigation lights
        const navLightPositions = [
            { x: 2 * config.size, y: 0, z: 0, color: 0xff0000 }, // Red front
            { x: -2 * config.size, y: 0, z: 0, color: 0x00ff00 }, // Green rear
            { x: 0, y: 2 * config.size, z: 0, color: 0xffffff }, // White top
            { x: 0, y: -2 * config.size, z: 0, color: 0xffffff } // White bottom
        ];
        
        navLightPositions.forEach(light => {
            const lightGeometry = new THREE.SphereGeometry(0.1 * config.size, 4, 4);
            const lightMaterial = new THREE.MeshBasicMaterial({ 
                color: light.color,
                transparent: true,
                opacity: 0.9
            });
            const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
            lightMesh.position.set(light.x, light.y, light.z);
            group.add(lightMesh);
        });
        
        // Store spaceship data
        group.userData = {
            ...config,
            type: 'spaceship',
            navLights: group.children.filter(child => 
                child.material && child.material.color && 
                (child.material.color.getHex() === 0xff0000 || 
                 child.material.color.getHex() === 0x00ff00 || 
                 child.material.color.getHex() === 0xffffff)
            ),
            engineGlows: group.children.filter(child => 
                child.material && child.material.color && 
                child.material.color.getHex() === 0x00ffff
            )
        };
        
        // Set initial position
        group.position.x = Math.cos(config.angle) * config.orbitRadius;
        group.position.z = Math.sin(config.angle) * config.orbitRadius;
        group.position.y = Math.sin(config.angle * 2) * 5; // Add some vertical variation
        
        return group;
    }
    
    createOrbitPath(radius, color) {
        const orbitGeometry = new THREE.RingGeometry(radius - 0.5, radius + 0.5, 128);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        
        const orbitPath = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitPath.rotation.x = Math.PI / 2;
        orbitPath.userData = { type: 'spaceshipOrbit' };
        
        this.scene.add(orbitPath);
        this.orbitPaths.push(orbitPath);
    }
    
    update(animationSpeed) {
        this.animationSpeed = animationSpeed;
        
        this.spaceships.forEach(spaceship => {
            const data = spaceship.userData;
            
            // Update orbital position
            data.angle += data.orbitSpeed * this.animationSpeed;
            
            // Calculate new position with slight vertical oscillation
            const x = Math.cos(data.angle) * data.orbitRadius;
            const z = Math.sin(data.angle) * data.orbitRadius;
            const y = Math.sin(data.angle * 3) * 8 + Math.cos(data.angle * 1.5) * 3; // Complex vertical movement
            
            spaceship.position.set(x, y, z);
            
            // Face direction of travel with banking
            const nextX = Math.cos(data.angle + 0.01) * data.orbitRadius;
            const nextZ = Math.sin(data.angle + 0.01) * data.orbitRadius;
            const direction = new THREE.Vector3(nextX - x, 0, nextZ - z).normalize();
            
            // Point forward and add banking
            spaceship.lookAt(spaceship.position.clone().add(direction));
            spaceship.rotation.z += Math.sin(data.angle * 2) * 0.1; // Banking effect
            
            // Animate navigation lights (blinking)
            const time = Date.now() * 0.003;
            if (data.navLights) {
                data.navLights.forEach((light, index) => {
                    const blinkSpeed = 0.5 + index * 0.3;
                    light.material.opacity = 0.5 + Math.sin(time * blinkSpeed) * 0.4;
                });
            }
            
            // Animate engine glows
            if (data.engineGlows) {
                data.engineGlows.forEach(glow => {
                    const pulse = 0.4 + Math.sin(time * 4) * 0.2;
                    glow.material.opacity = pulse;
                    glow.scale.setScalar(0.8 + pulse * 0.4);
                });
            }
        });
    }
    
    setOrbitVisibility(visible) {
        this.orbitPaths.forEach(orbit => {
            orbit.visible = visible;
        });
    }
    
    getSpaceshipInfo(spaceship) {
        const data = spaceship.userData;
        return {
            name: data.name,
            type: 'Exploration Vessel',
            orbitRadius: `${data.orbitRadius} AU`,
            speed: `${(data.orbitSpeed * 100).toFixed(2)} AU/year`,
            mission: this.getMissionDescription(data.name)
        };
    }
    
    getMissionDescription(name) {
        const missions = {
            'Explorer-1': 'Inner system reconnaissance and mineral survey',
            'Voyager-2': 'Deep space exploration and asteroid belt mapping',
            'Deep-Space-1': 'Outer system research and ice moon investigation'
        };
        return missions[name] || 'Scientific exploration mission';
    }
    
    // Highlight a spaceship when clicked
    highlightSpaceship(spaceship) {
        // Reset all spaceships
        this.spaceships.forEach(ship => {
            ship.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x000000);
                }
            });
        });
        
        // Highlight selected spaceship
        if (spaceship) {
            spaceship.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x222222);
                }
            });
        }
    }
}

// Export the class
window.SpaceshipSystem = SpaceshipSystem;
