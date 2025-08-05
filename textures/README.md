# Planet Texture Sources

This file contains information about where to find high-quality planet textures for the solar system.

## Recommended Texture Websites

### 1. NASA - Planetary Fact Sheets
- **URL**: https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- **Quality**: Official NASA textures
- **License**: Public domain
- **Formats**: Various resolutions available

### 2. Solar System Scope
- **URL**: https://www.solarsystemscope.com/textures/
- **Quality**: High-resolution (up to 8K)
- **License**: Free for non-commercial use
- **Formats**: JPG, 1K to 8K resolutions

### 3. Planet Pixel Emporium
- **URL**: http://planetpixelemporium.com/planets.html
- **Quality**: Excellent quality textures
- **License**: Free for non-commercial use
- **Formats**: Multiple resolutions

## Texture Requirements

### File Naming Convention
- `mercury.jpg` - Mercury surface texture
- `venus.jpg` - Venus surface texture (cloud cover)
- `earth.jpg` - Earth surface texture (day side)
- `mars.jpg` - Mars surface texture
- `jupiter.jpg` - Jupiter atmospheric texture
- `saturn.jpg` - Saturn atmospheric texture
- `uranus.jpg` - Uranus atmospheric texture
- `neptune.jpg` - Neptune atmospheric texture

### Recommended Specifications
- **Format**: JPG or PNG
- **Resolution**: 1024x512 or 2048x1024 (2:1 aspect ratio)
- **Projection**: Equirectangular (spherical mapping)
- **File Size**: Under 2MB per texture for web performance

## Quick Setup Instructions

1. **Download textures** from the sources above
2. **Rename files** according to the naming convention
3. **Place files** in the `textures/` directory
4. **Check file sizes** - optimize if necessary
5. **Test loading** - run the application to verify textures load correctly

## Alternative: Procedural Textures

If you can't find suitable textures, the application will fall back to solid colors. You can also create simple procedural textures:

```javascript
// Example: Create a simple gradient texture for a planet
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 256;
const ctx = canvas.getContext('2d');

// Create gradient
const gradient = ctx.createLinearGradient(0, 0, 0, 256);
gradient.addColorStop(0, '#ff4444');  // Top color
gradient.addColorStop(1, '#cc2222');  // Bottom color

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 256);

// Convert to texture
const texture = new THREE.CanvasTexture(canvas);
```

## Copyright Notice

Please respect the licensing terms of any textures you use. For commercial projects, ensure you have appropriate licenses for all texture assets.
