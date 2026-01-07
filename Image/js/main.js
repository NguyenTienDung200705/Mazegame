// js/main.js
import { initController } from "./controller/MazeController.js";
import { View, hideAllSections } from "./view/MazeView.js";

window.onload = () => {
  hideAllSections();
  View.welcome.style.display = 'flex';
  initController();
};
