window.api.onDebugImage((imageData) => {
    document.getElementById('cropped-image').src = `data:image/png;base64,${imageData}`;
});