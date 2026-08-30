# Contributing to Chain Reaction 🔗

First off, thank you for considering contributing to **Chain Reaction**! 

Whether you are fixing a bug, improving the drawing canvas, adding UI animations, or suggesting new game modes, your contributions are welcome.

Developed by **[JOJIN JOHN](https://www.linkedin.com/in/jojin-john/)**.

---

## How to Contribute

### 1. Reporting Bugs

If you find a bug:
1. Check existing [GitHub Issues](https://github.com/jojin1709/chain-reaction-game/issues) to make sure it hasn't already been reported.
2. Open a new issue with a clear title, description of the problem, steps to reproduce, and screenshots if applicable.

### 2. Suggesting Enhancements

Have an idea to make the game better?
1. Open a new issue outlining your proposed feature or enhancement.
2. Describe why it would be beneficial to players and how it fits into the game logic.

### 3. Submitting Pull Requests

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/chain-reaction-game.git
   ```
3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes** cleanly and test thoroughly:
   - Ensure `client` builds cleanly (`npm run build` inside `client/`).
   - Ensure `server` runs cleanly (`npm start` inside `server/`).
5. **Commit your changes**:
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork** and submit a **Pull Request** to the `main` branch.

---

## Code Style & Conventions

- **React / Frontend**: Use clean functional components and React hooks in `client/src/components/`.
- **CSS**: Use modern CSS variables defined in `client/src/styles.css`.
- **Node / Sockets**: Keep event listeners clean in `server/index.js` and keep state strictly in-memory.

---

## Community & Code of Conduct

Please note that this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

Thank you for helping make **Chain Reaction** awesome! 🎨✨
