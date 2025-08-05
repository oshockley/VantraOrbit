class PlanetaryAudioSystem {
    constructor() {
        this.audioContext = null;
        this.oscillators = {};
        this.gainNodes = {};
        this.isInitialized = false;
        this.isPlaying = false;
        this.masterVolume = 0.3;
        
        // Planet audio configurations based on their characteristics
        this.planetConfigs = {
            mercury: {
                baseFreq: 523.25, // C5 - High pitch for fastest planet
                waveType: 'sine',
                volume: 0.15,
                rotationMultiplier: 1.0
            },
            venus: {
                baseFreq: 440.00, // A4 - Mysterious tone for hottest planet
                waveType: 'triangle',
                volume: 0.18,
                rotationMultiplier: 0.8
            },
            earth: {
                baseFreq: 261.63, // C4 - Home frequency
                waveType: 'sine',
                volume: 0.25,
                rotationMultiplier: 1.2
            },
            mars: {
                baseFreq: 196.00, // G3 - Lower tone for red planet
                waveType: 'sawtooth',
                volume: 0.12,
                rotationMultiplier: 0.9
            },
            jupiter: {
                baseFreq: 130.81, // C3 - Deep tone for gas giant
                waveType: 'triangle',
                volume: 0.3,
                rotationMultiplier: 2.4
            },
            saturn: {
                baseFreq: 146.83, // D3 - Mystical tone for ringed planet
                waveType: 'sine',
                volume: 0.22,
                rotationMultiplier: 2.2
            },
            uranus: {
                baseFreq: 164.81, // E3 - Cold, distant tone
                waveType: 'triangle',
                volume: 0.15,
                rotationMultiplier: 1.4
            },
            neptune: {
                baseFreq: 98.00, // G2 - Deepest tone for outermost planet
                waveType: 'sine',
                volume: 0.18,
                rotationMultiplier: 1.3
            }
        };
    }
    
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);
            
            // Initialize each planet's audio
            for (const [planetName, config] of Object.entries(this.planetConfigs)) {
                this.createPlanetAudio(planetName, config);
            }
            
            this.isInitialized = true;
            console.log('Planetary Audio System initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            return false;
        }
    }
    
    createPlanetAudio(planetName, config) {
        // Create oscillator for the planet
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = config.waveType;
        oscillator.frequency.setValueAtTime(config.baseFreq, this.audioContext.currentTime);
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime); // Start silent
        
        // Create filter for more interesting sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(config.baseFreq * 2, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        // Connect audio nodes
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Store references
        this.oscillators[planetName] = oscillator;
        this.gainNodes[planetName] = gainNode;
        
        // Start the oscillator
        oscillator.start();
    }
    
    updatePlanetRotation(planetName, rotationSpeed, isVisible = true) {
        if (!this.isInitialized || !this.oscillators[planetName]) return;
        
        const config = this.planetConfigs[planetName];
        const oscillator = this.oscillators[planetName];
        const gainNode = this.gainNodes[planetName];
        
        if (!config || !oscillator || !gainNode) return;
        
        // Calculate frequency modulation based on rotation speed
        const frequencyModulation = 1 + (rotationSpeed * config.rotationMultiplier * 0.1);
        const newFrequency = config.baseFreq * frequencyModulation;
        
        // Calculate volume based on visibility and rotation speed
        let targetVolume = 0;
        if (this.isPlaying && isVisible) {
            targetVolume = config.volume * (0.5 + rotationSpeed * 0.5);
        }
        
        // Smooth transitions
        const currentTime = this.audioContext.currentTime;
        oscillator.frequency.setTargetAtTime(newFrequency, currentTime, 0.1);
        gainNode.gain.setTargetAtTime(targetVolume, currentTime, 0.2);
    }
    
    startAudio() {
        if (!this.isInitialized) return false;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        
        // Fade in each planet gradually
        Object.entries(this.planetConfigs).forEach(([planetName, config], index) => {
            setTimeout(() => {
                if (this.gainNodes[planetName]) {
                    const currentTime = this.audioContext.currentTime;
                    this.gainNodes[planetName].gain.setTargetAtTime(
                        config.volume * 0.3, 
                        currentTime, 
                        0.5
                    );
                }
            }, index * 200); // Stagger the fade-ins
        });
        
        return true;
    }
    
    stopAudio() {
        if (!this.isInitialized) return;
        
        this.isPlaying = false;
        
        // Fade out all planets
        Object.keys(this.gainNodes).forEach(planetName => {
            if (this.gainNodes[planetName]) {
                const currentTime = this.audioContext.currentTime;
                this.gainNodes[planetName].gain.setTargetAtTime(0, currentTime, 0.3);
            }
        });
    }
    
    setMasterVolume(volume) {
        if (!this.isInitialized) return;
        
        this.masterVolume = Math.max(0, Math.min(1, volume));
        const currentTime = this.audioContext.currentTime;
        this.masterGain.gain.setTargetAtTime(this.masterVolume, currentTime, 0.1);
    }
    
    toggleAudio() {
        if (this.isPlaying) {
            this.stopAudio();
        } else {
            this.startAudio();
        }
        return this.isPlaying;
    }
    
    // Play swoosh transition when switching between planets
    playPlanetTransition(fromPlanet, toPlanet) {
        if (!this.isInitialized) return;
        
        // Play the swoosh sound
        this.playSwooshTransition();
        
        // If we have specific planet tones, create a smooth transition between them
        if (fromPlanet && toPlanet && this.planetConfigs[fromPlanet] && this.planetConfigs[toPlanet]) {
            this.createTonalTransition(fromPlanet, toPlanet);
        }
    }
    
    // Create a smooth tonal transition between planets
    createTonalTransition(fromPlanet, toPlanet) {
        if (!this.isInitialized) return;
        
        const currentTime = this.audioContext.currentTime;
        const fromConfig = this.planetConfigs[fromPlanet];
        const toConfig = this.planetConfigs[toPlanet];
        
        // Create a transition oscillator that morphs between planet frequencies
        const transitionOsc = this.audioContext.createOscillator();
        const transitionGain = this.audioContext.createGain();
        const transitionFilter = this.audioContext.createBiquadFilter();
        
        // Start with the source planet's characteristics
        transitionOsc.type = fromConfig.waveType;
        transitionOsc.frequency.setValueAtTime(fromConfig.baseFreq, currentTime);
        
        // Transition to the target planet's frequency
        transitionOsc.frequency.exponentialRampToValueAtTime(toConfig.baseFreq, currentTime + 0.6);
        
        // Configure filter for smooth transition
        transitionFilter.type = 'lowpass';
        transitionFilter.frequency.setValueAtTime(fromConfig.baseFreq * 3, currentTime);
        transitionFilter.frequency.exponentialRampToValueAtTime(toConfig.baseFreq * 3, currentTime + 0.6);
        transitionFilter.Q.setValueAtTime(1, currentTime);
        
        // Create a gentle envelope
        transitionGain.gain.setValueAtTime(0, currentTime);
        transitionGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.1);
        transitionGain.gain.exponentialRampToValueAtTime(0.05, currentTime + 0.4);
        transitionGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.7);
        
        // Connect the transition audio chain
        transitionOsc.connect(transitionFilter);
        transitionFilter.connect(transitionGain);
        transitionGain.connect(this.masterGain);
        
        // Play the transition
        transitionOsc.start(currentTime);
        transitionOsc.stop(currentTime + 0.7);
    }
    
    // Special effect for when user clicks on a planet
    playPlanetHighlight(planetName) {
        if (!this.isInitialized || !this.oscillators[planetName]) return;
        
        const config = this.planetConfigs[planetName];
        const oscillator = this.oscillators[planetName];
        const gainNode = this.gainNodes[planetName];
        
        // Brief frequency sweep and volume boost
        const currentTime = this.audioContext.currentTime;
        const originalFreq = config.baseFreq;
        
        // Frequency sweep up and down
        oscillator.frequency.setValueAtTime(originalFreq, currentTime);
        oscillator.frequency.linearRampToValueAtTime(originalFreq * 1.5, currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(originalFreq, currentTime + 0.3);
        
        // Volume boost
        const currentVolume = gainNode.gain.value;
        gainNode.gain.setValueAtTime(currentVolume, currentTime);
        gainNode.gain.linearRampToValueAtTime(Math.min(config.volume * 1.5, 0.4), currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(currentVolume, currentTime + 0.5);
        
        // Play swoosh transition sound
        this.playSwooshTransition();
    }
    
    // Create a pleasant swoosh sound for planet transitions
    playSwooshTransition() {
        if (!this.isInitialized) return;
        
        const currentTime = this.audioContext.currentTime;
        
        // Create a swoosh effect using filtered noise and frequency sweep
        const swooshOscillator = this.audioContext.createOscillator();
        const swooshGain = this.audioContext.createGain();
        const swooshFilter = this.audioContext.createBiquadFilter();
        
        // Configure the swoosh oscillator
        swooshOscillator.type = 'sawtooth';
        swooshOscillator.frequency.setValueAtTime(200, currentTime);
        
        // Create frequency sweep for swoosh effect (high to low)
        swooshOscillator.frequency.exponentialRampToValueAtTime(80, currentTime + 0.4);
        swooshOscillator.frequency.exponentialRampToValueAtTime(40, currentTime + 0.8);
        
        // Configure filter for smooth swoosh texture
        swooshFilter.type = 'lowpass';
        swooshFilter.frequency.setValueAtTime(800, currentTime);
        swooshFilter.frequency.exponentialRampToValueAtTime(200, currentTime + 0.6);
        swooshFilter.Q.setValueAtTime(2, currentTime);
        
        // Configure gain envelope for natural swoosh fade
        swooshGain.gain.setValueAtTime(0, currentTime);
        swooshGain.gain.linearRampToValueAtTime(0.15, currentTime + 0.1);
        swooshGain.gain.exponentialRampToValueAtTime(0.08, currentTime + 0.4);
        swooshGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.8);
        
        // Connect the swoosh audio chain
        swooshOscillator.connect(swooshFilter);
        swooshFilter.connect(swooshGain);
        swooshGain.connect(this.masterGain);
        
        // Start and stop the swoosh
        swooshOscillator.start(currentTime);
        swooshOscillator.stop(currentTime + 0.8);
        
        // Add a subtle reverb-like delay for spacey effect
        this.addSwooshReverb(swooshFilter, currentTime);
    }
    
    // Add subtle reverb effect to the swoosh for spatial depth
    addSwooshReverb(sourceNode, startTime) {
        if (!this.isInitialized) return;
        
        // Create a simple delay-based reverb effect
        const delay = this.audioContext.createDelay(0.3);
        const delayGain = this.audioContext.createGain();
        const feedback = this.audioContext.createGain();
        
        // Configure delay parameters
        delay.delayTime.setValueAtTime(0.15, startTime);
        delayGain.gain.setValueAtTime(0.3, startTime);
        delayGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
        feedback.gain.setValueAtTime(0.2, startTime);
        
        // Create the reverb feedback loop
        sourceNode.connect(delay);
        delay.connect(delayGain);
        delay.connect(feedback);
        feedback.connect(delay);
        delayGain.connect(this.masterGain);
    }
    
    // Create ambient space atmosphere
    createSpaceAmbience() {
        if (!this.isInitialized) return;
        
        // Low-frequency rumble for space ambience
        const spaceOscillator = this.audioContext.createOscillator();
        spaceOscillator.type = 'triangle';
        spaceOscillator.frequency.setValueAtTime(40, this.audioContext.currentTime);
        
        const spaceGain = this.audioContext.createGain();
        spaceGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        
        const spaceFilter = this.audioContext.createBiquadFilter();
        spaceFilter.type = 'lowpass';
        spaceFilter.frequency.setValueAtTime(80, this.audioContext.currentTime);
        
        spaceOscillator.connect(spaceFilter);
        spaceFilter.connect(spaceGain);
        spaceGain.connect(this.masterGain);
        
        spaceOscillator.start();
        
        // Slowly modulate the frequency for movement
        const modulator = this.audioContext.createOscillator();
        modulator.frequency.setValueAtTime(0.1, this.audioContext.currentTime);
        
        const modulatorGain = this.audioContext.createGain();
        modulatorGain.gain.setValueAtTime(10, this.audioContext.currentTime);
        
        modulator.connect(modulatorGain);
        modulatorGain.connect(spaceOscillator.frequency);
        modulator.start();
    }
}

// Export the class
window.PlanetaryAudioSystem = PlanetaryAudioSystem;
