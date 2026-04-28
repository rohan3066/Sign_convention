export const UI_COLORS = {
    bg: "#0f172a",       // Deep Slate Studio
    bgLight: "#1e293b",
    panel: "#1e293b",    // Slate Surface
    panel_alt: "rgba(100, 116, 139, 0.05)", 
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#3b82f6",   // Azure Blue
    accent_2: "#8b5cf6", // Violet
    danger: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
    border: "rgba(255, 255, 255, 0.08)",
    glass: "rgba(15, 23, 42, 0.6)", 
    glassDark: "rgba(2, 6, 17, 0.9)", 
};

export const AVATAR_COLORS = {
    // Human Skin Tones (Python Parity)
    skin: '#fcdcc6',
    skinShadow: '#eac3a5',
    skinHighlight: '#ffffff',
    skinAmbient: '#252525',
    
    // Hair
    hair: '#6d351d',
    hairHighlight: '#8d4b2d',
    hairShadow: '#4e2815',
    
    // Clothing (Python Reference)
    jacket: '#9cb1c2',      // Grayish Blue
    jacketShadow: '#7a8b99',
    lapel: '#4b5d6a',
    
    shirt: '#ff9800',       // Vibrant Orange
    shirtHighlight: '#ffb74d',
    
    pants: '#6d4c41',       // Brown
    pantsShadow: '#4e342e',
    
    shoe: '#bc5a3a',
    shoeHighlight: '#d46a4a',
    
    eye: '#2e7d32',         // Green Eyes
    pupil: '#000000',
    nose: '#f89a94',
    blush: 'rgba(248, 154, 148, 0.2)',
};

export const PALM_LANDMARKS = [0, 1, 5, 9, 13, 17];

export const FINGER_LANDMARKS = {
    thumb: [1, 2, 3, 4],
    index: [5, 6, 7, 8],
    middle: [9, 10, 11, 12],
    ring: [13, 14, 15, 16],
    pinky: [17, 18, 19, 20]
};

export const SKELETON_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28]
];
