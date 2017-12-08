module.exports = {
    "root": true,
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 5
    },
    "globals": {
        "Account": false,
        "AnimationCache": false,
        "Assets": false,
        "Audio": false,
        "AudioDevice": false,
        "AudioEffectOptions": false,
        "AvatarList": false,
        "AvatarManager": false,
        "Camera": false,
        "Clipboard": false,
        "Controller": false,
        "DialogsManager": false,
        "DebugDraw": false,
        "Entities": false,
        "FaceTracker": false,
        "GlobalServices": false,
        "HMD": false,
        "LODManager": false,
        "Mat4": false,
        "Menu": false,
        "Messages": false,
        "ModelCache": false,
        "MyAvatar": false,
        "Overlays": false,
        "OverlayWebWindow": false,
        "Paths": false,
        "Quat": false,
        "Rates": false,
        "Recording": false,
        "Resource": false,
        "Reticle": false,
        "Scene": false,
        "Script": false,
        "ScriptDiscoveryService": false,
        "Settings": false,
        "SoundCache": false,
        "Stats": false,
        "Tablet": false,
        "TextureCache": false,
        "Toolbars": false,
        "Uuid": false,
        "UndoStack": false,
        "UserActivityLogger": false,
        "Vec3": false,
        "WebSocket": false,
        "WebWindow": false,
        "Window": false,
        "XMLHttpRequest": false,
        "location": false,
        "print": false,
        "RayPick": false,
        "LaserPointers": false,
        "ContextOverlay": false,
        "module": false
    },
    "rules": {
        "brace-style": ["error", "1tbs", { "allowSingleLine": false }],
        "comma-dangle": ["error", "never"],
        "camelcase": ["error"],
        "curly": ["error", "all"],
        "eqeqeq": ["error", "always"],
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "keyword-spacing": ["error", { "before": true, "after": true }],
        "max-len": ["error", 128, 4],
        "new-cap": ["error"],
        "no-floating-decimal": ["error"],
        //"no-magic-numbers": ["error", { "ignore": [0, 1], "ignoreArrayIndexes": true }],
        "no-multiple-empty-lines": ["error"],
        "no-multi-spaces": ["error"],
        "no-unused-vars": ["error", { "args": "none", "vars": "local" }],
        "semi": ["error", "always"],
        "spaced-comment": ["error", "always", {
            "line": { "markers": ["/"] }
        }],
        "space-before-function-paren": ["error", {"anonymous": "ignore", "named": "never"}]
    }
};
