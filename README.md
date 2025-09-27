# Handwriting Recognition with CNN (EMNIST Dataset)

This project is a **web-based handwriting recognition system** built using **Convolutional Neural Networks (CNN)** trained on the **EMNIST dataset**.  
The entire project is implemented using **JavaScript, HTML, and CSS** — without any external backend or frameworks.  

---

## 🚀 Features
- Recognizes handwritten characters (letters and digits) from the EMNIST dataset.
- Built with **pure JavaScript** (no Python or heavy ML frameworks).
- **CNN model** implemented directly in JS for real-time inference.
- Simple and interactive **drawing canvas** for testing your own handwriting.
- The model predicts the character in real-time as you draw.
- The application displays the top 3 predictions with their confidence scores.
- You can adjust the brush size for drawing.
- Clean and responsive UI using only HTML and CSS.

---
---

## 🧠 Model Details
- Dataset: **EMNIST** (Extended MNIST)  
- Model: **Convolutional Neural Network (CNN)**  
  - Conv2D layer with 32 filters and a kernel size of (5,5)
  - MaxPool2D layer
  - Conv2D layer with 48 filters and a kernel size of (5,5)
  - Flatten layer
  - Dense layer with 256 units
  - Dense layer with 84 units
  - Dense layer with 47 units (output layer with softmax activation)
- Input size: `28x28 grayscale images`  
- Output classes: Depends on EMNIST subset (Digits, Letters, or Balanced).  

> The model is trained for 30 epochs with a batch size of 32. The Adam optimizer and categorical cross-entropy loss function are used. Early stopping and model checkpoint callbacks are also used to prevent overfitting and save the best model.

---

## 💻 Usage
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/handwriting-recognition-js.git
   cd handwriting-recognition-js
   ```
2. Open index.html in your browser.
(No server required — works locally!)

3. Use the canvas to draw a digit/letter.

## 📸 Demo

## 📜 License

This project is licensed under the MIT License.
Feel free to use, modify, and share!
