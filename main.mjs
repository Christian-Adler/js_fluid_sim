import {Fluid} from "./fluid.mjs";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

const N = 128;
const SCALE = 6;

let worldWidth = canvas.width;
let worldHeight = canvas.height;

const updateWorldSettings = () => {
  if (worldHeight !== window.innerHeight || worldWidth !== window.innerWidth) {
    worldWidth = window.innerWidth;
    worldHeight = window.innerHeight;
    // worldWidth = N * SCALE;
    // worldHeight = N * SCALE;
    // canvas.width = worldWidth;
    // canvas.height = worldHeight;
    canvas.width = N * SCALE;
    canvas.height = N * SCALE;
  }
};

updateWorldSettings();

const fluid = new Fluid({size: N, scale: SCALE, dt: 0.1, diffusion: 0.00001, viscosity: 0.0000001});
fluid.step();

let prevMousePos = null;
let actMousePos = null;

canvas.addEventListener("mousedown", (evt) => {
  prevMousePos = {x: evt.x, y: evt.y};
});
canvas.addEventListener("mousemove", (evt) => {
  actMousePos = {x: evt.x, y: evt.y};
});
canvas.addEventListener("mouseup", (evt) => {
  fluid.addDensity(Math.floor(evt.x / SCALE), Math.floor(evt.y / SCALE), 1000);

  const amountX = evt.x - prevMousePos.x;
  const amountY = evt.y - prevMousePos.y;
  fluid.addVelocity(Math.floor(evt.x / SCALE), Math.floor(evt.y / SCALE), amountX / SCALE, amountY / SCALE);

  prevMousePos = null;
  actMousePos = null;
});

const update = () => {
  // const t1 = new Date().getTime();


  ctx.clearRect(0, 0, worldWidth, worldHeight);

  if (prevMousePos && actMousePos) {
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(prevMousePos.x, prevMousePos.y);
    ctx.lineTo(actMousePos.x, actMousePos.y);

    ctx.stroke();
  }

  fluid.step();
  fluid.renderD(ctx);
  // fluid.fadeD();

  // const t2 = new Date().getTime();
  // console.log(t2 - t1);

  updateWorldSettings();

  requestAnimationFrame(update);
}

update();
